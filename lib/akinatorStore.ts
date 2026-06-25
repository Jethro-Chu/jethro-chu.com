/* ============================================================
   MEDICAL AKINATOR  ·  learning store
   ============================================================
   Persists the conditions the game gets stumped on so it can recognize
   them in future games, plus a log of asked questions to inform future
   question selection.

   Backend: Vercel KV / Upstash Redis over its REST API (KV_REST_API_URL +
   KV_REST_API_TOKEN). Provision it in Vercel → Storage → Create → KV; the
   env vars are injected automatically. When those vars are absent, this
   falls back to an in-process Map so the feature still works in dev and
   degrades gracefully in prod (learning then lasts only as long as a warm
   serverless instance — set up KV for real cross-session persistence).

   Server-only. Never import into a client component.
   ============================================================ */

/* ---- types (the stored shape mirrors the enrichment JSON) -------------- */

export interface ConditionProfile {
  name: string;
  aliases: string[];
  category: string; // "medication" | "medical_topic"
  primary_system?: string;
  acute?: boolean;
  chronic?: boolean;
  autoimmune?: boolean;
  infectious?: boolean;
  inflammatory?: boolean;
  common_symptoms: string[];
  hallmark_features: string[];
  best_questions: string[];
  // bookkeeping
  times_missed: number;
  created_at: string;
  last_seen: string;
}

export interface GameAnswer {
  question: string;
  answer: string;
  useful: boolean;
}

/* ---- config + low-level KV --------------------------------------------- */

const KV_URL = process.env.KV_REST_API_URL ?? "";
const KV_TOKEN = process.env.KV_REST_API_TOKEN ?? "";
const PERSISTENT = Boolean(KV_URL && KV_TOKEN);

const CONDITIONS_KEY = "akinator:conditions"; // hash: normalized name -> JSON profile
const HISTORY_KEY = "akinator:history"; // list of JSON {game_id, question, answer, useful, ts}
const HISTORY_CAP = 2000;

/** in-process fallback (per instance; not shared, not durable) */
const memConditions = new Map<string, ConditionProfile>();
const memHistory: string[] = [];

/** true when a real durable store is configured */
export function isPersistent(): boolean {
  return PERSISTENT;
}

/** run one Upstash REST command, returning its `result` (throws on error) */
async function kv(command: (string | number)[]): Promise<unknown> {
  const res = await fetch(KV_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`kv ${res.status}`);
  const data = (await res.json()) as { result?: unknown; error?: string };
  if (data.error) throw new Error(`kv: ${data.error}`);
  return data.result;
}

const norm = (s: string) => s.toLowerCase().trim().replace(/\s+/g, " ");
const uniq = (xs: string[]) => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of xs.map((s) => s.trim()).filter(Boolean)) {
    const k = x.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push(x);
    }
  }
  return out;
};

/* ---- conditions -------------------------------------------------------- */

/** all learned conditions, optionally filtered by category, most-missed first */
export async function getLearnedConditions(category?: string): Promise<ConditionProfile[]> {
  let all: ConditionProfile[] = [];
  if (!PERSISTENT) {
    all = [...memConditions.values()];
  } else {
    try {
      const flat = (await kv(["HGETALL", CONDITIONS_KEY])) as unknown[] | null;
      if (Array.isArray(flat)) {
        for (let i = 1; i < flat.length; i += 2) {
          try {
            all.push(JSON.parse(String(flat[i])) as ConditionProfile);
          } catch {
            /* skip a corrupt row */
          }
        }
      }
    } catch (err) {
      console.error("[akinator-store] getLearnedConditions failed:", (err as Error).message);
      return [];
    }
  }
  const filtered = category ? all.filter((c) => c.category === category) : all;
  return filtered.sort((a, b) => (b.times_missed ?? 0) - (a.times_missed ?? 0));
}

async function getCondition(key: string): Promise<ConditionProfile | null> {
  if (!PERSISTENT) return memConditions.get(key) ?? null;
  try {
    const v = await kv(["HGET", CONDITIONS_KEY, key]);
    return v ? (JSON.parse(String(v)) as ConditionProfile) : null;
  } catch {
    return null;
  }
}

/**
 * Insert a newly-learned condition, or MERGE into an existing one:
 * union aliases / hallmark features / questions / symptoms, refresh the boolean
 * facts, bump times_missed, and update last_seen. Never overwrites blindly.
 * Returns the stored (merged) profile.
 */
export async function learnCondition(incoming: ConditionProfile): Promise<ConditionProfile> {
  const key = norm(incoming.name);
  const now = new Date().toISOString();
  const existing = await getCondition(key);

  const merged: ConditionProfile = existing
    ? {
        ...existing,
        // refresh scalar facts from the latest enrichment
        category: incoming.category || existing.category,
        primary_system: incoming.primary_system ?? existing.primary_system,
        acute: incoming.acute ?? existing.acute,
        chronic: incoming.chronic ?? existing.chronic,
        autoimmune: incoming.autoimmune ?? existing.autoimmune,
        infectious: incoming.infectious ?? existing.infectious,
        inflammatory: incoming.inflammatory ?? existing.inflammatory,
        // union the lists (merge, don't replace)
        aliases: uniq([...existing.aliases, ...incoming.aliases]),
        common_symptoms: uniq([...existing.common_symptoms, ...incoming.common_symptoms]),
        hallmark_features: uniq([...existing.hallmark_features, ...incoming.hallmark_features]),
        best_questions: uniq([...existing.best_questions, ...incoming.best_questions]),
        times_missed: (existing.times_missed ?? 0) + 1,
        last_seen: now,
      }
    : { ...incoming, times_missed: 1, created_at: now, last_seen: now };

  if (!PERSISTENT) {
    memConditions.set(key, merged);
    return merged;
  }
  try {
    await kv(["HSET", CONDITIONS_KEY, key, JSON.stringify(merged)]);
  } catch (err) {
    console.error("[akinator-store] learnCondition write failed:", (err as Error).message);
  }
  return merged;
}

/* ---- game history ------------------------------------------------------ */

/** append the game's asked questions (capped) for future question tuning */
export async function saveGameHistory(gameId: string, answers: GameAnswer[]): Promise<void> {
  if (!answers.length) return;
  const ts = new Date().toISOString();
  const rows = answers.map((a) => JSON.stringify({ game_id: gameId, ...a, ts }));

  if (!PERSISTENT) {
    memHistory.push(...rows);
    if (memHistory.length > HISTORY_CAP) memHistory.splice(0, memHistory.length - HISTORY_CAP);
    return;
  }
  try {
    await kv(["RPUSH", HISTORY_KEY, ...rows]);
    await kv(["LTRIM", HISTORY_KEY, -HISTORY_CAP, -1]);
  } catch (err) {
    console.error("[akinator-store] saveGameHistory failed:", (err as Error).message);
  }
}
