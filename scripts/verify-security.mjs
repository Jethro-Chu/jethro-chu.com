import assert from 'node:assert/strict';
import { mkdir, rm, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { NextRequest } from 'next/server.js';

// No .env loading. Store fallbacks contain only the synthetic fixtures below.
process.env.NODE_ENV = 'test';
for (const name of ['KV_REST_API_URL','KV_REST_API_TOKEN','UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN','GEMINI_API_KEY','VERCEL']) delete process.env[name];
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => { throw new Error('Unexpected network access in isolated security test'); };
const dir = resolve('node_modules/.cache/security-tests');
await mkdir(dir, { recursive: true });
const file = resolve(dir, 'routes.mjs');
await build({
  stdin: { contents: `export * as security from './lib/apiSecurity.ts'; export * as session from './app/api/medmath/session/route.ts'; export * as complete from './app/api/medmath/complete/route.ts'; export * as suggestions from './app/api/newgrad/suggestions/route.ts'; export * as abgPlayer from './app/api/abg/player/route.ts'; export * as abgSession from './app/api/abg/session/route.ts'; export * as abgAttempt from './app/api/abg/attempt/route.ts';`, resolveDir: process.cwd() },
  bundle: true, platform: 'node', format: 'esm', outfile: file,
  plugins: [{ name: 'project-imports', setup(builder) {
    builder.onResolve({ filter: /^next\/server$/ }, () => ({ path: resolve('node_modules/next/server.js'), external: true }));
    builder.onResolve({ filter: /^@\// }, args => ({ path: resolve(args.path.slice(2) + '.ts') }));
  } }],
});
const { security, session, complete, suggestions, abgPlayer, abgSession, abgAttempt } = await import(pathToFileURL(file));
let checks = 0;
const payload = { sessionId: 'security-fixture-session', visitorId: 'test-only', sessionType: 'exam', selectedCategories: ['conversions'], selectedDifficulty: 'mixed', plannedQuestionCount: 5, completedQuestionCount: 0, startedAt: new Date().toISOString(), isCompleted: false, totalAttempts: 0, firstAttemptCorrectCount: 0, eventualCorrectCount: 0, totalHintsUsed: 0, totalSolutionsRevealed: 0, averageResponseTimeSeconds: 0, categoryBreakdown: {}, difficultyBreakdown: {}, weakCategories: [] };
function request(path, body, { cookie, origin = 'http://localhost:3000', method = 'POST' } = {}) {
  return new NextRequest('http://localhost:3000' + path, { method, headers: { 'content-type': 'application/json', origin, ...(cookie ? { cookie } : {}) }, ...(method !== 'GET' ? { body: JSON.stringify(body) } : {}) });
}
async function expectStatus(handler, req, status) { const r = await handler(req); assert.equal(r.status, status, await r.clone().text()); checks++; return r; }
function cookie(response, key) { const match = response.headers.get('set-cookie')?.match(new RegExp(key + '=([^;]+)')); assert.ok(match); return key + '=' + match[1]; }
const own = await expectStatus(session.POST, request('/api/medmath/session', payload), 200);
const owner = cookie(own, 'medmath_owner');
assert.match(own.headers.get('set-cookie'), /HttpOnly/i); assert.match(own.headers.get('set-cookie'), /SameSite=strict/i); checks += 2;
const sessionPath = '/api/medmath/session?sessionId=' + payload.sessionId;
await expectStatus(session.GET, request(sessionPath, null, { method: 'GET' }), 404);
await expectStatus(session.GET, request(sessionPath, null, { method: 'GET', cookie: 'medmath_owner=' + 'a'.repeat(64) }), 404);
const restored = await expectStatus(session.GET, request(sessionPath, null, { method: 'GET', cookie: owner }), 200);
assert.equal('ownerHash' in (await restored.json()).session, false); checks++;
await expectStatus(session.POST, request('/api/medmath/session', { ...payload, firstAttemptCorrectCount: 999 }), 404);
await expectStatus(complete.POST, request('/api/medmath/complete', { sessionId: payload.sessionId, completedQuestionCount: 5 }), 404);
await expectStatus(complete.POST, request('/api/medmath/complete', { sessionId: payload.sessionId, completedQuestionCount: 5 }, { cookie: owner }), 200);
await expectStatus(session.POST, request('/api/medmath/session', { sessionId: 'invalid' }), 400);
await expectStatus(session.POST, request('/api/medmath/session', payload, { origin: 'https://attacker.example' }), 403);
await expectStatus(suggestions.GET, request('/api/newgrad/suggestions', null, { method: 'GET' }), 401);
process.env.NEWGRAD_ADMIN_TOKEN = 'local-fixture-admin-token-not-production';
await expectStatus(suggestions.GET, request('/api/newgrad/suggestions', null, { method: 'GET' }), 401);
const authorizedQueue = request('/api/newgrad/suggestions', null, { method: 'GET' });
authorizedQueue.headers.set('authorization', 'Bearer ' + process.env.NEWGRAD_ADMIN_TOKEN);
process.env.NODE_ENV = 'production'; // Prevent the CLI-only remote fallback.
await expectStatus(suggestions.GET, authorizedQueue, 200);
process.env.NODE_ENV = 'test';
await expectStatus(abgPlayer.PATCH, request('/api/abg/player', { displayName: 'Attacker' }), 401);
await expectStatus(abgSession.POST, request('/api/abg/session', {}), 401);
await expectStatus(abgAttempt.POST, request('/api/abg/attempt', {}), 401);
const playerA = await expectStatus(abgPlayer.POST, request('/api/abg/player', { displayName: 'Fixture A' }), 201);
const playerB = await expectStatus(abgPlayer.POST, request('/api/abg/player', { displayName: 'Fixture B' }), 201);
const a = cookie(playerA, 'abg_player'), b = cookie(playerB, 'abg_player');
const started = await expectStatus(abgSession.POST, request('/api/abg/session', { mode: 'ranked' }, { cookie: a }), 200);
const startedBody = await started.json();
await expectStatus(abgSession.GET, request('/api/abg/session?sessionId=' + startedBody.session.id, null, { method: 'GET', cookie: b }), 404);
await expectStatus(abgAttempt.POST, request('/api/abg/attempt', { sessionId: startedBody.session.id, questionId: startedBody.question.id, disorder: 'Respiratory Acidosis', compensation: 'Uncompensated' }, { cookie: b }), 400);
// Pure wrapper checks for limits, streamed bodies, and production fail-closed behavior.
let calls = 0;
const guarded = security.protectApi(async () => { calls++; return Response.json({ ok: true }); }, { scope: 'fixture', perMinute: 2, daily: 4, maxBytes: 100 });
await expectStatus(guarded, request('/api/test', {}), 200);
await expectStatus(guarded, request('/api/test', {}), 200);
await expectStatus(guarded, request('/api/test', {}), 429);
assert.equal(calls, 2); checks++;
const sizeGuard = security.protectApi(async () => Response.json({ ok: true }), { scope: 'size', perMinute: 10, daily: 20, maxBytes: 100 });
await expectStatus(sizeGuard, request('/api/test', 'x'.repeat(101)), 413);
await expectStatus(sizeGuard, new Request('http://localhost:3000/api/test', { method: 'POST', headers: { 'content-type': 'text/plain' }, body: '{}' }), 415);
process.env.NODE_ENV = 'production';
await expectStatus(guarded, request('/api/test', {}, { origin: 'https://www.jethrochu.com' }), 503);
// Exercise the shared-store branch and verify cross-instance counters + TTL script.
process.env.KV_REST_API_URL = 'https://redis.fixture.invalid'; process.env.KV_REST_API_TOKEN = 'test-only';
let redisCalls = 0;
globalThis.fetch = async (_url, init) => { const command = JSON.parse(init.body); assert.equal(command[0], 'EVAL'); assert.match(command[1], /EXPIRE/); redisCalls++; return Response.json({ result: [redisCalls, redisCalls] }); };
const shared = security.protectApi(async () => Response.json({ ok: true }), { scope: 'shared', perMinute: 1, daily: 2 });
await expectStatus(shared, request('/api/test', {}, { origin: 'https://www.jethrochu.com' }), 200);
await expectStatus(shared, request('/api/test', {}, { origin: 'https://www.jethrochu.com' }), 429);
globalThis.fetch = async () => { throw new Error('store unavailable'); };
await expectStatus(shared, request('/api/test', {}, { origin: 'https://www.jethrochu.com' }), 503);
const resultPage = await readFile('app/medmath/results/[sessionId]/page.tsx', 'utf8');
assert.match(resultPage, /ownsSession\(session/); checks++;
globalThis.fetch = originalFetch;
await rm(dir, { recursive: true, force: true });
console.log(`PASS: ${checks} isolated security assertions, including cross-browser authorization, CSRF checks, payload bounds and shared-store failure.`);
