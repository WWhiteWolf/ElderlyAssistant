# Parked items — running backlog (open work only)

Future / deferred work for "Remember When." Not for the current session — the active
goal lives in `handoff.md`. Pull an item from here when you're ready to take it on;
move it back into `handoff.md` once it's the live goal. Add new ideas as they come up.

This file holds only still-open work. Finished items aren't archived in the docs —
git history keeps the full record.

Last updated: 2026-06-28 (session #32 — retired To-Do's Daily & Weekly; removed that
cleanup item).

---

## In plain English — what's still on this list (read first)

This is the "someday" list: things worth doing eventually, not what we're working on
right now. Nothing here is urgent.

The still-open work falls into: a few **small bugs / unfinished bits** (the 3- and
6-month repeats, a Monthly/Yearly firing test, a couple of minor logging quirks), a few
**decisions to make** (Backup Merge, per-appointment reminder times), some
**nice-to-have polish**, and a couple of **bigger items parked on purpose** (Siri voice,
the louder timer alarm).

---

## Bugs / correctness (still open)

- **"3 Months" and "6 Months" repeat options do nothing yet** (`app/todo.tsx`). iOS has
  no native every-3/6-month trigger, and those two options have no anchor-date picker in
  the form. Approach to design later: add a "starting date" picker, then pre-schedule the
  next few one-shots and top up on app open (respecting the iOS 64-pending cap).
- **Monthly + Yearly recurring To-Do firing — needs a phone test.** The code is in and
  committed (session #8) and should fire on schedule (a monthly bill, a yearly
  furnace-filter reminder), but a real reminder hasn't been watched go off on the phone
  yet — Yearly's month especially (Expo months are 0-based).
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
- **Per-appointment reminder time override.** Morning/evening reminder times are global
  (set once in Settings). Patrick chose to keep it global only. Possible later add-on: let
  a single appointment use different times. Parked, not planned.

## Nice-to-have later (UI polish)

- **Project Planner reminders do nothing yet** (`app/planner.tsx`). The screen has reminder
  fields, but they aren't wired to any notifications. Low priority.
- **Finish the "Elyfont" renaming.** The in-app home greeting still says "Remember When";
  the TestFlight / App Store listing is still named "Remember When"; and the "Memory Assist"
  tagline still needs a home (an in-app subtitle and/or the App Store subtitle field — it
  can't go in the app name).
- **Match the button labels.** To-Do's header says "New Task" while Vault's says "+ Add."
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
