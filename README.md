# BKC Report Bots

This repository contains a collection of Slack bots used during reporting week at the Berkman Klein Center. Each bot listens for messages in Slack and uses AI services to generate helpful responses.

## Features

- **Multi‑Agent Responses** – `app.js` launches a Bolt app that routes every message through `src/handlers/message-handler.js`. That handler loads a list of "agents" from Airtable and sequentially prompts OpenAI to craft replies as each agent.
- **Translation Bots** – The `ts280` bots provide French, German, and Japanese translations and evaluate them with critic bots.
- **Creative Writing Bots** – The `rainbow-tests` bots generate poetry and critiques.
- **Poster Maker** – Uses Replicate to create images from prompts and uploads them directly to Slack.
- **CLI Utilities** – `cli.js` includes helper commands for pulling data from Google Sheets and other project tasks.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create an environment file (e.g. `.env.dev`) with the following variables:
   - `SLACK_BOT_TOKEN`
   - `SLACK_APP_TOKEN`
   - `SLACK_SIGNING_SECRET`
   - `SLACK_LOGGING_CHANNEL`
   - `OPENAI_API_KEY`
   - `AIRTABLE_API_TOKEN`
   - `AIRTABLE_BKC_BASE_ID`
   - `REPLICATE_API_TOKEN`
3. Start the app in development mode:
   ```bash
   npm run dev
   ```

The bot will connect via Socket Mode and begin processing messages posted in the workspace.

## License

This project is licensed under the ISC license. See the [LICENSE](LICENSE) file for details.
