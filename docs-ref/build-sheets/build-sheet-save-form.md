# Build sheet — the save form writes from the table

**Read this file and build. Read only the files on the read list. Do not
ask Patrick anything about the design. Every decision here is already
made and is not to be reopened.**

Written at #92-new, 8 September 2026.

If something genuinely is not here, choose the plainest option that
matches the existing code, and put it in the build report to Patrick
rather than writing it into any document. Do not stop to ask.

**Where you build.** Memory, `elderlyassistant`. Open that folder as
the workspace that holds the files you edit. Run no git command.

**#92-new writes this sheet and does not build. Build waits for its
own Go.**

**Two pieces. Stop after each.** Do the piece, report, and wait. Do
not start the next piece until Patrick says Go for that piece.

**Both pieces were built at #92-new.** Not on the phone.

The four table-door pieces are already in the project. This is the
sitting those sheets named as later: teach the save form to write
the codes and leave the rest to the table.

---

## What this job is

Save still builds the item by kind. `assembleFormItem` in
`app/item-edit.tsx` has a recipe for Daily, then Weekly, then Monthly
with Quarterly and Yearly, then One Time, Appointments, Birthdays,
then Bucket List. Each recipe says which fields to keep. The form
does not ask the table what an item is. It remembers.

The table already says what a kind is: Done, the banner set, the
exclusive group, the Quarterly step. Put the save facts there too.
Save reads those facts. It does not switch on the kind name for
which fields belong.

The visible form stays as it is. Daily still has its time row,
Weekly its weekday chips, Quarterly its day chips, One Time still
saves as today. This sitting does not redesign those screens. It
only changes how Save writes the item.

---

## What this job is not

Do not change the scheduler’s decisions. Do not edit `armdepth.ts`,
`stillwanted.ts`, or the occurrence readers. Do not edit the
translator’s Done, banner, exclusive-group, or Quarterly-step
fields. They already stand.

Do not rewrite the rest of `app/item-edit.tsx`. The controls, the
Options sheet, + OPT, and which rows show for which kind stay.

Do not rebuild Home, Help, Calendar, Settings, Backup, or Scheduled
Reminders.

Do not start writing `shifteddayactions`.

Do not change Siri.

Do not connect `floatDay`. Do not change the 12-hour spinners or the
24-hour digit spinner.

---

## The write codes

Declare these in `scheduler/inputshape.ts` as named sets, the same
way the other codes are declared.

**Date write** — what Save does with `year`, `month`, and `day`:

- **none** — drop them.
- **weekday** — `day` is the weekday number. Drop `year` and `month`.
- **calendar** — write `year`, `month`, and `day` from the pending
  date, unless one exclusive weekday bit is complete. Then drop
  them. The exclusive-group write already does that drop; this code
  is what tells Save a calendar date belongs at all.
- **today** — write today’s date, not the date on the picker.
- **required** — always write the pending date.
- **optional** — write the pending date when a date was set. If it
  was not set, drop them. Do not invent a date.

**Time write** — what Save does with `hour` and `minute`:

- **none** — drop them.
- **ifPendingTime** — write from the pending time when it is there.
  If it is not, drop them.
- **alwaysPendingTime** — always write from the pending time. If
  there is none, use noon.
- **alwaysPendingDate** — always write from the pending date’s time.
- **ifTimeSet** — write from the pending date’s time when a time was
  set. If it was not, drop them.

**Lead chips** — a bit. True, keep the reminders list. False, drop
`reminders`.

The Quarterly step stays the field already on the table. If the
row has `quarterlyStepOf`, Save writes one step: a day-count, or
`intervalMonths` 3 and no day-count. If the row has no step, drop
`intervalDays` and `intervalMonths`.

The exclusive group stays the field already on the table. If the
kind has a group, Save runs `applyExclusiveGroupToItem`. If it has
none, it does not. Birthdays have no group.

---

## Each kind’s write codes

These match what Save already writes. They are not a new design.

- **daily** — date none. Time ifPendingTime. No lead chips.
- **weekly** — date weekday. Time alwaysPendingTime. No lead chips.
- **monthly** — date calendar. Time alwaysPendingDate. No lead
  chips. Exclusive group as now. No Quarterly step.
- **quarterly** — date calendar. Time alwaysPendingDate. No lead
  chips. Quarterly step on the row.
- **yearly** — date calendar. Time alwaysPendingDate. No lead chips.
  Exclusive group as now. No Quarterly step.
- **oneTime** — date today. Time ifTimeSet. Lead chips.
- **appointments** — date optional. Time ifTimeSet. Lead chips.
  Appointments’ date is required on the page in the spec; the live
  form still allows a missing date. Keep the live form.
- **birthdays** — date required. Time ifTimeSet. Lead chips. No
  exclusive group.
