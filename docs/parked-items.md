# Parked items — running backlog

Future / deferred work for "Remember When." Not for the current session — the active goal lives in `handoff.md`. Pull an item from here when you're ready to take it on; move it back into `handoff.md` once it's the live goal. Add new ideas as they come up.

Last updated: 2026-06-15

## Bugs / correctness

- **`deleteTask` doesn't cancel reminders** (`app/todo.tsx`). A deleted task's reminder can still fire. Natural companion to the `updateTask` cancel+reschedule fix that already landed. Mirror that: call `cancelReminders(task.id)` on delete.
- **Possible Timer cancel bug — unconfirmed** (`app/timer.tsx`, `cancelTimer`). Cancels using `timer.id` (a `Date.now()` string), not the identifier returned by `scheduleNotificationAsync`, so the cancel may silently fail. Needs a device check.
- **To-Do "recurring" never schedules repeating notifications** (`scheduleReminders`, `app/todo.tsx:348`). It always builds a one-shot DATE trigger from `dueDate`+`dueTime` and ignores the `recurring` field. A "Daily" To-Do fires ONCE on its date; on completion it reschedules to a now-past date and gets dropped by the future-guard. Today `recurring` (daily/weekly/monthly/yearly) drives only the Week-view display. Tied to the daily-reminders design decision below.
- **Pre-existing TS error** (`app/settings.tsx:165`) — `pin` parameter implicitly `any`. Harmless but should be typed.

## Design decisions

- **Where do daily-repeating reminders live?** My Day is already the daily engine (DAILY trigger, time-only, daily reset + history). Decide whether To-Do drops "Daily" entirely (and what happens to weekly/monthly/yearly, which also don't schedule notifications). Likely direction: daily-repeating reminders live in My Day; To-Do is for dated one-offs.
- **Merge Medication into one list, rename "Meals"** (`app/myday.tsx`). Meals and Meds are already the same `ScheduleItem` type and scheduled together, so merging mostly deletes the duplicate section/state/`editingMeds` branching. Patrick's UI direction: one single box on My Day with tiles styled like the To-Do task cards (consistent card look across pages). Cautions: (a) avoid the name "Tasks" (collides with the To-Do screen) — prefer "Items" or "Routine"; (b) merging `my_schedule` + `my_meds` storage keys needs a one-time data migration or current items vanish; (c) the food-specific log wording ("What did you eat?") needs to become neutral.
- **Tap-routing is screen-only and untested** (`app/_layout.tsx`). Routes by `data.source` to the right SCREEN but never lands on the specific item, and has never been confirmed with a real tap. To-Do reminders carry `taskId` (landing on the task is feasible); My Day and To-Do "Background" reminders carry no item id.

## UI polish

- **To-Do tiles should show the due TIME** (`app/todo.tsx:513` and `:552`). Currently show `Due: {dueDate}` only; `dueTime` is stored but not displayed. Add it, e.g. "Due: 06/14/26 at 7:58 PM". Two render spots: Week-ahead view + main list.
- **My Day tile time display — optional** (`app/myday.tsx`). Time is already shown but in 24-hour format and behind a collapsed section. Possible: AM/PM reformat (helper `format12Hour` at `:165` is misnamed — it outputs 24h) and/or a separate styled time column (unused `timeText` style at `:860`).
- **Project Planner schedules nothing** (`app/planner.tsx`). Has reminder UI/fields but wires up no notifications. Dormant, low priority.
