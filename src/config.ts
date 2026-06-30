import { chmod, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

export const DEFAULT_BASE_URL = "https://api.aimfox.com";
export const CONFIG_DIR = path.join(homedir(), ".config", "aimfox");
export const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");

export type StoredConfig = {
  apiKey?: string;
  baseUrl?: string;
};

export type EffectiveConfig = {
  apiKey?: string;
  apiKeySource: "flag" | "env" | "stored" | "none";
  baseUrl: string;
  configPath: string;
};

export async function readConfig(): Promise<StoredConfig> {
  try {
    return JSON.parse(await readFile(CONFIG_PATH, "utf8")) as StoredConfig;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw error;
  }
}

export async function writeConfig(config: StoredConfig): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });
  await writeFile(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
  await chmod(CONFIG_PATH, 0o600);
}

export async function clearConfig(): Promise<void> {
  await rm(CONFIG_PATH, { force: true });
}

export async function resolveConfig(options: { apiKey?: string; baseUrl?: string } = {}, requireKey = true): Promise<EffectiveConfig> {
  const stored = await readConfig();
  const envKey = process.env.AIMFOX_API_KEY?.trim();
  const flagKey = options.apiKey?.trim();
  const storedKey = stored.apiKey?.trim();
  const apiKey = flagKey || envKey || storedKey;
  const apiKeySource = flagKey ? "flag" : envKey ? "env" : storedKey ? "stored" : "none";
  if (requireKey && !apiKey) throw new Error("No Aimfox API key. Run `aimfox auth set --stdin` or set AIMFOX_API_KEY.");
  return {
    apiKey,
    apiKeySource,
    baseUrl: normalizeBaseUrl(options.baseUrl || process.env.AIMFOX_BASE_URL || stored.baseUrl || DEFAULT_BASE_URL),
    configPath: CONFIG_PATH,
  };
}

export function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

export function redact(value: string | undefined): string {
  if (!value) return "not set";
  if (value.length <= 8) return "********";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}
