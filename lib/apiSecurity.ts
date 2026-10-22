import { createHash } from "node:crypto";

type Budget = { scope: string; perMinute: number; daily: number; maxBytes?: number };
const local = new Map<string, { count: number; expires: number }>();
const RATE_SCRIPT = `
local a = redis.call('INCR', KEYS[1])
if a == 1 then redis.call('EXPIRE', KEYS[1], 60) end
local b = redis.call('INCR', KEYS[2])
if b == 1 then redis.call('EXPIRE', KEYS[2], 86400) end
return {a,b}`;

function error(status: number, message: string) {
  return Response.json({ error: message }, { status, headers: {
    "Cache-Control": "no-store", ...(status === 429 ? { "Retry-After": "60" } : {}),
  } });
}

export function sameOrigin(request: Request): boolean {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true; // Non-browser clients still face the shared budget.
  const allowed = new Set(["https://jethrochu.com", "https://www.jethrochu.com"]);
  if (process.env.NODE_ENV !== "production") allowed.add(new URL(request.url).origin);
  if (process.env.VERCEL_URL) allowed.add(`https://${process.env.VERCEL_URL}`);
  return allowed.has(origin);
}

export async function withinBudget(request: Request, budget: Budget): Promise<boolean> {
  // Vercel overwrites x-forwarded-for on requests reaching its functions.
  const ip = process.env.VERCEL
    ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
    : "local";
  const fingerprint = createHash("sha256").update(ip).digest("hex").slice(0, 32);
  const keys = [`{security}:${budget.scope}:ip:${fingerprint}`, `{security}:${budget.scope}:daily`];
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  let counts: number[];
  if (url && token) {
    const response = await fetch(url, { method: "POST", cache: "no-store",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(["EVAL", RATE_SCRIPT, 2, ...keys]), signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) throw new Error("Request budget unavailable");
    const data = await response.json() as { result?: number[]; error?: string };
    if (data.error || !Array.isArray(data.result) || data.result.length !== 2) throw new Error("Request budget unavailable");
    counts = data.result.map(Number);
    if (!counts.every(Number.isFinite)) throw new Error("Request budget unavailable");
  } else {
    if (process.env.NODE_ENV === "production") throw new Error("Shared request budget required");
    const now = Date.now();
    for (const [key, value] of local) if (value.expires <= now) local.delete(key);
    counts = keys.map((key, i) => {
      const value = local.get(key) ?? { count: 0, expires: now + (i ? 86400_000 : 60_000) };
      value.count += 1; local.set(key, value); return value.count;
    });
  }
  return counts[0] <= budget.perMinute && counts[1] <= budget.daily;
}

export function protectApi<T extends Request>(handler: (request: T) => Promise<Response>, budget: Budget) {
  return async (request: T): Promise<Response> => {
    if (!sameOrigin(request)) return error(403, "Origin not allowed");
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return error(415, "JSON required");
    const max = budget.maxBytes ?? 64 * 1024;
    const length = Number(request.headers.get("content-length"));
    if (length > max) return error(413, "Request too large");
    try {
      if (!await withinBudget(request, budget)) return error(429, "Too many requests. Please try again later.");
    } catch { return error(503, "Service temporarily unavailable"); }
    // Count actual streamed bytes, including requests without Content-Length.
    const reader = request.clone().body?.getReader();
    let bytes = 0;
    const chunks: Uint8Array[] = [];
    if (reader) {
      try {
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          bytes += chunk.value.byteLength;
          if (bytes > max) { void reader.cancel(); return error(413, "Request too large"); }
          chunks.push(chunk.value);
        }
      } catch { return error(400, "Invalid request body"); }
    }
    try {
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      if (!body || typeof body !== "object" || Array.isArray(body)) return error(400, "JSON object required");
    } catch { return error(400, "Invalid JSON body"); }
    const response = await handler(request);
    response.headers.set("Cache-Control", "no-store");
    return response;
  };
}
