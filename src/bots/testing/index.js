const llog = require('learninglab-log');


module.exports = async ({ client, message, say }) => {
    llog.cyan("got a test message")
    await say(`got that message <@${message.user}>`)
}

