# Build sheet — the automated reminder test load

**Read this file and build. Read only the files on the read list. Do not
ask Patrick anything about the design. Every decision here is already
made and is not to be reopened.**

Written at #43-new, 2026-08-31. The design is `docs/automated-test-load.md`;
this sheet copies the answers it needs rather than sending you there.

If something genuinely is not here, choose the plainest option that
matches the existing code, and put it in your build report to Patrick
rather than writing it into any document. Do not stop to ask.

**Where you build.** Memory, `elderlyassistant`. Open that folder as
the workspace that holds the files you edit.

---

## What this job is

A **temporary load** that proves what the Mac tests cannot: **what
Patrick sees** on the simulator and then on the phone.

The Mac suite already proves the engine's arithmetic. This job does not
repeat that. It proves the real road: an ordinary saved item becomes the
right notice on the phone, with the right words and buttons; Done, Delay,
Skip, Then and Next Day do what the page and the banner say they do;
closing the app and opening it again still looks right; and cleanup
gives him his own reminders back.

Tried on the simulator first. One later phone build is the iPhone proof.

The load is temporary. It leaves after that phone run.

---

## What this sheet is not

No new reminder engine. No Mac cases that only check codes and bits.
No 24-hour clock change. No Timer. No first-run gate that runs by
itself when the app opens. No clearing of all storage or all
notifications as a shortcut. No writing a `ShapedItem`, a
`WantedReminder`, or an iOS request by hand. No asking the engine under
test to calculate its own expected answer.

Do not connect `floatDay`. Do not treat `shiftedChoice` as a recipe.
Do not put Skip or Note on Options. Extended gets no banners.

---

## What it proves

Each case is something Patrick can see or tap.

- The test item appears on the page it belongs to, under its test name.
- Daily also shows today's visitors, with `from Weekly` (or Monthly,
  and so on) next to the name. A dateless item does not.
- Extended appears on Extended and nowhere else, and arms nothing.
- Scheduled Reminders and the phone queue show the right heading,
  sentence, buttons, and firing time.
- A few near-future banners actually arrive. Tapping Done, Delay, Skip,
  OK, Then, or Next Day leaves the page and the next notice in the
  state named below.
- Closing the app and opening it again does not restore yesterday's
  ticks, duplicate notices, or lose the ones that should still be there.
- Cleanup restores his real items and settings. Test names are gone.

---

## The four pieces, and the screen that starts them

Four files, removed together after the phone run:

- `scheduler/testload/scenario.ts` — the items to save, and apart from
  them the expected notice, time, buttons, and result for each case.
- `scheduler/testload/loader.ts` — saves those items through
  `saveReminderItems` and asks `runScheduler` to run (that save already
  does). Running it twice must not duplicate anything.
- `scheduler/testload/checker.ts` — reads the real phone queue with
  `readQueue` and compares it to the scenario's expected list. It never
  imports the engine's translator, join, still-wanted, lead moments, or
  arm-depth.
- `scheduler/testload/cleanup.ts` — removes only records whose id
  carries the test prefix, restores what the loader preserved, and lets
  the real scheduler reconcile the phone.

The gate is a **temporary screen**, `app/testload.tsx`, opened from a
**Home tile labelled Test load** at the **foot** of the Home list, so
living with the app is unchanged until he taps it. It is not a first-run
screen and it does not run on launch.

When the four files come out, the screen and the Home tile come out too.
Register the screen in `app/_layout.tsx` with `headerShown: false`, the
same as the other pages. The known `.expo/types/router.d.ts` miss for a
new screen rewrites on the next build.

Copy header, Bridge, and theme from `app/reminders.tsx`.

---

## How the sitting runs

The Test load screen has four actions, in this order:

1. **Load the cases.** Confirm first: this replaces the live reminder
   list with the test items for the sitting, after saving a copy of
   his real list. Then load.
2. **Check the queue.** Runs the checker at once. Draws the
   pass-and-failure report. Most cases finish here. He does not compare
   a long list by eye.
3. **The live banners.** A short named list of the few that will
   actually fire, with the tap to use and what he should see afterwards.
   Two minutes between those firing times.
