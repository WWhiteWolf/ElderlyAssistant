# Build sheet — finish the designed machine

**Read this file and build. Read only the files named for the piece in
front of you. Do not ask Patrick a design question. The decisions are
here and are not to be reopened.**

Written at #107-new, 13 September 2026, after a read-only comparison of
the designed implementation with the live code.

**Where you build.** Memory, `elderlyassistant`. Open that folder as the
workspace that holds the files you edit. Run no git command.

**#107-new writes this sheet and does not build from it. Every piece
waits for its own Go.**

There are three jobs below. The third has three smaller checkpoints.
Stop, report, and wait after every named stop. Do not carry a Go from
one stop into the next.

If something genuinely is not answered here, choose the plainest
implementation that preserves the named machinery and put the choice
in the build report. Do not fill a gap with another kind check.

---

## Why this work exists

The designed machine is the app's real backbone. All nine saved kinds
have one typed row on the translator's table. Save reads table codes.
The engine reads one shaped item. The reminder pages use one list page,
one edit form, one row, and one log page.

The read found several boundaries that still remember the same rule in
more than one place. One of them is already a live fault:

- One Time says it can be pushed back. The row and banner offer the
  short delays and write `snoozedUntil`. `stillwanted.ts` accepts that
  promised moment. `pushBackSource` in `remindersfor.ts` then returns
  nothing for `oneTime`, so the promise never reaches the phone.
- The old Pending record says One Time Snooze worked at #93-new. The
  current end-to-end code contradicts that record. Prove the live road;
  do not preserve the old claim.
