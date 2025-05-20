# bok-summer-25-report-bots

This repository contains the Slack app used for **BOK Summer 25** reporting. The project is built with [Bolt](https://github.com/slackapi/bolt) for Node.js and coordinates multiple AI agents that respond to messages in a Slack workspace.

Key features include:

- **Multi-agent responses**: Several bots can process the same message sequentially, each providing its own answer. Agent settings like prompts and icons are managed in Airtable, making it easy to update them without code changes.
- **Slack integration**: The app handles message events, slash commands, and interactive elements through Slack's APIs. Configuration is defined in the `docs/app-manifest.md` file.
- **OpenAI support**: Responses are generated with OpenAI's language models, using conversation history for context.
- **Command line helpers**: The `cli.js` file and scripts in the `src` directory offer additional tools for posting updates and creating reports.

See the `docs` folder for a detailed walkthrough on setting up environment variables, deploying the app, and understanding the Slack manifest.
