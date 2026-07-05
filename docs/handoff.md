# Hand-off note — paste at the start of the next session

## THIS SESSION — #60 (2026-07-04) "Polish 5": **Pre-build plan items 1 AND 2 are DONE — To-Do stores numbers, Priority + Status removed, "30 min." preset in — `tsc` clean, all Simulator-approved by Patrick (banner fired on the minute). PLUS a round of New/Edit popup polish he called during testing.**

**What changed (all `app/todo.tsx`):**
- **Item 1 — storage conversion to numbers:** `dueDate`/`dueTime` strings replaced by `year / month (0-11) / day / hour / minute` (Look Ahead's pattern — now the app-wide standard everywhere it matters). One bridge `taskDueDate(task): Date | null` feeds every read point: tile label, log's scheduledFor, edit-popup open, sort, and `scheduleReminders` (offset + clock kinds recomputed from numbers; all string parsing deleted, incl. `storedToDate`). NO compat code (Patrick's rule): an old string task opens at today-noon in Edit, sorts to the bottom, shows no due line, schedules nothing — until edited/re-saved, which converts it. Simulator-proof: banner body correct from numbers, "1 hour" preset fired exactly on the minute.
- **Item 2 — form slim-down + preset:** **Priority removed entirely** (form buttons, tile side bar, colored word; old stored values ignored — the #42 categories treatment; `priority*` theme keys STAY in Themes.ts, Planner uses them). **Status removed entirely** (Active/On Hold/Completed buttons, "Reason for Hold" box, Completed-from-Edit; the tile's green Done is the one way to complete; the separate `completed` boolean is untouched). Orphaned `priorityRow/Btn/BtnText` styles deleted. **"30 min." reminder preset** added before "1 hour" (offset kind; the minutes math already existed).
- **Popup polish (Patrick's calls while testing):** title gap 32→8; popup maxHeight 85%→98% (both inline — the log popup is untouched); the italic "Tap background / Scroll" hint REMOVED (he never noticed it); **Reminders moved up under the date/time** (they sat at the bottom, out of sight, and he kept forgetting to set them — the root-cause fix; the "No Reminder Set" confirm stays as backup); Notes dropped to last, label now **"Notes (optional) ↓"** (the ↓ replaces the removed hint), box starts ~3 lines tall (minHeight 76, text top-aligned) and still grows.
- **Decided AGAINST (Patrick, flat no):** moving the type-in boxes' direction lines into placeholders to shorten the form. The hints stay under the boxes. Don't re-raise.
- **Known leftover, deliberate:** `_layout.tsx` (~333) still builds `scheduledFor` from `task.dueDate` strings — that's inside the OLD To-Do banner-Done handler, dead path since #40/#56 (todook banners have no Done). Uses `|| ''`, can't crash; goes when the parked popup-plumbing retirement happens.
- **Mid-test lesson (again):** typing on the Mac keyboard lands in whatever Simulator field has the cursor — stray text showed up in the time box. The control handled it as designed: Save blocked, clear-and-tap-away recovered (#59 fix).

**Commit note:** NOT yet committed — code (`app/todo.tsx`) + these docs. Patrick commits.

**➤ NEXT SESSION — pick up here: item 3 of the pre-build plan, the time-only rollout** — My Day, My Week, Pets, Settings get `<DateTimeControl mode='time'>` (light wiring, plausibly two pages a session; the pages' code is UNREAD as of #60 — verify sizing before promising). THEN item 4: Patrick's EAS "beat on" build, judging the whole NEEDS-A-PHONE-TEST list. BUILD POLICY stands (#50): no per-session builds.

---

## SESSION — #59 (2026-07-04) "Polish 4": **Look Ahead is on the shared date/time control — `tsc` clean, Patrick Simulator-approved ("That works"). PLUS an empty-box fix inside the control itself (To-Do inherits it). AND the plan was reset: the next EAS build is the "beat on" build — everything lands BEFORE it.** COMMITTED (code + docs, `a882d4e`). `app/lookahead.tsx`: inline spinners replaced by `<DateTimeControl>` (labels "First Due Date" / "Time"); bad typed value blocks Save; dead spinner helpers removed (`MONTH_NAMES`/`daysInMonth` KEPT — tiles/re-arm use them). `components/DateTimeControl.tsx`: clearing a bad typed box now counts as valid, red clears, blur refills from the spinners — both boxes. Pre-build order set: (1) To-Do numbers ✅ #60, (2) form slim-down ✅ #60, (3) time-only pages, (4) the build.

---

*Only the last two sessions are kept here. Older session detail isn't archived in the docs anymore — git history holds the full record.*
