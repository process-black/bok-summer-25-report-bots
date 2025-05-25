const llog = require('learninglab-log');
const OpenAI = require('openai');
const airtableTools = require('../../utils/ll-airtable-tools');
const makeSlackImageURL = require('../../utils/ll-slack-tools/utils/make-slack-image-url');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const makeFilePublic = async (client, fileId) => {
  try {
    const result = await client.files.sharedPublicURL({
      token: process.env.SLACK_USER_TOKEN,
      file: fileId,
    });
    return result;
  } catch (error) {
    llog.red('Error making file public:', error);
    throw error;
  }
};

const getChannelHistory = async (client, channel, limit = 20) => {
  try {
    const result = await client.conversations.history({
      channel: channel,
      limit: limit,
    });
    return result.messages || [];
  } catch (error) {
    llog.red('Error fetching channel history:', error);
    return [];
  }
};

const getThreadReplies = async (client, channel, threadTs) => {
  try {
    const result = await client.conversations.replies({
      channel: channel,
      ts: threadTs,
    });
    return result.messages || [];
  } catch (error) {
    llog.red('Error fetching thread replies:', error);
    return [];
  }
};

const buildContextMessages = (messages) => {
  return messages.slice(0, 20).map(msg => ({
    role: 'user',
    content: `[${new Date(msg.ts * 1000).toISOString()}] ${msg.user}: ${msg.text || '[file/media]'}`
  }));
};

const generateImageDescription = async (imageUrl, contextMessages) => {
  try {
    const messages = [
      {
        role: 'system',
        content: 'You are an AI assistant that describes images in detail. Based on the image and conversation context, provide a comprehensive description and suggest a concise alt text caption. Return your response as JSON with "description" and "alt_text" fields.'
      },
      ...contextMessages.slice(-10),
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Please analyze this image and provide a detailed description and concise alt text caption, considering the conversation context.'
          },
          {
            type: 'image_url',
            image_url: {
              url: imageUrl
            }
          }
        ]
      }
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    try {
      return JSON.parse(response.choices[0].message.content);
    } catch (parseError) {
      const content = response.choices[0].message.content;
      return {
        description: content,
        alt_text: content.split('.')[0] || 'Image'
      };
    }
  } catch (error) {
    llog.red('Error generating image description:', error);
    return {
      description: 'Unable to generate description',
      alt_text: 'Image'
    };
  }
};

const saveToAirtable = async (imageData) => {
  try {
    const record = {
      baseId: process.env.AIRTABLE_IMAGES_BASE || process.env.AIRTABLE_SHOW_BASE,
      table: "ImageAnalysis",
      record: {
        "Id": `${imageData.fileName}-${imageData.timestamp}`,
        "FileName": imageData.fileName,
        "Title": imageData.title,
        "Description": imageData.description,
        "AltText": imageData.altText,
        "SlackUrl": imageData.publicUrl,
        "SlackFileInfo": JSON.stringify(imageData.fileInfo, null, 2),
        "ContextMessages": JSON.stringify(imageData.contextMessages, null, 2),
        "PostedBySlackUser": imageData.userId,
        "Channel": imageData.channel,
        "SlackTs": imageData.timestamp,
        "ImageFiles": [
          {
            "url": imageData.publicUrl
          }
        ]
      }
    };

    const result = await airtableTools.addRecord(record);
    llog.green('Saved to Airtable:', result.id);
    return result;
  } catch (error) {
    llog.red('Error saving to Airtable:', error);
    throw error;
  }
};

const postSlackResponse = async (client, channel, threadTs, imageData) => {
  try {
    const markdownBlock = `![${imageData.altText}](${imageData.publicUrl})`;
    
    const response = await client.chat.postMessage({
      channel: channel,
      thread_ts: threadTs,
      unfurl_media: false,
      unfurl_links: false,
      parse: "none",
      text: `Image analysis complete! Here's the markdown for embedding:\n\n\`\`\`\n${markdownBlock}\n\`\`\`\n\n**Description:** ${imageData.description}\n\n**Alt text:** ${imageData.altText}`,
    });

    llog.green('Posted response to Slack');
    return response;
  } catch (error) {
    llog.red('Error posting to Slack:', error);
    throw error;
  }
};

const processImage = async ({ client, file, event }) => {
  try {
    llog.cyan(`Processing image: ${file.name}`);

    // Make file public to get viewable URL
    await makeFilePublic(client, file.id);
    const publicUrl = makeSlackImageURL(file.permalink, file.permalink_public);

    llog.green('Public URL created:', publicUrl);

    // Get conversation context
    let contextMessages = [];
    
    // Get recent channel history
    const channelHistory = await getChannelHistory(client, event.channel_id);
    contextMessages = contextMessages.concat(channelHistory);

    // If this is in a thread, get thread context too
    if (event.thread_ts) {
      const threadReplies = await getThreadReplies(client, event.channel_id, event.thread_ts);
      contextMessages = contextMessages.concat(threadReplies);
    }

    // Build context for OpenAI
    const formattedContext = buildContextMessages(contextMessages);

    // Generate image description using OpenAI Vision
    const analysis = await generateImageDescription(publicUrl, formattedContext);

    // Prepare data for storage
    const imageData = {
      fileName: file.name,
      title: file.title || file.name,
      description: analysis.description,
      altText: analysis.alt_text,
      publicUrl: publicUrl,
      fileInfo: file,
      contextMessages: formattedContext,
      userId: file.user,
      channel: event.channel_id,
      timestamp: event.event_ts || file.timestamp,
    };

    // Save to Airtable
    await saveToAirtable(imageData);

    // Post response to Slack
    await postSlackResponse(
      client, 
      event.channel_id, 
      event.thread_ts || event.event_ts, 
      imageData
    );

    llog.green(`Image processing complete for: ${file.name}`);

  } catch (error) {
    llog.red(`Error processing image ${file.name}:`, error);
  }
};

const handleImageUpload = async ({ event, client }) => {
  try {
    llog.cyan('Image handler bot processing files:', event);

    // Get file info for the uploaded file(s)
    const fileInfo = await client.files.info({
      file: event.file_id,
    });

    await processImage({ client, file: fileInfo.file, event });

  } catch (error) {
    llog.red('Error in image handler bot:', error);
  }
};

module.exports = handleImageUpload;