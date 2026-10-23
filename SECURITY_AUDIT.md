# jethrochu.com security audit

Audit date: October 21, 2026 (America/Los_Angeles).

**Status: fixes prepared locally. No production deployment, hosting change, database migration, credential rotation, commit, or push was performed. The production findings below remain until the reviewed release is deployed and checked.**

## 1. Deployment identity and PHP2Shell

| Item | Evidence and confidence |
| --- | --- |
| Repository | [Jethro-Chu/jethro-chu.com](https://github.com/Jethro-Chu/jethro-chu.com). Local checkout: `/Users/jethrochu/dev/portfolio`. |
| Production version | Vercel deployment `dpl_H2kQbXx2adA32DJhYwpULgquJbrj`, Git branch `master`, commit `d756b0cc544cd51fc1ce59ddabce1841be499a59`. The authenticated deployment record lists both custom domains as aliases. |
| Hosting | Vercel project `jethro-chu-com`, ID `prj_XMcyY3jdPp4AYYC5FERzC4NLNWSp`, in `jethro-chus-projects`. Live HTTPS responses also identify Vercel. Apex redirects to `www.jethrochu.com`. |
| Frontend | The deployed build log explicitly reports Next.js **15.5.19**. Its Git source uses React **19.0.0**, TypeScript, and Tailwind. This is not a fully static-only application: the build lists API functions. |
| Backend/runtime | Vercel functions containing Next route handlers, including AI and educational-game APIs. Current project setting is Node.js **24.x**. The connector did not return the historical per-function runtime manifests, so the exact Node patch/runtime revision of the existing deployment is unverified. |
| Persistence | The deployed IQ store requires the server-only Upstash Redis REST URL/token. A harmless production aggregate read returned 200, supporting an active configured Redis store. The actual Redis endpoint, account, permissions, and retention configuration could not be read. MedMath and ABG code use the same integration. |
| Other services | Server-side Google Gemini calls; static camera/game assets and a GitHub Pages game integration; pinned CDN scripts. Linked NurseJet and Lab Logger sites are separate products, not evidence of this site's backend. |

The official PHP project advisories confirm CVE-2026-109618 (out-of-memory corruption) and CVE-2026-109619 (stale global state). Supported fixed releases are **8.2.35, 8.3.36, 8.4.27, and 8.5.12**. Updating PHP is the complete remediation; configuration mitigations alone are incomplete. See the [PHP security announcement](https://www.php.net/), [OOM advisory](https://github.com/php/php-src/security/advisories/GHSA-w8hw-w9fx-j79w), and [stale-state advisory](https://github.com/php/php-src/security/advisories/GHSA-6wmf-4rv5-p3rp).

**Applicability:** no PHP runtime was identified in the confirmed application serving path. Vercel deployment records, the actual build log, and the matching source identify a Next/Node application, without a PHP runtime configuration, Composer dependency, or customer-managed PHP container. No PHP update was prepared. This does not attest to undisclosed services or provider-internal software. No PHP exploit, memory-exhaustion test, or upload probe was sent to production.

## 2. Confirmed findings and prepared fixes

| Finding | Evidence | Local fix |
| --- | --- | --- |
| High: unauthenticated suggestion queue read | Production `GET /api/newgrad/suggestions` returned 200 with an array containing five records. Only the response shape/count was retained; submission contents were not printed. | Require a constant-time checked `NEWGRAD_ADMIN_TOKEN`; deny when absent; mark responses `no-store`. CLI now sends the token directly to the canonical www host. Future local queue writes go to the ignored `data/newgrad/private/` directory. The historical five-row tracked seed remains unchanged. |
| High: MedMath session access and replacement relied on a client-selected ID | The deployed source accepts a session object and overwrites the corresponding record without verifying a browser owner. Individual reads/results also rely on that ID. Exploit scenarios were tested only with local synthetic sessions. | Issue a random HttpOnly, Secure-in-production, SameSite=Strict browser capability; keep only its SHA-256 hash in the store; atomically claim new session ownership; check it on read, replacement, completion, and results pages. Do not return the ownership hash. An attempt cannot write against another browser's existing session. |
| High: unbudgeted paid AI/public mutation endpoints | Deployed AI handlers call Gemini without a shared client/global request budget. Most other public mutations also lack a shared limit. | Add atomic Redis per-client minute and global daily budgets, actual streamed body bounds, JSON-object validation, and browser origin checks to all API mutations. Production fails closed with 503 when the budget store is unavailable. AI calls get 15-second upstream timeouts and provider response bodies are no longer logged. Production Akinator reasoning debug output is disabled. |
| Vulnerable dependencies | OSV matched 25 package/advisory pairs in the lockfile tied to the deployed commit. Some advisories have environmental prerequisites; no live exploitation was attempted. | Next and eslint-config-next **15.5.28**, sharp **0.35.5**, and patched compatible transitive packages. See `audit/dependency-audit.json` for before/after matches. |
| Missing browser hardening | Production homepage lacked CSP, frame protection, nosniff, and Referrer-Policy. HSTS was already supplied by hosting. | Add `nosniff`, `SAMEORIGIN`, `strict-origin-when-cross-origin`, and a focused CSP covering base URI, objects, frame ancestors, and form destinations. Existing same-origin frames and camera/game code remain unchanged. |

Relevant Next advisories include [AVIF/image processing](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4) and [SSG/ISR cache poisoning](https://github.com/vercel/next.js/security/advisories/GHSA-mcj8-r9mp-w47p). A vulnerable package version is not a claim that every listed exploit condition applies to Vercel.

Other review results:

- No credential patterns were found in tracked files, all reachable historical text blobs up to 2 MB, or the 14 JavaScript assets referenced by the live homepage. This was a pattern scan, not proof that every possible secret format or deployed route was covered. Existing `.env.local` was not printed or committed.
- Redis commands use JSON arrays with fixed command/key structures. No SQL or shell execution path was found in these APIs. JSX handles user-facing strings as text; structured-data JSON escapes `<`. The game `innerHTML` uses reviewed constants/game-generated content, not these submissions. No confirmed application XSS or injection was found.
- ABG keeps an unpredictable player capability in an HttpOnly/Strict cookie, omits it from public leaderboard rows, and checks session ownership server-side. Cross-player attempts were tested locally.
- IQ and MedMath public analytics are intentionally public, with aggregates/sanitized fields. They are not private account records. Anonymous self-reported analytics remain susceptible to coordinated falsification; request quotas do not establish a verified identity or exam integrity.
- No upload endpoint exists in this app. Food photos belong to the other site. Browser camera processing was not activated during this audit.
- A wildcard CORS header on public static HTML is not credentialed private-data access. No permissive credentialed API CORS configuration was found in source. Added origin checks protect mutations; CORS is not used as authentication.

## 3. Verification

- `npm run build`: passes on local Node 22.22.2, using Next 15.5.28. Existing lint warnings remain in unrelated components.
- `npm run verify:security`: **34 assertions pass**, covering cross-browser MedMath access/overwrite/completion, queue authorization, ABG isolation, CSRF/origin checks, JSON/body bounds, budget exhaustion, and store failure.
- MedMath HTTP test against the real locally built server plus a disposable Redis HTTP fixture: generate, grade, persist, and re-read ten known-correct questions; owner result-page 200; unrelated session read/write/result-page 404. No live data or paid API is used.
- Existing MedMath bank/store tests, 40 randomized Canvas exams, ABG service/engine checks, IQ public-data/timing checks, and 29 New Grad tests pass.
- Browser smoke: the locally built homepage renders with its expected navigation and project previews. Local HTTP responses contain the new headers. The initial development server failed to finish initialization; verification used the successfully built production server instead.
- OSV checked all **494** versioned lockfile entries, including optional and development packages. One advisory remains: `braces` 3.0.3, `GHSA-vfj7-8cjw-p6xm`. npm currently publishes no patched braces release. Its installed chain is ESLint -> Next ESLint plugin -> fast-glob -> micromatch. No public-request path into this build-tool parser was found. Standard npm audit endpoints timed out; the complete OSV batch check was used instead.
- `git diff --check` passes. Existing uncommitted village/game work was not edited, staged, or committed by the audit.

## 4. Release requirements, credentials, and access

1. Review the local diff and new security helpers/tests. No branch was pushed because `master` is the production source.
2. Confirm the production Upstash URL/token have `EVAL`, `INCR`, `EXPIRE`, and the required existing store commands. Set the same integration on an isolated preview using test data. Do not point exploit tests at production Redis.
3. Create a random server-only `NEWGRAD_ADMIN_TOKEN` of at least 32 bytes and configure it in production and the local suggestion CLI. No new secret was generated or stored in Git.
4. Deploy a reviewed preview, test the full browser flow on its HTTPS URL, then promote only with production approval. Verify queue 401, headers, correct Math owner behavior, and budget failures after deployment. Historical sessions without an ownership hash cannot safely be claimed; users need to retake them. Existing result links will no longer grant access across browsers.
5. Review Gemini usage and set provider billing quotas. The new shared AI budget is a request cap, not a dollar guarantee. No exposed Gemini/Redis key was established, so rotation is conditional on suspicious usage or another exposure finding.
6. Vercel's connector denied environment metadata with 403. Existing local CLI credentials were also rejected as invalid. Reauthorize scoped Vercel access to inspect production environment values/metadata and integration permissions; never paste keys into chat.

## 5. Unverified/residual scope

Production fixes are **not deployed or verified**. Exact deployed Node patch, Redis ACLs/retention, provider billing controls, WAF rules, complete Cloud/service configuration, and undisclosed integrations remain unverified. Managed-service internal PHP cannot be inspected from application access. CDN/vendored camera libraries are outside the npm lockfile inventory; their complete vulnerability inventory and integrity pinning remain follow-up work. The focused CSP does not restrict all script sources or constitute complete XSS protection. No authenticated customer account system exists here to audit. This audit does not establish that the website is completely secure.
