# aimfox

Agent-first CLI, endpoint reference, Codex skill, and Codex plugin files for the Aimfox public API.

This package is not affiliated with or endorsed by Aimfox.

## Install

```sh
npm install -g aimfox
```

## Auth

Aimfox uses bearer tokens:

```sh
printf '%s\n' "$AIMFOX_API_KEY" | aimfox auth set --stdin
aimfox auth check
```

The saved key lives at `~/.config/aimfox/config.json` with `0600` permissions. You can also skip saved config and set `AIMFOX_API_KEY`.

## Usage

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

Use `aimfox api <METHOD> <PATH>` for routes without a wrapper. Pass query params as repeated `-q key=value`; pass JSON bodies with `--data` or `--data-file`.

## Codex Skill And Plugin

The package includes:

- `skills/aimfox-api-cli`
- `plugins/aimfox`
- `docs/endpoints.md`
- `docs/endpoints.json`

The skill tells Codex to prefer the local `aimfox` command for Aimfox API work and to avoid printing API keys.

## Development

```sh
npm install
npm test
npm pack --dry-run
```
