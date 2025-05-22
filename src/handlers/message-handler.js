const llog = require('learninglab-log');
const fs = require('fs');
const path = require('path');
// const bkc = require('../bots/bkc-bots');

// Load message rules from config/message_rules.json
let messageRules = [];

try {
    const rulesPath = path.resolve(__dirname, '../../config/message_rules.json');
    if (fs.existsSync(rulesPath)) {
        const raw = fs.readFileSync(rulesPath, 'utf8');
        messageRules = JSON.parse(raw);
        llog.green('message rules loaded');
        llog.green(messageRules)
    } else {
        llog.yellow('no message_rules.json found');
    }
} catch (err) {
    llog.red('error loading message rules', err);
}

const isBotMessage = (message) => {
    return message.subtype === "bot_message";
};

const isInSubthread = (message) => {
    return message.thread_ts && message.thread_ts !== message.ts;
};

const bots = require('../bots');
// Execute a bot module by name
const runBot = async (botName, params) => {
    try {
        const bot = bots[botName];
        if (!bot) {
            throw new Error(`Bot '${botName}' not found in bots index.`);
        }
        await bot(params);
    } catch (err) {
        llog.red(`failed to run bot ${botName}`, err);
    }
};

// Apply rules from message_rules.json to dispatch bots
const handleWithRules = async ({ client, message, say, event }) => {
    if (!messageRules.length) {
        // fall back to bkc if no rules loaded
        // await bkc({ client, message, say, event });
        return;
    }
    let matched = false;
    const botPromises = [];
    for (const rule of messageRules) {
        const channels = rule.channels || [];
        const channelMatch = channels.includes('*') || channels.includes(message.channel);
        const triggerMatch = rule.trigger === '*' ||
            (message.text && message.text.toLowerCase().includes(rule.trigger.toLowerCase()));

        if (channelMatch && triggerMatch) {
            botPromises.push(runBot(rule.bot, { client, message, say, event }));
            matched = true;
        }
    }
    // default fallback if no rule matched
    // await bkc({ client, message, say, event });
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

