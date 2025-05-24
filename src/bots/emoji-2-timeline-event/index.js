// src/bots/emoji-2-timeline-event.js

const llog = require("learninglab-log");
const { OpenAI } = require("openai");
const { z } = require("zod");
const { zodTextFormat } = require("openai/helpers/zod");
const Airtable = require("airtable");

// ─────────────────────────────────────────────────────────────────────────────
// 1) OpenAI & Zod schema (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const TimelineEventSchema = z
  .object({
    title: z.string().describe("Concise event title"),
    ShortDescription: z.string().describe("One-paragraph summary"),
    Markdown: z.string().describe("Detailed standalone essay in Markdown"),
    TimelineMedia: z.union([z.string(), z.null()]).describe(
      "YouTube link or image URL, or null"
    ),
    StartDate: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?([+-]\d{2}:\d{2}|Z)?$/
      )
      .describe("ISO 8601 datetime string with minute precision"),
    EndDate: z
      .union([
        z
          .string()
          .regex(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?([+-]\d{2}:\d{2}|Z)?$/
          ),
        z.null(),
      ])
      .describe("ISO 8601 datetime string or null"),
    HeroImage: z
      .union([z.string(), z.null()])
      .describe("The single best image URL to represent this event, or null"),
    MediaCaption: z.string().describe("Short caption for the main media"),
    FollowUpQuestions: z
      .string()
      .describe("Follow-up questions or 'No follow-up questions.'"),
    AllImages: z
      .array(z.string())
      .describe("All image URLs mentioned in the thread"),
  })
  .strict();

async function summarizeStructured(text) {
  const systemPrompt = [
    "You are an expert at summarizing Slack threads into timeline events.",
    "Respond with JSON exactly matching the schema.",
    "Include all user messages in context.",
    "Select the single best image URL as the HeroImage; if none, return null.",
    "Extract all image URLs into the AllImages array.",
    "If required data is missing, ask follow-up questions.",
  ].join(" ");

  const resp = await openai.responses.parse({
    model: "gpt-4o-2024-08-06",
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: text },
    ],
    text: { format: zodTextFormat(TimelineEventSchema, "timeline_event") },
  });

  if (resp.output[0].refusal) {
    throw new Error(`OpenAI refused: ${resp.output[0].refusal}`);
  }
  return resp.output_parsed;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2) Enhanced helper: determine correct thread TS and fetch all messages
