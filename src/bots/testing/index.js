const llog = require('learninglab-log');

const wait = (seconds) => new Promise(resolve => setTimeout(resolve, seconds*1000));

module.exports = async ({ client, message, say, event }) => {
    llog.cyan("got a test message")
    await say(`got that message <@${message.user}>`)
}

