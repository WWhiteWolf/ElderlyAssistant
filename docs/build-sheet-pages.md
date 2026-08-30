# Build sheet — Weekly through Options, and the + Add popup

**Read this file and build. Read only the files on the read list. Do not
ask Patrick anything about the design. Every decision here is already
made and is not to be reopened.**

Written at #33-new, 2026-08-29. This is the second job of the pages
phase. Daily, and the one list it needs, is the first job, from
`docs/build-sheet-daily.md`. That job is built first. This sheet copies
the answers it needs rather than sending you there.

If something genuinely is not here, choose the plainest option that
matches the existing code, and put it in your build report to Patrick
rather than writing it into any document. Do not stop to ask.

**Where you build.** Memory, `elderlyassistant`. Open that folder as
the workspace that holds the files you edit.

---

## What this job is

**Weekly, Monthly, Quarterly, Yearly, One Time, Extended, Options, and
the + Add popup that asks where a new item belongs.** Home gains those
tiles. My Week, Look Ahead and To-Do stop being how you open those
items. The Input tile comes off; the page stays registered so nothing
else breaks.

**This job assumes Daily is already built.** The first sheet is
`docs/build-sheet-daily.md`. Do not rebuild Daily from that sheet. It
is out of date on the buttons, the log, reorder, and My Day. Copy
what is on Daily now, as this file states it below.

**Daily becomes the day view as well.** Anything from Weekly, Monthly,
Quarterly, Yearly or One Time that falls on today shows on Daily with
the every-day items. Next to a visitor's name it says `from Weekly`,
`from Monthly`, and so on. That is the name, not a separate control. A
visitor returns to Daily after edit. A dateless item has no day, so it
does not show there.

---

## What Daily already is

The first sheet said Daily has no buttons. That was reversed while
Patrick was looking at Daily. Daily now has:

- **Snooze, Done, and Done that undoes.**
- **Tap the name to edit.** Hold the name and slide to reorder. No
  overlay arrows, and no arrows on the row. The list is not rewritten
  while the finger is down; the new order is written when the finger
  lifts. Rewriting mid-slide drops the hold after one slot.
- **My Log**, the same saved list My Day used (`my_history`). Done
  writes a line. Tap a line for a note. Swipe to delete. Clear All.
  Undo Done does not remove the line.
- **Daily's own add** is still only Every day, or One Time for today.
  On One Time for today, Reminders before are only **30 min., 1 hour,
  2 hours, and Time of**. Time of is the item's own time (zero minutes
  before). Do not put Morning of, Day Before, Week, or Month back on
  that add when you extend the edit page.
- **Save.** Every day returns to Daily. One Time for today currently
  returns to To-Do, because that was the page with the Log. Once One
  Time is a page, that save returns to One Time. Cancel and the header
  Home on that add still go to Daily. After save, dismiss the stack
  then replace, so the page underneath does not flash.
- **The My Day page is gone.** `app/myday.tsx` only hops to Daily.
  Home has no My Day tile. Banners tagged `myday` or `mydaysnooze`,
  and Siri mark-done, already open Daily. Do not send anyone back to
  My Day.

Copy header, Snooze, highlight, swipe, Done, hold-and-slide, and the
log from `app/daily.tsx`. Do not copy them from the old My Day file.

---

## What this sheet is not

No 24-hour clock change. No scheduler test load. No phone build. No
coffee, water, or treats counters. No log on Weekly, Monthly,
Quarterly, Yearly, One Time, Extended, or Options. Daily already has
My Log; leave it. No engine rewrite: the translator table and
`gatherWanted` are not edited. Dual-write keeps the old keys current so
reminders still arm.

**Banner landings for pages this job retires.** If Home stops opening
My Week, Look Ahead or To-Do, and the banner handler still opens those
old screens, Patrick will see the new page then quickly the old one.
That is what happened with Daily and My Day. Daily's My Day banners
already open Daily; leave that. This job sends My Week's banners to
Weekly, To-Do's to One Time, and Look Ahead's to Monthly. Do not
rewrite Done, Snooze, or Skip on those banners. Do not send anyone to
My Day.

---

## The decisions this job uses

**One saved list**, key `reminder_items`. A page is a filter on that
list. An item lives on one page. Daily may also show another page's
item when that item falls today.

