export {};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

process.env.KV_REST_API_URL = "https://example.invalid";
process.env.KV_REST_API_TOKEN = "test-redis-token";
process.env.IQ_RATE_LIMIT_SECRET = "test-rate-limit-secret";
process.env.IQ_RATE_LIMIT_MAX = "2";
process.env.IQ_RATE_LIMIT_WINDOW_SECONDS = "3600";

const clientAddress = "203.0.113.42";
const commands: unknown[][] = [];
let requestCount = 0;
globalThis.fetch = async (_input, init) => {
  const command = JSON.parse(String(init?.body)) as unknown[];
  commands.push(command);
  requestCount += 1;
  return new Response(
    JSON.stringify({ result: [requestCount === 1 ? 1 : 3, 3500] }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
};

const { consumeIQSubmissionRateLimit } = await import(
  "../lib/iqtest/store.ts"
);
const allowed = await consumeIQSubmissionRateLimit(clientAddress);
const blocked = await consumeIQSubmissionRateLimit(clientAddress);

assert(allowed.allowed, "The first submission should be allowed.");
assert(allowed.remaining === 1, "The remaining allowance is incorrect.");
assert(!blocked.allowed, "A submission over the configured limit must be blocked.");
assert(blocked.retryAfterSeconds === 3500, "Retry timing is incorrect.");
assert(commands.length === 2, "Each check should use one Redis transaction.");
assert(
  JSON.stringify(commands).includes("{iqtest}:v1:submission-rate:"),
  "The rate-limit key namespace is incorrect.",
);
assert(
  !JSON.stringify(commands).includes(clientAddress),
  "The raw client address must never be sent to Redis.",
);
assert(
  commands[0][3] === commands[1][3],
  "The same client should produce the same pseudonymous rate-limit key.",
);

console.log(
  "Verified IQ submission throttling, retry metadata, and client-address hashing.",
);