// ─────────────────────────────────────────────────────────────────────────────
async function getMessageDetails(client, channel, itemTs) {
  llog.yellow("=== getMessageDetails START ===");
  llog.yellow(`Input: channel=${channel}, itemTs=${itemTs}`);
  
  try {
    let targetMessage = null;
    let threadTs = null;
    
    // Strategy 1: Use Slack's recommended approach for retrieving individual messages
    // Set latest to the target timestamp and let Slack search backwards
    llog.yellow("Strategy 1: Using Slack's recommended conversations.history approach...");
    
    const historyResp = await client.conversations.history({
      channel,
      latest: itemTs,
      limit: 1,
      inclusive: true,
    });
    
    llog.yellow("conversations.history response:", JSON.stringify(historyResp, null, 2));
    
    if (historyResp.ok && historyResp.messages?.length > 0) {
      const foundMessage = historyResp.messages[0];
      if (foundMessage.ts === itemTs) {
        targetMessage = foundMessage;
        llog.yellow("Found exact target message:", JSON.stringify(targetMessage, null, 2));
      }
    }
    
    // Strategy 2: If not found, try conversations.replies (maybe it's a thread root)
    if (!targetMessage) {
      llog.yellow("Strategy 2: Trying conversations.replies (maybe it's a thread root)...");
      
      const repliesResp = await client.conversations.replies({
        channel,
        ts: itemTs,
        inclusive: true,
        limit: 100,
      });
      
      llog.yellow("conversations.replies response:", JSON.stringify(repliesResp, null, 2));
      
      if (repliesResp.ok && repliesResp.messages?.length > 0) {
        // Find our exact message in the thread
        targetMessage = repliesResp.messages.find(m => m.ts === itemTs);
        if (targetMessage) {
          llog.yellow("Found target message in thread:", JSON.stringify(targetMessage, null, 2));
        }
      }
    }
    
    // Strategy 3: Broader search if still not found
    if (!targetMessage) {
      llog.yellow("Strategy 3: Trying broader conversations.history search...");
      const broadResp = await client.conversations.history({
        channel,
        limit: 200,
      });
      
      if (broadResp.ok && broadResp.messages?.length > 0) {
        targetMessage = broadResp.messages.find(m => m.ts === itemTs);
        if (targetMessage) {
          llog.yellow("Found target message via broad search:", JSON.stringify(targetMessage, null, 2));
        }
      }
    }
    
    if (!targetMessage) {
      // Last resort: return what we can determine and log the issue
      llog.red(`Could not find message with ts: ${itemTs}`);
      llog.yellow("Attempting to proceed with itemTs as threadTs...");
      threadTs = itemTs;
    } else {
      // Determine thread timestamp using Slack's documented logic
      if (targetMessage.thread_ts) {
        threadTs = targetMessage.thread_ts;
        if (targetMessage.thread_ts === targetMessage.ts) {
          llog.yellow(`Message is a thread parent (thread_ts === ts), threadTs=${threadTs}`);
        } else {
          llog.yellow(`Message is a thread reply (thread_ts !== ts), threadTs=${threadTs}`);
        }
      } else {
        // No thread_ts means it's a regular channel message or potential thread root
        threadTs = targetMessage.ts;
        llog.yellow(`Message has no thread_ts, using message ts as threadTs=${threadTs}`);
      }
    }
    
    llog.yellow(`Final threadTs determined: ${threadTs}`);
    
    // Now fetch all messages in this thread using the threadTs
    const threadResp = await client.conversations.replies({
      channel,
      ts: threadTs,
      inclusive: true,
      limit: 100,
    });
    
    llog.yellow("Final conversations.replies response:", JSON.stringify(threadResp, null, 2));
    
    if (!threadResp.ok) {
      throw new Error(`Slack conversations.replies error: ${threadResp.error}`);
    }
    
    const allMessages = threadResp.messages || [];
    llog.yellow(`Raw thread messages count: ${allMessages.length}`);
    
    // Filter to real user messages only (no bots, no system subtypes)
    const userMsgs = allMessages.filter(
      (m) => m.type === "message" && !m.subtype && m.user
    );
    
    llog.yellow(`Filtered user messages count: ${userMsgs.length}`);
    llog.yellow("Filtered user messages summary:", userMsgs.map(m => ({ ts: m.ts, user: m.user, text_preview: m.text?.substring(0, 50) })));
    
    llog.yellow("=== getMessageDetails END ===");
    
    return { threadTs, userMsgs, targetMessage };
    
  } catch (error) {
    llog.red("Error in getMessageDetails:", error);
    throw error;
  }
}

