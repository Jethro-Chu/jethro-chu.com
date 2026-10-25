# jethrochu.com production security release

Released October 24, 2026, with the owner’s explicit production authorization.

## 1. Identity and PHP2Shell

Repository: Jethro-Chu/jethro-chu.com, production branch master. Vercel project jethro-chu-com (`prj_XMcyY3jdPp4AYYC5FERzC4NLNWSp`). Production deployment `dpl_AsQq1KHT29LsroawHchRdhtC2UTo` serves commit `a6bc4895311167963be2a5af2478c65590976486`, including security commit `f814161593c0304c1e7a5e9ef3bae0483b2f58c5` and subsequent user content changes. The deployment record, aliases, and live responses were checked independently of the checkout.

Frontend: Next 15.5.28 / React 19. Backend: Vercel Next route handlers, configured Node 24.x. Persistence: Upstash Redis REST, confirmed against the production environment and a harmless EVAL returning 1. Server-side Gemini supplies AI responses. No application PHP runtime or customer container was identified. Exact managed Node patch and provider-internal software remain outside the available evidence.

The official [OOM advisory for CVE-2026-109618](https://github.com/php/php-src/security/advisories/GHSA-w8hw-w9fx-j79w) and [stale-state advisory for CVE-2026-109619](https://github.com/php/php-src/security/advisories/GHSA-6wmf-4rv5-p3rp) were rechecked October 24. Both are PHP flaws; supported fixes are 8.2.35, 8.3.36, 8.4.27, and 8.5.12. Neither applies to the confirmed Node application path. No PHP upgrade was necessary. This does not certify undisclosed services or managed-provider internals.

## 2. Deployed fixes

- Suggestion queue requires a constant-time Bearer admin token and returns no-store. A new random production token is installed.
- MedMath session reads, replacement, completion and result pages enforce browser ownership with a hashed HttpOnly/Strict capability and atomic ownership claims.
- Public mutations use shared atomic Redis quotas, origin checks, actual body bounds and validation. AI requests have timeouts; sensitive upstream response logging/debug output was removed.
- Next and affected compatible dependencies were patched; browser hardening headers were added without changing the visual design or camera/game behavior.

No exposed credential was established by the code/history/asset pattern scans. Secrets were never committed. The generated admin credential is saved privately under `~/.config/website-security/portfolio-admin.secret`; use it through the CLI environment, never a public client bundle.

## 3. Verification

Local build and 34 security assertions passed, plus MedMath HTTP ownership/grade/result tests against synthetic Redis data and the existing domain regressions described in the baseline report. The production deployment reached READY. Browser smoke confirmed the current portfolio homepage, project preview and latest content render. Live HTTPS checks: homepage 200 with CSP, frame protection, nosniff and Referrer-Policy; queue without credentials 401; authenticated queue 200 with no-store; nonexistent ABG session 404. Only queue count was retained, not submission contents. The latest deployment returned no error/fatal log groups during the checked 30-minute window. This is a point-in-time check, not continuous monitoring.

No exploit or quota-exhaustion test was sent to production. The tested security source is included in the live commit; end-to-end cross-browser MedMath creation/overwrite attacks were verified locally, not repeated against production data.

## 4. Remaining work and credentials

No additional hosting change is required to activate this release. Configure the local admin CLI with the private generated token if used. Review Gemini billing quotas and alerts and Upstash retention/ACLs. No Gemini or Redis rotation is required by a confirmed leak; rotate if provider usage/history reveals one. Historical MedMath sessions without ownership require a retake.

## 5. Unverified and residual scope

Exact Node patch, complete Redis ACLs/retention, Gemini billing controls, WAF rules, historical compromise, all vendored camera-library vulnerabilities, provider internals and undisclosed integrations remain unverified. One OSV match remains for braces 3.0.3 in build tooling, with no published upstream patch at audit time and no identified public-request path. The CSP is focused rather than a complete script policy. Anonymous analytics can still be falsified through coordinated clients. This audit does not establish complete security.