- A One Time item does **not** Skip (Patrick, #107-new). It has no next
  cycle. Its banner has Done, OK, and Delay 15 / 30 / 60 min. It does
  not inherit Daily's Skip button.
- The words, action names, and arithmetic for a banner set are copied
  between category registration, the banner handler, and the list
  popup. Weekly's extra day had to be remembered in all three.
- Which Options a kind may carry is a separate kind list beside the
  translator's table. Save usually strips a wrong field, but the
  translator itself will accept `afterSetDay` or `holidayMove` from a
  kind that cannot choose it.
- Weekly Done writes `doneAt` through a private
  `kind === 'weekly'` check even though the existing table fields
  already describe Weekly.
- `applyReminderChange` serializes page and banner changes, but the day
  and week rollovers write `reminder_items` directly. A rollover and a
  person making a change can therefore each write a list read before
  the other change.

Patrick also found a separate opening fault on build 81:

- Daily items were left undone yesterday.
- The first opening of the day was a tap on the body of a banner.
- The app opened the item's own page and highlighted the item.
- The missed-reminder popup did not appear then or on the later return.

The body-tap path waits for `loadReminderItems`, and that load waits for
the day roll. The day roll records misses before it clears Daily. The
unsafe part is the housing: native Alert presentation and banner
routing are independent. The code marks the notice as showing before
the alert is safely in front, and only OK clears that mark. A route
change can lose the alert while later attempts believe it is still
showing.

---

## The shape that governs every job

- A kind's behavior is data on its translator-table row: code words,
  named bits, and named groups of fields.
- A code word is a typed set of allowed words. An impossible word
  cannot compile.
- Several independent yes-or-no facts are independent bits.
- A group of fields may be read together when the group already says
  the whole thing. Do not add a new bit when existing fields already
  carry the answer.
- Expo, React Native, storage, and routing stay at the outside edge.
  The catalog and arithmetic underneath them are plain TypeScript that
  the Node suite can test.
- The scheduler's decisions do not change: depth one, the current lead
  moments, the waiting windows, Done meanings, Skip meaning, date
  stepping, and reconciliation all stay.
- A person-facing form may still name kinds to decide which controls
  are visible. That is presentation. A saved or scheduled behavior may
  not depend on a second remembered kind list.
- Add no compatibility layer for retired names. There are no old
  backup shapes to preserve.

---

## Job 1 — one banner-action machine

**One piece. Stop when its proof is complete.**

### One typed catalog

Add one plain TypeScript catalog for banner actions under `scheduler`.
The exact file name may follow the one-lowercase-word convention. It
contains the only definitions of:

- the allowed banner action codes;
- the visible button title for each action;
- whether the action leaves the app closed;
- what the action does: acknowledge, Done, Skip, push back, keep the
  shifted day, or move the shifted occurrence to the next day;
- and, for a push-back action, how its target stamp is calculated.

The push-back calculation is a named code, not a function copied into
each consumer:

- 15, 30, or 60 elapsed minutes from now;
- 1 or 7 calendar days from now;
- 1 calendar month from now;
- or next calendar day at the item's saved hour and minute.

`BannerButtonsCode` remains the name of one complete set. The catalog is
an exhaustive `Record<BannerButtonsCode, ...>`, so adding a set without
describing its buttons is a TypeScript error.

The six sets are:

- `routineactions` — Done, OK, Skip, Delay 15 / 30 / 60 min.
  Daily only.
- `onetimeactions` — Done, OK, Delay 15 / 30 / 60 min. No Skip.
- `weeklyactions` — Done, OK, Skip, Delay 15 / 30 / 60 min, Delay 1
  Day.
- `cadenceactions` — Done, Delay 1 Day / 1 Week / 1 Month.
- `appointmentsok` — OK.
- `shifteddayactions` — Then, Next Day.

Add `onetimeactions` to the named `BannerButtonsCode` set. One Time's
translator row uses it.

### Every consumer reads the catalog

`app/_layout.tsx` registers the six Expo categories by walking the
catalog **sequentially**. Keep sequential registration; concurrent Expo
category writes have dropped categories on a cold first launch before.
The file only maps the plain catalog fields into Expo's shape.

The banner-response handler looks up the returned action in the
category that was actually carried by that notification. It applies
the catalog's effect. It does not repeat the action-code lists or the
delay arithmetic.

Before an effect changes an item, load the item by id and confirm that
the action belongs to the category on that notification. A stale or
impossible action changes nothing.

`snoozeChoicesOf` reads the shaped item's banner code, takes the
push-back actions from the same catalog, and presents their titles.
The list popup and the banner therefore cannot disagree about a
distance.

Keep these existing results:

- OK only acknowledges.
- Then accepts the last existing day and writes nothing.
- Done calls `markReminderDone`.
- Skip writes this cycle's skip stamp and only appears on a set for a
  repeating item.
- Next Day keeps its different meaning: tomorrow at the item's saved
  clock time, not merely one day from the tap's clock time.
- Await the Next Day write. Do not leave an unawaited inner task.
- A body tap still finds the item by id and opens the page from the
  saved kind. Job 2 changes only when that route is released.

### Push-back source is table data

Remove the `pushBackSource` kind switch from `remindersfor.ts`.

Give `ScreenRules` and `ShapedItem` an optional named
`pushBackSourceCode`. Set it on the translator-table rows:

- Daily — `dailysnooze`
- One Time — `oneTimesnooze`
- Weekly — `weeklysnooze`
- Monthly — `monthlydelay`
- Quarterly — `quarterlydelay`
- Yearly — `yearlydelay`

Appointments, Birthdays, and Bucket List leave it off because their
table rows do not allow push-back.

The translator carries the field. The join reads it. A promised
push-back with no source is an impossible combination for the current
table, not a branch that silently throws the promise away.

One Time's delayed reminder is:

- source `oneTimesnooze`;
- key `oneTimesnooze:<item id>:base`;
- the One Time item's words;
- and category `onetimeactions`.

Put the reminder-list source codes in one exported typed list. Both
`OWNED_SOURCES` and the unread-list protection in `reconcile.ts` read
that list rather than copying it. Make `queueview.ts`'s page-name map
exhaustive for the same source type. `oneTimesnooze` is shown as
Daily — snoozed.

### Files for Job 1

Read and edit only:

- `scheduler/inputshape.ts`
- `scheduler/translators/translate.ts`
- `scheduler/remindersfor.ts`
- the new plain banner catalog
- the one source-code file, if a separate file is the plainest shape
- `scheduler/scheduler.ts` — owned sources only
- `scheduler/reconcile.ts` — unread reminder-list sources only
- `scheduler/queueview.ts` — exhaustive page names only
- `modules/reminder-items.ts` — `snoozeChoicesOf` and the Skip stamp
  helper only
- `app/_layout.tsx` — category registration and response effects
- the relevant scheduler tests and `scheduler/tests/run-all.ts`

Do not change occurrence arithmetic, lead moments, `stillwanted.ts`,
arming depth, the saved-list door, Options, or any page layout.

### Proof for Job 1

Add plain tests that prove:

- every `BannerButtonsCode` has exactly one catalog row;
- One Time's set has no Skip;
- Daily and Weekly still have Skip;
- page and banner push-back calculations use the same definitions;
- One Time with a future `snoozedUntil` produces a wanted
  `oneTimesnooze` reminder;
- changing that stamp keeps one stable key rather than piling up;
- all reminder-list sources are protected after an unread list;
- and the queue view can name `oneTimesnooze`.

Run:

    node --experimental-strip-types scheduler/tests/run-all.ts
    npx tsc

Report the test count and TypeScript result. On the simulator, confirm
the row choices for Daily, One Time, Weekly, and Monthly. Do not make a
phone build unless Patrick separately asks. Then stop.

---

## Job 2 — one opening sequence, including a banner body tap

**One piece. Stop when its proof is complete.**

The missed-reminder arithmetic is not rebuilt. `recordMisses`,
`missesForRollover`, Daily reset, Weekly reset, and the wording in
`health.ts` stay.

### One root coordinator

The root housing owns one opening sequence for launch and every return
to the foreground. A page does not own it, and the banner handler does
not race it.

The sequence is:

1. Wait until saved appearance choices and the root navigation are
   ready.
2. Complete the day and week rollover as part of the scheduler run.
3. Complete the real scheduler run, including a queued rerun requested
   while that run was active.
4. Read and present the health and missed-reminder notice.
5. If this opening came from a banner body tap, release the saved
   destination only after the notice has either found nothing to say
   or Patrick has tapped OK.

This order matches the existing health ruling: a missed item is shown
before the person has a chance to deal with it. When there is no
notice, the body tap opens its item without an extra stop.

Action buttons still perform their catalog action. Do not turn a save
into a health-notice trigger. The notice belongs to app opening and
foreground return, not to `applyReminderChange`.

### Await the work that is already running

Today a second `runScheduler()` call returns `null` immediately and
only marks a rerun pending. A caller can therefore continue as though
the scheduler finished.

Keep one in-flight scheduler promise. A call during a run still asks
for one final rerun, but it returns the same promise and resolves only
after the active run and that final rerun are complete. No run is
duplicated, and no opening caller mistakes "queued" for "finished."

### Await the notice itself

Keep the native Alert and its existing appearance behavior.
`showHealthNotice()` returns one shared presentation promise:

- it resolves immediately when there is nothing to say;
- when a notice is shown, it resolves only after OK;
- another caller while it is showing awaits the same promise instead
  of returning as if the notice finished;
- misses and seen signatures are written only after OK, as now;
- and the in-flight state is cleared on every completed or failed
  presentation.

The banner destination waits on that promise. Do not use a timeout,
an arbitrary animation delay, or a page-specific second call to the
notice. Those are new rules to remember.

Keep the persisted `(notification id, action)` deduplication. A cold
launch must not replay an old response.

### Files for Job 2

Read and edit only:

- `app/_layout.tsx`
- `scheduler/notice.ts`
- `scheduler/scheduler.ts`
- `scheduler/rungate.ts`
- one new plain opening-sequence module if that keeps the order
  testable without React Native
- the relevant scheduler tests and `scheduler/tests/run-all.ts`

Read only:

- `scheduler/health.ts`
- `scheduler/resetgate.ts`
- `modules/reminder-items.ts`
- `app/index.tsx`

Do not change miss selection, reminder scheduling decisions, banner
effects, page routes, or popup wording.

### Proof for Job 2

Use injected plain functions to test the opening order. Prove:

- a second scheduler caller waits for the active run and its queued
  rerun;
- a body destination is not released before rollover, scheduling, and
  the notice decision;
- a real notice holds the destination until OK;
- no notice releases the destination immediately after housekeeping;
- two notice callers share one presentation;
- a save runs the scheduler but does not present the health notice;
- and one banner response is handled once after a cold launch.

Run:

    node --experimental-strip-types scheduler/tests/run-all.ts
    npx tsc

Reproduce Patrick's path on a device capable of delivering the banner:
leave a timed Daily item undone, cross the day boundary without opening
Memory, and make the first opening a tap on a banner body. The
missed-reminder popup appears first. After OK, the correct page opens
with the correct item highlighted. A later foreground return does not
repeat a miss already acknowledged.

The all-green Daily path remains quiet. Then stop.

---

## Job 3 — finish the remaining kind and storage boundaries

This job has three checkpoints. Each checkpoint gets its own Go and
its own report.

### Checkpoint 3A — allowed Options live on the kind row

Declare a typed `OptionCaseCode` for:

- `holidays`
- `afterSetDay`
- `timezone`
- `secondThursday`
- `wednesdayAfter`

Give every `ScreenRules` row an `allowedOptionCaseCodes` list:

- Daily and One Time — Time zone.
- Weekly — Holidays, Day after the set day, Time zone.
- Appointments and Birthdays — Holidays, Time zone.
- Monthly, Quarterly, and Yearly — Holidays, Time zone, a second
  Thursday, a Wednesday after the 6th.
- Bucket List — none.

The Options metadata still owns the icon, visible name, and explanatory
words. It no longer owns a parallel kind switch. The form asks the
table for the allowed codes and turns those codes into the metadata
rows.

Pass the table row into the saved-options translator. Carry a saved
option into `ShapedItem` only when that row allows its case:

- `afterSetDayBit` can come only from Weekly.
- `holidayMoveCode` can come only from a kind with Holidays.
- a named zone still requires the complete float/zone pair.
- monthly weekday fields still require the exclusive group on that
  row.

Save strips disallowed fields from the same allowed-code list. Backup
Replace and Merge validate that every item has a current saved kind and
sanitize its allowed Options before writing. A file with an unknown
kind is not a current valid backup and changes nothing.

Keep `shadeCalendar` as inert saved history. The live design says the
Options row is gone but the saved field stays. Do not connect it and
do not delete it in this checkpoint. Keep `floatDay` disconnected.

Avoid an import circle. The Options metadata and pure field helpers may
be imported by the translator. They must not then import the translator
back. Callers can combine the table's allowed codes with the metadata.

Read and edit only:

- `scheduler/inputshape.ts`
- `scheduler/translators/translate.ts`
- `modules/option-cases.ts`
- `modules/assemble-form-item.ts`
- `app/item-edit.tsx`
- `app/backup.tsx`
- the relevant tests and `scheduler/tests/run-all.ts`

Tests prove each kind's allowed list, wrong-kind fields never reach the
engine, Save strips them, both exclusive weekday patterns still cannot
be true, Birthdays stay outside that group, and Restore writes no
unknown kind. Run the full suite and `npx tsc`. Then stop.

### Checkpoint 3B — Weekly Done reads the existing field group

Add no new Weekly bit. The table already says:

- Done is `thisCycle`;
- and the repeat unit is `week`.

That group is the answer. In `markReminderDone`, write `doneAt` when
those two table facts are true, not when
`one.kind === 'weekly'`.

In `runWeeklyReset`, select resettable items from the same two table
facts. The pure arithmetic in `weeklyreset.ts` stays unchanged. Daily
still clears by its calendar-day reset. One Time has no repeat unit.
Dated kinds still use `advanceDate`. Appointments and Bucket List still
use `endItem`.

Read and edit only:

- `modules/reminder-items.ts`
- `scheduler/scheduler.ts`
- `scheduler/translators/translate.ts` only if an existing accessor
  must be exported
- the relevant tests and `scheduler/tests/run-all.ts`

Prove Weekly writes and clears its cycle stamp, Daily does not gain
one, and all three Done meanings remain unchanged. Run the full suite
and `npx tsc`. Then stop.

### Checkpoint 3C — one physical transaction for the saved list

One neutral storage module owns `reminder_items`, its raw read, and one
queued read-change-write transaction. The transaction:

1. waits for every earlier list transaction;
2. reads the latest saved list inside the queue;
3. applies the caller's change to that list;
4. writes that result;
5. and returns it.

A caller never computes a whole replacement list before entering the
queue. Queuing a stale prepared list is still the old overwrite fault.
Every distinct change runs; list changes are never collapsed the way
scheduler reruns may be.

`applyReminderChange` remains the app-facing change door. It delegates
the physical transaction, then publishes the Daily names and asks the
scheduler to run **after the list queue has been released**.

Daily and Weekly rollover use the same physical transaction. Their
reset calculation is applied to the latest list inside the queue. The
Daily transaction records misses from that same pre-clear snapshot
before returning the cleared list. Keep `oneDailyReset`; it prevents
two daily rolls from recording the same morning twice.

Do not make `applyReminderChange` call `loadReminderItems` while it
holds the queue if `loadReminderItems` can enter a rollover transaction.
That would wait on itself. The safe order is:

- opening or a person change completes any needed rollover;
- the caller enters the list transaction;
- the transaction reads and writes;
- the queue releases;
- then app-facing side effects and scheduling run.

Read and edit only:

- `modules/reminder-items.ts`
- `scheduler/scheduler.ts`
- `scheduler/resetgate.ts` only if its public waiting shape must change
- one new neutral saved-list storage module
- callers only if the exported door's location changes
- the relevant tests and `scheduler/tests/run-all.ts`

Add a controlled concurrency test. Hold a rollover after it has begun,
submit a person change, release both, and prove the final list contains
the rollover and the person change. Test the reverse arrival order as
well. Prove two ordinary patches both run in order. Run the full suite
and `npx tsc`. Then stop.

---

## Nothing else belongs to this sheet

- Do not rebuild Home, Help, Calendar, Settings, Backup's visible
  screen, Scheduled Reminders, the User's Guide, or page layout.
- Do not change lead moments, waiting windows, depth, date advancement,
  the 31st rule, birthday age, holiday arithmetic, or the Weekly
  Day-after calculation.
- Do not raise or rebuild Siri.
- Do not add Reset All Data.
- Do not upgrade Expo or poke the notification library for thread
  names.
- Do not regenerate `pending.docx`; Patrick asks for that separately.
- Do not edit any documentation in a build sitting.
- Add no dependency.
- Run no git command.

After each stop, report only what differed from this sheet, what turned
up, the test count, whether TypeScript is clean, and what remains.
