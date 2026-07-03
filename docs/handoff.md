# Hand-off note — paste at the start of the next session

## THIS SESSION — #50 (2026-07-02) "Theme planner.tsx #50": **planner.tsx on `Themes.ts` in both themes; `tsc` clean; Patrick Simulator-checked both themes (cards, popups, log) and approved ("It looks nice"). Mockup-first; page logic untouched (the unwired reminder fields stay parked). PLUS the Home dark-greeting wrap fix.**

**Start-of-session facts:** #49's CODE was committed ("Theme todo.tsx #49 complete") but its DOCS commit never happened — docs still described #48. The #49 entry below is reconstructed from git, not session notes.

**Four new theme keys, both palettes (light / dark):** `statusActive` `#2d9e8f`/`#5fc4b5` (dark gets a brighter teal — the light teal goes muddy on the dark card) + `statusActiveText` `#ffffff`/`#04342c`, `statusOnHoldText` white in BOTH, `progressTrack` `#e0e0e0`/`#5c5044`. Status map: Active = statusActive, On Hold = existing statusOnHold orange, Completed reuses prioritySomeday grey. Page follows todo.tsx's #49 shape exactly: `priorityColors(t)`/`statusColors(t)` + text-color maps for selected form buttons, `useTheme()` + `makeStyles(theme)`.

**Dark conventions applied:** "+ Task/+ Project" and "Edit Project" solid orange (action); "Log" and "Complete Project" outlined gold (quiet, #47 rule); Cancel/Save with the #47 border treatment; solid buttons carry invisible borders for size-match; all 10 inputs got `mutedText` placeholders (#48 rule); the greys (`#666/#999/#aaa`) unified onto `mutedText`; seven dead styles removed (`backBtn`, `backText`, `settingsBtnText`, `statusBadge`, `statusBadgeText`, `hintText`, `pressToEdit`). Reminder "Yes" selected uses statusActive (light identical to old bridge teal).

**TITLE-SIZE RULE (Patrick, #50):** page titles do NOT need to be 26 — 22–26 is all acceptable, and fitting comfortably beats matching exactly. I raised Planner's 22 to 26 "for consistency"; the long name crowded the Home pill; reverted; Patrick then picked **24** — that's what's in the file. Don't "standardize" it upward again.

**Home greeting fix (same commit):** dark `subtitleWeight` `'500'` → `'400'` in `Themes.ts`, so "Good to see you, Patrick!" renders pixel-identical in both themes. On the phone it had wrapped to two left-aligned lines in dark (heavier weight = wider text than the fixed middle column allows). Patrick's rule: nothing in the header may move or change noticeably when switching themes.

**BUILD POLICY (Patrick, #50):** EAS builds cost real money past the Starter plan's $45 credit — last period's 22 iOS builds ($2 each) used it exactly. Patrick's call: **no more TestFlight builds until the remaining pages are converted**, then ONE batched build picks everything up. He handles the Expo billing side himself. Don't suggest per-session builds.

**Commit note:** NOT yet committed — `app/planner.tsx` + `constants/Themes.ts` (includes the greeting fix).

**➤ NEXT SESSION — pick up here:**
1. **#51 — `lookahead.tsx`** (rollout item 7): grouped sections / swipe / modal pattern — a smaller preview of the myday/myweek/mollie trio.
2. Then `myday.tsx` (biggest file, 5 modals), then `myweek.tsx` + `mollie.tsx` (near-duplicates, fastest). After all four: the ONE batched TestFlight build + phone checkpoints (fold in the #48 toggle test and the #49/#50 pages).
3. Still open and untouched: backup-keys bug (six keys), app-name revert, backup folder naming, Vault import discussion, Vault "Custom" label bug (unverified), structured reminder tests, phone checkpoints A + B.

---

## SESSION — #49 (2026-07-02) "Theme todo.tsx" — **reconstructed from git; the session's docs commit was never made.**

Code committed as "Theme todo.tsx #49 complete:" — `app/todo.tsx` (~180 lines changed) + `constants/Themes.ts` (+24 lines: the six priority keys `priorityUrgent/Normal/Someday` + `...Text` variants, plus `statusOnHold`, in BOTH palettes). todo.tsx converted to `useTheme()`/`makeStyles(theme)` with `priorityColors(t)`/`priorityTextColors(t)` maps feeding the side bar, priority word, Week Ahead dot, and selected Priority button. Patrick reported no problems with it in #50, and the pattern carried cleanly into planner.tsx. No further session notes survive.

---

*Only the last two sessions are kept here. Older session detail isn't archived in the docs anymore — git history holds the full record.*
