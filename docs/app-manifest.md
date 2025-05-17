```
{
    "display_information": {
        "name": "bok-summer-25-report-bots",
        "description": "Slack app for BOK Summer 25 reporting",
        "background_color": "#131214"
    },
    "features": {
        "app_home": {
            "home_tab_enabled": false,
            "messages_tab_enabled": true,
            "messages_tab_read_only_enabled": false
        },
        "bot_user": {
            "display_name": "s25-report-bots",
            "always_online": true
        },
        "slash_commands": [
            {
                "command": "/s25-report",
                "description": "interact with the bok-summer-25-report-bots",
                "usage_hint": "[args]",
                "should_escape": false
            }
        ]
    },
    "oauth_config": {
        "scopes": {
            "user": [
                "files:read",
                "files:write",
                "chat:write"
            ],
            "bot": [
                "app_mentions:read",
                "channels:history",
                "channels:read",
                "chat:write",
                "commands",
                "emoji:read",
                "files:read",
                "files:write",
                "groups:history",
                "groups:read",
                "im:history",
                "im:read",
                "im:write",
                "links:read",
                "mpim:history",
                "mpim:read",
                "mpim:write",
                "pins:read",
                "reactions:read",
                "reactions:write",
                "reminders:read",
                "reminders:write",
                "remote_files:write",
                "chat:write.customize",
                "groups:write.topic",
                "groups:write",
                "groups:write.invites",
                "incoming-webhook"
            ]
        }
    },
    "settings": {
        "event_subscriptions": {
            "bot_events": [
                "app_home_opened",
                "app_mention",
                "file_change",
                "file_created",
                "file_deleted",
                "file_public",
                "file_shared",
                "file_unshared",
                "link_shared",
                "message.channels",
                "message.groups",
                "message.im",
                "message.mpim",
                "pin_added",
                "pin_removed",
                "reaction_added",
                "reaction_removed"
            ]
        },
        "interactivity": {
            "is_enabled": true,
            "request_url": "https://s25-report-bots.herokuapp.com/slack/events"
        },
        "org_deploy_enabled": false,
        "socket_mode_enabled": true,
        "token_rotation_enabled": false
    }
}
```