async function archiveThreadEvents(base, threadTs) {
  llog.yellow(`Archiving existing events for threadTs: ${threadTs}`);
  
  const existing = await base("TimelineEvents")
    .select({ filterByFormula: `{ThreadTs}='${threadTs}'` })
    .firstPage();
    
  llog.yellow(`Found ${existing.length} existing records to archive`);
  
  if (existing.length) {
    await Promise.all(
      existing.map((r) => {
        llog.yellow(`Archiving record ID: ${r.id}`);
        return base("TimelineEvents").update(r.id, { Status: "Archived" });
      })
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3) Build & create new Airtable record (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
async function createTimelineEvent(
  base,
  threadTs,
  itemTs,
  reactionTs,
  aiData,
  userMsgs
) {
  const record = {
    ThreadTs: threadTs,
    ItemTs: itemTs,
    ReactionTs: reactionTs,
    Name: aiData.title,
    Title: aiData.title,
    ShortDescription: aiData.ShortDescription,
    Markdown: aiData.Markdown,
    Attachments: aiData.AllImages.map((url) => ({ url })),
    HeroImage: aiData.HeroImage,
    TimelineMedia: aiData.TimelineMedia || "",
    MediaCaption: aiData.MediaCaption,
    StartDate: aiData.StartDate,
    EndDate: aiData.EndDate,
    Status: "Active",
    FollowUpQuestions: aiData.FollowUpQuestions,
    OpenAiResponse: JSON.stringify(aiData, null, 2),
    ThreadJson: JSON.stringify(userMsgs, null, 2),
    Env: process.env.NODE_ENV,
  };

  llog.yellow("Creating Airtable record with threadTs:", threadTs);
  const created = await base("TimelineEvents").create(record);
  llog.yellow("Created record ID:", created.id);
  return created.id;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4) Main handlers, updated to use getMessageDetails()
// ─────────────────────────────────────────────────────────────────────────────
async function handleReactionAdded({ client, event }) {
  llog.yellow("=== REACTION ADDED HANDLER START ===");
  llog.yellow("Event received:", JSON.stringify(event, null, 2));

  const channel    = event.item.channel;
  const itemTs     = event.item.ts;
  const reactionTs = event.event_ts;
  const reaction   = event.reaction;

  llog.yellow(`Processing reaction: ${reaction} on channel: ${channel}, itemTs: ${itemTs}`);

  // 1) Get the correct thread TS and all user messages
  const { threadTs, userMsgs, targetMessage } = await getMessageDetails(client, channel, itemTs);
  
  llog.yellow(`Thread analysis complete:`);
  llog.yellow(`- itemTs (reacted message): ${itemTs}`);
  llog.yellow(`- threadTs (thread root): ${threadTs}`);
  llog.yellow(`- Are they the same? ${itemTs === threadTs ? 'YES (root message)' : 'NO (reply in thread)'}`);
  llog.yellow(`- User messages in thread: ${userMsgs.length}`);

  // 2) if no real user chat, skip
  if (!userMsgs.length) {
    llog.yellow("No user messages in thread—skipping.");
    return;
  }

  // 3) archive any old events for this thread
  const base = new Airtable({
    apiKey: process.env.AIRTABLE_API_TOKEN,
  }).base(process.env.AIRTABLE_SUMMER_WEEK_0_BASE);
  
  try {
    await archiveThreadEvents(base, threadTs);
  } catch (err) {
    llog.red("Archiving thread events failed:", err.message);
  }

  // 4) build prompt and call OpenAI
  const prompt = userMsgs
    .map((m) => `${m.user}: ${m.text || ""}`)
    .join("\n");
  const latest = new Date(
    Number(userMsgs[userMsgs.length - 1].ts.split(".")[0]) * 1000
  ).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/New_York",
  });
  const fullPrompt = `The latest message in this thread was sent on ${latest} EDT. Include the entire thread context.\n\n${prompt}`;
  llog.yellow("Prompt to OpenAI:", fullPrompt);

  const aiData = await summarizeStructured(fullPrompt);

  // 5) write new record
  const newRecId = await createTimelineEvent(
    base,
    threadTs,
    itemTs,
    reactionTs,
    aiData,
    userMsgs
  );
  llog.green("Airtable record created:", newRecId);

  // 6) post back into the correct thread (using threadTs, not itemTs)
  llog.yellow(`Posting response to thread: ${threadTs}`);
  const post = await client.chat.postMessage({
    channel,
    thread_ts: threadTs,
    text: `✅ Timeline event upserted!\n*Date*: ${aiData.StartDate}\n*Title*: ${aiData.title}\n*Summary*: ${aiData.ShortDescription}`,
  });
  await base("TimelineEvents").update(newRecId, { BotPostTs: post.ts });
  
  llog.yellow("=== REACTION ADDED HANDLER END ===");
}

async function handleReactionRemoved({ client, event }) {
  llog.yellow("=== REACTION REMOVED HANDLER START ===");
  llog.yellow("Event received:", JSON.stringify(event, null, 2));
  
  const channel = event.item.channel;
  const itemTs  = event.item.ts;
  
  // Get the correct thread timestamp
  const { threadTs } = await getMessageDetails(client, channel, itemTs);
  
  llog.yellow(`Removing timeline events for threadTs: ${threadTs}`);

  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_TOKEN })
    .base(process.env.AIRTABLE_SUMMER_WEEK_0_BASE);
  const existing = await base("TimelineEvents")
    .select({
      filterByFormula: `AND({ThreadTs}='${threadTs}',{Status}='Active')`,
      sort: [{ field: "ReactionTs", direction: "desc" }],
      maxRecords: 1,
    })
    .firstPage();
    
  llog.yellow(`Found ${existing.length} active records to archive`);
  
  await Promise.all(
    existing.map((r) => {
      llog.yellow(`Archiving record ID: ${r.id}`);
      return base("TimelineEvents").update(r.id, { Status: "Archived" });
    })
  );
  
  llog.yellow("=== REACTION REMOVED HANDLER END ===");
}

// ─────────────────────────────────────────────────────────────────────────────
// 5) Export entry point (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
module.exports = async function emojiToTimelineEventBot({ event, client }) {
  try {
    if (event.type === "reaction_added") {
      await handleReactionAdded({ client, event });
    } else if (event.type === "reaction_removed") {
      await handleReactionRemoved({ client, event });
    }
    return true;
  } catch (err) {
    llog.red("Handler error:", err.message);
    llog.red("Error stack:", err.stack);
    await client.chat.postMessage({
      channel: event.user,
      text: `❌ Failed: ${err.message}`,
    });
    return false;
  }
};