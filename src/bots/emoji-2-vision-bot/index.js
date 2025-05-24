const llog = require("learninglab-log");
const { OpenAI } = require('openai');
const { z } = require('zod');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Define the schema for the structured vision result
const VisionSchema = z.object({
  summary: z.string().describe("A concise summary of the image or content"),
  details: z.string().describe("Detailed vision/explanation of the image or content")
});

/**
 * Helper to get structured vision result from OpenAI chat API and validate with zod
 */
async function getStructuredVision(conversation) {
  const systemPrompt = `
You are an expert at describing and analyzing images or visual content from Slack conversations.
Extract key details to create a clear, concise vision record in this JSON format:
{
  "summary": "A concise summary of the image or content",
  "details": "Detailed vision/explanation of the image or content"
}
Respond ONLY with a valid JSON object.
`;
  const userPrompt = conversation.map(m => `${m.name || 'User'}: ${m.content}`).join('\n');
  const payload = {
    model: "gpt-4o-2024-08-06",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    response_format: { type: "json_object" }
  };
  llog.magenta('OpenAI payload:', JSON.stringify(payload, null, 2));
  const completion = await openai.chat.completions.create(payload);
  let parsed;
  try {
    parsed = JSON.parse(completion.choices[0].message.content);
    VisionSchema.parse(parsed); // Throws if invalid
  } catch (e) {
    throw new Error("OpenAI did not return valid vision JSON: " + JSON.stringify(e, null, 2));
  }
  return parsed;
}

/**
 * Builds the vision result from a Slack reaction event
 * @param {object} param0
 * @returns {Promise<{success: boolean, record?: object, error?: string}>}
 */
async function buildVisionRequest({ client, event }) {
  try {
    // 1. Get the message that was reacted to
    const messageResult = await client.conversations.history({
      channel: event.item.channel,
      latest: event.item.ts,
      inclusive: true,
      limit: 1
    });
    
    const message = messageResult.messages?.[0];
    if (!message) {
      throw new Error('Message not found');
    }
    
    // 2. Prepare conversation context for OpenAI
    const conversation = [
      { role: 'user', content: message.text }
    ];

    // 3. Call OpenAI to structure the vision request
    llog.blue('Calling OpenAI to structure vision request...');
    const structuredVision = await getStructuredVision(conversation);
    llog.blue('Structured vision:', structuredVision);

    // 4. Create a record (could be sent to Airtable or elsewhere)
    const visionRecord = {
      'Slack Timestamp': message.ts,
      'Channel': event.item.channel,
      'Message Text': message.text,
      'User': message.user,
      'Vision Summary': structuredVision.summary,
      'Vision Details': structuredVision.details,
      'Structured Data': JSON.stringify(structuredVision, null, 2)
    };
    
    llog.blue('Created vision record with structured data');
    // Optionally, send to Airtable or another store here
    return { success: true, record: visionRecord };
  } catch (error) {
    llog.red('Error in buildVisionRequest:', error);
    return { success: false, error: error.message };
  }
}

module.exports = async function emoji2VisionBot({ event, client }) {
  return await buildVisionRequest({ event, client });
};
