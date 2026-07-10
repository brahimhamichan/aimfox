---
name: aimfox-mcp
description: "Use the official Aimfox MCP integration for Aimfox accounts, campaigns, leads, conversations, templates, analytics, webhooks, labels, and blacklist workflows. Prefer this skill whenever a task mentions Aimfox or LinkedIn outreach managed in Aimfox."
---

# Aimfox MCP

Use the Aimfox MCP tools instead of a local CLI or manually supplied API key.

## Authentication

- Connect through the Aimfox OAuth flow when prompted.
- Never ask the user to paste an Aimfox access token or API key into chat.
- If authorization expires, reconnect the Aimfox integration.

## Workflow

1. Use read-only tools to discover accounts, campaigns, leads, conversations, templates, analytics, or webhooks.
2. Resolve names to stable identifiers before mutations.
3. Summarize the intended change and request confirmation unless the user explicitly requested that exact mutation.
4. Perform the smallest matching MCP tool call and report the result.

## Safety

- Treat campaign changes, messages, profile additions/removals, labels, notes, templates, webhooks, limits, and blacklist actions as mutations.
- Treat deletion, message sending, blacklist changes, and campaign state changes as high-impact mutations.
- Never expose OAuth tokens or private lead data beyond what the user requested.
