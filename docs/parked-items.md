# Parked items — running backlog (open work only)

Future / deferred work for "Remember When." Not for the current session — the active
goal lives in `handoff.md`. Pull an item from here when you're ready to take it on;
move it back into `handoff.md` once it's the live goal. Add new ideas as they come up.

This file holds only still-open work. Finished items aren't archived in the docs —
git history keeps the full record.

Last updated: 2026-07-02 (session #47 — shopping.tsx + vault.tsx
converted to `Themes.ts`, both themes approved in the Simulator. Eleven
more shared keys (neutral/delete/stocked buttons, selected row, chip);
new dark convention: solid orange = action, OUTLINED GOLD = quiet
(Stocked / Edit / Cancel); dark creams brightened app-wide (bodyText +
button text `#fff6de`, muted `#e9dcba`) — note Home's tileLabel still
has the old dimmer cream. Two new items below: the unverified Vault
"Custom" label bug, and "Remove categories from Vault".)

---

## TWO-THEME ROLLOUT (was "dark theme rollout"; rescoped #45) — all 13 pages

Patrick's call (#45): the light theme is NOT going away — every page gets
BOTH themes, shared via `constants/Themes.ts` (both palettes, same keys),
switched later by a Settings toggle (see Nice-to-have). Converting a page
now means: agree its light + dark treatment (mockups first if it has new
elements), wire it to `useTheme()` + the `makeStyles(theme)` pattern that
`home.tsx` demonstrates, and add any new keys to BOTH palettes. One file
(or small pair) per session, `tsc` clean + Simulator-checked in BOTH themes
before moving on. Until the toggle exists, the active theme is the
`DEFAULT_THEME` one-word switch in `Themes.ts` (committed as `'light'`).

1. ✅ **DONE — `home.tsx`** (#44 dark build; #45 converted to `Themes.ts`
   + light design approved). Dark: as #44 (cart/gear swapped to
   `@expo/vector-icons` — VS16 emoji glyphs ignore RN `color`). Light:
   soft-teal circles `#4caba1`/`#348f86`, cart `#eaeff2`, gear `#4caba1`,
   original typography. Header title/subtitle are 28/22 in BOTH themes
   (Patrick wants no size jump between themes). Known accepted quirk:
   28px title wraps on the Simulator's narrower screen, fits on the real
   phone — auto-shrink fix offered and declined ("simulator thing").
