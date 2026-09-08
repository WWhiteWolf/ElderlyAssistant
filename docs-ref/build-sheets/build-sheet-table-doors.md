# Build sheet — the table first, then every door reads it

**Read this file and build. Read only the files on the read list. Do not
ask Patrick anything about the design. Every decision here is already
made and is not to be reopened.**

Written at #91-new, 8 September 2026.

If something genuinely is not here, choose the plainest option that
matches the existing code, and put it in the build report to Patrick
rather than writing it into any document. Do not stop to ask.

**Where you build.** Memory, `elderlyassistant`. Open that folder as
the workspace that holds the files you edit. Run no git command.

**#91-new writes this sheet and does not build. Build waits for its
own Go.**

**Four pieces. Stop after each.** Do the piece, report, and wait. Do
not start the next piece until Patrick says Go for that piece.

**All four pieces were built at #91-new.** Not on the phone.

The names are already in the shape. The old remembering is still doing
the work. Put the difference in the table first, then make every door
read it.

---

## What this job is

A reminder kind’s difference lives on the translator’s table. The
doors — Done, undo, Skip, Snooze, exclusive patterns, and the
Quarterly step — still remember kinds and distances beside that table.
They should read the table.

The four registered banner sets stay. They are already named in
`app/_layout.tsx`. Do not invent a fifth set.

- **routineactions** — Done, OK, Skip, Delay 15 / 30 / 60 min.
- **cadenceactions** — Done, Delay 1 Day / 1 Week / 1 Month.
- **appointmentsok** — OK, which closes without opening the app.
- **shifteddayactions** — Then, Next Day. Still never written. Leave
  it registered. Do not start writing it.

---

## What this job is not

Do not change the scheduler’s decisions. Do not edit `armdepth.ts` or
the occurrence readers. The one allowed edit in the scheduler is
`stillwanted.ts` in piece 1, and only the Done branch named there.

Do not rewrite the whole save form. A later sitting can teach the form
to write the codes and leave the rest to the table. That waits until
these four pieces are true.

Do not rebuild Home, Help, Calendar, Settings, Backup, or Scheduled
Reminders.

Do not change Siri. Do not raise the later in-app Siri.

Do not change morning, midday, or evening times. Do not connect
`floatDay`. Do not change the 12-hour spinners or the 24-hour digit
spinner.

Do not change how many reminders to arm, how a date is stepped, or
what a Skip stamp means to the engine once it is written.

---

## Piece 1 — Done is only the three-word code

The table already has `doneActionCode` on every row:
`thisCycle`, `advanceDate`, or `endItem`. It also still has
`canBeDoneBit`, and the dated rows say false. Those rows never read
a Done tick (`isDoneOf` returns false). The two-way bit is a second
answer. Take it out of the way: dated kinds can be marked done. The
three-word code says what that mark means.

### The table

In `scheduler/translators/translate.ts`, on the shared dated row
(Monthly, Quarterly, Yearly) and on Birthdays:

- `canBeDoneBit` is **true**.
- `isDoneOf` reads `!!item.completed`, the same as Daily.
- `doneActionCode` stays `advanceDate`.

Do not change Daily, Weekly, One Time, Appointments, or Bucket List.

`doneActionCodeOf` already reads the table. Leave that helper.

### The wanted-block

`scheduler/stillwanted.ts` already asks `canBeDoneBit && isDoneBit`
first. Today a dated tick never reaches that question, because the
translator will not carry the tick and the bit says they cannot be
done. After the table change, a dated tick will reach it.

The date has already moved. The tick is the mark that this cycle was
done. It stays until the morning of the next due date. The new date
must still be armed.

Add `advanceDate` to that first question:

- `endItem` — the item is finished. No reminders. This already
  stands.
- `advanceDate` — still wanted. Do not drop this occurrence. The
  date already moved. The tick is a mark, not a drop.
- `thisCycle` — this occurrence is done, later ones stand. This
  already stands.

Do not drop the `canBeDoneBit` gate. It still means the item is
allowed a tick. After this piece, every current kind is allowed one.
The gate is not the dated workaround any more.

Rewrite the test that says a dated cadence cannot be marked done
(`scheduler/tests/stillwanted.test.ts`, “An item that cannot be
marked done is never treated as done”). Keep a test of the gate if
you want, but do not use Monthly as the example of cannot-be-done.
Add a test: Monthly, `canBeDoneBit` true, `isDoneBit` true,
`doneActionCode` `advanceDate` is wanted and does not drop this
occurrence.

### The Done door

`markReminderDone` in `modules/reminder-items.ts` already reads
`advanceDate` and calls `advanceDatedItem`. The Weekly-only branch
after that comes out. Weekly still writes `doneAt`, because the
weekly reset already reads it. That is the reset’s existing need,
not a second Done meaning. Daily still does not write `doneAt`.

When Done is `advanceDate`, keep the date that was on the item
before the advance:

- Write `priorYear`, `priorMonth`, and `priorDay` from the item’s
  `year`, `month`, and `day` as they were.
