# Hand-off note — paste at the start of the next session

## THIS SESSION — #61 (2026-07-04) "Date/Time control — My Week & Pets Day" (grew to all four): **The time-only rollout is COMPLETE — My Week, Pets Day, My Day, AND Settings all got `<DateTimeControl mode='time'>` — `tsc` clean after each page, each Simulator-approved by Patrick one at a time. The #58 shared-control plan is fully done; nothing is left before the "beat on" EAS build.**

**What changed (four files, same six-edit pattern each):**
- **`app/myweek.tsx`, `app/mollie.tsx`, `app/myday.tsx`:** the ~80-line inline Hour/Minute/AM-PM spinner block in each New/Edit popup replaced by `<DateTimeControl mode="time" timeLabel="Time">`; new `pendingTimeValid` flag set true whenever the popup opens (New AND Edit paths); Save blocked with the "Check Time — fix the box outlined in red" alert while a typed time isn't real (Look Ahead's wording, adapted); orphaned `timeAdjBtn`/`timeAdjText`/`timeDisplayText` styles deleted. Storage untouched — all three already keep `hour`/`minute` as numbers.
- **`app/settings.tsx`:** same treatment on the ONE shared time popup serving Morning/Midday/Evening; guard sits at the top of `saveTime`; flag set in `openTimeEditor`. Storage deliberately untouched — `saveTime` still writes the padded "HH:MM" strings, so everything downstream reads exactly what it always did.
- **Look change, accepted:** the three routine pages' spinner circles went from the big blue/gold `timeStepper` circles to the shared control's smaller solid-orange ones, plus the new 24-hour type-in box. Settings barely changed (its circles were already solid orange).
- **Housekeeping note:** the `timeStepper`/`timeStepperBorder`/`timeStepperText` theme keys now have **NO users** (My Day was the last). Left in `Themes.ts` on purpose — removing theme keys is its own small decision. Parked.
- **This closes the #58 plan end to end:** To-Do (#58), Look Ahead (#59), To-Do number storage (#60), the four time-only pages (#61).

**Commit note:** NOT yet committed — code (`app/myweek.tsx`, `app/mollie.tsx`, `app/myday.tsx`, `app/settings.tsx`) + these docs. Patrick commits.

**➤ NEXT SESSION — pick up here: item 4, the last pre-build item = Patrick's EAS "beat on" build.** Trigger the build (code committed first — EAS captures git state), load it on the phone, and judge the whole NEEDS-A-PHONE-TEST list in `pending.txt` (now including all six date/time-control pages). BUILD POLICY stands (#50): no per-session builds — this IS the batched one.

---

## SESSION — #60 (2026-07-04) "Polish 5": **Pre-build plan items 1 AND 2 are DONE — To-Do stores numbers, Priority + Status removed, "30 min." preset in — `tsc` clean, all Simulator-approved by Patrick (banner fired on the minute). PLUS a round of New/Edit popup polish he called during testing.**

**What changed (all `app/todo.tsx`):**
- **Item 1 — storage conversion to numbers:** `dueDate`/`dueTime` strings replaced by `year / month (0-11) / day / hour / minute` (Look Ahead's pattern — now the app-wide standard everywhere it matters). One bridge `taskDueDate(task): Date | null` feeds every read point: tile label, log's scheduledFor, edit-popup open, sort, and `scheduleReminders` (offset + clock kinds recomputed from numbers; all string parsing deleted, incl. `storedToDate`). NO compat code (Patrick's rule): an old string task opens at today-noon in Edit, sorts to the bottom, shows no due line, schedules nothing — until edited/re-saved, which converts it. Simulator-proof: banner body correct from numbers, "1 hour" preset fired exactly on the minute.
- **Item 2 — form slim-down + preset:** **Priority removed entirely** (form buttons, tile side bar, colored word; old stored values ignored — the #42 categories treatment; `priority*` theme keys STAY in Themes.ts, Planner uses them). **Status removed entirely** (Active/On Hold/Completed buttons, "Reason for Hold" box, Completed-from-Edit; the tile's green Done is the one way to complete; the separate `completed` boolean is untouched). Orphaned `priorityRow/Btn/BtnText` styles deleted. **"30 min." reminder preset** added before "1 hour" (offset kind; the minutes math already existed).
- **Popup polish (Patrick's calls while testing):** title gap 32→8; popup maxHeight 85%→98% (both inline — the log popup is untouched); the italic "Tap background / Scroll" hint REMOVED (he never noticed it); **Reminders moved up under the date/time** (they sat at the bottom, out of sight, and he kept forgetting to set them — the root-cause fix; the "No Reminder Set" confirm stays as backup); Notes dropped to last, label now **"Notes (optional) ↓"** (the ↓ replaces the removed hint), box starts ~3 lines tall (minHeight 76, text top-aligned) and still grows.
- **Decided AGAINST (Patrick, flat no):** moving the type-in boxes' direction lines into placeholders to shorten the form. The hints stay under the boxes. Don't re-raise.
- **Known leftover, deliberate:** `_layout.tsx` (~333) still builds `scheduledFor` from `task.dueDate` strings — that's inside the OLD To-Do banner-Done handler, dead path since #40/#56 (todook banners have no Done). Uses `|| ''`, can't crash; goes when the parked popup-plumbing retirement happens.
- **Mid-test lesson (again):** typing on the Mac keyboard lands in whatever Simulator field has the cursor — stray text showed up in the time box. The control handled it as designed: Save blocked, clear-and-tap-away recovered (#59 fix).

**Commit note:** COMMITTED (code + docs, `d512931`). (#60's "next session" pointer — the time-only rollout — was done in #61 above.)

---

*Only the last two sessions are kept here. Older session detail isn't archived in the docs anymore — git history holds the full record.*