4. **Clean up.** Always available, including after a failed check.
   Restores the preserved list and settings, removes test ids, runs the
   scheduler.

**Ceiling is a fifth action on the same screen**, not mixed into the
feature load. It is labelled **Ceiling test**. Run it only after cleanup
of the feature load, or instead of that load, never at the same time.
Fifty-six notices. The warning he sees is the one `warnIfFull` already
speaks: title `No room for this reminder`, body `Your phone holds only
so many reminders and it is full. This one is saved, but the one
furthest in the future will not go off until something makes room.`
The scheduler's allowance is 64 minus 8 reserved, which is 56.

A second tap of Load, while a preserve copy already exists for this
version, replaces only the test items. It does not snapshot the test
list as if it were his.

---

## Ids, names, and what is preserved

Every test item's `id` starts with `tl1-` and then the case id, for
example `tl1-daily-base`. The visible `label` starts with `TEST ` so
it cannot be mistaken on Daily.

Before the first load, preserve:

- the current `reminder_items` array
- `reminder_last_date`
- `reminder_morning_time`, `reminder_midday_time`, `reminder_evening_time`
- `my_history`, `week_history`, `lookahead_history`, `onetime_history`,
  `extended_history`

Keep that copy under the storage key `testload_preserve_v1`. Cleanup
writes those values back. It restores the list through
`saveReminderItems` so the scheduler and Siri's list follow. It never
calls `AsyncStorage.clear` and never cancels every notification.

Do not change his Settings clock times. A Morning-of case reads them
and writes the expected fire from those saved times.

---

## Minute spacing

The live banners are two minutes apart, counting from the moment Load
finishes.

The first live case fires at load-plus-two-minutes, the next at
plus-four, and so on. Queue-only cases may use later times the same
day, or dated civil days, so they do not all pile onto those first
minutes.

---

## Expected answers, written down

The scenario file holds two lists: items to save, and expected results.
The checker reads only the second.

**Do not import** `scheduler/translators/translate.ts`,
`scheduler/remindersfor.ts`, `scheduler/stillwanted.ts`,
`scheduler/leadmoments.ts`, `scheduler/armdepth.ts`, or
`nextFireTime` from `scheduler/reconcile.ts` into the scenario or the
checker.

Allowed in the scenario file: ordinary `Date` arithmetic; the last day
of a month as `new Date(year, month + 1, 0).getDate()`; a first weekday
after a numbered day as a short loop; the second Thursday as the
Thursday in days 8–14; a copied US federal holiday table for the
holiday cases below; and `Intl` for a named zone. Those are the
written answers, not the engine checking itself.

The live scheduler arms **the next occurrence as one date**, not as a
repeating iOS daily or weekly request. Expected `trigger` is therefore
`{ kind: 'date', at: <milliseconds> }` for every armed notice.

The queue key is `source:itemId:part`. For a repeating item the part is
the fire day's year, month and day as eight digits, month and day
two-digit padded (`20260831`). For a One Time lead, the part is that
reminder's own `id`. For a One Time with no extra lead, the part is
`base`. A delay or snooze is a second notice whose source is the
push-back name below, part `base`, trigger a date at the delayed
moment.

---

## What each kind looks like on the banner

These are the words and buttons he will see. The checker compares
them to `readQueue`: `title`, `body`, `categoryIdentifier`, `source`,
`label`, and `trigger`.

**Daily** (source `myday`)

