import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export interface HospitalSuggestion {
  id: string;
  hospital_name: string;
  location?: string | null;
  url?: string | null;
  notes?: string | null;
  submitted_at: string;
  status: "pending" | "processed" | "rejected";
  processed_at?: string | null;
}

const KV_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? "";
const KV_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? "";
const REDIS_KEY = "{newgrad}:suggestions:v1";

const memSuggestions: HospitalSuggestion[] = [];

async function redis(command: Array<string | number>): Promise<unknown> {
  if (!KV_URL || !KV_TOKEN) throw new Error("KV store not configured");
  const response = await fetch(KV_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
    signal: AbortSignal.timeout(6000),
  });
  if (!response.ok) throw new Error(`KV store returned ${response.status}`);
  const body = (await response.json()) as { result?: unknown; error?: string };
  if (body.error) throw new Error(body.error);
  return body.result;
}

const filePath = join(process.cwd(), "data", "newgrad", "suggestions.json");

export async function readLocalSuggestions(): Promise<HospitalSuggestion[]> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as HospitalSuggestion[];
  } catch {
    return [];
  }
}

export async function writeLocalSuggestions(items: HospitalSuggestion[]): Promise<void> {
  try {
    await writeFile(filePath, `${JSON.stringify(items, null, 2)}\n`, "utf8");
  } catch (err) {
    console.error("[newgrad-suggestions] writeLocalSuggestions failed:", err);
  }
}

export async function getAllSuggestions(): Promise<HospitalSuggestion[]> {
  if (KV_URL && KV_TOKEN) {
    try {
      const result = await redis(["GET", REDIS_KEY]);
      if (result) {
        return JSON.parse(String(result)) as HospitalSuggestion[];
      }
    } catch (err) {
      console.warn("[newgrad-suggestions] Redis GET failed, falling back to local file:", err);
    }
  } else {
    try {
      const res = await fetch("https://jethrochu.com/api/newgrad/suggestions", {
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const data = (await res.json()) as { ok: boolean; suggestions?: HospitalSuggestion[] };
        if (data.ok && Array.isArray(data.suggestions)) {
          const local = await readLocalSuggestions();
          const localMap = new Map(local.map((s) => [s.id, s]));
          let changed = false;
          for (const remote of data.suggestions) {
            if (!localMap.has(remote.id)) {
              local.unshift(remote);
              changed = true;
            }
          }
          if (changed) await writeLocalSuggestions(local);
          return local;
        }
      }
    } catch {
      // offline or unreachable; fall back to local file
    }
  }
  const fileItems = await readLocalSuggestions();
  if (fileItems.length > 0) return fileItems;
  return memSuggestions;
}

export async function saveSuggestion(
  suggestion: Omit<HospitalSuggestion, "id" | "submitted_at" | "status">,
): Promise<HospitalSuggestion> {
  const item: HospitalSuggestion = {
    id: `sug_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    hospital_name: suggestion.hospital_name.trim(),
    location: suggestion.location?.trim() || null,
    url: suggestion.url?.trim() || null,
    notes: suggestion.notes?.trim() || null,
    submitted_at: new Date().toISOString(),
    status: "pending",
  };

  memSuggestions.unshift(item);

  const localItems = await readLocalSuggestions();
  localItems.unshift(item);
  await writeLocalSuggestions(localItems);

  if (KV_URL && KV_TOKEN) {
    try {
      let current: HospitalSuggestion[] = [];
      const res = await redis(["GET", REDIS_KEY]);
      if (res) current = JSON.parse(String(res)) as HospitalSuggestion[];
      current.unshift(item);
      await redis(["SET", REDIS_KEY, JSON.stringify(current)]);
    } catch (err) {
      console.error("[newgrad-suggestions] Redis save failed:", err);
    }
  }

  return item;
}

export async function updateSuggestionStatus(
  id: string,
  status: "processed" | "rejected",
): Promise<boolean> {
  const items = await getAllSuggestions();
  const target = items.find((s) => s.id === id);
  if (!target) return false;

  target.status = status;
  target.processed_at = new Date().toISOString();

  await writeLocalSuggestions(items);

  if (KV_URL && KV_TOKEN) {
    try {
      await redis(["SET", REDIS_KEY, JSON.stringify(items)]);
    } catch (err) {
      console.error("[newgrad-suggestions] Redis update failed:", err);
    }
  }

  return true;
}
