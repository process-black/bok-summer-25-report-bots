const llog = require("learninglab-log");
const bots = require('../bots');


const reactionBotMap = {
  "eyeglasses": bots.emoji2VisionBot,
  "waitwhat": bots.emoji2ExplanationBot,
  "blob_waitwhat": bots.emoji2ExplanationBot,
  "timeline-event": bots.emoji2TimelineEventBot,
};

exports.reactionAdded = async ({ event, client }) => {
  llog.gray(`got a reactionAdded: ${event.type}:`, event);
  try {
    const handler = emojiBotMap[event.reaction];
    if (handler) {
      await handler({ event, client });
    } else {
      llog.yellow("Unhandled reaction type:", event.reaction);
    }
  } catch (error) {
    llog.red('Error in reactionAdded:', error);
  }
};

exports.reactionRemoved = async ({ event }) => {
  llog.gray(`got a reactionRemoved ${event.type}:`, event);
};

// File type to bot mapping
const fileBotMap = {
  // Image types
  "image/png": bots.imageHandlerBot,
  "image/jpeg": bots.imageHandlerBot,
  "image/jpg": bots.imageHandlerBot,
  "image/gif": bots.imageHandlerBot,
  "image/bmp": bots.imageHandlerBot,
  "image/webp": bots.imageHandlerBot,
  // Could add more file types here later
  // "video/mp4": bots.videoHandlerBot,
  // "audio/mpeg": bots.audioHandlerBot,
  // "application/pdf": bots.pdfHandlerBot,
};

// File extension patterns for fallback when mimetype is not available
const fileExtensionPatterns = {
  image: /\.(png|jpe?g|gif|bmp|webp)$/i,
  video: /\.(mp4|mov|avi|mkv|webm)$/i,
  audio: /\.(mp3|wav|m4a|aac|flac)$/i,
  document: /\.(pdf|doc|docx|txt|rtf)$/i,
};

const getFileTypeFromExtension = (filename) => {
  for (const [type, pattern] of Object.entries(fileExtensionPatterns)) {
    if (pattern.test(filename)) {
      return type;
    }
  }
  return 'unknown';
};

exports.fileShared = async ({ event, client }) => {
  llog.cyan(`got a fileShared event:`, event);
  
  try {
    if (!event.file_id) {
      llog.yellow('No file_id in event, skipping');
      return;
    }

    // Get detailed file information
    const fileInfo = await client.files.info({
      file: event.file_id,
    });

    const file = fileInfo.file;
    llog.gray('File info:', { name: file.name, mimetype: file.mimetype, filetype: file.filetype });

    // Try to find appropriate bot by mimetype first
    let handler = fileBotMap[file.mimetype];
    
    // If no mimetype match, try by file extension
    if (!handler) {
      const fileType = getFileTypeFromExtension(file.name);
      if (fileType === 'image') {
        handler = bots.imageHandlerBot;
      }
      // Add more type mappings here as needed
      // if (fileType === 'video') handler = bots.videoHandlerBot;
      // if (fileType === 'audio') handler = bots.audioHandlerBot;
      // if (fileType === 'document') handler = bots.documentHandlerBot;
    }

    if (handler) {
      llog.green(`Routing ${file.name} (${file.mimetype || 'unknown mimetype'}) to appropriate handler`);
      await handler({ event, client });
    } else {
      llog.yellow(`No handler found for file type: ${file.mimetype || 'unknown'} (${file.name})`);
      llog.gray('Available handlers:', Object.keys(fileBotMap));
    }

  } catch (error) {
    llog.red('Error in fileShared handler:', error);
  }
};

// exports.appHomeOpened = appHomeHandler

exports.parseAll = async ({ event }) => {
  const handledEvents = ["message", "reaction_added", "reaction_removed"];
  if (!handledEvents.includes(event.type)) {
    llog.gray(`Unhandled event type: ${event.type}`, event);
  }
};
