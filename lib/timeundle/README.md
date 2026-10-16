# Timeundle / Chrono-Dive

An unlisted Next.js game at `/timeundle`. The route owns its dark, fixed-height
viewport, Space Grotesk / Inter / Space Mono font roles and CSS module. Tailwind
sets the root viewport layout; the module supplies the game states and motion.
No API, database, accounts or AI generation are required. The sitemap and noindex
metadata are unchanged. Other pages retain their original styles and behavior.

## Components and state

- `useTimeundle.ts`: storage synchronization, transactional actions, absolute
  deadlines, expiry, mode switching and duplicate-action guards.
- `GameHUD.tsx`: seven tier-colored pips, exact-hit combo, animated score.
- `StageDeck.tsx`: mystery/revealed event, 50ms fuse, inline fact and score math.
- `ChronoSpine.tsx`: compact nodes, expanding year-span gaps, mouse/touch/drag
  handling, internal scrolling and one-shot insertion animation.
- `Timeundle.tsx`: opening screen, keyboard shortcuts, optional year input,
  results and spoiler-free sharing.

The state machine is `place -> reveal -> place`, seven times, then `complete`.
Play/Next creates a 20,000ms absolute deadline. Aim changes never reset it.
The center gap is initially highlighted. Expiration submits the highlighted slot;
with no valid aimed slot it records zero. A pending reveal has no timer and waits for Next. Returning home, changing
modes, backgrounding a tab or refreshing cannot replenish the fuse. A 240ms guard
on Next prevents a double action from skipping a reveal. Repeated drop/expiry
calls are idempotent because they are accepted only in the placing phase.

Mouse hover previews; click commits once. Touch/pen previews on the first tap and
commits on the second tap in the same gap. Pointer-captured card dragging can also aim/drop, with a floating card label.
Arrow Up/Down or W/S scrubs; Enter/Space drops; Space advances a reveal. Inputs,
buttons and links keep their normal semantics. Timeundle's arrows are excluded
from the portfolio's Konami listener on this route only.

## Frozen daily content

`events.ts` retains its 46 sourced, immutable v1 events. `legacy.ts` retains the
original generator, scores and fixture. Every saved v1 puzzle keeps its anchors,
queue and already-earned scores. Remaining rounds can use the new timed rules.
Classic timelines are identified in shared results so they are distinguishable.

New puzzles use the frozen v2 algorithm and the same UTC-date seed / puzzle-number
epoch (2026-10-16 = #1). Practice adds a locally generated random seed. Version 2
shuffles eligible anchor pairs 60–120 years apart, then backtracks over a seeded
content order until the full curve and four-category minimum are satisfied:

- Rounds 1–2: within 50 years of an anchor, including before and after it.
- Rounds 3–5: nearest placed event is 10–25 years away.
- Rounds 6–7: a different-category event is 1–8 years away.

No event or year repeats. Constraints never silently fall back to an easier
puzzle. The fixed first-day fixture and 600-date test protect determinism. Future
bank or algorithm changes require a new version; retain old versions for replay.

## Scoring

Base points use the number of cards **before** insertion:

| Distance | Small board | Later board |
| --- | --- | --- |
| Exact | 100 | 100 |
| 1 slot | 40 with <=3 cards | 75 |
| 2 slots | 15 with <=4 cards | 50 |
| 3 slots | 0 with <=4 cards | 25 |
| 4+ slots / no aim | 0 | 0 |

Exact hits add `round(timeLeft / 20000 * 30)` speed points. One-slot misses add
`round(timeLeft / 20000 * 10)`. Exact combos multiply `(base + speed)` by the
consecutive exact-hit count: 1x, 2x, 3x, up to 7x. Any non-exact result resets it.

An optional pre-drop year inside the selected gap and within two years of the
answer adds 25 points **after** the multiplier. At timeout speed/snipe bonuses are
zero. A perfect instantaneous run with seven snipes totals 3,815. New sharing uses
points, exact count, max streak and tier squares rather than a 700-point ceiling.
Squares encode distance tiers, independent of early-round base points or bonuses.

## Persistence

The existing `timeundle:save:v1` key and schema-1 envelope remain intact. Date-keyed
Daily games, Practice and active mode stay separate. Timed rounds include elapsed
milliseconds, base/speed/multiplier/snipe components and the tier. Loading regenerates
that puzzle's content version, then replays and validates each score. Absolute
pending deadlines are retained. Archived classic scores are validated with the
legacy rules. Daily streaks include old completions; timed best/average use games
containing timed rounds so the original 700-point results are not mixed into them.

Unavailable storage displays a notice and permits in-memory play. Clearing browser
storage clears this local history. Clipboard failure exposes selectable share text.

## Verification and deployment

```sh
npm run verify:timeundle
node --no-warnings --experimental-strip-types scripts/verify-timeundle-legacy.ts
npx tsc --noEmit
node --test test/*.test.mjs
npm run build
```

The new engine checks cover 600 compression curves, every insertion position,
small-board score boundaries, speed/timeout boundaries, streaks, snipes, duplicate
actions, timer resume, legacy/mixed migration, tampered scores, daily rollover and
practice isolation. The retained legacy suite guards the original version.

Optional browser QA uses dependencies installed outside this repository:

```sh
npm install --prefix /tmp/timeundle-qa playwright @axe-core/playwright
npm run dev -- --port 3103
TIMEUNDLE_QA_MODULES=/tmp/timeundle-qa/node_modules \
  node --no-warnings --experimental-strip-types scripts/verify-timeundle-browser.mjs
```

Set `TIMEUNDLE_URL` for a different server/deployment and `TIMEUNDLE_QA_ARTIFACTS`
for screenshots. The normal workflow is the existing GitHub `master` -> Vercel
`jethro-chu-com` production deployment at `https://jethrochu.com/timeundle`.
No domain or deployment settings change.
