# Timeundle

An unlisted, static Next.js page at `/timeundle`. All gameplay and persistence run
locally. There are no accounts, API requests, analytics, databases, or AI calls.
The route owns its CSS module and font variables. Existing site navigation,
content, sitemap, global styles, and other games are unchanged.

## Daily contract

`events.ts` contains 46 sourced events. `engine.ts` freezes both the bank and the
generator as version 1. The launch epoch is 2026-10-16, puzzle #1. A UTC date,
version, and mode seed a defined 32-bit PRNG and Fisher–Yates shuffle. A puzzle
contains nine unique IDs and years, with starter anchors at chronological ranks
3 and 7. Most puzzles draw from the denser post-1958 bank; others span the full
bank. At least four categories are represented.

Do not edit v1 events, their order, or the v1 algorithm after launch. For content
corrections or expansion, add a new frozen version and select it by an explicit
future UTC activation date. Retain older versions so in-progress games can resume.
The checked-in first-day fixture catches accidental changes.

## Persistence and scoring

`timeundle:save:v1` holds date-keyed daily games, a separate practice game, and the
active mode. A refresh resumes that mode, selected position, pending reveal or
completed result. Loading Daily on a new UTC day opens that date's game. An open
older game gets an explicit rollover notice and can still be finished.

Scores derive from saved guesses. Loading replays every round and validates its
event, slot and points. Lock and Next guard their phases; synchronous refs guard
rapid clicks. Daily statistics derive from the completed date-keyed games, so
reopening a result cannot add another completion. Streaks include yesterday when
today is still unplayed and reset after a missed day. Practice never affects them.
Clearing browser storage clears this local history. Blocked/full storage shows a
notice while allowing play in memory.

Wrong guesses appear at their guessed location for 1.4 seconds before a FLIP
animation moves them into order. The textual guess remains available after the
move. Reduced motion places the card correctly immediately. Next controls the
pace. Mobile uses a scrollable timeline and a persistent Lock/Next action.

Share squares map to 100 / 75 / 50 / 25 / 0 as green / yellow / orange / brown /
white. Clipboard failure exposes a selectable plain-text fallback.

## Checks

```sh
npm run verify:timeundle
npx tsc --noEmit
node --test test/*.test.mjs
npm run build
```

The engine check covers 600 dates, a fixed determinism fixture, every correct
insertion position and guessed slot, score tiers, invalid state, repeated actions,
replay/resume, date boundaries, streaks, practice isolation and sharing.

For browser QA, install optional tools outside this repository and run a local
server. The script uses installed Google Chrome, fixes the browser clock to the
launch date, and saves screenshots under the system temporary directory:

```sh
npm install --prefix /tmp/timeundle-qa playwright @axe-core/playwright
npm run dev -- --port 3101
TIMEUNDLE_QA_MODULES=/tmp/timeundle-qa/node_modules \
  node --no-warnings --experimental-strip-types scripts/verify-timeundle-browser.mjs
```

Set `TIMEUNDLE_URL` to test another local server or a deployment. Set
`TIMEUNDLE_QA_ARTIFACTS` to override the screenshot directory. Browser coverage
includes full gameplay, pending reveals, completed-game refresh, practice refresh,
keyboard, native help dialog focus, mobile long timelines, reduced motion, both
clipboard outcomes, UTC rollover, noindex, sitemap exclusion and existing routes.

## Deploy

This repository's existing Vercel project is `jethro-chu-com`, connected to
`Jethro-Chu/jethro-chu.com`. Its production Git branch is `master`, serving
`https://jethrochu.com`. Pushing a checked commit to that branch invokes the
existing deployment workflow. No project, domain or deployment settings change.
