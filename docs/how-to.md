# How to Start a New Slack App (Node.js, Bolt)

This guide will help you set up a Slack app like `bok-summer-25-report-bots` using Node.js and the Bolt framework. It references `package.json` and `app.js` for structure and setup.

---

## 1. Prerequisites
- Node.js (v16+ recommended)
- npm (comes with Node.js)
- A Slack workspace where you can install your app

---

## 2. Project Setup

### a. Create Your Project Directory
```bash
mkdir my-slack-app
cd my-slack-app
```

### b. Initialize npm
```bash
npm init -y
```

### c. Install Dependencies
Install the required packages (see `package.json`):
```bash
npm install @slack/bolt airtable axios chokidar clear dotenv learninglab-log node-cron openai yargs
```

---

## 3. Environment Variables
Create a `.env.dev` file in your root directory with the following keys:
```
SLACK_BOT_TOKEN=your-slack-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_APP_TOKEN=your-app-level-token
SLACK_LOGGING_CHANNEL=your-logging-channel-id
OPENAI_API_KEY=your-openai-api-key
PORT=3000
```

> **Note:** Never commit secrets to your repository.

---

## 4. app.js Structure
Your `app.js` should:
- Load environment variables with `dotenv`
- Initialize the Bolt `App`
- Register message handlers
- Start the app and post a startup message

Example (simplified):
```js
const { App } = require("@slack/bolt");
require("dotenv").config({ path: `.env.dev` });

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  port: process.env.PORT || 3000,
});

app.message("hello", async ({ message, say }) => {
  await say(`Hello, <@${message.user}>!`);
});

(async () => {
  await app.start();
  console.log("⚡️ Bolt app is running!");
})();
```

---

## 5. Running the App

To start your app in development mode:
```bash
npm run dev
```
Or, directly:
```bash
node app.js
```

---

## 6. Next Steps
- Add custom handlers in `src/handlers/`
- Use `cli.js` for command-line utilities
- Read and modify `package.json` as needed

For more details, see the official [Slack Bolt documentation](https://slack.dev/bolt-js/).
