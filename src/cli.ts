#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { Command } from "commander";
import { AimfoxApiError, AimfoxClient } from "./client.js";
import { clearConfig, readConfig, redact, resolveConfig, writeConfig } from "./config.js";

type GlobalOptions = { apiKey?: string; baseUrl?: string };

function version(): string {
  try {
    return (createRequire(import.meta.url)("../package.json") as { version?: string }).version || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8").trim();
}

function json(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function queryFrom(pairs: string[] = []): URLSearchParams {
  const params = new URLSearchParams();
  for (const pair of pairs) {
    const index = pair.indexOf("=");
    if (index <= 0) throw new Error(`Expected query as key=value, got ${pair}`);
    params.append(pair.slice(0, index), pair.slice(index + 1));
  }
  return params;
}

async function parseBody(opts: { data?: string; dataFile?: string }): Promise<unknown> {
  if (opts.dataFile) return JSON.parse(await readFile(opts.dataFile, "utf8"));
  if (opts.data) return JSON.parse(opts.data);
  return undefined;
}

async function clientFor(command: Command, requireKey = true): Promise<AimfoxClient> {
  return new AimfoxClient(await resolveConfig(command.optsWithGlobals<GlobalOptions>(), requireKey));
}

const program = new Command()
  .name("aimfox")
  .description("Agent-first CLI for the Aimfox public API.")
  .version(version())
  .option("--api-key <key>", "Aimfox API key; prefer AIMFOX_API_KEY or `aimfox auth set`")
  .option("--base-url <url>", "Aimfox API base URL");

const auth = program.command("auth").description("Manage local Aimfox API key.");

auth.command("set")
  .description("Save an Aimfox API key to ~/.config/aimfox/config.json.")
  .option("--api-key <key>", "API key value")
  .option("--stdin", "Read API key from stdin")
  .action(async (opts: { apiKey?: string; stdin?: boolean }) => {
    const apiKey = (opts.stdin ? await readStdin() : opts.apiKey)?.trim();
    if (!apiKey) throw new Error("Pass --api-key <key> or --stdin.");
    const existing = await readConfig();
    await writeConfig({ ...existing, apiKey });
    json({ ok: true, configPath: (await resolveConfig({}, false)).configPath, apiKey: redact(apiKey) });
  });

auth.command("status")
  .description("Show redacted auth/config status.")
  .action(async function () {
    const config = await resolveConfig(this.optsWithGlobals<GlobalOptions>(), false);
    json({ baseUrl: config.baseUrl, configPath: config.configPath, apiKey: redact(config.apiKey), apiKeySource: config.apiKeySource });
  });

auth.command("check")
  .description("Validate auth with a safe read-only request.")
  .action(async function () {
    const client = await clientFor(this);
    const data = await client.request("GET", "/api/v2/accounts");
    json({ ok: true, accounts: Array.isArray((data as { accounts?: unknown[] }).accounts) ? (data as { accounts: unknown[] }).accounts.length : undefined });
  });

auth.command("clear")
  .description("Remove saved local config.")
  .action(async () => {
    await clearConfig();
    json({ ok: true });
  });

program.command("api")
  .description("Raw Aimfox API request. Path may be /api/v2/... or a full URL.")
  .argument("<method>", "HTTP method")
  .argument("<path>", "API path")
  .option("-q, --query <key=value...>", "Query parameter", [])
  .option("-d, --data <json>", "JSON request body")
  .option("--data-file <path>", "Read JSON request body from file")
  .action(async function (method: string, apiPath: string, opts: { query?: string[]; data?: string; dataFile?: string }) {
    const client = await clientFor(this);
    json(await client.request(method, apiPath, { body: await parseBody(opts), query: queryFrom(opts.query) }));
  });

program.command("accounts")
  .description("List Aimfox accounts.")
  .action(async function () {
    json(await (await clientFor(this)).request("GET", "/api/v2/accounts"));
  });

const campaigns = program.command("campaigns").description("Read Aimfox campaigns.");
campaigns.command("list")
  .option("--outreach-type <type>", "inbound or outbound")
  .option("--accepts-profiles <true|false>", "filter campaigns that accept LinkedIn profile inserts")
  .action(async function (opts: { outreachType?: string; acceptsProfiles?: string }) {
    const query = new URLSearchParams();
    if (opts.outreachType) query.set("outreach_type", opts.outreachType);
    if (opts.acceptsProfiles) query.set("accepts_profiles", opts.acceptsProfiles);
    json(await (await clientFor(this)).request("GET", "/api/v2/campaigns", { query }));
  });
campaigns.command("get").argument("<campaign_id>").action(async function (campaignId: string) {
  json(await (await clientFor(this)).request("GET", `/api/v2/campaigns/${encodeURIComponent(campaignId)}`));
});

program.command("recent-leads")
  .description("List recent leads analytics.")
  .option("-q, --query <key=value...>", "Query parameter", [])
  .action(async function (opts: { query?: string[] }) {
    json(await (await clientFor(this)).request("GET", "/api/v2/analytics/recent-leads", { query: queryFrom(opts.query) }));
  });

program.command("interactions")
  .description("List interaction analytics.")
  .option("-q, --query <key=value...>", "Query parameter", [])
  .action(async function (opts: { query?: string[] }) {
    json(await (await clientFor(this)).request("GET", "/api/v2/analytics/interactions", { query: queryFrom(opts.query) }));
  });

program.command("webhooks")
  .description("List webhooks.")
  .action(async function () {
    json(await (await clientFor(this)).request("GET", "/api/v2/webhooks"));
  });

program.parseAsync().catch((error: unknown) => {
  if (error instanceof AimfoxApiError) {
    json({ ok: false, status: error.status, error: error.message, data: error.data });
  } else {
    json({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
  process.exitCode = 1;
});