- Heading: `Daily Routine`
- Sentence: `Time for TEST Daily!` (the item's own label)
- Buttons: `routineactions` — Done, OK, Skip, Delay 15 min, Delay 30
  min, Delay 60 min
- Delay writes `snoozedUntil` and arms source `mydaysnooze`

**Weekly** (source `myweek`)

- Heading: `Weekly Chore`
- Sentence: `Time for …!`
- Buttons: the same `routineactions`
- Delay arms source `myweekpostpone`
- Saved `day` is 0 for Sunday through 6 for Saturday, matching
  `Date.getDay()`

**Monthly, Quarterly, Yearly** (source `lookahead`)

- Heading: `🔭 Look Ahead`
- Sentence: `Time for …!`
- Buttons: `lookaheadactions` — Done, Delay 1 Day, Delay 1 Week,
  Delay 1 Month
- Delay arms source `lookaheaddelay`
- If this occurrence used the last day that exists, buttons are
  `shifteddayactions` instead — Then, Next Day. Then writes nothing.
  Next Day writes `snoozedUntil` at tomorrow, same hour and minute.
  The saved year, month and day of the recipe do not change.

**One Time** (source `todo`)

- Heading: `📋 Reminder: ` plus the label
- Sentence: the due sentence the One Time translator already writes
- Buttons: `todook` — OK only. OK closes the banner and does not mark
  the item done.

**Extended**

- No notice. No row in the queue. The item is on the Extended page
  only, with its name and optional note.

A banner body-tap (not a button) opens Daily for `myday` /
`mydaysnooze`, Weekly for `myweek` / `myweekpostpone`, Monthly for
`lookahead` / `lookaheaddelay`, One Time for `todo`, and highlights
the row when `itemId` is present.

Skip and OK do not bring the app to the front. Done and the Delay
buttons do. After a banner Done he may land wherever the app was;
the proof is on Daily or Weekly when he opens it: the row is checked
and Log has a line. Skip leaves the row unchecked and writes no log
line. Monthly Done from a banner writes the Look Ahead log and does
not change the saved date.

`+1 Day` is not on the live Weekly banner. Do not test it. Weekly
delay is Delay 15 / 30 / 60 min on the shared routine buttons.

---

## The case inventory

One small item per case. Do not pile every option onto one item.

A case that is only engine arithmetic, with nothing to see on a page
or a banner, is not in this list.

### Queue and page, checked at once

Each of these is saved, the scheduler runs, the checker scores it.
No waiting.

**Q1 Daily with a time.** Kind `daily`, hour and minute in the future
today. On Daily. One notice, Daily words and buttons, fire at the
next that hour and minute.

**Q2 Daily with no time.** Kind `daily`, no hour. On Daily. No notice.

**Q3 Weekly for today.** Kind `weekly`, `day` is today's `getDay()`,
time in the future today. On Weekly, and on Daily as `from Weekly`.
One notice, Weekly words and buttons.

**Q4 Monthly for today.** Kind `monthly`, today's year, month, day,
time in the future today. On Monthly, and on Daily as `from Monthly`.
Look Ahead words and buttons.

**Q5 Quarterly for today.** Same as Q4 with kind `quarterly`. Daily
says `from Quarterly`.

**Q6 Yearly for today.** Same as Q4 with kind `yearly`. Daily says
`from Yearly`.

**Q7 One Time for today.** Kind `oneTime`, today's date, time in the
future today. On One Time, and on Daily as `from One Time`. One Time
words and OK.

**Q8 Extended.** Kind `extended`, name and a note, no time. On
Extended. Not on Daily. No notice.

**Q9 One Time, 30 minutes before.** Kind `oneTime`, a time later
today, `reminders` one offset of 30 minutes, id `30min`. Two notices:
the appointment, and one 30 minutes earlier. Parts `base` and `30min`.

**Q10 One Time, Time of.** Kind `oneTime`, `reminders` one offset of
0 minutes, id `timeof`. One notice at the item's own time.

**Q11 Lead across midnight.** Kind `oneTime`, tomorrow at 00:10,
30 minutes before. The early notice fires today at 23:40. That date
is the proof.

**Q12 Named zone.** Kind `daily`, `floatsWithPhone: false`,
`dueTimeZoneText: 'America/Los_Angeles'`. The fire time on Scheduled
Reminders is that zone's clock, not the phone's. Expected `at` comes
from `Intl` in `America/Los_Angeles`.

**Q13 Zone across a date boundary.** Kind `oneTime`, 00:30 in
`America/Los_Angeles`, `floatsWithPhone: false`. If the phone is ahead
of that zone, Scheduled Reminders shows the earlier civil date. Expected
`at` from `Intl` in that zone.

**Q14 Monthly 31st through a short month.** Kind `monthly`, `day: 31`,
a time later today. The next fire is the last day that exists in the
next month that needs one. If that day is not the 31st, buttons are
Then and Next Day. The saved `day` stays 31.

**Q15 Holiday, day after.** Kind `oneTime`, dated the next 25 December
after load, `holidayMove: 'after'`. One notice on 26 December, OK
buttons. Not Then/Next Day.

**Q16 Holiday, day before.** Kind `weekly`, the weekday of the next
4 July after load, `holidayMove: 'before'`. If that 4 July is that
weekday, the notice is 3 July.

**Q17 Second Thursday.** Kind `monthly`, `weekdayOrdinal: 2`,
`ordinalWeekday: 4` (Thursday as `getDay()`). No numbered `day`. The
next fire is the Thursday in days 8–14 of this month, or of the next
month if that Thursday is already past. Look Ahead words.

**Q18 Wednesday after the 6th.** Kind `monthly`, `afterWeekday: 3`,
`afterDayCount: 6`. No numbered `day`. The next fire is the first
Wednesday on or after the 7th of this month, or of the next month if
that day is past. Only that first Wednesday, not later ones.

**Q19 Rename.** After Q1 is loaded, save that same id with a new
label `TEST Daily renamed`. The queued heading and sentence use the
new name at the same fire time. The old sentence is gone.

**Q20 Monthly Done does not move the date.** Kind `monthly` dated the
15th of next month. After Load, the checker (or a helper on the Test
load screen) marks it done the way the page does: clear `snoozedUntil`,
do not change year, month, or day. Re-run the scheduler. The saved
date is still the 15th, and a notice for the following occurrence is
still present.

**Q21 Calendar shading.** Not a queue row. After Load, he opens
Monthly on Q14. The last existing day of the short month is shaded.
Open Q15's month: the moved holiday day is shaded. The report line is
**Look**, not Pass or Fail from the checker.

### Combinations, where order is the point

**C1 Delay then the delayed notice.** Use Q1. Write `snoozedUntil`
fifteen minutes out the way a Delay 15 min banner does, through
`saveReminderItems`. The Daily repeat for the original time remains,
and a `mydaysnooze` notice exists at the delayed moment. The item is
not completed.

**C2 Skip leaves it not done.** Use a second every-day item
`tl1-daily-skip`. After a Skip (clear `snoozedUntil`, do not set
`completed`), Daily shows it unchecked, Log has no new line for it,
and the next Daily notice is still queued.

**C3 Done, then tomorrow still arms.** Use Q1. Mark completed through
`saveReminderItems` the way banner Done does. Daily shows it checked
and Log has a line. The next day's notice at that hour and minute is
still queued (depth is one, so the armed date is tomorrow).

**C4 Next Day on a shifted banner.** Only if Q14's next fire used a
missing day. After Next Day, the recipe is still the 31st, and a
`lookaheaddelay` notice exists tomorrow at the same time. Then, if he
taps it on a live banner, writes nothing and the last existing day
stands.

A missing day and a holiday move are never on the same item.

### Live banners he watches

Five notices, two minutes apart, named on the Test load screen with
the tap to use. These are extra items, not the Q-list reused, so a
queue check is not fighting a banner he has already tapped.

**L1** Daily, plus two minutes. Tap **Done**. Then Daily: checked, Log
line, still a notice for tomorrow.

**L2** Daily, plus four minutes. Tap **Delay 15 min**. Then the item
is not checked, and a delay notice exists about fifteen minutes later.

**L3** Daily, plus six minutes. Tap **Skip**. Then Daily: not checked,
no Log line, still a notice for the next cycle.

**L4** Weekly for today, plus eight minutes. Tap **Done**. Then Weekly:
checked, week log line.

**L5** One Time today, plus ten minutes. Tap **OK**. Banner gone. The
item is not marked done.

If a live L-item's time has already passed when he gets to it, the
report says so rather than calling it a failure of the feature.

### Close and reopen

After the queue check, and before cleanup:

**R1** Send the app to the background, then open it again on Daily.
Yesterday's ticks are not back. The test notices that should still
be queued still are. No duplicate keys.

**R2** Leave Daily on screen, send the app to the background, wait a
moment, open it again without changing page. Daily still shows today's
list, not yesterday's ticks.

The report lines for R1 and R2 are **Look**, with a one-line what-to-
see, unless the checker can re-read the queue for duplicates on its
own, in which case duplicates are Fail.

### Ceiling, kept apart

**Z1** After cleanup, Ceiling test loads fifty-six every-day items
with times spread through the day, through `saveReminderItems`. The
warning pop-up appears. The queue holds fifty-six of ours, not more.
Cleanup of Z1 uses the same preserve copy as a normal cleanup, and
must run before he lives with the app again.

---

## The pass-and-failure report

The Test load screen draws one row per case, in the inventory order
above, after Check.

Each row is the case id, the visible name, and **Pass**, **Fail**,
**Look**, or **Waiting**.

A Fail row adds one line of expected versus actual, naming only what
differed: heading, sentence, buttons, time, or missing/extra notice.
Times as 24-hour `HH:MM` and the civil date. No engine dump.

Look rows name what he should open: Daily, Monthly, Scheduled
Reminders.

Waiting is only for an L-case whose banner has not fired yet.

A count sits under the header: `12 passed, 1 failed, 2 look`, in the
same place Scheduled Reminders puts its count, directly under the
header.

Scheduled Reminders stays in the app. He can open it. The checker is
still the pass or fail.

---

## What to build

**New files**

- `scheduler/testload/scenario.ts`
- `scheduler/testload/loader.ts`
- `scheduler/testload/checker.ts`
- `scheduler/testload/cleanup.ts`
- `app/testload.tsx`

**Edits**

- `app/home.tsx` — one tile at the foot of `modules`, id `testload`,
  label `Test load`. `handleTile` pushes `/testload`.
- `app/_layout.tsx` — register `testload` with `headerShown: false`.
  Do not change banner handlers.

**Nothing else changes.** No scheduler decision file. No translator.
No Mac test in `scheduler/tests` for this load. The suite stays at
whatever count it is when you start; if that number moves, the build
is wrong.

---

## House rules

- **Comments are full sentences in plain English** explaining why, in
  the voice of the surrounding file.
- **Run `npx tsc`.** Anything it reports is yours. The known
  `.expo/types/router.d.ts` miss for this new screen rewrites on the
  next build.
- **Run the scheduler suite** —
  `node --experimental-strip-types scheduler/tests/run-all.ts`.
  It was 459 of 459 passing. Nothing here should move that number.
- **Patrick tries the simulator first.** Leave Test load openable
  from Home. Do not make a phone build in this job.

---

## Read list

Read these, and only these, and only as far as the sheet already
names:

- `modules/reminder-items.ts` — `saveReminderItems`,
  `loadReminderItems`. That save already runs the scheduler and
  updates Siri's list. The load rolls the day and the week before it
  reads.
- `modules/reminder-types.ts` — `ReminderItem`, `LeadReminder`.
- `scheduler/scheduler.ts` — `runScheduler`, `readQueue`.
- `scheduler/types.ts` — `makeKey`, `WantedTrigger`.
- `scheduler/reconcile.ts` — `QueueEntry`, `CEILING` (64),
  `ROOM_FOR_OTHERS` (8). Do not use `nextFireTime`.
- `scheduler/warn.ts` — `WARNING_TITLE`, `WARNING_BODY`, `warnIfFull`.
- `app/_layout.tsx` — the category registrations and the Done / Skip /
  Delay / Then / Next Day / OK branches, and how a `Stack.Screen` is
  registered. Do not edit those branches.
- `app/home.tsx` — the `modules` list and `handleTile`.
- `app/reminders.tsx` — header, Bridge, count band, theme. Copy the
  look, not the queue math.
- `app/daily.tsx` — only to see Done, Log, and `from Weekly`. Do not
  edit it.
- `components/CadenceListPage.tsx` — only to see how Monthly Done
  clears a snooze and leaves the date. Do not edit it.
- `components/Bridge.tsx` — use it.
- `constants/Themes.ts` — `useTheme` and `makeStyles(theme)` only.

**Do not open** Memory's `docs/handoff.md`, `docs/in-flight.md`,
`docs/reminder-shape.md`, `docs/automated-test-load.md`, any other
build sheet, Students-Assistant, or the Reminder Engine folder. This
sheet already holds the answers.
