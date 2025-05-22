// Bot replies with "the bot is running" and mentions the user
module.exports = async function({ message, say }) {
    const userMention = message.user ? `<@${message.user}>` : 'user';
    await say(`the bot is running, ${userMention}`);
};
