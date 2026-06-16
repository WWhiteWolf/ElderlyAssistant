# Parked items — running backlog

Future / deferred work for "Remember When." Not for the current session — the active goal lives in `handoff.md`. Pull an item from here when you're ready to take it on; move it back into `handoff.md` once it's the live goal. Add new ideas as they come up.

Last updated: 2026-06-15

## Bugs / correctness

- **Possible Timer cancel bug — unconfirmed** (`app/timer.tsx`, `cancelTimer`). Cancels using `timer.id` (a `Date.now()` string), not the identifier returned by `scheduleNotificationAsync`, so the cancel may silently fail. Needs a device check.
- **To-Do "recurring" never schedules repeating notifications** (`scheduleReminders`, `app/todo.tsx:348`). It always builds a one-shot DATE trigger from `dueDate`+`dueTime` and ignores the `recurring` field. A "Daily" To-Do fires ONCE on its date; on completion it reschedules to a now-past date and gets dropped by the future-guard. Today `recurring` (daily/weekly/monthly/yearly) drives only the Week-view display. Tied to the daily-reminders design decision below.
- **Old `pets_data` storage key is orphaned** (`app/mollie.tsx`). The Pets Day single-page rewrite (2026-06-15) switched to new keys (`pets_feeds` / `pets_history` / `pets_last_date`) and no longer reads the old multi-pet `pets_data`. That key still sits in AsyncStorage, unused and harmless. Add a one-time cleanup that removes `pets_data` so nothing stale lingers.

## Design decisions

- **Where do daily-repeating reminders live?** My Day is already the daily engine (DAILY trigger, time-only, daily reset + history). Decide whether To-Do drops "Daily" entirely (and what happens to weekly/monthly/yearly, which also don't schedule notifications). Likely direction: daily-repeating reminders live in My Day; To-Do is for dated one-offs.
- **Pets Day routine reminders → NOW THE ACTIVE GOAL.** Moved to `handoff.md` "Active next step" (2026-06-15) with a full, code-verified build plan (title "Pets Routine," generic body, Snooze like My Day, touches `mollie.tsx` + `_layout.tsx`). Listed here only as a pointer; do the work from the handoff.
- **Tap-routing is screen-only and untested** (`app/_layout.tsx`). Routes by `data.source` to the right SCREEN but never lands on the specific item, and has never been confirmed with a real tap. To-Do reminders carry `taskId` (landing on the task is feasible); My Day and To-Do "Background" reminders carry no item id. (If Pets Day notifications land, decide its `data.source` routing too.)

## UI polish

- **Project Planner schedules nothing** (`app/planner.tsx`). Has reminder UI/fields but wires up no notifications. Dormant, low priority.

## Done (recently cleared from this list)

- **To-Do tiles show the due TIME** — DONE 2026-06-15 (session 2). Both render spots (`app/todo.tsx` lines 515 + 554) now append `' at ' + task.dueTime` when set, shown exactly as typed (free-text field), matching the reminder body. Awaiting Patrick's commit + device test.
- **`deleteTask` cancels reminders** — DONE 2026-06-15 (session 2). Added `cancelReminders(id)` in the Delete handler (`app/todo.tsx` ~line 239), mirroring `completeTask`. Awaiting commit + device test.
- **`settings.tsx:165` TS error** — DONE 2026-06-15 (session 2). `pin` typed as `string`. Awaiting commit + device test.
- **Merge My Day Meals + Meds into one card-styled list** — DONE 2026-06-15. Now one "Routine" list of Entries under `my_routine` (migrated from `my_schedule` + `my_meds`), single common Log, "+ Add Entry" in header.
- **My Day tile time formatting (AM/PM)** — DONE 2026-06-15. `format12Hour` now outputs real 12-hour AM/PM on tiles, and the time picker is Hour(1–12)/Minute/AM-PM on both My Day and Pets Day.
