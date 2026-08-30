# Build sheet — Daily, and the one list it needs

**Read this file and build. Read only the files on the read list. Do not
ask Patrick anything about the design. Every decision here is already
made and is not to be reopened.**

Written at #32-new, 2026-08-29. This is the first job of the pages
phase. The phase spec is `docs/spec-pages.md`; this sheet copies the
answers it needs rather than sending you there.

If something genuinely is not here, choose the plainest option that
matches the existing code, and put it in your build report to Patrick
rather than writing it into any document. Do not stop to ask.

**Where you build.** Memory, `elderlyassistant`. Open that folder as
the workspace that holds the files you edit.

---

## What this job is

**Daily**, as the first page on **one saved list**. Home gains a Daily
tile. My Day and Pets stop being how you open those items.

**This job is not the rest of the pages.** No Weekly, Monthly,
Quarterly, Yearly, One Time page, Extended, or Options. Visitors from
those pages do not appear on Daily yet. The Input page stays where it
is. The engine's translator table and `gatherWanted` are not edited.

---

## What this sheet is not

No 24-hour clock change. No scheduler test load. No phone build. No
banner-handler rewrite in `_layout.tsx`. No coffee, water, or treats
counters. No log. No Options. No holiday list. No name-tag on visitors
(there are no visitors yet). No Done or Snooze buttons on Daily.

---

## The decisions this job uses

**One saved list**, key `reminder_items`. Each item carries which page
it belongs to. This job only writes two kinds: `daily` (every-day) and
`oneTime` (a One Time for today, from Daily's own add).

**An item lives on one page.** A `daily` item lives on Daily. A
`oneTime` item lives on One Time; if its date is today it will show on
Daily in a later job. This job still shows those One Time-for-today
adds on Daily, because Daily's add put them there for today, and Daily
is where you returned.

**Daily has no buttons.** Swipe to delete when an item is done or not
needed. A tap on the tile opens the edit page. After edit you return
to Daily.

**The edit is a page**, not a modal.

**+ Add** on Daily opens a short popup that only asks which of Daily's
two kinds: an every-day item, or a One Time for today with Reminders
before. Then that kind's small add. When finished, back to Daily.

**Pets is just another every-day item.** There is no Pets page in this
job. Old Pets feeds migrate in as `daily` items.

**Reminders-before chips** on a One Time add, any and all at once: 30
min., 1 hour, 2 hours, Morning of, Day Before, Night Before, 2 Days
Before, Week, and Month.

---

## What to build

**Two new files. Two existing files edited.**

- **New:** `app/daily.tsx` — the Daily view.
- **New:** `app/item-edit.tsx` — the add/edit page for a `daily` item
  or a `oneTime` item started from Daily.
- **Edit:** `app/_layout.tsx` — register `daily` and `item-edit` with
  `headerShown: false`. Do not change the banner handler.
- **Edit:** `app/home.tsx` — one tile labelled Daily, using My Day's
  icon, in My Day's place in the module list. Remove the My Day and My
  Pets Day tiles from the list and from `handleTile`. Leave the
  `myday` and `mollie` routes registered so nothing else breaks.

**Nothing else changes.** No scheduler file. No translator. No reader.
No test in `scheduler/tests`. `app/myday.tsx` and `app/mollie.tsx` are
not edited.

---

## The one list

Key: `reminder_items`. A JSON array.

Each item this job writes:

- `id` — string, `Date.now().toString()` for a new one, same id when
  editing so the engine's dual-write can match.
- `kind` — `'daily'` or `'oneTime'`.
- `label` — the name.
- `hour` / `minute` — numbers, or omitted when no time. Same rule as
  My Day: both present or both absent.
- For `oneTime` only: `year`, `month` (0–11), `day`, and `reminders`
  copied from To-Do's `Reminder` shape (id, amount, unit, kind,
  daysBefore, timeOfDay). A Daily One Time-for-today always has
  today's date.

On first open of Daily, if `reminder_items` is missing or `[]`,
migrate: read `my_routine` and `pets_feeds`, write them as `kind:
'daily'` with the same id, label, hour, minute. Then write
`reminder_items`. Do not delete the old keys. Dual-write keeps them
current after that.

**Dual-write, so the engine still arms.** After every save of
`reminder_items`, write `my_routine` as every `daily` item in the
shape `translateMyDay` already reads (`id`, `label`, `hour`, `minute`,
`completed: false`). Write `pets_feeds` as `[]` once migration has
run, so feeds are not armed twice. Write `todo_tasks` as the current
To-Do list with this job's `oneTime` items merged in: same `id`,
`title` from `label`, `taskType: 'scheduled'`, the date fields, the
reminders, `completed: false`, `createdDate` as To-Do already writes,
`notes: ''`. When reading `todo_tasks` to merge, keep tasks whose ids
are not this job's `oneTime` ids, so existing To-Do tasks stay.

