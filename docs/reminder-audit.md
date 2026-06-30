# Reminder / Notification audit — session #34 (2026-06-30)

Working reference for the "Reminder Notification Consolidation" effort. Read-only
audit; no code changed yet. **Timer is OUT of scope** (Patrick's call — it's small,
unique, special needs, and already a separate island).

## Scope of this effort
In: **To-Do, My Day, My Week, Pets (mollie)** reminders, plus the shared
response/routing layer in `_layout.tsx`.
Out: **Timer** (`app/timer.tsx`) — leave entirely as-is.
Also currently inert: **Planner** reminder fields (not wired to notifications).

## How it works today (the problem)

Not one system — several, with setup scattered:

- `_layout.tsx` is the hub for taps + action buttons (Done / Snooze 15·30·60 /
  My Week +1 Day / To-Do OK) for sources: `todo`, `myday`/`mydaysnooze`,
  `myweek`/`myweekpostpone`, `pets`/`petssnooze`. Registers those 4 categories
  (sequentially — race-fix). Routes plain taps to the right screen.
- **Permissions** requested in My Day, My Week, Pets, Timer — **NOT To-Do**.
- **setNotificationHandler** set in My Day, My Week, Pets (on load) + Timer (module
  load) — **NOT To-Do, NOT _layout**. To-Do depends on another screen first.

## Per-screen scheduling today

| Screen | Trigger type | Title | Body | Category | Reschedule-on-load? | Cancel by |
|---|---|---|---|---|---|---|
| To-Do | DATE / MONTHLY / YEARLY (+ DAILY 8am background) | `📋 Reminder: {title}` | Due/Day N/Month N | `todosnooze` | **No** (schedules on save) | `data.taskId` |
| My Day | DAILY | `Daily Routine` | `Time for {label}!` | `mydaysnooze` | Yes | `data.source` |
| Pets | DAILY | `Pets Routine` | `Time for {label}!` | `petssnooze` | Yes | `data.source` |
| My Week | WEEKLY (+ DATE postpone) | `Weekly Chore` | `Time for {label}!` | `myweekactions` | Yes | `data.source` |

## Concrete inconsistencies / suspects (verify on device)

1. **Snooze loses sound.** `_layout.tsx` snooze reschedule (~line 145) sets no
   `sound`; on-screen snooze in My Day/Pets sets `sound: 'default'`. Same action,
   two paths, different result.
2. **Rebuild vs schedule-once split.** My Day/Pets/My Week cancel+rebuild all their
   reminders on load (self-healing); To-Do schedules once on save. Deepest split.
3. **To-Do background 8am reminder** never cancelled before re-adding → can stack;
   carries no itemId, no category/buttons.
4. **Title/body/buttons differ** per screen (see table); button sets differ too.
5. **Completion logs differ** per source: `todo_log` (taskTitle/completedDate/
   scheduledFor/notes) vs routine `*_history` (date/sched/actual/what/note).
6. **data payload shape differs**: To-Do = taskId+itemId+label+source; routines =
   source+itemId+label.

## DIRECTION CHANGE (Patrick, #34) — read this first

- **Consolidation effort = POPUPS ONLY for now.** In-app tile buttons stay as-is
  this round.
