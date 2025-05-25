# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Development:**
- `npm run dev` - Start development server with nodemon
- `npm run prod` - Start production server
- `npm test` - Run tests using Node.js built-in test runner

**CLI Tools:**
- `node cli.js --getSheetData --id=<sheet_id> --name=<sheet_name>` - Fetch Google Sheets data

## Architecture

This is a Slack bot application built with Slack Bolt for Node.js that coordinates multiple AI agents for BOK Summer 25 reporting.

**Core Structure:**
- `app.js` - Main Slack app entry point using socket mode
- `cli.js` - Command-line interface for standalone operations
- `src/bots/` - Contains individual bot implementations that process messages
- `src/handlers/` - Slack event handlers (messages, reactions, etc.)
- `src/utils/` - Utility libraries organized by purpose (ll-slack-tools, ll-image-tools, etc.)

**Bot System:**
- Bots reply to messages and events in Slack, and some work autonomously through scheduled cron jobs
- Bots are modular and can process the same message sequentially
- Bot registration happens in `src/bots/index.js`
- Message routing handled by `src/handlers/message-handler.js` with configurable rules
- Event handling takes place in `src/handlers/event-handler.js` with configurable rules

**Environment:**
- Uses `.env.dev` for development and `.env.prod` for production
- Requires SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, SLACK_APP_TOKEN, OPENAI_API_KEY
- Socket mode enabled for real-time communication
- Creates `_temp/` and `_output/` directories on startup

**Message Flow:**
1. All messages trigger `parseAll` handler
2. Messages are filtered by channel and trigger phrases
3. Matching bots process messages using OpenAI API
4. Responses posted back to Slack with conversation context

The app uses extensive utility libraries for image processing, video tools, Airtable integration, and Google Sheets access.

## Available Bots

- **BKC Bots** - Multi-agent system that fetches AI agents from Airtable and processes messages sequentially through each agent
- **Emoji-2-Explanation Bot** - Handles explanation requests triggered by emoji reactions (placeholder implementation)
- **Emoji-2-Timeline-Event Bot** - Converts Slack thread conversations into structured timeline events and stores in Airtable
- **Emoji-2-Vision Bot** - Analyzes images/visual content using OpenAI vision when triggered by emoji reactions
- **Poster Maker** - Generates images using Replicate's Flux model and uploads to Slack
- **Rainbow Tests** - Sequential poetry bot that creates poems and then critiques them
- **TS280** - Multi-language translation demo (French, German, Japanese) with critical analysis
- **Testing Bot** - Simple test bot that confirms the system is running
- **Upload Handling Bot** - File upload handler (placeholder implementation)

## Goals

- Handling reporting tasks for the Learning Lab Studio. As we create notes, record videos and audio to get transcripts, and post images--all to Slack--we want to have an ensemble of ai bots work with that data to generate content (stories, social posts, reports) based on our work.