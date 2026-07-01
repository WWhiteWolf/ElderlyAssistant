# Parked items — running backlog (open work only)

Future / deferred work for "Remember When." Not for the current session — the active
goal lives in `handoff.md`. Pull an item from here when you're ready to take it on;
move it back into `handoff.md` once it's the live goal. Add new ideas as they come up.

This file holds only still-open work. Finished items aren't archived in the docs —
git history keeps the full record.

Last updated: 2026-07-01 (session #39 — Step 4 routine half done: My Day / My Week /
Pets now share ONE popup (OK / Skip / Delay 15·30·60 / Done); silent-snooze fixed;
past-day Done guard added; My Week's banner "+1 Day" dropped. Simulator-checked.
Next session (Patrick's pick): STRUCTURED REMINDER TESTS — one organized checklist
for every reminder kind, folding in Phone Checkpoints A+B).

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
- **STRUCTURED REMINDER TESTS — ← NEXT (Patrick's pick, #39).** One organized test
  checklist covering every reminder kind: To-Do one-shots (own OK+Done popup), My Day /
  Pets daily, My Week weekly + postpone, Look Ahead long-lead + Delay, the shared
  routine popup's six buttons, past-day/past-cycle guards, sound, tap-routing. Work
  through it Simulator-first; batch the device-only parts into the checkpoints below.
- **PHONE CHECKPOINTS A + B (cloud build) — owed; likely folded into the structured
  test session.** On the real phone confirm: To-Do one-shots + Look Ahead reminders
  fire, route on tap, the Look Ahead Done/Delay buttons behave, the To-Do popup's
  OK/Done behave on a real lock screen (sound, past-day rule), AND the new shared
  routine popup (#39): six buttons, Skip, past-day guard, snooze sound.
- **Integrate the "Watch List" page** (independent of reminders). Already built as a
  standalone Expo app in `Projects/WatchList` (movie/TV tracker, no notifications). Fold
  in as a new home-screen page: `app/watchlist.tsx` + home tile + route; port `App.js` /
  `useWatchListState.js` / `types.js` into this app's TS/expo-router structure.

---

## In plain English — what's still on this list (read first)

This is the "someday" list: things worth doing eventually, not what we're working on
right now. Nothing here is urgent.

The still-open work falls into: a few **small bugs / unfinished bits** (a couple of
minor logging quirks, the To-Do Custom-Category cancel, tap-to-exact-item), a few
**decisions to make** (Backup Merge, per-appointment reminder times), some
**nice-to-have polish**, and a couple of **bigger items parked on purpose** (Siri voice,
the louder timer alarm). (The old 3/6-month + Monthly/Yearly To-Do repeat items are done
— recurrence moved to the Look Ahead page, finished in #37.)

---

## Bugs / correctness (still open)

- **To-Do reminder fired early — needs a clean phone re-test** (`app/todo.tsx`). A To-Do
  Patrick recalls setting for 23:30 fired around 21:15. Reading the scheduling code found
  **no bug**: the only thing that produces an early fire is the "2 hours" before-reminder
  preset, and 21:15 is exactly 2h before a 23:15 due time — so this is most likely the
  preset working as designed, not a fault. Confirm before chasing it: on the phone, make a
  new task due a few minutes out, tap **only "At time"** (no before-offset), and watch
  whether it fires on the minute. If that fires on time, the original was just the 2-hour
  preset and there's nothing to fix.
- **To-Do Custom Category cancel wipes the new task** (`app/todo.tsx`). In New Task,
  opening the "Custom Category" second popup and tapping **Cancel** closes BOTH popups and
  loses the in-progress task. Cancel on the category popup should close only that popup and
  return to the New Task form with entries intact.
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

- **Name the backup folder** (`app/backup.tsx`). Give the exported backup folder/file a
  clear, recognizable name so it's easy to find where it's saved (e.g. iCloud Drive).
- **Project Planner reminders do nothing yet** (`app/planner.tsx`). The screen has reminder
  fields, but they aren't wired to any notifications. Low priority.
- **Finish the "Elyfont" renaming.** The in-app home greeting still says "Remember When";
  the TestFlight / App Store listing is still named "Remember When"; and the "Memory Assist"
  tagline still needs a home (an in-app subtitle and/or the App Store subtitle field — it
  can't go in the app name).
- **Match the button labels.** To-Do's header says "New Task" while Vault's says "+ Add."
- **Rename the `todosnooze` notification category (cosmetic).** After #38 it holds only
  OK + Done — no snooze — so the id is a misnomer. Renaming touches `_layout.tsx` (the
  category registration) and `app/todo.tsx` (`categoryIdentifier: 'todosnooze'` in
  `scheduleReminders`). Purely internal; no behavior change.
- **Retire the leftover pre-#39 popup plumbing (cosmetic, after device validation).**
  `_layout.tsx` still registers the now-unused `mydaysnooze` / `petssnooze` /
  `myweekactions` categories and keeps the old `postpone1` (+1 Day) handler — left in
  place on purpose so banners scheduled before the #39 switch still work. Once the
  shared popup is device-validated and old banners have cycled out, both can be
  removed. Purely internal; no behavior change.
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
