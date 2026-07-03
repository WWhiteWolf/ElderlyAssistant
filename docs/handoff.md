# Hand-off note — paste at the start of the next session

## THIS SESSION — #51 (2026-07-02) "Theme 'lookahead.tsx' — #51": **lookahead.tsx on `Themes.ts` in both themes; `tsc` clean; Patrick Simulator-checked both themes (page, tiles, all three popups, new header) and approved. Mockup-first; page logic untouched. PLUS the title-24 decision and the deliberate two-line header.**

**Two new theme keys, both palettes (light / dark):** `delay` `#FF9500` in BOTH themes (the "delay color" stays identical so a delayed item always jumps out) + `delayText` `#ffffff`/`#4a1f0c` (bright fill gets dark-brown text in dark — same rule as the gold buttons). Everything else rode existing keys: the Edit button and the Monthly/3/6/Yearly group headers use `pill` (teal in light / gold in dark — exactly the values needed, no new key); greys (`#666/#888/#999/#aaa/#eee`) unified onto `mutedText` / `progressTrack`; #47 invisible-border treatment on Cancel/Save; all 3 inputs got `mutedText` placeholders (#48 rule). Light is pixel-true apart from those standing conventions.

**Patrick's Log call (#51):** the per-tile **Log button is SOLID `buttonPrimary`** ("version A", it's the mark-done action) — deliberately NOT Planner's outlined-gold Log. Delay button + the Delay popup's 1 Day/1 Week/1 Month buttons + the "▶ Delayed …" tile line all use the new `delay` keys.

**TITLE-SIZE RULE UPDATED (Patrick, #51 — supersedes #50's "22–26 all fine"):** Patrick now wants **ALL page titles eventually at 24**. Look Ahead is 24 as of this session. The rest are PARKED (his words: "Park it with the rest") — see the parked item. To-Do (currently 26) is explicitly on that list. Home is 28 by a deliberate #45 choice — whether "all" includes Home is Patrick's call when the parked item is picked up.

**Header restructure that came with it:** "Look Ahead 🔭" was one Text — at 26 the emoji happened to wrap underneath (the look Patrick likes), at 24 it jumped up beside the words. Now it's deliberately two lines: a `titleWrap` column holding the title Text (24) and a telescope Text (24). Don't merge them back into one string.

**Commit note:** NOT yet committed — `app/lookahead.tsx` + `constants/Themes.ts` + these docs. Patrick commits.

**➤ NEXT SESSION — pick up here:**
1. **#52 — `myday.tsx`** (rollout item 8): biggest file (5 modals, ~340 lines of styles); sets the pattern for the routine-tracker trio.
2. Then `myweek.tsx` + `mollie.tsx` (near-duplicates, fastest). After all three: the **PRE-BUILD BATCH** (Patrick, #51 — see parked-items: titles to 24, matching button labels, the icon-label rename), THEN the ONE batched TestFlight build + phone checkpoints (fold in the #48 toggle test and the #49–#51 pages). **BUILD POLICY stands (#50): no per-session builds** — EAS builds past the $45 credit cost real money; Patrick handles Expo billing.
3. Still open and untouched: backup-keys bug (six keys), app-name revert, backup folder naming, Vault import discussion, Vault "Custom" label bug (unverified), structured reminder tests, phone checkpoints A + B, and the new page-titles-to-24 parked item.

---

## SESSION — #50 (2026-07-02) "Theme planner.tsx #50": **planner.tsx on `Themes.ts` in both themes; `tsc` clean; Patrick Simulator-checked both themes (cards, popups, log) and approved ("It looks nice"). Mockup-first; page logic untouched (the unwired reminder fields stay parked). PLUS the Home dark-greeting wrap fix.**

Four new theme keys, both palettes: `statusActive` `#2d9e8f`/`#5fc4b5` + `statusActiveText` `#ffffff`/`#04342c`, `statusOnHoldText` white in BOTH, `progressTrack` `#e0e0e0`/`#5c5044`. Status map: Active = statusActive, On Hold = statusOnHold orange, Completed reuses prioritySomeday grey. Page follows todo.tsx's #49 shape: `priorityColors(t)`/`statusColors(t)` + text-color maps, `useTheme()` + `makeStyles(theme)`. Dark conventions: "+ Task/Edit Project" solid orange (action); "Log"/"Complete Project" outlined gold (quiet, #47 rule); Cancel/Save with the #47 border treatment; all 10 inputs got `mutedText` placeholders; greys unified onto `mutedText`; seven dead styles removed. Planner's title set to **24** (Patrick's pick — 26 crowded the pill). Home greeting fix in the same commit: dark `subtitleWeight` `'500'` → `'400'` so the greeting renders pixel-identical in both themes. Committed as "Theme Planer #50 done."

---

*Only the last two sessions are kept here. Older session detail isn't archived in the docs anymore — git history holds the full record.*
