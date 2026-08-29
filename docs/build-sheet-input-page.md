# Build sheet — Memory Input page: first glance and Repeat

> **The plan this sheet belongs to is dropped** (Patrick, #30-new). One
> form that asks every kind of question and then files the answer onto a
> list is not how add works. The page it describes is still in the app as
> a try, and this sheet is still the accurate description of that try —
> but it is history, not the road. The road is the reminder pages, at the
> top of `docs/handoff.md`.

**Built** at #29-new Cursor, 2026-08-28, as `app/input.tsx`, with
Home's first tile and the route in `app/_layout.tsx`. Patrick checked
it on the simulator. **Enter to the five lists was added in that same
session after this sheet**, which had said not to write lists. Do not
build the page again from this sheet. The rest of this file is the
instructions that were followed for the first glance and Repeat.

**Read this file and build. Read only the files on the read list. Do not
ask Patrick anything about the design. Every decision here is already
made and is not to be reopened.**

Written at #29-new, 2026-08-28, from the Input page settled in that
session. This sheet carries the answers themselves rather than pointing
at other documents.

If something genuinely is not here, choose the plainest option that
matches the existing code, and put it in your build report to Patrick
rather than writing it into any document. Do not stop to ask.

**Where you build.** Memory, `elderlyassistant`. Open that folder as
the workspace that holds the files you edit.

**What this sheet is not.** No viewing pages. No writing to My Day,
Pets, My Week, Look Ahead, or To-Do. No translator change. No engine
change. No Options. No holidays. No time zone. No float button. No
Skip. No extra tap on a shifted day. No calendar shading. No
Reminders-before row. No notes row. No second Thursday. No Wednesday
after the 6th. The five existing Add and Edit boxes stay as they are.

This page is the first screen that can hold a repeat rule in the
engine's own fields. Persistence waits on the viewing pages. Until
then the values live only while the page is open.

---

## The decision

**One Input page.** The five reminder pages become viewing pages after
this page is known, and not before. Save does not pick a list.

**First glance** is four lines:

- a name
- a date or none
- a time or none
- Repeat or none

Date and time start asleep, each half on its own, the way
`DateTimeControl` already can.

**The Repeat panel begins with** four controls, and nothing else:

- **How often** — every day, week, month, or year
- **Every how many** — 1 unless they change it
- **Which weekdays** — only if it is a week
- **Stops on** — a last date, or none

Time zone is not on this page.

---

## What to build

**One new file. Two existing files edited.**

- **New:** `app/input.tsx` — the Input page.
- **Edit:** `app/_layout.tsx` — register the route, the same way
  `reminders` is registered, so the navigator does not draw a default
  header above this page's own.
- **Edit:** `app/home.tsx` — a tile labelled Input, first in the
  module list, so the page can be opened on the simulator. The tile
  opens `/input`. It does not file an item into any list.

**Nothing else changes.** No scheduler file. No reader. No translator.
No test in `scheduler/tests`. The five reminder pages are not edited.

---

## The read list, which is separate from what you may edit

**Read and edit:** the three files named above. `app/input.tsx` is new.

**Read only, do not edit:**

- `components/DateTimeControl.tsx` — use it with `optionalDate` and
  `optionalTime` both on, the same way `app/todo.tsx` does at the Add
  Task box. Copy that call. Do not change the control.
- `scheduler/inputshape.ts` — only `RepeatUnitCode` (`'day' | 'week' |
  'month' | 'year'`). Those four words are How often. You are not
  changing the file.
- `app/todo.tsx` — the Add Task modal only, for the name box, the
  `DateTimeControl` call, `input` / `inputLabel` / `recurBtn` styles,
  and `makeStyles(theme)`.
- `app/myday.tsx` — the header only: Home on the left, title in the
  center, `Bridge` under the header. Copy that furniture.
- `app/myweek.tsx` — `DAY_NAMES` only (`Sun` through `Sat`, Sunday is
  0). That is Which weekdays.

**Do not open** Memory's `docs/handoff.md`, `docs/in-flight.md`,
`docs/reminder-shape.md`, any other build sheet, Students-Assistant,
or the Reminder Engine folder.

---

## House rules

- **Comments are full sentences in plain English** explaining why, in
  the voice of the surrounding file.
- **Run `npx tsc`.** Anything it reports is yours.
- **Run the scheduler suite** —
  `node --experimental-strip-types scheduler/tests/run-all.ts`. It was
  413 of 413 passing. Nothing here should move that number; if it
  does, the build is wrong.
- **Patrick checks this on the simulator**, so leave the page in a
  state he can open from Home.

---

## One: register the page

In `app/_layout.tsx`, add a `Stack.Screen` for `input` with
`headerShown: false`, next to the existing screens. That is the whole
edit in this file.

In `app/home.tsx`, add `{ id: 'input', label: 'Input', icon: '📝' }`
as the **first** item in `modules`, and in `handleTile` add
`if (id === 'input') router.push('/input');` beside the other
pushes. Do not reorder the rest.

---

## Two: the Input page

A full page, not a modal sitting on another page. `SafeAreaView` at
the top, Home that goes home the same way My Day does
(`router.dismissAll(); router.replace('/home');`), title **Input**
centered, and a same-width empty view on the right so the title stays
centered. `Bridge` under the header. `makeStyles(theme)` like Home
and To-Do. `useTheme`.

The body is a `ScrollView`. Keyboard avoiding on iOS, copied from the
Add Task box.

### First glance

Four lines, in this order:

**Name.** Label `Name`. A `TextInput` using To-Do's `input` style.
Placeholder `What is this for?`.

**Date.** `DateTimeControl` with `optionalDate` and `optionalTime`
both on, `mode` left at its default so both halves show. Date starts
not set. Time starts not set. `onChange` wakes only the half that
was touched, the same as To-Do. Empty is none. Do not write today's
date onto a blank.

**Time.** That is the time half of the same control. Do not add a
second `DateTimeControl`.

**Repeat.** A row you can tap. While no repeat is set it shows
**None**. Once a unit is chosen it shows a short label, as below.
Tapping the row opens the Repeat panel on this same page, under the
four lines. It does not push another route.

There is no Save that writes a list. Home leaves. Values are lost
when the page closes. That is deliberate: viewing pages are later.

### The Repeat panel

Visible after Repeat is tapped. Four controls, in this order, and
nothing else.

**How often.** Four chips, one at a time: Day, Week, Month, Year.
They write `day`, `week`, `month`, `year`. Copy To-Do's `recurBtn`
and `recurBtnActive` for the chips. A fifth chip **None** clears the
unit and the rest of the panel, and the Repeat line shows None again.

**Every how many.** A number that starts at **1**. A minus and a plus.
Minus will not go below 1. This is `repeatIntervalCount`. Hide this
row while How often is None.

**Which weekdays.** Seven chips, `Sun` through `Sat`, Sunday is 0,
copied from My Week's `DAY_NAMES`. More than one may be on. Show this
row only when How often is Week. Hide it otherwise. If none are on,
leave the weekday list empty; do not invent a default day.

**Stops on.** A `DateTimeControl` with `mode='date'`, `optionalDate`
on, no time half. Starts not set. Empty means it does not end. Hide
this row while How often is None.

Do not add a time zone. Do not add Options. Do not add an ordinal on
a weekday. Do not add an after-day count.

### The short Repeat label

On the first-glance Repeat line, once a unit is set:

- interval 1, day → `Every day`
- interval 1, week, no weekdays → `Every week`
- interval 1, week, with weekdays → `Every week on` then the chosen
  day names, in Sunday-to-Saturday order, separated by commas
- interval 1, month → `Every month`
- interval 1, year → `Every year`
- interval greater than 1 → `Every n days` (or weeks, months, years),
  with the weekday names appended the same way when it is a week

If Stops on has a date, append `, until` and that date as the control
shows it. If Repeat is None, the line is `None` and nothing is
appended.

---

## What would make this build wrong

- Writing to `my_routine`, `pets_feeds`, `week_routine`,
  `lookahead_items`, or To-Do's saved tasks.
- Opening `scheduler/` except the one type read named above.
- Putting Repeat onto the five existing Add boxes instead of this
  page.
- A Home tile that is a viewing page for a list.
- Asking Patrick which list this belongs to.
