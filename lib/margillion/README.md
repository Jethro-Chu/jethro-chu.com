# Margillion

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

Questions have no time limit. There is no round countdown, laser fuse, expiration,
or timeout damage for new answers. Leaving or refreshing preserves the current input
and margin. Reveals still advance after 2.8 seconds, or with Space / Enter after the
240ms duplicate-action guard; advancing a reveal never creates another scored round.

`margillion:save:v2` stores daily runs and the latest endless run. On first load it
imports `margillion:save:v1` without modifying the old key. Historical 15/25-second
rounds retain their original scores, including old timeout penalties. Active old
rounds become untimed without applying any missed timeout. Scores are replayed from
validated inputs, and unavailable storage falls back to memory with a visible notice.

The untimed release resets the 2026-10-16 daily once. Its new daily identity ends in
`:untimed-1`, so replay progress and completed results survive subsequent reloads.
Other dates and their statistics remain intact. The UTC question seed is unchanged.

The current UI requires a viewport at least 768px wide and a physical keyboard.
A single 580px column contains the telemetry strip and unified question/input surface.
There is no on-screen keypad. Header controls expose rules and the mode menu.

Share: one symbol per played tier, skull overriding the terminal depleted tier,
red for timeout/bust, and white for unused daily tiers. Endless shows the latest
50 symbols while retaining the full score and tier count. Daily statistics track
finished days, survivors, best score, and consecutive survived UTC dates.

Run `npm run verify:margillion` for deterministic seed, scoring, persistence, untimed play, daily reset,
endless, and share validation. Run `npm run build` for the complete Next production build.