2. ✅ **DONE (#46) — `backup.tsx` + `watchlist.tsx`.** Mockup-first design
   pass approved for both themes; both files on `makeStyles(theme)`;
   eight new keys in both palettes (see Themes.ts comments). backup's
   back pill now says "← Back" (the old "← Settings" wrapped to two
   lines in the fixed-width pill — Patrick chose the shorter word).
   Light `cartIcon` changed to `#d8dde3` (Patrick, supersedes #45).
3. ✅ **DONE (#47) — `shopping.tsx` + `vault.tsx`.** Mockup-first, both
   themes approved. Eleven new keys (see Themes.ts comments). New dark
   convention set here: solid orange = action, outlined gold = quiet
   (Stocked, Edit, Cancel). Dark creams brightened app-wide. Vault's
   "Missing Info" alert reworded ("Tap a Label..."). Light unchanged.
4. **`timer.tsx` + `settings.tsx`** — paired: both use native `Switch`
   toggles needing explicit `trackColor`/`thumbColor` values (per theme).
5. **`todo.tsx`** — standalone; colors come from a `PRIORITY_COLORS` JS
   object in the code, not just the stylesheet — needs logic edits.
6. **`planner.tsx`** — standalone; same color-map situation
   (`PRIORITY_COLORS` + `STATUS_COLORS`), most structurally complex file.
7. **`lookahead.tsx`** — grouped sections/swipe/modal pattern, a smaller
   preview of the myday/myweek/mollie trio below.
8. **`myday.tsx`** — biggest file (5 modals, ~340 lines of styles); sets the
   pattern for the routine-tracker trio.
9. **`myweek.tsx` + `mollie.tsx`** — copy myday's pattern; near-duplicate
   files, should go fastest.

Once all 13 are converted, `constants/Colors.ts` can be retired — its
values already live on as the light palette in `Themes.ts`. Not removed
yet on purpose: unconverted pages still read it.

---

## BIG PLANNED WORK from #34 (master spec: `docs/reminder-audit.md`)

A multi-session effort to make reminders behave the same everywhere, plus two new
pages. Take ONE piece per session. **Order: pages first, then the popup consolidation.**

- **✅ DONE (#35, Simulator-validated) — Stripped recurrence out of To-Do → one-time
  only** (`app/todo.tsx`, `app/_layout.tsx`). Removed Monthly + Yearly live code and the
  3/6-month stubs; To-Do is now one-time tasks only. `tsc` clean. Real-device check is
  folded into Checkpoint A. (Superseded the old "3/6-month" + "Monthly/Yearly firing
  test" items below — nothing left to do there.)
- **✅ DONE (#36, Simulator-validated) — Built the "Look Ahead" home-screen page**
  (`app/lookahead.tsx` + home tile/route + `_layout.tsx` Stack.Screen). Items grouped under
  Monthly / 3 Months / 6 Months / Yearly; add/edit form (name + first-due date + time +
  repeat interval); own history log; reorder within group; swipe-delete. `tsc` clean.
  **No notification code yet** — that's Step 3 below.
- **✅ DONE (#37, Simulator-validated) — Look Ahead reminders + re-arm**
  (`app/lookahead.tsx`, `app/_layout.tsx`). Patrick chose ONE uniform mechanism for all
  four intervals (not the spec's native-repeat / re-arm split): every item is a single
  dated reminder the app re-arms; the page self-heals on load; items advance only when
  marked done. Log/Done rolls the item to its next future date and logs it. Added the
  **Delay = Day / Week / Month** control on the notification banner AND as an on-tile
  button (orange, Pets-Snooze style), plus an orange **"▶ Delayed …"** line on the tile
  that clears on done / edit / once the delay time passes. `tsc` clean. Real-device check
  is **PHONE CHECKPOINT A**, still pending.
- **✅ DONE (#38, Simulator-checked) — Step 4, To-Do half: To-Do gets its OWN reminder
  structure** (`app/settings.tsx`, `app/backup.tsx`, `app/todo.tsx`, `app/_layout.tsx`).
  **Decision (Patrick): To-Do is NOT unified with the others** — it's a fixed one-time
  appointment (can't be done late, can't be delayed; a change = a new appointment), and
  its old trouble was *riding on* the other pages' notification setup. So: To-Do now
  requests its own permission + sets its own handler; its popup is **OK + Done only** (no
  Snooze/Delay); presets rebuilt (dropped "At time", added Day Before/Night Before/2 Days
  Before, plus a new settable **Midday** time). `tsc` clean. Real-device check is part of
  the checkpoints below.
- **✅ DONE (#39, Simulator-checked) — Step 4, routine half: ONE shared popup for
  My Day / My Week / Pets** (`app/_layout.tsx`, `app/myday.tsx`, `app/mollie.tsx`,
  `app/myweek.tsx`). New `routineactions` category: OK / Skip / Delay 15·30·60 / Done.
  Skip = dismiss + cancel the item's pending one-offs, nothing marked/logged. Done got
  the past-day guard (logs a past completion, doesn't check off today's / this cycle's).
  Silent-snooze fixed (banner snoozes now carry sound). My Week's banner "+1 Day"
  dropped (Patrick's call — postpone stays on the page). Real-device check owed below.
- **✅ DONE (#40) — Design review of each page's reminder machinery.** Patrick's
  per-page calls: **To-Do banners now carry NO buttons** (`app/todo.tsx` dropped the
  `categoryIdentifier`; `app/_layout.tsx` dropped the `todosnooze` registration, old
  handler left harmlessly) — a To-Do is a one-time appointment, every set reminder
  should fire, Done happens in-app afterward. My Day / My Week / Pets reviewed and
  kept as-is. Look Ahead / Timer / Planner not reviewed. `tsc` clean; phone check of
  the buttonless banner batched into the checkpoints below.
- **STRUCTURED REMINDER TESTS — still owed** (was #39's pick; #40 became the design
  review instead). One organized test checklist covering every reminder kind: To-Do
  one-shots (now buttonless banners), My Day / Pets daily, My Week weekly + postpone,
  Look Ahead long-lead + Delay, the shared routine popup's six buttons,
  past-day/past-cycle guards, sound, tap-routing. Work through it Simulator-first;
  batch the device-only parts into the checkpoints below. **Add (#41, Patrick's
  item 4): he saw a banner Done on YESTERDAY'S My Day reminder check off TODAY'S —
  almost certainly the phone's older TestFlight build (the #39 past-day guard isn't
  device-tested yet), but verify the guard explicitly. Patrick is tracking it.**
- **PHONE CHECKPOINTS A + B (cloud build) — owed; likely folded into the structured
  test session.** On the real phone confirm: To-Do one-shots + Look Ahead reminders
  fire, route on tap, the Look Ahead Done/Delay buttons behave, **the To-Do banner is
  buttonless (#40)** — swipe dismisses, tap opens the app, no OK/Done (banners
  scheduled before #40 may still show the old buttons until they cycle out) — AND the
  shared routine popup (#39): six buttons, Skip, past-day guard, snooze sound. **Plus
  a quick Watch List once-over (#41): tile, add movie/show, buttons, data survives
  an app restart. Plus a #42 once-over: To-Do with no categories (New/Edit form,
  no filter bar), Look Ahead popup buttons up top, and the My Day / Pets ✓
  un-check (history intact, reminder re-armed).**
- **✅ DONE (#41, Simulator-validated) — Watch List integrated as a home page**
  (`app/watchlist.tsx` new + home tile/route + `_layout.tsx` Stack.Screen). The
  standalone `Projects/WatchList` app's three files combined into one TS page,
  restyled to the app's blue look; behavior unchanged (movies To Watch/Watched,
  shows +Ep/+Seas); same storage keys (`watchlist_movies`, `watchlist_shows`); no
  notifications. `tsc` clean. Phone once-over batched into the checkpoints above.
  **This closes the #34 plan's five steps** (device validation still owed).

---

## Patrick's #41 list — what's still open (items 2, 5, 6, 7 done in #42)

Raised by Patrick at the end of #41. Items 5, 6, 7 built and Simulator-validated
in #42 (item 2's bug died with item 6); their phone once-over is batched into the
checkpoints above. Still open:

1. **Name the backup folder — PROMOTED from nice-to-have.** Give the exported
   backup folder/file a clear, recognizable name so it's easy to find where it's
   saved. (Detail still in "Nice-to-have" below; it's now wanted, not just nice.
   Best confirmed on a real phone, where iCloud Drive is involved.)
3. **Import files/docs into Vault.** Bring outside files/documents into the
   Vault. Scope is undefined (file types? where from? how shown/stored/encrypted?)
   — needs a discussion session before any build.
4. **My Day past-day banner Done** — folded into the STRUCTURED REMINDER TESTS
   entry above. Patrick is tracking whether it recurs.

Done in #42, for the record: **5** — Look Ahead New/Edit popup's Cancel & Save
moved up under the title (matching To-Do). **6** — Categories removed from To-Do
entirely (`app/todo.tsx`: picker, Custom-Category popup, filter bar, tile labels
and machinery all removed; `todo_categories` dropped from backup's key list; old
tasks' stored `categoryId` is simply ignored) — **item 2's cancel bug is gone**.
**7** — tapping ✓ in My Day / Pets asks "Mark as not done?" and clears just the
checkmark, history log untouched (Patrick's rule); My Week already worked this way.

---

## In plain English — what's still on this list (read first)

This is the "someday" list: things worth doing eventually, not what we're working on
right now. Nothing here is urgent.

The still-open work falls into: a few **small bugs / unfinished bits** (the missing
backup keys, a couple of minor logging quirks, tap-to-exact-item), a few
**decisions to make** (Backup Merge, Vault import scope), some
**nice-to-have polish**, and a couple of **bigger items parked on purpose** (Siri voice,
the louder timer alarm). (The To-Do Custom-Category cancel bug is gone — #42 removed
categories from To-Do entirely.)

---

## Bugs / correctness (still open)

- **Vault "Custom" label may save as the word "Custom" (spotted #47, UNVERIFIED)**
  (`app/vault.tsx`). The save path checks `selectedPreset === 'custom'` (lowercase)
  but the chip sets `'Custom'` (capital C) — read straight from the code, so tapping
  Custom and typing your own label would save an item literally labeled "Custom",
  ignoring what was typed. Found by code-reading during the #47 theme conversion;
  NOT yet reproduced. Verify in the Simulator first: Vault → any category → + Add →
  tap Custom → type a label → Add, and see what label the saved item shows. If it
  reproduces, the fix is a one-word case correction (its own small session/step).

- **Backup misses Look Ahead and Watch List data (found #41)** (`app/backup.tsx`).
  `READABLE_KEYS` doesn't include `lookahead_items` / `lookahead_history` (a gap
  since #36 built the page) nor the new `watchlist_movies` / `watchlist_shows`
  (#41). Export/restore silently skips those pages' data. Fix: add the four keys —
  but note a restored backup from BEFORE the fix won't contain them; verify
  restore handles the missing keys gracefully.
- **To-Do reminder fired early — needs a clean phone re-test** (`app/todo.tsx`). A To-Do
  Patrick recalls setting for 23:30 fired around 21:15. Reading the scheduling code found
  **no bug**: the only thing that produces an early fire is the "2 hours" before-reminder
  preset, and 21:15 is exactly 2h before a 23:15 due time — so this is most likely the
  preset working as designed, not a fault. Confirm before chasing it: on the phone, make a
  new task due a few minutes out, tap **only "At time"** (no before-offset), and watch
  whether it fires on the minute. If that fires on time, the original was just the 2-hour
  preset and there's nothing to fix.
- **[SUPERSEDED by #34 plan] To-Do recurrence (Monthly / Yearly / 3 / 6 Months).**
  These were all open To-Do items (3/6-month stubs did nothing; Monthly/Yearly needed a
  phone test). Per #34, **recurrence leaves To-Do entirely** and moves to the new Look
  Ahead page. So don't fix them in To-Do — handle them as part of "Strip recurrence out
  of To-Do" + "Build Look Ahead" above. The 3/6-month anchor-date approach (a starting
  date, pre-schedule one-shots, top up on open within the iOS 64-pending cap) and the
  Yearly 0-based-month gotcha both carry over to Look Ahead.
- **My Week on-screen "Done" stamps tap-time, not the chore's day** (`app/myweek.tsx`,
  `confirmLog`). Minor, identical to My Day's accepted limitation: the *banner* Done is
  correct (fired time); only the in-app Log modal dates from `new Date()`. Only matters
  if a chore is logged well after its day. Same fix shape as My Day's would need (a
  cutoff-hour rule).
- **Tapping a reminder opens the screen, not the exact item** (`app/_layout.tsx`). Routes
  by `data.source` to the right screen but never lands on the specific item, and has
  never been confirmed with a real tap. To-Do reminders carry `taskId` (landing on the
  task is feasible); My Day / "Background" reminders carry no item id.

## Design decisions to make

- **Remove categories from Vault (Patrick, #47).** Like #42 did for To-Do:
  drop the Vault's category layer (Identity / Property / Financial / Medical /
  Digital / Legal / Other). Scope to decide before any build: does the
  two-level navigation (category list → items) collapse into one flat list;
  what happens to the per-category preset label chips (keep one combined set,
  or drop presets); and how existing items' stored `category` field is
  handled (To-Do's approach: just ignore it). Needs a discussion session
  first — related open item: "Import files/docs into Vault" above, since both
  reshape the same page.

- **Backup "Merge" option.** Restoring a backup currently **replaces** everything. Patrick
  wants the *choice* to **merge** a backup into existing data. Its own session — the
  combine rule differs per data type and each is Patrick's call:
  - **ID-keyed arrays** (`todo_tasks`, `vault_items`, `planner_projects`, the routine
    lists `my_routine` / `week_routine` / `pets_feeds`): add items whose IDs aren't
    already present; decide the rule when the same ID exists in both (keep current / take
    backup / keep both).
  - **Append-only logs** (`my_history`, `week_history`, `pets_history`, `todo_log`,
    `planner_log`): concatenate then de-duplicate (dup key e.g. date+label+time).
  - **Counters** (`my_coffee`, `my_water`, `pets_treats`): pick higher, sum, or keep?
  - **Single values** (`user_name`, reminder times, flags, last-date keys): backup-wins
    vs current-wins per field.
  - Likely UX: after a file is picked + validated (and Vault decrypted), ask "Replace or
    Merge?", then run the chosen path. Replace already exists (`applyRestore` in
    `app/backup.tsx`); merge would be a sibling. Scope each rule first; build one at a time.

## Nice-to-have later (UI polish)

- **System light/dark vs app theme — decide at the toggle session (#46).**
  `app.json` has `userInterfaceStyle: "automatic"`, so iOS-drawn pieces
  (Alert popups, share sheet, file picker, keyboard) follow the PHONE's
  light/dark setting while the app's own pages follow `DEFAULT_THEME` —
  they can mismatch. Patrick knows and is fine for now. Options when the
  Settings toggle is built: pin the system style, or make the app theme
  follow the phone automatically.
- **Theme toggle button in Settings (Patrick, #44; foundation built #45).**
  Add a toggle in Settings to switch between light and dark. The plumbing
  now exists: the toggle session upgrades `useTheme()` in
  `constants/Themes.ts` (stored choice + live switching) and adds the
  Settings control — converted pages won't need edits. Makes most sense
  once more pages are converted. No rush.
- **Name the backup folder — PROMOTED (#41, see Patrick's list above)**
  (`app/backup.tsx`). Give the exported backup folder/file a clear, recognizable name
  so it's easy to find where it's saved (e.g. iCloud Drive). (The file itself is
  already named `Elyfont-Backup-<date>.json`; this is about where it lands / how
  findable it is.)
- **Project Planner reminders do nothing yet** (`app/planner.tsx`). The screen has reminder
  fields, but they aren't wired to any notifications. Low priority.
- **Finish the "Elyfont" renaming.** The in-app home greeting still says "Remember When";
  the TestFlight / App Store listing is still named "Remember When"; and the "Memory Assist"
  tagline still needs a home (an in-app subtitle and/or the App Store subtitle field — it
  can't go in the app name).
- **Match the button labels.** To-Do's header says "New Task" while Vault's says "+ Add."
- **Retire the leftover pre-#39/#40 popup plumbing (cosmetic, after device validation).**
  `_layout.tsx` still registers the now-unused `mydaysnooze` / `petssnooze` /
  `myweekactions` categories and keeps the old `postpone1` (+1 Day) handler and the
  To-Do banner OK/Done handler (#40 made To-Do banners buttonless) — all left in
  place on purpose so banners scheduled before the switches still work. Once the
  changes are device-validated and old banners have cycled out, they can be
  removed. Purely internal; no behavior change. (The old "rename `todosnooze`"
  item is gone — #40 deleted that category entirely.)
- **"At time" reminder option, possibly revisit.** Removed from To-Do in #38 (Patrick's
  call — soonest preset is now "1 hour" before). If after phone testing Patrick misses an
  exact-time alert, it can be added back as a preset.
- **Add an on-tile Snooze button to To-Do** (`app/todo.tsx`). My Day and Pets Day each have
  an on-page Snooze (15/30/60) on every tile; To-Do only has Snooze on the notification
  banner. Add the same on-tile control for consistency.

## Parked on purpose (bigger items / accepted limitations)

- **Siri voice control — PARKED** (Patrick's decision, session #20). Tap-from-Shortcuts
  works, but Siri won't voice-match the spoken item name; no high-confidence fix remains,
  and part may be an iOS-side regression. All scaffolding stays in place, inert. **Full
  self-contained resume guide: `docs/siri-voice-resume.md` — read it first if revisited.**
- **Timer "Loud alert" isn't actually louder.** It's the normal alert tone. A genuinely
  louder, distinct alarm needs a custom sound file bundled into the app (a full rebuild),
  and breaking through Silent / Do-Not-Disturb needs Apple's Critical Alerts entitlement
  (medical/safety apps). Heavy — deferred.
- **A running Timer's tile disappears if the app reloads or restarts** (active timers are
  in memory only). Accepted as-is: tapping Done still stops the alerts whether or not the
  tile is showing. To make it survive: persist `activeTimers` to AsyncStorage + reconcile
  on Timer-page focus against `getAllScheduledNotificationsAsync`.
- **Reminder times stay global — DECIDED, nothing to do.** Morning / Midday / Evening
  times are set once in Settings and apply to everything. Patrick considered a
  per-appointment override and chose global only. Kept here solely in case it's ever
  revisited.