- Then advance, then set `completed` true.

Add those three fields to `ReminderItem` in
`modules/reminder-types.ts`. The translator and the engine do not
read them. The backup carries the one list, so they travel with it.
There are no old backup files to keep a shape for.

### Undo on the list

`undoDone` in `components/CadenceListPage.tsx` always clears the
tick. It must read the three-word code.

- `advanceDate` — put `priorYear`, `priorMonth`, and `priorDay`
  back onto `year`, `month`, and `day`. Then drop the three prior
  fields, `completed`, and `doneAt`.
- `thisCycle` and `endItem` — clear `completed` and `doneAt`, as
  now.

If the prior fields are missing, only clear the tick. Do not invent
a date.

### Morning clear

`clearStartingOccurrenceTicks` in `scheduler/miss-candidates.ts`
already takes the dated tick off on the morning of the next due
date. When it takes the tick off, drop `priorYear`, `priorMonth`,
and `priorDay` as well. The cycle was accepted. A later un-check
must not restore a spent date.

### Files this piece touches

- `scheduler/translators/translate.ts`
- `scheduler/stillwanted.ts`
- `scheduler/tests/stillwanted.test.ts`
- `scheduler/tests/translatorcadence.test.ts` (dated `canBeDoneBit`
  and a ticked dated item)
- `modules/reminder-types.ts`
- `modules/reminder-items.ts`
- `components/CadenceListPage.tsx`
- `scheduler/miss-candidates.ts`

### Read list for this piece

- This sheet, this piece
- The files named above
- `scheduler/weeklyreset.ts` — only to see that Weekly’s reset
  reads `doneAt`. Do not edit it.

Do not open the form, Options, or `docs/handoff.md` to decide
anything.

### Checks after piece 1

```
node --experimental-strip-types scheduler/tests/run-all.ts
npx tsc
```

Say how many tests passed, and whether TypeScript is clean.

On the simulator, not the phone:

- Daily Done still ticks and comes round again.
- Weekly Done still ticks, writes a done-time, and the weekly
  reset still clears it on the next cycle.
- Monthly Done still moves the date and ticks.
- Un-check on that Monthly item puts the old date back and takes
  the tick off.
- A ticked Monthly item still arms the new date. It does not go
  quiet.

Then stop.

---

## Piece 2 — exclusive groups are one group

Do not start this piece until Patrick says Go.

The table already names the group on the shared dated row:
`exclusiveGroupBits` is `MONTHLY_WEEKDAY_EXCLUSIVE_GROUP`
(`secondThursday`, `wednesdayAfter`). `exclusiveGroupBitsOf`
already returns it. The translator never reads that name when it
writes the repeat. The form has its own last-pattern code. Those
are two copies of the same rule.

### The translator

In `withMonthlyRepeat` (`scheduler/translators/translate.ts`):

- A second Thursday and a Wednesday after the 6th cannot both be
  written. If both saved fields are complete, write **neither**
  weekday pattern. Fall through to the dated repeat. Do not pick
  Thursday.
- If only one is complete, write that one, as now.
- **Birthdays stay off that path.** Do not send Birthdays through
  the Thursday or Wednesday writes. Birthdays still repeat yearly
  (`year`, 1). Birthdays are not given those Options cases.

A half-entered pair is still left off.

### The form

The form turns the others off from the table’s list. It drops its
own last-pattern copy.

`exclusiveGroupBitsOf(kind)` is the list. When one name on that
list becomes complete, clear the fields of the other names. Do not
keep a parallel `MonthlyPattern` type as a second list of the same
names.

Choosing a date on Monthly, Quarterly, or Yearly still clears both
weekday field sets. That is the group off, not a third exclusive
bit.

The date-and-time control still shows a date when neither weekday
bit is complete, and time only when one is. Ask the settings
fields, not a stored pattern name.

`lastEnteredMonthlyPattern`, `withLastMonthlyPattern`, and
`applyLastPatternToItem` in `modules/option-cases.ts` are the copy.
Replace their use with the table’s list. Birthdays never use this
path; they already do not.

### Files this piece touches

- `scheduler/translators/translate.ts`
- `scheduler/tests/translatorcadence.test.ts`
- `modules/option-cases.ts`
- `app/item-edit.tsx`

### Read list for this piece

- This sheet, this piece
- The files named above
- `scheduler/inputshape.ts` — the named group only. Do not edit
  it unless a comment is now wrong.

Do not open the list, the banner, or `docs/handoff.md` to decide
anything.

### Checks after piece 2

```
node --experimental-strip-types scheduler/tests/run-all.ts
npx tsc
```

Add a test: both weekday fields complete on a Monthly item writes
neither weekday pattern.

Add a test: Birthdays with those fields set still repeat yearly
and do not carry a weekday list.

On the simulator: on Monthly Options, finishing a second Thursday
clears a Wednesday after, and the reverse. Then stop.

---