- **To-Do becomes one-time only — no recurrences.** Daily/Weekly already gone (#32).
  Now also remove **Monthly** (live code), **Yearly** (live code), and the **3 Months
  / 6 Months** stubs (dead options). After this, every To-Do reminder is a single
  one-shot DATE — much simpler to unify.
- **New "Look Ahead" page** (separate build, likely its own session). Sits on the
  home screen alongside My Day / My Week / Pets etc. (home is a simple tile grid in
  `app/home.tsx` — add a module entry + route + new screen + Stack.Screen). Holds
  Monthly,
  3 Months, 6 Months, Yearly together, built like My Day / My Week / Pets, using the
  same unified reminder approach. Agreed so far:
  - Works like the routine pages: saved list of items; each nags on schedule; tap
    Done → logs + re-arms for the next cycle.
  - **Uniform item model:** every item = label + **first due date + time** + **repeat
    every: Monthly / 3 Months / 6 Months / Yearly**. (Monthly & Yearly can use iOS
    native repeats; 3/6 Months have no native trigger, so the app re-arms a DATE
    one-shot each cycle from the item's due date — the first-due-date already gives
    the anchor.)
  - **Layout:** items shown under separate subheadings, shortest interval first:
    **Monthly → 3 Months → 6 Months → Yearly**.
  - Keeps its own completion **history/log** (like My Day / My Week / Pets).
  - **No migration needed** — Patrick confirmed no existing Monthly/Yearly To-Do data.
  - **Delay amounts differ by page.** Same button KINDS everywhere (OK / Skip / Delay
    / Done), but Look Ahead's Delay is measured in days/weeks, not the 15/30/60 min
    used by the daily/weekly routines. Exact Look Ahead delay increments TBD.

**Also planned — "Watch List" page (separate, independent of the reminder work).**
Already built as its own standalone Expo app in **`Projects/WatchList`** (JS; Expo 54 /
RN 0.81, same as this app), designed to drop in here as another home-screen page. It's
a movie/TV tracker (streaming providers, movies, TV shows, episode/season progress,
watched status) — **no notifications**, so it doesn't touch the reminder effort. Folding
it in = a new screen (`app/watchlist.tsx`) + home tile + route, porting `App.js` /
`useWatchListState.js` / `types.js` into this app's structure. Its own future session.

Three distinct pieces of work for the reminder effort: (1) popup consolidation across
My Day / My Week / Pets / simplified To-Do; (2) strip recurrence from To-Do; (3) build
the new Look Ahead page. Plus, separately, (4) integrate the Watch List page. **Sequencing (decided):** nail down the PAGES first — settle To-Do to one-time-only
and define/build the new Recurring page — THEN do the popup consolidation on the
stable set of screens. Check for existing Monthly/Yearly To-Do data before deleting
(migration to the new page may be needed).

## BUILD PLAN — ONE continuous initiative ("Reminder Rebuild #34")

Patrick's directive (#34): keep ALL of these together as a single tracked effort so
no piece gets lost among other backlog items, and do as much as practical in the
**iOS Simulator first** (`npm run ios` — free, no EAS budget) before spending a cloud
build. Each session still takes ONE step, discussed and validated before the next.

**Simulator covers:** screens, home tile, add/edit forms, subheading grouping, the
history log, Done→log→re-arm logic, button wiring, and short-interval notification
firing (use near-future due dates / shortened intervals to watch alerts go off).
**Real phone (EAS cloud build) is only needed for:** notification delivery reliability,
tap-to-open routing, sound, and the past-day Done behavior on a real lock screen — so
those get BATCHED into two checkpoints, not one build per change.

Order (do in sequence):
1. **Strip recurrence from To-Do → one-time only.** [Simulator]
2. **Build Look Ahead** — page, home tile, route, add/edit, subheadings, history. [Simulator]
3. **Look Ahead reminders + re-arm** (near-future/shortened intervals to test firing). [Simulator]
   → **PHONE CHECKPOINT A** (1 cloud build): To-Do one-shots + Look Ahead reminders
     fire and route on the real device.
4. **Unified popups** — shared helper + OK / Skip / Delay / Done across To-Do, My Day,
   My Week, Pets (popups only; Timer excluded). [Simulator for buttons + logic]
   → **PHONE CHECKPOINT B** (1 cloud build): buttons, past-day Done rule, sound,
     tap-routing on a real lock screen.
5. **Integrate Watch List** as a page (no notifications — Simulator covers it; rides
   along on the next phone build). [Simulator]

Whoever picks this up next session: this BUILD PLAN is the running checklist — tick a
step only when its Simulator check passes; treat Checkpoints A/B as the device-validation
gates before moving on.

## Agreed target BEHAVIOR (Patrick, #34) — applies to all 4 in-scope reminders

Every in-scope reminder popup offers the same buttons, behaving identically:

- **OK** — silence just THIS one popup. Item not marked/logged; no other reminder
  touched (other offsets, an existing delay, tomorrow's repeat all stand).
- **Skip** — skip THIS occurrence only. Stop the rest of this round's nagging; do
  NOT mark or log done. Repeating items (daily/weekly) still return next normal
  cycle. (One-time item stays on the list, un-done, just silenced.)
- **Delay 15 / 30 / 60** — snooze just this one reminder that long; leave all else.
- **Done** — check off + log, recording BOTH the originally scheduled time AND the
  done-tap time. **Past-day rule:** if the tapped banner fired on a PAST day, log
  that past completion but do NOT check off today's/current occurrence.

Note: this is ~6 action buttons. iOS shows them in the expanded (long-press/pull)
banner. Keep an eye on whether the list feels too long for Patrick in practice.

## Target shape (to discuss, not yet agreed)

One shared notification helper every in-scope screen calls: owns permissions, the
handler, category registration, a consistent title/body format, one sound rule, and
one cancel-and-reschedule pattern. One response handler routes every in-scope source
the same way. Screens just say "schedule reminders for this item" / "cancel this
item's reminders."

Plan: build the shared helper first (no behavior change), then move ONE screen onto
it at a time, Simulator check between each, phone check before declaring done.
