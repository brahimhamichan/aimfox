import assert from "node:assert/strict";
import { normalizeBaseUrl, redact } from "./config.js";

assert.equal(normalizeBaseUrl("https://api.aimfox.com/"), "https://api.aimfox.com");
assert.equal(redact("1234567890abcdef"), "1234...cdef");

const params = new URLSearchParams();
params.append("accepts_profiles", "true");
assert.equal(params.toString(), "accepts_profiles=true");

console.log("self-check ok");