## Piece 3 — the Quarterly step is a field on the table

Do not start this piece until Patrick says Go.

The shape already has `quarterlyStepCode`: `none`, `days30`,
`days60`, `days90`. The table does not. Quarterly shares Monthly
and Yearly’s row. A later branch overwrites the repeat to a
day-count.

### The table

Quarterly gets its own row. It no longer shares
`datedCadenceRules` and then overwrites it.

Give `ScreenRules` a Quarterly-step accessor, left off on every
other kind. Quarterly’s row writes the named step from
`intervalDays` the same way `quarterlyStepCodeOf` already does.

When the step is `none`, Quarterly repeats every three months
(`month`, 3), as now. When the step is a day-count, it repeats in
days from the entered date. That write lives on the row, not in a
later branch that every dated kind walks through.

A day-count step is the repeat. Do not also write a second Thursday
or a Wednesday after on that item. That is what the early return
already does. Keep it, on Quarterly’s row.

Monthly and Yearly stay on the shared dated row. They do not grow
a Quarterly step.

### Save

The chips already write the named set: none, 30, 60, or 90 days.
One at a time. A second tap is none.

Save stops writing a months-count as a second answer.

- Step `none` — write `intervalMonths` 3. Drop `intervalDays`.
- A day chip — write `intervalDays`. Drop `intervalMonths`.

Do not rewrite the rest of `assembleFormItem`. Only this second
answer comes out.

### Files this piece touches

- `scheduler/translators/translate.ts`
- `scheduler/tests/translatorcadence.test.ts`
- `app/item-edit.tsx`

### Read list for this piece

- This sheet, this piece
- The files named above
- `scheduler/inputshape.ts` — `quarterlyStepCodeOf`,
  `quarterlyStepDaysOf`, and the named set. Do not change the
  named set.

Do not open the list, the banner, or `docs/handoff.md` to decide
anything.

### Checks after piece 3

```
node --experimental-strip-types scheduler/tests/run-all.ts
npx tsc
```

The existing Quarterly tests still hold: no chip is every three
months; a 90-day chip is `day` / 90 / `days90`.

On the simulator: a Quarterly chip still writes one step, and a
second tap clears it. Save does not leave both a day-count and a
months-count on the item. Then stop.

---

## Piece 4 — the row and the banner read the button set

Do not start this piece until Patrick says Go.

The table already names `bannerButtonsCode` on each kind. The
banner already registers those sets. The list’s Snooze distances
are always 15, 30, and 60 minutes. Skip stamps a cycle only for
Daily and Weekly.

### Snooze distances

Put one helper next to `hasReminderSet` in
`modules/reminder-items.ts`. It reads the item’s shaped
`bannerButtonsCode` and returns the distances that set already
uses:

- `routineactions` — 15 minutes, 30 minutes, 60 minutes.
- `cadenceactions` — 1 day, 1 week, 1 month.

The shared list popup offers those labels and writes
`snoozedUntil` the same way the banner already writes it for those
buttons. It does not remember the kind.

`hasReminderSet` still asks whether the item can be pushed back
and has a due time. No button, no popup, when it cannot.

Do not put Skip onto the list. Skip stays on the banner set that
already has it.

### Skip

Skip stamps a cycle when the item has a next cycle, not when the
kind is Daily or Weekly.

`thisCycleDueStamp` in `modules/reminder-items.ts` asks the
translator. If the shaped item has no `repeatUnitCode`, there is
no next cycle: write no stamp. If it has one, the stamp is this
cycle’s due moment: Daily and Weekly as they already compute it;
any other repeating item uses the shaped `dueMoment` when it is
there. If there is no moment to name, write no stamp.

The banner Skip handler already finds the item by id. It keeps
doing that. It uses this stamp function. It does not ask the kind.

The engine’s reading of a Skip stamp does not change.

### Files this piece touches

- `modules/reminder-items.ts`
- `components/CadenceListPage.tsx`
- `app/_layout.tsx` (only if Skip still names Daily or Weekly;
  the stamp function should make that unnecessary)

### Read list for this piece

- This sheet, this piece
- The files named above
- `scheduler/translators/translate.ts` — `bannerButtonsCode` on
  the rows. Do not edit the translator in this piece.
- `app/_layout.tsx` — the four category registrations, so the
  labels and distances match.

Do not open the form, Options, or `docs/handoff.md` to decide
anything.

### Checks after piece 4

```
node --experimental-strip-types scheduler/tests/run-all.ts
npx tsc
```

On the simulator, not the phone:

- Daily Snooze on the list is still 15, 30, and 60 minutes.
- Monthly Snooze on the list is Delay 1 Day, 1 Week, and 1 Month,
  the same as its banner.
- Appointments still has no Snooze.
- Daily Skip still drops this cycle and arms the next.
- A Weekly Skip still does the same.

Then stop.

---

## After the four

The save form still builds the item by kind. That is a later
sitting. Do not start it from this sheet.

`shifteddayactions` is still never written. That is not this job.
