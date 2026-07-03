# Hand-off note — paste at the start of the next session

## THIS SESSION — #54 (2026-07-03) "PRE-BUILD BATCH — #54": **the batch is DONE — the ONE batched TestFlight build is now unblocked.** All visual/wording, no behavior logic, `tsc` clean throughout. Plus one extra cleanup Patrick added mid-session (the To-Do Week button, below).

**What changed:**
- **Titles:** the seven remaining pages went 26 → 24 (To-Do, Shopping, Vault, Settings, Timer, Backup, Watch List) — **all 12 non-Home pages now read 24**; verified page-by-page. Home stays 28 (Patrick's call — see below).
- **Home header:** subtitle 22 → **21** in BOTH palettes (`Themes.ts` `subtitleSize`) — Patrick's fix for the subtitle wrapping with his name. Title briefly went to 26 mid-session, then **reverted to 28** on Patrick's call after his phone (old build) showed 28 fits fine — **the Simulator misled on text size** (it runs a narrower device, so the same pt size wraps there but not on the phone; Patrick declined switching the Simulator device to match). Net: Home = 28/21.
- **App name:** `app.json` `"name"` `"Elyfont"` → `"Remember When"` (icon-label half only; shows after the build). `slug`/`scheme`/`bundleIdentifier` deliberately untouched; backup-file naming stays in Nice-to-have (touches restore logic).
- **Button labels item (To-Do "New Task" vs Vault "+ Add") — DROPPED from the batch by Patrick**, not done.
- **To-Do Week button REMOVED (Patrick's mid-session add):** the "📅 Week" fab button, `showWeekAhead` state, the whole Week Ahead overlay (~50 lines) and its 10 `week*` styles cut from `app/todo.tsx`. The "Week" reminder preset (7 days before) STAYS. **No parked-items entry — Patrick's call ("nothing to park")**; the code lives in git history before the #54 commit if ever wanted. Also removed: a dead `showToday` state line (pre-existing, found by an unused-code sweep; the sweep found nothing else in the file).
- **Planner title "too small" on Patrick's phone — already fixed, nothing done:** his build (the #48 state) has Planner at 22; current code has 24 (#50). The next build shows it.

**Process note (Patrick flagged BOTH in #54):** (1) an instruction like "park it now" means NOW, not deferred to session end; (2) a scope answer is not a "go" — wait for the explicit go before cutting code.

**Commit note:** NOT yet committed — 9 code files (`Themes.ts`, `app.json`, `todo.tsx`, `shopping.tsx`, `vault.tsx`, `settings.tsx`, `timer.tsx`, `backup.tsx`, `watchlist.tsx`) + these docs. Patrick commits.

**➤ NEXT SESSION — pick up here:**
1. **The ONE batched TestFlight build** + phone checkpoints (fold in the #48 toggle test and the #49–#54 pages). **BUILD POLICY stands (#50): no per-session builds** — EAS builds past the $45 credit cost real money; Patrick handles Expo billing.
2. Still open and untouched: backup-keys bug (six keys), backup folder naming, Vault import discussion, Vault "Custom" label bug (unverified), structured reminder tests, phone checkpoints A + B, Colors.ts retirement.

---

## SESSION — #53 (2026-07-02) "Theme — myweek.tsx + mollie.tsx #53": **BOTH pages on `Themes.ts` in both themes; `tsc` clean; Patrick Simulator-checked BOTH themes on BOTH pages (pages, tiles, all popups) and approved. THE TWO-THEME ROLLOUT IS COMPLETE — all 13 pages converted.** Mockup-first for My Week (page + New Chore + Postpone popups); Pets needed no mockup — no new elements, everything had a #52-approved treatment. Page logic untouched. Titles 26 → 24 on both (the #51 rule).

**ZERO new theme keys — `Themes.ts` untouched.** Everything rode existing keys:
- **My Week:** Postpone button, "Tomorrow (+1 day)", and the "▶ moved to <day>" tile line ride the `delay` keys (same #FF9500 both themes); the day/time tile line ("Tue 7:00 PM") rides `pill` (light unchanged teal / gold in dark); Done = solid `buttonPrimary`; Edit = outlined `pill`; **day chips (the one element My Day didn't have):** unselected = `pageBackground` fill + `cardBorder` border + `bodyText` text (light pixel-true), selected = solid `buttonPrimary` — Patrick OK'd the dark New Chore popup having TWO solid oranges (Save + the selected day; Timer's selected-pill precedent, bends #52's "Save stands alone").
- **Pets (`mollie.tsx`):** Snooze + the 15/30/60 popup ride `delay`; Treats "−" on `counterMinus` (new `minusBtnText` style — dark-brown text on the yellow in dark), "+" on `bridge`, count on `bodyText`; Log solid `buttonPrimary`; Edit outlined `pill`; time stepper on the `timeStepper` keys. New/Edit Entry popup deliberately kept borderless (faithful to the old light look; My Day/My Week's have a thin border).
- **Both:** ✓ done state now GREEN in BOTH themes via `buttonDone` (the #52 "green means done" rule — a visible light-theme change, was teal; Patrick approved on the mockup); #47 invisible border on Cancel; #48 `mutedText` placeholders (3 inputs My Week, 4 Pets); greys (#aaa/#666/#999/#eee/#ccc) unified onto `mutedText`/`progressTrack`/`buttonNeutral`; spinner captions on `bodyText`.

**Rollout consequence:** every page now reads `Themes.ts` — `constants/Colors.ts` is officially retirable (its own small parked item, now unblocked; check nothing else imports it first).

**Commit note:** NOT yet committed — `app/myweek.tsx` + `app/mollie.tsx` + these docs. Patrick commits.

**➤ NEXT SESSION — pick up here:**
1. **PRE-BUILD BATCH** (Patrick, #51 — see parked-items): remaining titles to 24 (To-Do explicitly; check the other converted pages; Home-at-28 is Patrick's call), matching button labels (To-Do "New Task" vs Vault "+ Add"), the icon-label rename to "Remember When".
2. THEN the ONE batched TestFlight build + phone checkpoints (fold in the #48 toggle test and the #49–#53 pages). **BUILD POLICY stands (#50): no per-session builds** — EAS builds past the $45 credit cost real money; Patrick handles Expo billing.
3. Still open and untouched: backup-keys bug (six keys), backup folder naming, Vault import discussion, Vault "Custom" label bug (unverified), structured reminder tests, phone checkpoints A + B, Colors.ts retirement.

---

*Only the last two sessions are kept here. Older session detail isn't archived in the docs anymore — git history holds the full record.*
