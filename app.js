const { App } = require("@slack/bolt");
var path = require("path");
var fs = require("fs");
const llog = require("learninglab-log");
const handleMessages = require("./src/handlers/message-handler");
const handleEvents = require("./src/handlers/event-handler");
global.ROOT_DIR = path.resolve(__dirname);

require("dotenv").config({
  path: path.resolve(__dirname, `.env.${process.env.NODE_ENV}`),
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  port: process.env.PORT || 3000,
});


app.message("testing testing", handleMessages.testing);
app.message(/.*/, handleMessages.parseAll);

app.event("reaction_added", handleEvents.reactionAdded);
app.event("reaction_removed", handleEvents.reactionRemoved);
// app.event("app_home_opened", handleEvents.appHomeOpened);
app.event("file_shared", handleEvents.fileShared);

(async () => {

  if (!fs.existsSync("_temp")) {
    fs.mkdirSync("_temp");
  }
  if (!fs.existsSync("_output")) {
    fs.mkdirSync("_output");
  }
  await app.start(process.env.PORT || 3000);
  llog.yellow("⚡️ Bolt app is running!", process.env.OPENAI_API_KEY);
  let slackResult = await app.client.chat.postMessage({
    channel: process.env.SLACK_LOGGING_CHANNEL,
    text: "starting up the s25-report-bots",
  });

  
})();