- **bucketlist** — date none. Time none. No lead chips.

---

## Piece 1 — the table holds the write codes

Do not start this piece until Patrick says Go.

Add the two codes and the lead-chips bit to `ScreenRules` in
`scheduler/translators/translate.ts`. Set them on every row from the
list above. Quarterly already has its own row. Do not send
Birthdays through the weekday exclusive group.

Export three helpers next to `doneActionCodeOf`:

- `dateWriteCodeOf(kind)`
- `timeWriteCodeOf(kind)`
- `keepsLeadChipsOf(kind)`

A helper for “this kind writes a Quarterly step” is the row’s
`quarterlyStepOf`. Export `hasQuarterlyStepOf(kind)` as true when
that accessor is on the row.

Do not change `assembleFormItem` in this piece. The table is the
difference. Save still remembers until piece 2.

### Files this piece touches

- `scheduler/inputshape.ts` — the two named sets only
- `scheduler/translators/translate.ts`
- `scheduler/tests/translatorcadence.test.ts`

### Read list for this piece

- This sheet, this piece
- The files named above
- The kind list under **Each kind’s write codes**

Do not open the list, the banner, or `docs/handoff.md` to decide
anything.

### Checks after piece 1

```
node --experimental-strip-types scheduler/tests/run-all.ts
npx tsc
```

Add tests that the helpers return the codes in the list above, one
assertion per kind is enough if it names all nine. Then stop.

---

## Piece 2 — Save reads the table

Do not start this piece until Patrick says Go.

Lift `assembleFormItem` out of `app/item-edit.tsx` into
`modules/assemble-form-item.ts`. The screen still calls it. The
function does not import React.

Save writes from the helpers. It does not branch on the kind name
for which fields belong.

- Read `dateWriteCodeOf`. Write or drop `year`, `month`, and `day`
  as that code says. **today** uses the clock date at save, with the
  pending date’s time of day only as the time write says. **weekday**
  writes `day` from the weekday already on the form.
- Read `timeWriteCodeOf`. Write or drop `hour` and `minute` as that
  code says. Use `hourMinuteOf` where the live form already does.
- Keep `reminders` only when `keepsLeadChipsOf` is true.
- If `hasQuarterlyStepOf`, write the named step: a day-count drops
  `intervalMonths`; none writes `intervalMonths` 3 and drops
  `intervalDays`. Otherwise drop both interval fields.
- If `exclusiveGroupBitsOf` returns a group, run
  `applyExclusiveGroupToItem`. If it returns nothing, do not.
- Options still go through `keepOptionsForKind` and
  `applyConnectedOptions`, as now. Bucket List still gets empty
  options.
- Notes stay as they are.

The screen’s `editKind ===` checks that show or hide controls stay.
They are which rows appear, not which fields Save writes.

### Files this piece touches

- `modules/assemble-form-item.ts` — new
- `app/item-edit.tsx` — call the lifted function; drop the local copy
- `scheduler/tests/assembleform.test.ts` — new
- `scheduler/tests/run-all.ts` — one line to run those tests

### Read list for this piece

- This sheet, this piece
- The files named above
- `modules/option-cases.ts` — `applyExclusiveGroupToItem`,
  `weekdayPatternComplete`, `keepOptionsForKind`. Do not edit it
  unless a name the lift needs is not exported.
- `modules/reminder-items.ts` — `hourMinuteOf` only. Do not edit it.

Do not open the list, the banner, or `docs/handoff.md` to decide
anything.

### Checks after piece 2

```
node --experimental-strip-types scheduler/tests/run-all.ts
npx tsc
```

Tests, against `assembleFormItem`, not the screen:

- Daily with a time keeps hour and minute and has no date and no
  reminders.
- Weekly writes the weekday in `day` and has no year.
- Monthly with no weekday pattern writes the calendar date.
- Monthly with a complete second Thursday drops the calendar date.
- Quarterly none writes `intervalMonths` 3 and no `intervalDays`.
- Quarterly 90 writes `intervalDays` 90 and no `intervalMonths`.
- One Time writes today’s date.
- Appointments with no date set has no year, month, or day.
- Birthdays always write a date.
- Bucket List has no date, no time, and no reminders.

On the simulator, not the phone:

- Daily Save still comes back on Daily with a time, or with no time.
- One Time for today still saves as today and comes back on Daily.
- Monthly Save still keeps the date. A second Thursday still clears
  the date on the item.
- Quarterly: one chip, or none. Save does not leave both a day-count
  and a months-count.
- Birthdays still require a date.

Then stop.

---

## After the two

The visible form still names kinds when it shows a row. That is a
later sitting if it is ever a sitting. It is not this job.

`shifteddayactions` is still never written. That is not this job.
