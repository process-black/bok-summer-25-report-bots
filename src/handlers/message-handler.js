const llog = require('learninglab-log');

// Import bot functions directly
const { testing, ts280, rainbowTests } = require('../bots');

// Message rules configuration
const messageHandlers = [
//   {
//     channels: ["CHANNEL_TS280"],
//     trigger: "ts280",
//     handler: ts280
//   },
//   {
//     channels: ["CHANNEL_RAINBOW"],
//     trigger: "rainbow",
//     handler: rainbowTests
//   },
  {
    channels: ["*"],
    trigger: "testing testing",
    handler: testing
  }
];

llog.green('Message handlers loaded');

const isBotMessage = (message) => {
    return message.subtype === "bot_message";
};

const isInSubthread = (message) => {
    return message.thread_ts && message.thread_ts !== message.ts;
};

// Handle messages using the configured handlers
const handleWithRules = async ({ client, message, say, event }) => {
    if (!message.text) return;
    
    const text = message.text.toLowerCase();
    
    for (const handler of messageHandlers) {
        const channelMatch = handler.channels.includes('*') || 
                           handler.channels.includes(message.channel);
        const triggerMatch = text.includes(handler.trigger.toLowerCase());
        
        if (channelMatch && triggerMatch) {
            try {
                await handler.handler({ client, message, say, event });
                break; // Stop after first matching handler
            } catch (error) {
                llog.red(`Error in message handler for trigger '${handler.trigger}':`, error);
            }
        }
    }
};

exports.parseAll = async ({ client, message, say, event }) => {
    llog.cyan("got a message the day of the rainbow tests")

        // Check if the message is a bot message
    // if (isBotMessage(message)) {
    //     llog.yellow("Skipped: Bot message detected");
    //     return;
    // }

    // Check if the message is in a subthread
    if (isInSubthread(message)) {
        llog.magenta("Message is in a subthread");
        // Add specific logic for subthread messages here if needed
        return;
    }



    llog.gray(message);
    if (message.text) {
        await handleWithRules({ client, message, say, event });
    } else {
        llog.blue("message has no text");
    }
}

