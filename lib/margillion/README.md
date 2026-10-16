# Margillion v1

`/margillion` replaces the deleted Timeundle game. `/timeundle` permanently redirects.
This route is deliberately unlisted and noindex. The dark instrument UI is scoped to
the game, per its requested design; portfolio styling and other games are untouched.

The frozen question bank is version 1, with 45 positive answers. Approximate values
and special units are stated in prompts. Source links appear in the final round log.
The Big Mac uses the US menu's 580 kcal listing as checked in October 2026. The golf
question names the 2024 Vice Pro Plus: dimple counts vary by model.

Daily uses FNV/Mulberry seeded shuffles keyed by UTC date and bank version. Tiers
1–3 use difficulty 1, 4–7 use difficulty 2, and 8–10 use difficulty 3. Epoch #001 is
2026-10-16. Endless has a random seed and exhausts each shuffled bank before repeating.

Percentage error rounds to one decimal *before* scoring/thresholds. Safe damage caps
at 35. Razor success gives 3 times the same base score and heals 5; failure gives
unmultiplied base points and double damage capped at 60. Thus a 5% Razor earns 270
points, while a perfect Razor earns 400 with the separate 100-point bullseye bonus.
Razor healing and bullseye healing stack (10), capped at 100 total margin. Safe
bullseyes still take their error damage before healing. Streak is consecutive
estimates within 5%; it is a display count, not another multiplier. Only daily
survivors earn the remaining-margin-times-ten bonus. Endless has no terminal bonus.

Every new fuse has an absolute 25-second deadline. Reveals last 2.8 seconds and support
early advance after a 240ms duplicate-action guard. Leaving, refreshing, or opening
the menu keeps time running. Catch-up applies expired timeouts and automatic
advances chronologically; four unopposed timeouts deplete a fresh run. At the exact
deadline a late estimate is a timeout, never a lock in the next tier.

`margillion:save:v1` stores daily runs and the latest endless run. Scores are replayed
from validated input logs on load; cached totals are never trusted. Storage failures
fall back to memory with a visible notice. Browser tabs sync through storage events.
Timeundle's incompatible historical localStorage keys remain untouched.
Historical 15-second Margillion rounds record their original durations during load,
so results and stats survive the timer update. Active 15-second rounds gain 10 seconds
without resetting their start; subsequent rounds use 25 seconds.

The current UI requires a viewport at least 768px wide and a physical keyboard.
A single 580px column contains the telemetry strip and unified question/input surface.
There is no on-screen keypad. Header controls expose rules and the mode menu.

Share: one symbol per played tier, skull overriding the terminal depleted tier,
red for timeout/bust, and white for unused daily tiers. Endless shows the latest
50 symbols while retaining the full score and tier count. Daily statistics track
finished days, survivors, best score, and consecutive survived UTC dates.

Run `npm run verify:margillion` for deterministic seed, scoring, persistence, deadline,
endless, and share validation. Run `npm run build` for the complete Next production build.
