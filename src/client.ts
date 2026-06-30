import type { EffectiveConfig } from "./config.js";

export class AimfoxApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly data: unknown,
  ) {
    super(message);
    this.name = "AimfoxApiError";
  }
}

export class AimfoxClient {
  constructor(private readonly config: EffectiveConfig) {}

  async request(method: string, apiPath: string, options: { body?: unknown; query?: URLSearchParams } = {}): Promise<unknown> {
    const url = new URL(apiPath.startsWith("http") ? apiPath : `${this.config.baseUrl}${apiPath.startsWith("/") ? "" : "/"}${apiPath}`);
    options.query?.forEach((value, key) => url.searchParams.append(key, value));

    const headers = new Headers({ Accept: "application/json" });
    if (this.config.apiKey) headers.set("Authorization", `Bearer ${this.config.apiKey}`);
    let body: string | undefined;
    if (options.body !== undefined) {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(options.body);
    }

    const response = await fetch(url, { method: method.toUpperCase(), headers, body });
    const data = await parseResponse(response);
    if (!response.ok) throw new AimfoxApiError(errorMessage(response.status, data), response.status, data);
    return data;
  }
}

async function parseResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function errorMessage(status: number, data: unknown): string {
  if (typeof data === "object" && data && "message" in data && typeof data.message === "string") return data.message;
  if (status === 500) return "Aimfox returned HTTP 500. Their docs say this often means the route expects a different key type, or the API key is invalid.";
  return `Aimfox API request failed with HTTP ${status}.`;
}
