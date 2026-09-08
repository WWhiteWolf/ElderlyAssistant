# Build sheet — banner housing onto the bits

**Read this file and build. Read only the files on the read list. Do not
ask Patrick anything about the design. Every decision here is already
made and is not to be reopened.**

Written at #85-new, 8 September 2026.

If something genuinely is not here, choose the plainest option that
matches the existing code, and put it in the build report to Patrick
rather than writing it into any document. Do not stop to ask.

**Where you build.** Memory, `elderlyassistant`. Open that folder as
the workspace that holds the files you edit. Run no git command.

**#85-new writes this sheet and does not build this piece. Build waits
for its own Go.**

**Two pieces. Stop after the first.** Do the door, report, and wait.
Do not start the housing until Patrick says Go for that piece.

---

## What this job is

The banner still decides by the source tag on the notice: which page
it came from. The translator already names a button set on each kind.
The housing should load the item, then do what that item already does
on the list.

The four registered sets stay. They are already named in
`app/_layout.tsx`. A banner naming a set the phone does not know shows
no buttons at all. Do not invent a fifth set.

- **routineactions** — Done, OK, Skip, Delay 15 / 30 / 60 min.
- **cadenceactions** — Done, Delay 1 Day / 1 Week / 1 Month.
- **appointmentsok** — OK, which closes without opening the app.
- **shifteddayactions** — Then, Next Day.

---

## What this job is not

Do not change the scheduler. Do not edit `stillwanted.ts`,
`armdepth.ts`, or the scheduler core. Do not add Done’s three words
(`thisCycle`, `advanceDate`, `endItem`) to the translator’s table.

Do not refuse dated Done because the table says those kinds cannot be
marked done. That bit is not enough, and the list still completes them.

Do not change Siri. Leave its Daily write as it is.

Do not rebuild Home, Help, Calendar, Settings, Backup, or Scheduled
Reminders. Do not put Skip or the 1 day / 1 week / 1 month delays
onto the list. They stay banner-only.

Do not change undo. A second tap on the list still only clears the tick.

---

## Piece 1 — the door

Lift the list’s Done, and the log write, into
`modules/reminder-items.ts`, next to `applyReminderChange` and
`advanceDatedItem`. Point the shared list at them. Do not edit the
housing in this piece.

**The item change follows the item, not the page.** Same branches the
list already has in `markDone`:

- Weekly: tick, a done-time, and any delay stamp comes off.
- Monthly, Quarterly, Yearly, and Birthdays: `advanceDatedItem`, then
  the tick.
- Daily, One Time, Appointments, and Bucket List: tick, and any
  delay stamp comes off.

**The log write is one function.** It takes the history key and the
clock time it is given. The entry shape stays as it is: id, date,
sched, actual, what, note. Cap 50. The page passes now. The banner
will pass the fire time, in piece 2.

Move `historyKeyFor` into this module. One Time uses Daily’s key
(`daily_history`). The other keys stay as they are.

**Daily’s log stays Daily’s history**, even when the row is a visitor.
The page still passes the page’s key. A banner is not on a page, so
piece 2 will pass the item’s key.

The list’s `markDone` becomes a call to this door, then a refresh of
the list and the log. Edit, delete, and clear of log rows stay on the
page.

Comments in this module stay in full sentences, in the voice already
there.

### Files this piece touches

- `modules/reminder-items.ts`
- `components/CadenceListPage.tsx`

### Read list for this piece

- This sheet
- `components/CadenceListPage.tsx` (`markDone`, `writeHistory`,
  `historyKeyFor`)
- `modules/reminder-items.ts`

Do not open the housing, the translator, or `docs/handoff.md` to
decide anything.

### Checks after piece 1

```
node --experimental-strip-types scheduler/tests/run-all.ts
npx tsc
```

Say how many tests passed, and whether TypeScript is clean. On the
simulator, Done on Daily, on Weekly, and on a dated page still does
what it does today, including moving a dated date. Then stop.

---

## Piece 2 — the housing

Do not start this piece until Patrick says Go.

The housing loads the item by id. It does not use the source tag for
Done, Skip, delay, or the tap.

**Done** calls the door from piece 1. The history key is
`historyKeyFor` of the item’s kind. The clock time is the fire time, as
the banner already uses. Dated Done therefore moves the date, which
the list already does and the banner today does not.

**Skip** and the delays drop the source checks. The stamps they already
write stay. Skip still uses `thisCycleDueStamp`. The minute delays and
the 1 day / 1 week / 1 month delays still write `snoozedUntil`.

**The tap** opens the item’s page from the saved kind. One Time opens
Daily. If there is no item, do nothing. The snooze and delay source
names (`dailysnooze`, `monthlydelay`, and the rest) are not used.

OK and Then stay as they are. Next Day already stamps by id; leave
that path, still without a source check.

**One Time on the translator’s table.** Today it spreads Appointments,
so it carries OK only, cannot be pushed back, and Done ends the item.
The guide already gives it Daily’s buttons and Daily’s Done. In
`scheduler/translators/translate.ts`, keep Appointments’ due moment
and reminder chips, and set:

- button set `routineactions`
- it can be pushed back
- Done does not end the item

That is the table at the boundary, not a scheduler change. Do not edit
any other translator row.

Do not branch on `canBeDoneBit` to skip Done.

Siri in this file stays as it is.

### Files this piece touches

- `app/_layout.tsx`
- `scheduler/translators/translate.ts`

### Read list for this piece

- This sheet
- `app/_layout.tsx` (the banner handler and the four category
  registrations)
- `scheduler/translators/translate.ts` (One Time’s row, and
  `bannerButtonsCode` on the other rows)

Do not open the scheduler core. Do not open `docs/handoff.md` to
decide anything.

### Checks after piece 2

```
node --experimental-strip-types scheduler/tests/run-all.ts
npx tsc
```

Say how many tests passed, and whether TypeScript is clean.

In `app/_layout.tsx`, Done, Skip, and the delays no longer read
`data.source`. The tap no longer reads it either.

On the simulator, not the phone:

- A Daily banner Done still ticks and logs on Daily.
- A Weekly banner Done still ticks, writes a done-time, and logs on
  Weekly.
- A Monthly banner Done moves the date and ticks, the same as the
  page.
- One Time’s banner set is Daily’s set, not OK only.
