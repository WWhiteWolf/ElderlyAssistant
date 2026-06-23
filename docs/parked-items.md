# Parked items — running backlog

Future / deferred work for "Remember When." Not for the current session — the active goal lives in `handoff.md`. Pull an item from here when you're ready to take it on; move it back into `handoff.md` once it's the live goal. Add new ideas as they come up.

Last updated: 2026-06-22

---

## In plain English — what's on this list (read this first)

This is the "someday" list: things worth doing eventually, but not what we're working on right now. The technical entries below each have a short everyday-language version here so you can tell at a glance what each one is.

**Things that are a bit broken (Bugs / correctness):**

- **Timer cancel might not work.** When you cancel a Timer, the alert it set might still go off, because the app may be using the wrong tag to call it back. Not confirmed yet — needs a test on the phone.
- **Medication taken after midnight is recorded on the wrong day — My Day (device-confirmed 2026-06-22, RAISED PRIORITY).** Patrick's medication is a **My Day** daily routine item, taken before bed, sometimes after midnight. Because My Day records completion at the moment you act (using that moment's calendar date), a dose taken late at night lands on the *next* day, not the day it was meant for. **Patrick confirmed he uses the banner Done on the notification popup** — which is the worse path: it writes **no** history line at all, only flips the item complete, and the next-day reset then clears even that, so a bedtime dose marked after midnight leaves no durable record in My Day history. (The on-screen Log does write a history line, but under the tap-day's date — still wrong after midnight.) For a medication log this is a real accuracy problem. **Open question for the fix:** what's the desired rule — should a dose marked just after midnight count for the previous day, and should banner Done write a dated history entry like Log does? (The earlier-logged To-Do "Done" date bug below is a separate, real bug, but it is NOT where the meds live.)
- **"Repeating" To-Dos — Weekly/Monthly/Yearly now repeat; only 3 & 6 Months remain.** Weekly (session 6), then **Monthly + Yearly** (session #8, 2026-06-19) now fire true repeating alerts. **Only "3 Months" and "6 Months" still do nothing** — iOS has no native every-3/6-month alarm, and those two options have no date picker in the form to anchor them. (Monthly/Yearly committed, device test pending; see handoff.)

- **To-Do banner Done + Snooze — DONE (banner). On-tile Snooze button still open.** Session 6 (2026-06-19) gave To-Do reminders a **Done + Snooze 15/30/60 banner** (new `todosnooze` category). NOT yet added: an **on-page Snooze button on each To-Do tile** like My Day/Pets have — do that if Patrick wants it. (Awaiting device test.)
- **Leftover old pet data.** When Pets Day was rebuilt, it switched to new storage and left the old pet data behind, sitting unused in the app. It's harmless, but a small cleanup would tidy it away.

**Decisions to make (Design decisions):**

- **Where should daily-repeating reminders live?** My Day already handles daily things well. The question is whether repeating reminders should live only in My Day, leaving To-Do just for one-time, dated reminders. Not decided yet.
- **Pets Day reminders — DONE.** Pets Day now sends daily routine reminders with Snooze, the same way My Day does. Built and tested on the phone 2026-06-17.
- **Tapping a reminder only opens the screen, not the item.** When you tap a reminder notification it takes you to the right screen, but not to the exact item — and that behavior has never actually been tested with a real tap.
- **Per-appointment reminder time override.** The morning/evening reminder times are global (set once in Settings). Patrick chose to keep it global only. A possible later add-on: let a single appointment use a different morning/evening time than the global default. Parked, not planned.

**Nice-to-have later (UI polish):**

- **Sort the To-Do list by soonest first (requested 2026-06-22).** Patrick wants the To-Do list ordered by time, with the closest/soonest item on top so the next thing is always at the top.
- **Project Planner reminders do nothing yet.** That screen has reminder fields, but they aren't wired up to anything. Low priority.

The **"Done"** section at the very bottom is just a record of recently finished work, kept for reference — nothing there is waiting on you.

---

## Bugs / correctness

- **Possible Timer cancel bug — unconfirmed** (`app/timer.tsx`, `cancelTimer`). Cancels using `timer.id` (a `Date.now()` string), not the identifier returned by `scheduleNotificationAsync`, so the cancel may silently fail. Needs a device check.
- **To-Do "recurring" — Weekly/Monthly/Yearly now schedule; only every3months/every6months remain** (`scheduleReminders`, `app/todo.tsx`). WEEKLY (session 6), MONTHLY (`day recurDay`), and YEARLY (`month recurMonth−1` [Expo 0-based], `day recurDay`) branches all fire native repeating triggers at `dueTime` with the `todosnooze` banner (session #8 added monthly/yearly — committed, device test pending). **every3months / every6months build nothing**: no native trigger AND no anchor-date picker in the form. Approach to design later: add a "starting date" picker, then either reschedule-on-fire (only runs when the app is opened/tapped — shaky for a memory aid) or pre-schedule the next few one-shots and top up on app open (sounder; respect the iOS 64-pending cap).
- **My Day completion is dated at action-time → after-midnight doses log on the wrong day — device-confirmed 2026-06-22, RAISED PRIORITY (Patrick's medication).** Code-verified paths in `app/myday.tsx` + `app/_layout.tsx`:
  - On-screen **Log** (`confirmLog`, `myday.tsx` ~line 204): history entry `date: new Date().toLocaleDateString()` — the tap moment, so a dose marked after midnight is filed under the next day.
  - Banner **Done** (`_layout.tsx` `action === 'done'`, `source !== 'todo'` branch, ~lines 122–137): only sets `completed: true` in `my_routine` by `itemId` and cancels the notif — writes **no** `my_history` entry. The daily reset (`loadData`, `myday.tsx` ~line 119: if `my_last_date !== today` → all items `completed:false`) then clears that flag on the next-day open, so the dose can vanish from the record.
  - **Patrick confirmed (2026-06-22) he uses the banner Done on the popup** — so for meds, the no-history path is the active one: the dose is marked complete, no `my_history` line is written, and the next-day reset clears the flag → no durable record. **Open questions before fixing:** (a) desired rule for late-night doses (count for the prior day?); (b) should banner Done write a dated `my_history` entry for parity with on-screen Log? Verified by reading code this session; not yet fixed.
- **To-Do "Done" logs tap-date, not the reminder's date — device-confirmed 2026-06-22** (`app/_layout.tsx`, `action === 'done'` → `source === 'todo'` branch, ~line 104). Separate from the My Day med bug above (meds are My Day, not To-Do). The completion entry's `completedDate` is built from `new Date()` at the moment Done is tapped, and the notification `data` payload carries no original fire date — so a Done tapped on a stale banner records the completion under **today**. Observed on recurring "Day"-reminder tasks. Fix: include the intended fire date in the notification `data` and stamp `completedDate` from that (fall back to `new Date()` only if absent). (Bug verified by reading the code this session; not yet fixed.)
- **Yearly day picker allows invalid dates** (`app/todo.tsx`, New/Edit Task form). The Yearly "Day" picker offers 1–31 for every month, so e.g. Feb 30 would throw a RangeError when `scheduleReminders` builds the YEARLY trigger (Expo validates day ≤ days-in-month). Low priority; tighten the picker to the selected month's length.
- **Old `pets_data` storage key is orphaned** (`app/mollie.tsx`). The Pets Day single-page rewrite (2026-06-15) switched to new keys (`pets_feeds` / `pets_history` / `pets_last_date`) and no longer reads the old multi-pet `pets_data`. That key still sits in AsyncStorage, unused and harmless. Add a one-time cleanup that removes `pets_data` so nothing stale lingers.

## Design decisions

- **Where do daily-repeating reminders live? → DECIDED 2026-06-19.** My Day is the daily engine; To-Do drops "Daily" entirely. Also decided: the "Weekly" category no longer requires a due date. (Weekly/Monthly/Yearly now schedule recurring notifications as of session #8; only 3/6-month remain — see Bugs/correctness.)
- **Pets Day routine reminders → DONE (2026-06-17).** Built in session 4: daily "Pets Routine" reminders with Snooze 15/30/60, touching `mollie.tsx` + `_layout.tsx`. Committed and device-validated on build 18. (See Done section.)
- **Tap-routing is screen-only and untested** (`app/_layout.tsx`). Routes by `data.source` to the right SCREEN but never lands on the specific item, and has never been confirmed with a real tap. To-Do reminders carry `taskId` (landing on the task is feasible); My Day and To-Do "Background" reminders carry no item id. (If Pets Day notifications land, decide its `data.source` routing too.)

## UI polish

- **Sort To-Do list by soonest due time on top** (`app/todo.tsx`, requested 2026-06-22). Order the rendered task list by due date/time ascending so the closest item is first. Decide how undated / recurring (weekly/monthly/yearly) tasks sort relative to dated ones.
- **Project Planner schedules nothing** (`app/planner.tsx`). Has reminder UI/fields but wires up no notifications. Dormant, low priority.

## Done (recently cleared from this list)

- **Monthly + Yearly recurring To-Do alerts (Group 1, the scoped half)** — DONE 2026-06-19 (session #8), **committed, device test pending**. `scheduleReminders` got native repeating MONTHLY (`day recurDay`) and YEARLY (`month recurMonth−1`, `day recurDay`) branches at `dueTime`, mirroring weekly, with the Done/Snooze/OK banner. Verified the library supports these triggers and that Expo months are 0-based. Use cases: Monthly = bills; Yearly = annual physical / furnace filter / smoke-detector batteries. **3-month + 6-month stay parked** (above), plus the Yearly-day-picker edge case (above). (`app/todo.tsx`.)
- **Appointment "Reminder Options" (the original purpose of the app)** — DONE 2026-06-19, **committed, awaiting build + device test**. Editable global **Morning (8 AM) / Evening (5 PM)** times in Settings (`reminder_morning_time`/`reminder_evening_time`); seven toggle-highlight **"Reminders before"** buttons in To-Do (At time / 1 hour / 2 hours / Morning of / Day / Week / Month) — "Morning of" fires the morning time on the appointment day, "Day/Week/Month" fire the evening time 1/7/30 days before, the rest are offsets from the appointment time; silent **OK** dismiss added to the To-Do banner. (`settings.tsx` + `todo.tsx` + `_layout.tsx`.) Note: only applies to *dated* To-Dos; weekly/monthly/etc. recurring scheduling is unchanged. Per-appointment time override parked above.
- **To-Do: remove Daily, Weekly works with no date, Done + Snooze banner** — DONE in working tree 2026-06-19 (session 6), **awaiting commit + device test**. Removed 'Daily' from the recurring picker; Weekly To-Dos now show day+time and fire a repeating WEEKLY alert with no date; To-Do reminders got a `todosnooze` category (Done + Snooze 15/30/60). Done logs to history and keeps repeating tasks running; one-time tasks are removed + cancelled. (`app/todo.tsx` + `app/_layout.tsx`.) Remaining spin-offs parked above: schedule monthly/3mo/6mo/yearly, and an optional on-tile Snooze button.
- **Notification "Done" action + on-page Snooze (My Day + Pets Day)** — DONE 2026-06-19 (session 5). Added a **Done** button to the `mydaysnooze`/`petssnooze` banner categories (marks the item complete in `my_routine`/`pets_feeds` by `itemId` and cancels the fired notif, in `app/_layout.tsx`), and an on-page **Snooze** button on every My Day + Pets Day tile that pops up 15/30/60 (`app/myday.tsx` + `app/mollie.tsx`, reusing the TIME_INTERVAL snooze scheme). **Committed + device-validated.** (To-Do equivalent deferred → now the next goal.)
- **Pets Day routine reminders (with Snooze)** — DONE 2026-06-17 (session 4). Pets Day had no notification code; now mirrors My Day. `mollie.tsx` got permission + handler on mount and `scheduleAllPetsNotifications` (DAILY trigger per incomplete feed, title "Pets Routine", `petssnooze` category); `_layout.tsx` got the `petssnooze` category, source-based snooze branching, and `pets`/`petssnooze` → `/mollie` routing. **Committed + device-validated on build 18.**
- **Counters reset on page return (My Day + Pets Day)** — DONE 2026-06-17 (session 4). Coffee/Water/Treats were in-memory only and reset to 0 whenever you left and came back. Now stored in AsyncStorage (`my_coffee`, `my_water`, `pets_treats`), loaded on open, saved on every +/−, and reset on the existing daily rollover. **Committed + device-validated on build 18.**
- **To-Do tiles show the due TIME** — DONE 2026-06-15 (session 2). Both render spots (`app/todo.tsx` lines 515 + 554) now append `' at ' + task.dueTime` when set, shown exactly as typed (free-text field), matching the reminder body. **Committed 2026-06-15 (`d7b4e81`); awaiting device test.**
- **`deleteTask` cancels reminders** — DONE 2026-06-15 (session 2). Added `cancelReminders(id)` in the Delete handler (`app/todo.tsx` ~line 239), mirroring `completeTask`. **Committed 2026-06-15 (`d7b4e81`); awaiting device test.**
- **`settings.tsx:165` TS error** — DONE 2026-06-15. Final fix is `onPress: async (pin?: string)`. (Session 2's first attempt used `pin: string`, which itself caused TS2322 — `Alert.prompt`'s callback value is `string | undefined`, so `string` was too narrow and blocked the commit. Session 3 corrected it to the optional `pin?: string`.) **Committed 2026-06-15 (`d7b4e81`); awaiting device test.**
- **Merge My Day Meals + Meds into one card-styled list** — DONE 2026-06-15. Now one "Routine" list of Entries under `my_routine` (migrated from `my_schedule` + `my_meds`), single common Log, "+ Add Entry" in header.
- **My Day tile time formatting (AM/PM)** — DONE 2026-06-15. `format12Hour` now outputs real 12-hour AM/PM on tiles, and the time picker is Hour(1–12)/Minute/AM-PM on both My Day and Pets Day.
