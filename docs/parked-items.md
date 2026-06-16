# Parked items — running backlog

Future / deferred work for "Remember When." Not for the current session — the active goal lives in `handoff.md`. Pull an item from here when you're ready to take it on; move it back into `handoff.md` once it's the live goal. Add new ideas as they come up.

Last updated: 2026-06-15

---

## In plain English — what's on this list (read this first)

This is the "someday" list: things worth doing eventually, but not what we're working on right now. The technical entries below each have a short everyday-language version here so you can tell at a glance what each one is.

**Things that are a bit broken (Bugs / correctness):**

- **Timer cancel might not work.** When you cancel a Timer, the alert it set might still go off, because the app may be using the wrong tag to call it back. Not confirmed yet — needs a test on the phone.
- **"Repeating" To-Dos don't actually repeat.** If you mark a To-Do as Daily/Weekly/etc., its reminder only fires once and then stops. Right now that repeat setting only changes how the To-Do looks in the Week view — it doesn't create a recurring reminder.
- **Leftover old pet data.** When Pets Day was rebuilt, it switched to new storage and left the old pet data behind, sitting unused in the app. It's harmless, but a small cleanup would tidy it away.

**Decisions to make (Design decisions):**

- **Where should daily-repeating reminders live?** My Day already handles daily things well. The question is whether repeating reminders should live only in My Day, leaving To-Do just for one-time, dated reminders. Not decided yet.
- **Pets Day reminders — this is the next job.** Adding reminders to Pets Day. It's already planned out and moved over to the handoff doc, so it's no longer really "parked."
- **Tapping a reminder only opens the screen, not the item.** When you tap a reminder notification it takes you to the right screen, but not to the exact item — and that behavior has never actually been tested with a real tap.

**Nice-to-have later (UI polish):**

- **Project Planner reminders do nothing yet.** That screen has reminder fields, but they aren't wired up to anything. Low priority.

The **"Done"** section at the very bottom is just a record of recently finished work, kept for reference — nothing there is waiting on you.

---

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

- **To-Do tiles show the due TIME** — DONE 2026-06-15 (session 2). Both render spots (`app/todo.tsx` lines 515 + 554) now append `' at ' + task.dueTime` when set, shown exactly as typed (free-text field), matching the reminder body. **Committed 2026-06-15 (`d7b4e81`); awaiting device test.**
- **`deleteTask` cancels reminders** — DONE 2026-06-15 (session 2). Added `cancelReminders(id)` in the Delete handler (`app/todo.tsx` ~line 239), mirroring `completeTask`. **Committed 2026-06-15 (`d7b4e81`); awaiting device test.**
- **`settings.tsx:165` TS error** — DONE 2026-06-15. Final fix is `onPress: async (pin?: string)`. (Session 2's first attempt used `pin: string`, which itself caused TS2322 — `Alert.prompt`'s callback value is `string | undefined`, so `string` was too narrow and blocked the commit. Session 3 corrected it to the optional `pin?: string`.) **Committed 2026-06-15 (`d7b4e81`); awaiting device test.**
- **Merge My Day Meals + Meds into one card-styled list** — DONE 2026-06-15. Now one "Routine" list of Entries under `my_routine` (migrated from `my_schedule` + `my_meds`), single common Log, "+ Add Entry" in header.
- **My Day tile time formatting (AM/PM)** — DONE 2026-06-15. `format12Hour` now outputs real 12-hour AM/PM on tiles, and the time picker is Hour(1–12)/Minute/AM-PM on both My Day and Pets Day.
