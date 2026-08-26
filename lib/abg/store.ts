import type { ABGPlayer, ABGSession } from "./types.ts";

const KV_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? "";
const KV_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? "";

const PLAYER_PREFIX = "{abg}:v1:player:";
const SESSION_PREFIX = "{abg}:v1:session:";
const ATTEMPT_PREFIX = "{abg}:v1:attempt:";
const RATE_PREFIX = "{abg}:v1:rate:";
const NAMES_KEY = "{abg}:v1:names";
const RATING_BOARD = "{abg}:v1:board:rating";

const state = globalThis as typeof globalThis & {
  __abgPlayers?: Map<string, ABGPlayer>;
  __abgSessions?: Map<string, ABGSession>;
  __abgNames?: Map<string, string>;
  __abgAttempts?: Set<string>;
  __abgRates?: Map<string, { count: number; resetAt: number }>;
};
const memPlayers = state.__abgPlayers ?? new Map<string, ABGPlayer>();
const memSessions = state.__abgSessions ?? new Map<string, ABGSession>();
const memNames = state.__abgNames ?? new Map<string, string>();
const memAttempts = state.__abgAttempts ?? new Set<string>();
const memRates = state.__abgRates ?? new Map<string, { count: number; resetAt: number }>();
state.__abgPlayers = memPlayers;
state.__abgSessions = memSessions;
state.__abgNames = memNames;
state.__abgAttempts = memAttempts;
state.__abgRates = memRates;

async function redis(command: Array<string | number>): Promise<unknown> {
  if (!KV_URL || !KV_TOKEN) throw new Error("ABG store is not configured");
  const response = await fetch(KV_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
    signal: AbortSignal.timeout(6000),
  });
  if (!response.ok) throw new Error(`ABG store returned ${response.status}`);
  const body = await response.json() as { result?: unknown; error?: string };
  if (body.error) throw new Error(body.error);
  return body.result;
}

export function normalizeDisplayName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}

export async function reserveDisplayName(name: string, playerId: string): Promise<boolean> {
  const normalized = normalizeDisplayName(name);
  if (!KV_URL || !KV_TOKEN) {
    if (memNames.has(normalized)) return false;
    memNames.set(normalized, playerId);
    return true;
  }
  try {
    const result = await redis(["HSETNX", NAMES_KEY, normalized, playerId]);
    if (Number(result) === 1) memNames.set(normalized, playerId);
    return Number(result) === 1;
  } catch (error) {
    console.error("[abg-store] reserveDisplayName failed:", error);
    if (memNames.has(normalized)) return false;
    memNames.set(normalized, playerId);
    return true;
  }
}

export async function replaceDisplayName(oldName: string, newName: string, playerId: string): Promise<boolean> {
  const oldNormalized = normalizeDisplayName(oldName);
  const newNormalized = normalizeDisplayName(newName);
  if (oldNormalized === newNormalized) return true;
  if (!await reserveDisplayName(newName, playerId)) return false;
  memNames.delete(oldNormalized);
  if (KV_URL && KV_TOKEN) {
    try { await redis(["HDEL", NAMES_KEY, oldNormalized]); }
    catch (error) { console.error("[abg-store] replaceDisplayName cleanup failed:", error); }
  }
  return true;
}

export async function getPlayer(id: string): Promise<ABGPlayer | null> {
  if (!KV_URL || !KV_TOKEN) return memPlayers.get(id) ?? null;
  try {
    const result = await redis(["GET", `${PLAYER_PREFIX}${id}`]);
    if (!result) return memPlayers.get(id) ?? null;
    const player = JSON.parse(String(result)) as ABGPlayer;
    memPlayers.set(id, player);
    return player;
  } catch (error) {
    console.error("[abg-store] getPlayer failed:", error);
    return memPlayers.get(id) ?? null;
  }
}

export async function savePlayer(player: ABGPlayer): Promise<void> {
  memPlayers.set(player.id, player);
  memNames.set(normalizeDisplayName(player.displayName), player.id);
  if (!KV_URL || !KV_TOKEN) return;
  try {
    await Promise.all([
      redis(["SET", `${PLAYER_PREFIX}${player.id}`, JSON.stringify(player)]),
      redis(["ZADD", RATING_BOARD, player.rating, player.id]),
    ]);
  } catch (error) {
    console.error("[abg-store] savePlayer failed:", error);
  }
}

export async function saveSession(session: ABGSession): Promise<void> {
  memSessions.set(session.id, session);
  if (!KV_URL || !KV_TOKEN) return;
  try {
    await redis(["SET", `${SESSION_PREFIX}${session.id}`, JSON.stringify(session), "EX", 60 * 60 * 24 * 7]);
  } catch (error) {
    console.error("[abg-store] saveSession failed:", error);
  }
}

export async function getSession(id: string): Promise<ABGSession | null> {
  if (!KV_URL || !KV_TOKEN) return memSessions.get(id) ?? null;
  try {
    const result = await redis(["GET", `${SESSION_PREFIX}${id}`]);
    if (!result) return memSessions.get(id) ?? null;
    const session = JSON.parse(String(result)) as ABGSession;
    memSessions.set(id, session);
    return session;
  } catch (error) {
    console.error("[abg-store] getSession failed:", error);
    return memSessions.get(id) ?? null;
  }
}

export async function claimAttempt(questionId: string, payload: unknown): Promise<boolean> {
  if (!KV_URL || !KV_TOKEN) {
    if (memAttempts.has(questionId)) return false;
    memAttempts.add(questionId);
    return true;
  }
  try {
    const result = await redis(["SET", `${ATTEMPT_PREFIX}${questionId}`, JSON.stringify(payload), "NX", "EX", 60 * 60 * 24 * 30]);
    return result === "OK";
  } catch (error) {
    console.error("[abg-store] claimAttempt failed:", error);
    if (memAttempts.has(questionId)) return false;
    memAttempts.add(questionId);
    return true;
  }
}

export async function saveAttempt(questionId: string, payload: unknown): Promise<void> {
  if (!KV_URL || !KV_TOKEN) return;
  try {
    await redis(["SET", `${ATTEMPT_PREFIX}${questionId}`, JSON.stringify(payload), "XX", "EX", 60 * 60 * 24 * 30]);
  } catch (error) {
    console.error("[abg-store] saveAttempt failed:", error);
  }
}

export async function getRank(playerId: string): Promise<number | null> {
  if (!KV_URL || !KV_TOKEN) {
    const players = Array.from(memPlayers.values()).sort((a, b) => b.rating - a.rating || a.createdAt.localeCompare(b.createdAt));
    const index = players.findIndex((player) => player.id === playerId);
    return index < 0 ? null : index + 1;
  }
  try {
    const rank = await redis(["ZREVRANK", RATING_BOARD, playerId]);
    return rank === null ? null : Number(rank) + 1;
  } catch {
    return null;
  }
}

export async function checkRateLimit(playerId: string, action: string, max = 90): Promise<boolean> {
  const key = `${playerId}:${action}`;
  if (!KV_URL || !KV_TOKEN) {
    const now = Date.now();
    const current = memRates.get(key);
    if (!current || current.resetAt <= now) {
      memRates.set(key, { count: 1, resetAt: now + 60_000 });
      return true;
    }
    current.count += 1;
    return current.count <= max;
  }
  try {
    const count = Number(await redis(["INCR", `${RATE_PREFIX}${key}`]));
    if (count === 1) await redis(["EXPIRE", `${RATE_PREFIX}${key}`, 60]);
    return count <= max;
  } catch {
    return true;
  }
}
