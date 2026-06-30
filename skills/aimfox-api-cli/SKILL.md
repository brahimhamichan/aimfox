---
name: aimfox-api-cli
description: "Use the local aimfox CLI for Aimfox public API work: auth checks, accounts, campaigns, recent leads, interactions, webhooks, and raw /api/v2 requests. Prefer this skill whenever a task mentions Aimfox, aimfox.com, LinkedIn outreach data in Aimfox, or Aimfox API automation."
---

# Aimfox API CLI

Use the local `aimfox` command before browser automation.

## Setup

- Auth is `Authorization: Bearer <api key>`.
- Saved key path: `~/.config/aimfox/config.json`.
- Environment override: `AIMFOX_API_KEY`.
- Sanity check: `aimfox auth check`.
- Config status: `aimfox auth status`.

## Common Commands

```sh
aimfox accounts
aimfox campaigns list
aimfox campaigns get <campaign_id>
aimfox recent-leads
aimfox interactions
aimfox webhooks
aimfox api GET /api/v2/accounts
aimfox api POST /api/v2/webhooks --data '{"url":"https://example.com/hook","events":["reply"]}'
```

Use `aimfox api <METHOD> <PATH>` for routes without a first-class wrapper. Pass query params as repeated `-q key=value`; pass JSON body with `--data` or `--data-file`.

## Safety

- Do not print API keys.
- Prefer read-only commands for discovery.
- Confirm before mutating campaigns, webhooks, conversations, templates, labels, blacklist, or workspace/client routes unless the user explicitly asks for the mutation.
- Aimfox documents a 60 requests/minute API limit.
- Aimfox docs note some routes require a master API key and others require a regular API key; a 500 can mean the wrong key type.

## Reference

Read [references/endpoints.md](references/endpoints.md) when you need endpoint paths.
