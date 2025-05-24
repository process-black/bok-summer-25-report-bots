const llog = require("learninglab-log");
const bots = require('../bots');


const emojiBotMap = {
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

// exports.appHomeOpened = appHomeHandler

exports.parseAll = async ({ event }) => {
  const handledEvents = ["message", "reaction_added", "reaction_removed"];
  if (!handledEvents.includes(event.type)) {
    llog.gray(`Unhandled event type: ${event.type}`, event);
  }
};
