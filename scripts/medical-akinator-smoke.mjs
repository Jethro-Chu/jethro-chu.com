/**
 * Medical Akinator — API smoke test.
 *
 * Exercises the public contract of /api/medical-akinator against a running dev
 * server. Deterministic checks (validation + safety screen) must pass; checks
 * that depend on a live Gemini call are "soft" (a 502/503 upstream blip warns
 * but does not fail the run).
 *
 * Usage:
 *   node scripts/medical-akinator-smoke.mjs            # defaults to :4321
 *   BASE_URL=http://localhost:3000 node scripts/medical-akinator-smoke.mjs
 */

const BASE = (process.env.BASE_URL || "http://localhost:4321").replace(/\/$/, "");
const URL = `${BASE}/api/medical-akinator`;

let hardFails = 0;
let softWarns = 0;

function pass(name, detail = "") {
  console.log(`  ✓ ${name}${detail ? `  ${detail}` : ""}`);
}
function fail(name, detail = "") {
  hardFails++;
  console.error(`  ✗ ${name}${detail ? `  ${detail}` : ""}`);
}
function warn(name, detail = "") {
  softWarns++;
  console.warn(`  ~ ${name} (skipped)${detail ? `  ${detail}` : ""}`);
}

async function post(body) {
  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON */
  }
  return { status: res.status, json };
}

// soft when the only problem is Gemini being unavailable (502/503)
const upstreamBlip = (r) => r.status === 502 || r.status === 503;

async function run() {
  console.log(`Medical Akinator smoke test → ${URL}\n`);

  // 1. invalid category → 400
  {
    const r = await post({ category: "sports trivia", answers: [] });
    r.status === 400
      ? pass("invalid category returns 400")
      : fail("invalid category returns 400", `got ${r.status}`);
  }

  // 2. malformed body → 400 (category missing)
  {
    const r = await post({ answers: "nope" });
    r.status === 400
      ? pass("missing/invalid category returns 400")
      : fail("missing/invalid category returns 400", `got ${r.status}`);
  }

  // 3. safety screen — personal emergency reveal never reaches Gemini → status "safety"
  {
    const r = await post({
      category: "cardiac condition",
      answers: [],
      reveal: "I'm having chest pain and shortness of breath, what should I do?",
    });
    r.status === 200 && r.json?.status === "safety" && r.json?.message
      ? pass("emergency/personal reveal triggers safety")
      : fail("emergency/personal reveal triggers safety", `got ${r.status} ${JSON.stringify(r.json)}`);
  }

  // 4. safety screen — a bare concept name still teaches (must NOT be flagged)
  {
    const r = await post({ category: "cardiac condition", answers: [], reveal: "heart attack" });
    if (upstreamBlip(r)) warn("bare concept name is not flagged as unsafe", "gemini upstream blip");
    else if (r.status === 200 && r.json?.status === "guess")
      pass("bare concept name is not flagged as unsafe");
    else fail("bare concept name is not flagged as unsafe", `got ${r.status} ${JSON.stringify(r.json)}`);
  }

  // 5. play: first turn returns a question (Gemini-dependent → soft)
  {
    const r = await post({ category: "cardiac condition", answers: [] });
    if (upstreamBlip(r)) warn("first turn returns a question", "gemini upstream blip");
    else if (r.status === 200 && r.json?.status === "question" && r.json?.question)
      pass("first turn returns a question", `“${r.json.question}”`);
    else fail("first turn returns a question", `got ${r.status} ${JSON.stringify(r.json)}`);
  }

  // 6. reveal of a real concept returns a learning summary (Gemini-dependent → soft)
  {
    const r = await post({ category: "endocrine condition", answers: [], reveal: "DKA" });
    if (upstreamBlip(r)) warn("reveal returns a learning summary", "gemini upstream blip");
    else if (r.status === 200 && r.json?.status === "guess" && r.json?.summary?.whatItIs)
      pass("reveal returns a learning summary", `→ ${r.json.guess}`);
    else fail("reveal returns a learning summary", `got ${r.status} ${JSON.stringify(r.json)}`);
  }

  console.log(`\n${hardFails === 0 ? "PASS" : "FAIL"} — ${hardFails} failed, ${softWarns} skipped (upstream).`);
  process.exit(hardFails === 0 ? 0 : 1);
}

run().catch((e) => {
  console.error("smoke test crashed:", e.message);
  process.exit(1);
});
