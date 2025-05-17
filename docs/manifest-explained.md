# What is a Slack App Manifest?

A **Slack app manifest** is a JSON or YAML file that defines the configuration, capabilities, and permissions of your Slack app. It acts as a blueprint that tells Slack what your app can do, how it appears, and what permissions it needs. The manifest is used when creating or updating an app in the Slack API dashboard, and it enables you to:

- Specify your app's name, description, and icon
- Define bot users and their behavior
- Set up slash commands
- List OAuth scopes (permissions)
- Configure event subscriptions and interactivity
- Manage other app features and settings

Using a manifest makes it easy to share, version, and reproduce your app configuration across environments or teams.

---

# Breakdown of `bok-summer-25-report-bots` Manifest

Below is an explanation of the key sections in the `docs/app-manifest.md` for this app:

## 1. `display_information`
- **name**: `bok-summer-25-report-bots` — The name shown in Slack.
- **description**: Briefly describes the app's purpose.
- **background_color**: Sets the app's color in Slack.

## 2. `features`
- **app_home**: Controls the app's Home and Messages tabs.
- **bot_user**: Defines the bot's display name and online status (`s25-report-bots`).
- **slash_commands**: Lists custom slash commands, e.g. `/s25-report` for interacting with the app.

## 3. `oauth_config`
- **scopes**: Lists permissions the app needs. Includes both `user` and `bot` scopes for reading/writing messages, files, reactions, and more.

## 4. `settings`
- **event_subscriptions**: Events your app listens to, such as messages, file changes, reactions, and mentions.
- **interactivity**: Enables interactive components (like buttons) and sets the request URL for handling those interactions.
- **org_deploy_enabled**: Whether the app can be deployed across an organization.
- **socket_mode_enabled**: Enables Socket Mode for real-time communication without a public HTTP endpoint.
- **token_rotation_enabled**: Whether token rotation is enabled for added security.

---

# Example Manifest (Excerpt)
```json
{
  "display_information": {
    "name": "bok-summer-25-report-bots",
    "description": "Slack app for BOK Summer 25 reporting",
    "background_color": "#131214"
  },
  "features": {
    "bot_user": {
      "display_name": "s25-report-bots",
      "always_online": true
    },
    "slash_commands": [
      {
        "command": "/s25-report",
        "description": "interact with the bok-summer-25-report-bots",
        "usage_hint": "[args]"
      }
    ]
  },
  ...
}
```

---

# Why Use a Manifest?
- **Consistency:** Ensures your app is configured the same way every time.
- **Portability:** Makes it easy to share or migrate your app to other workspaces.
- **Transparency:** Lets team members and admins review exactly what the app can do.

For more details, see the [Slack Manifest documentation](https://api.slack.com/reference/manifests).