Then `warnIfFull(await runScheduler())`, the same call My Day uses.

Also `AppGroup.setMyDayItems` from the `daily` items, the same way
`app/myday.tsx` does, so Siri's list does not go stale.

---

## Daily

Header furniture copied from My Day: Home on the left
(`router.dismissAll(); router.replace('/home');`), title **Daily**
centered, **+ Add** on the right. `Bridge` under the header.
`makeStyles(theme)`, `useTheme`. `SafeAreaView` at the top the same
way. Highlight from a banner (`highlight` search param) outlines the
row the same way My Day does, and a tap on a highlighted row only
clears the highlight.

The list is every `daily` item, then every `oneTime` item whose date
is today. No buttons on a row. Swipe to delete, with My Day's confirm
alert. Tap the tile (not a separate Edit button) to open
`/item-edit` with the item's `id` and `returnTo=daily`.

+ Add opens a small popup, not a full page: two choices, **Every day**
and **One Time for today**. Then `/item-edit` with `kind` set and
`returnTo=daily`, no id. Cancel on the popup closes it and stays on
Daily.

On focus, re-read `reminder_items` the way My Day re-reads storage.

---

## The edit page

A full page. Home on the left that goes to Daily when `returnTo` is
`daily` (`router.replace('/daily')`), title **New** or **Edit**,
Cancel and Save in the body the way Look Ahead's form puts them near
the top. `Bridge`. Keyboard avoiding copied from To-Do's Add box.

**Every-day:** Name, then `DateTimeControl` `mode="time"` with
`optionalTime`, the same call My Day's modal uses. Save writes a
`daily` item. No time is allowed.

**One Time for today:** Name, `DateTimeControl` with `optionalDate`
and `optionalTime` both on, the same call as To-Do's Add box, but the
date starts set to today and the time starts unset. Reminders-before
chips copied from To-Do's Add box, including `REMINDER_PRESETS` and
the toggle. The no-reminder confirm To-Do already uses. Save writes a
`oneTime` item with today's date if they left the date on today.

Save writes the list, dual-writes, runs the scheduler, then
`router.replace('/daily')`. Cancel goes back the same way without
saving.

Missing name blocks save, same alert as My Day. Invalid typed time
blocks save, same alert as My Day.

---

## The read list, which is separate from what you may edit

**Read and edit:** `app/daily.tsx` (new), `app/item-edit.tsx` (new),
`app/_layout.tsx`, `app/home.tsx`.

**Read only, do not edit:**

- `app/myday.tsx` — header, Home, + Add, `Bridge`, swipe-to-delete,
  highlight, `saveData`'s `runScheduler` / `warnIfFull` /
  `AppGroup.setMyDayItems`, and the `DateTimeControl` time-only call
  in the edit modal. Copy those. Do not change the file.
- `app/todo.tsx` — the Add Task modal only: `DateTimeControl` with
  both halves optional, `REMINDER_PRESETS`, `togglePreset`,
  `isPresetSelected`, the no-reminder confirm, `dueFieldsToSave`,
  `Task` / `Reminder` fields, and `input` / `recurBtn` styles.
- `app/lookahead.tsx` — Cancel and Save near the top of the edit
  form only.
- `components/DateTimeControl.tsx` — use it, do not change it.
- `components/Bridge.tsx` — use it, do not change it.
- `constants/Themes.ts` — `useTheme` and `makeStyles(theme)` only.
- `scheduler/scheduler.ts` — `runScheduler` only, as My Day calls it.
- `scheduler/warn.ts` — `warnIfFull` only.
- `modules/app-group.ts` — `setMyDayItems` only.

**Do not open** Memory's `docs/handoff.md`, `docs/in-flight.md`,
`docs/reminder-shape.md`, `docs/spec-pages.md`, any other build
sheet, Students-Assistant, or the Reminder Engine folder. This sheet
already holds the answers.

---

## House rules

- **Comments are full sentences in plain English** explaining why, in
  the voice of the surrounding file.
- **Run `npx tsc`.** Anything it reports is yours. The known
  `.expo/types/router.d.ts` miss for a new screen is the same class
  of thing as Scheduled Reminders; it rewrites on the next build.
- **Run the scheduler suite** —
  `node --experimental-strip-types scheduler/tests/run-all.ts`. It
  was 413 of 413 passing. Nothing here should move that number; if it
  does, the build is wrong.
- **Patrick checks this on the simulator**, so leave Daily openable
  from Home.