**On Weekly, Monthly, Quarterly, Yearly, One Time and Extended**, each
item has Done and Snooze. A tap on the tile opens the edit page. The
edit is a page, not a modal. **Daily has Done and Snooze too**, and
Done undoes (Patrick, #33-new).

**Done.** Weekly, Monthly, Quarterly and Yearly repeat: Done finishes
this cycle and arms the next. Any adjusting of what is shown is a
separate display change, not part of the Done tap. One Time and
Extended: Done turns the button to the done colour, the item stays, it
no longer fires or arms, and delete is how it leaves.

**Snooze** copies Daily's Snooze popup, which is the Snooze the app
already has. It writes a stamp on the item. The save asks the
scheduler to run.

**A six-month item lives on Quarterly**, still every six months
(Patrick, #33-new). A new add on Quarterly is every three months.
Six-month is what migrated Look Ahead `6month` items keep.

**+ Add** opens a short popup that only asks where the new item belongs.
The fields stay on that kind's own small add. When you are finished you
return to the page you started from. If you are already on Monthly, the
popup opens with Monthly already chosen. It opens from the + Add button
the pages already have. No new control. It works the same way from
Weekly, Monthly, Quarterly, Yearly, One Time and Extended. Daily keeps
its own narrower add from the first sheet. **Options has no + Add.**

**To-Do stops being a page.** A dated task goes to One Time. A dateless
one goes to Extended.

**The Input page goes away and nothing replaces it.** The + Add popup
is not its replacement. Home's Input tile comes off. The `input` route
stays registered.

**Reminders-before chips** on the One Time page's own add, any and all
at once: 30 min., 1 hour, 2 hours, Morning of, Day Before, Night
Before, 2 Days Before, Week, and Month. That is not Daily's One Time
for today add, which stays the four chips above.

---

## What to build

**Seven new screens, one shared popup, the edit page extended, Daily
and Home and the layout edited, one shared save.**

- **New:** `app/weekly.tsx`, `app/monthly.tsx`, `app/quarterly.tsx`,
  `app/yearly.tsx`, `app/onetime.tsx`, `app/extended.tsx`,
  `app/options.tsx`.
- **New:** `components/AddWherePopup.tsx` — the where-does-it-belong
  popup.
- **New:** `modules/reminder-items.ts` — read, migrate, dual-write, and
  save of `reminder_items`. If Daily already inlined that in
  `app/daily.tsx` and `app/item-edit.tsx`, move it here and have those
  two call it.
- **Edit:** `app/item-edit.tsx` — add/edit for every kind this job
  writes, plus the two Daily already writes.
- **Edit:** `app/daily.tsx` — show today's visitors, with `from Weekly`
  and so on next to the name. A visitor's edit uses `returnTo=daily`.
- **Edit:** `app/_layout.tsx` — register the seven new screens with
  `headerShown: false`. Change only the banner *landings* for My Week,
  Look Ahead and To-Do, as above. Leave Done, Snooze and Skip. Leave
  Daily's My Day landing on Daily.
- **Edit:** `app/home.tsx` — tiles as below. Remove Input, To-Do, Look
  Ahead and My Week from the list and from `handleTile`. Leave those
  routes registered.

**Nothing else changes.** No scheduler file. No translator. No reader.
No test in `scheduler/tests`. `app/myweek.tsx`, `app/lookahead.tsx` and
`app/todo.tsx` are not edited.

---

## The one list

Key: `reminder_items`. A JSON array. Daily already writes `daily` and
`oneTime`. This job also writes `weekly`, `monthly`, `quarterly`,
`yearly`, `extended`.

Each item:

- `id` — string, `Date.now().toString()` for a new one, same id when
  editing.
- `kind` — `'daily'` | `'weekly'` | `'monthly'` | `'quarterly'` |
  `'yearly'` | `'oneTime'` | `'extended'`.
- `label` — the name.
- `hour` / `minute` — numbers, or omitted when no time. Both present or
  both absent.
- **Weekly:** `day` — 0 = Sunday through 6 = Saturday, the same as My
  Week.
- **Monthly, Quarterly, Yearly, One Time:** `year`, `month` (0–11),
  `day`.
- **Quarterly:** `intervalMonths` — `3` for a new add, `6` for a
  migrated six-month item. Keep `6` when that item is edited.
- **One Time:** `reminders` copied from To-Do's `Reminder` shape (id,
  amount, unit, kind, daysBefore, timeOfDay).
- **Occurrence:** `completed` (boolean), `doneAt` (weekly, epoch ms),
  `snoozedUntil` (epoch ms).

**Migrate** on first save path that finds old lists not yet folded in.
Match by id so a second run does not duplicate. Do not delete the old
keys.

- `week_routine` → `kind: 'weekly'`, same id, label, day, hour, minute,
  completed, doneAt, `snoozedUntil` from `postponedTo`.
- `lookahead_items` → `monthly` / `quarterly` / `yearly` from
  `interval` `monthly` / `3month` or `6month` / `yearly`. Six-month
  keeps `intervalMonths: 6` and `kind: 'quarterly'`. `snoozedUntil`
  from `delayedUntil`.
- `todo_tasks` → dated (`year`/`month`/`day` all numbers) as
  `oneTime`; dateless as `extended`. Same id, `label` from `title`,
  the date and time fields, the reminders, completed.

**Dual-write, so the engine still arms.** After every save of
`reminder_items`:

- `week_routine` — every `weekly` item in the shape
  `translateMyWeek` already reads (`id`, `label`, `day`, `hour`,
  `minute`, `completed`, `doneAt`, `postponedTo` from `snoozedUntil`).
- `lookahead_items` — every `monthly`, `quarterly` and `yearly` item
  in the shape Look Ahead already saves (`id`, `label`, `year`,
  `month`, `day`, `hour`, `minute`, `interval` `monthly` | `3month` |
  `6month` | `yearly`, `delayedUntil` from `snoozedUntil`). A
  quarterly with `intervalMonths: 6` writes `6month`.
- `todo_tasks` — keep tasks whose ids are not this list's `oneTime`
  or `extended` ids, then merge those in: `title` from `label`,
  `taskType: 'scheduled'` for `oneTime` and `'background'` for
  `extended`, the date fields, the reminders, `completed`.
- Daily's dual-write of `my_routine`, empty `pets_feeds`,
  `AppGroup.setMyDayItems`, and the One Time-for-today merge stays as
  the first sheet has it.

Then `warnIfFull(await runScheduler())`, the same call Daily already
makes.

---

## The view pages

Header furniture copied from Daily: Home on the left
(`router.dismissAll(); router.replace('/home');`), the page title
centered, **+ Add** on the right except on Options. `Bridge` under the
header. `makeStyles(theme)`, `useTheme`. `SafeAreaView` at the top the
same way. Highlight from a banner (`highlight` search param) outlines
the row the same way Daily does, and a tap on a highlighted row only
clears the highlight.

On focus, re-read `reminder_items`.

Each row: the name, the day or date and time in the same words that
page used to use (My Week's day and time, Look Ahead's date and time,
To-Do's schedule line). A snooze stamp shows as Daily's
`Snoozed till:` line. **Done** and **Snooze** on the row. No separate
Edit button. **Tap the name to edit** — `/item-edit` with the item's
`id` and `returnTo` set to this page. Hold the name and slide to
reorder, the same as Daily: no overlay arrows, no arrows on the row,
and the new order is written when the finger lifts. Swipe to delete,
with Daily's confirm alert.

**Done** on Weekly copies My Week's Done, without the log modal.
Monthly, Quarterly and Yearly: roll the date forward by
`intervalMonths` (1, 3 or 6, or 12 for yearly), copying Look Ahead's
`advanceItem`, including clamping to the last day of a shorter month.
One Time and Extended: set `completed: true`, the item stays, the
button turns to the done colour. One Time has no log of its own;
Daily already has My Log.

**Snooze** copies Daily's Snooze popup and writes `snoozedUntil`.

**Weekly** lists `kind === 'weekly'`. **Monthly** lists `monthly`.
**Quarterly** lists `quarterly` (three-month and six-month together).
**Yearly** lists `yearly`. **One Time** lists `oneTime`. **Extended**
lists `extended`.

**Daily** lists every `daily` item, then every `weekly` whose `day` is
today's weekday, then every `monthly` / `quarterly` / `yearly` /
`oneTime` whose date is today. Visitors show the name and, next to it,
`from Weekly` or `from Monthly` and so on. Done and Snooze on those
rows too, same as Daily's own items. A tap opens edit with `returnTo=daily`.

---

## The edit page

The same `app/item-edit.tsx` Daily already has. Home on the left goes
to `returnTo`. Title **New** or **Edit**. Cancel and Save near the top,
Look Ahead's placement. `Bridge`. Keyboard avoiding copied from
To-Do's Add box.

The fields are only that kind's own small add:

- **Weekly:** Name, My Week's day chips, `DateTimeControl` `mode="time"`.
- **Monthly, Quarterly, Yearly:** Name, `DateTimeControl` with date and
  time, Look Ahead's first-due call. No interval chips; the page is
  the repeat. A quarterly edit does not change `intervalMonths`.
- **One Time:** Name, `DateTimeControl` with `optionalDate` and
  `optionalTime`, Reminders-before chips copied from To-Do's Add box,
  including `REMINDER_PRESETS` and the no-reminder confirm. When this
  same page is opened as Daily's One Time for today (`returnTo` daily
  and `kind` oneTime), keep Daily's four chips only.
- **Extended:** Name, and `DateTimeControl` `mode="time"` with
  `optionalTime`. No date.

Missing name blocks save, same alert as Daily. Invalid typed time or
date blocks save, same alert as Daily.

Save writes the list, dual-writes, runs the scheduler, then
`router.dismissAll()` and `router.replace` to `returnTo`. Cancel goes
back the same way without saving. After One Time is built, change
Daily's One Time-for-today save so it returns to One Time, not To-Do.

---

## The + Add popup

`components/AddWherePopup.tsx`. A small popup, not a full page. It
only asks where the new item belongs. The choices are Daily, Weekly,
Monthly, Quarterly, Yearly, One Time, Extended. The page you are on is
already chosen. Cancel closes it and stays. Choosing one opens
`/item-edit` with that `kind` and `returnTo` set to the page you
started from, no id.

It opens from the **+ Add** button on Weekly, Monthly, Quarterly,
Yearly, One Time and Extended. No new control.

Daily does not use this popup. Daily keeps the two choices from the
first sheet: Every day, and One Time for today.

Options has no + Add.

---

## Options

A list in the style of the iPhone's notification-apps list, for the
odd cases and what to do about them (Patrick, #32-new).

Missing days follow the engine record: the last day that exists, with
an extra tap for then or next day, not skip. Also every nth day in a
period, and move the day to before or after a holiday. That calendar
thinking is from RFC 5545 and JSCalendar RFC 8984, without the file
format, settled in `Reminder Engine/docs/reminder-engine.md`. Skip of
a cycle is a different thing from a missing day, and JSCalendar's own
`skip` property is about dates that do not exist, not about skipping
an occurrence.

**When you open Options, you see this list** (Patrick, #33-new, from
the rest of the Input sheet at #30-new):

- holidays
- time zone
- the float button
- Skip
- an extra tap on a shifted day
- calendar shading
- a notes row
- a second Thursday
- a Wednesday after the 6th

**Reminders-before is not a row.** It already lives on One Time.

Each row opens that case, the way tapping an app in that iPhone list
opens that app.

Header: Home on the left, title **Options** centered, no + Add.
`Bridge`. Rows with a leading icon circle, the name, and a chevron,
grouped on a card, copied from the look of Settings' own list rows
enough to read as that iPhone list.

This job builds the list, and the case each row opens. It does not
rewrite the engine. Dual-write does not have to carry these cases.

---

## Home

Take Input, To-Do, Look Ahead and My Week off the module list. Leave
Planner, Memory Test, Orders, Watch List, Vault, Timer and Shopping
where they are. Daily is already in My Day's old place. Do not put
My Day back.

Weekly takes My Week's icon and My Week's place. Monthly takes Look
Ahead's icon and Look Ahead's place. Quarterly and Yearly sit with
Monthly, same icon. One Time takes To-Do's icon and To-Do's place.
Extended sits with One Time. Options sits with the reminder tiles.

---

## The read list, which is separate from what you may edit

**Read and edit:** `app/weekly.tsx` (new), `app/monthly.tsx` (new),
`app/quarterly.tsx` (new), `app/yearly.tsx` (new), `app/onetime.tsx`
(new), `app/extended.tsx` (new), `app/options.tsx` (new),
`components/AddWherePopup.tsx` (new), `modules/reminder-items.ts`
(new), `app/item-edit.tsx`, `app/daily.tsx`, `app/_layout.tsx`,
`app/home.tsx`.

**Read only, do not edit:**

- `app/daily.tsx` — also on the edit list, and the pattern to copy:
  header, Home, + Add, `Bridge`, swipe-to-delete, highlight, Snooze,
  Done, hold-and-slide, My Log, and `saveReminderItems`.
- `app/myday.tsx` — a hop to Daily only. Do not put the old page back.
- `app/myweek.tsx` — day chips, Done, the weekday row, `postponedTo`,
  `doneAt`, `week_routine` fields, and `DAY_NAMES`.
- `app/lookahead.tsx` — Cancel and Save near the top of the edit form,
  `advanceItem`, `INTERVAL_MONTHS`, `lookahead_items` fields including
  `interval` and `delayedUntil`.
- `app/todo.tsx` — the Add Task modal: `DateTimeControl` with both
  halves optional, `REMINDER_PRESETS`, `togglePreset`,
  `isPresetSelected`, the no-reminder confirm, `dueFieldsToSave`,
  `Task` / `Reminder` fields, and `input` / `recurBtn` styles.
- `app/settings.tsx` — the list-row look only, for Options.
- `components/DateTimeControl.tsx` — use it, do not change it.
- `components/Bridge.tsx` — use it, do not change it.
- `constants/Themes.ts` — `useTheme` and `makeStyles(theme)` only.
- `scheduler/scheduler.ts` — `runScheduler` only, as Daily calls it.
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
- **Run `./node_modules/.bin/tsc --noEmit`** from the
  `elderlyassistant` folder. `npx tsc` can pick up the wrong
  package. Anything it reports is yours. The known
  `.expo/types/router.d.ts` miss for a new screen is the same class
  of thing as Scheduled Reminders; it rewrites on the next build.
- **Run the scheduler suite** —
  `node --experimental-strip-types scheduler/tests/run-all.ts`. It
  was 413 of 413 passing. Nothing here should move that number; if it
  does, the build is wrong.
- **Patrick checks this on the simulator**, so leave every new page
  openable from Home.
