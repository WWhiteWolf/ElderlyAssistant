# An outside reading of the reminder code

## What this is

On 25 August 2026 (#17-new) Patrick put the app's reminder code in front of a
reader outside this project: Grok 4.6, in Ask mode, inside Cursor.

The reason was his own. Eight sessions — #5-new through #13-new — had the
reminders as their sole focus, the read at #14-new still found eight faults, and
this session had twice seen Claude recommend something and then reverse it. What
he wanted was a reading that had not inherited this project's assumptions.

Two things were deliberately withheld from it, so that what came back would be
its own reading and not this project's conclusions handed back:

- **No documents.** It was pointed at `scheduler/` and `app/` only. `docs/`,
  `App-docs/` and every `.md` file were expressly excluded, because those carry
  claims — "the module's own shape is sound", "My Week never had the fault" —
  that a fresh reader would otherwise absorb and repeat.
- **No conclusions from this session.** It was not told what Claude had found,
  nor what the fault was thought to be.

It read the code as it stood after #17-new's build, so it sees `occurrences.ts`
and the moved My Day reader.

**Nothing in the report below had been acted on when this file was written.** It
was recorded so it would not be lost, not because it had been accepted. At
#18-new it was checked against the code, and the marking section at the foot now
says what stands, what is deliberate, and what is still unread. **The largest
result of that checking is that most of the report describes features this
project decided on purpose**, which Cursor had no way of knowing.

## The request it answers, word for word

> Read only the code in /Users/patsmactop/Projects/elderlyassistant/scheduler and
> /Users/patsmactop/Projects/elderlyassistant/app — the .ts and .tsx files. Ignore
> every .md file, and the docs/ and App-docs/ folders — I want your reading of the
> code, not the notes written about it. Change nothing and run no git commands.
>
> This app's one job is reminding me of things. Six screens can raise reminders.
>
> Tell me:
>
> 1. For each screen, how does the code record that an item has been done or dealt
>    with? Name the field, and the file and function that writes it.
>
> 2. Where is that record cleared or expired, and what has to run for the clearing
>    to happen at all?
>
> 3. Are the six screens doing this the same way? Where they differ, say how they
>    differ.
>
> 4. Can a reminder fire for something already done? Can a reminder fail to fire
>    for something still undone? For each, show me the path through the code, or
>    say plainly that you found none.
>
> 5. The test suite passes. Tell me what it does not cover.
>
> 6. What in this design would you not trust, and why?
>
> Report with file and function names. Do not propose fixes and do not change
> anything — I want to know what is there first.

## The report, as it was given

The six screens the scheduler actually answers for are My Day, Pets
(`mollie.tsx`), My Week, Look Ahead, To-Do, and Memory Test. That is
`gatherWanted` in `scheduler.ts`. Timer still arms its own alerts. Orders is
named only so leftover banners get cancelled.

### 1. How each screen records "done"

**My Day** — field `completed` on the item in `my_routine`.

- Screen Log: `logItem` in `myday.tsx` sets `completed: true` and drops
  `snoozedUntil`, then `saveData`.
- Banner Done: the `action === 'done'` branch in `_layout.tsx` does the same
  write, then `runScheduler`.
- Siri: `applyPendingNote` in `_layout.tsx` sets `completed: true` only. It does
  not drop a snooze, and it does not call `runScheduler`.

**Pets** — field `completed` on the feed in `pets_feeds`.

- Screen Log: `logItem` in `mollie.tsx`.
- Banner Done: the same `_layout.tsx` Done branch, with `storageKey`
  `pets_feeds`.

**My Week** — fields `completed` and `doneAt` on the chore in `week_routine`.

- Screen Done: `confirmLog` in `myweek.tsx` sets `completed: true`,
  `doneAt: Date.now()`, and clears `postponedTo`, then `saveData`.
- Banner Done: `_layout.tsx` writes those same three fields, then `runScheduler`.

**Look Ahead** — no done flag. "Dealt with" means the date moved.

- Screen Log: `confirmLog` in `lookahead.tsx` calls `advanceItem`, which writes a
  new `year` / `month` / `day` and clears `delayedUntil`.
- Banner Done: `_layout.tsx` does that same roll-forward, then `runScheduler`.

**To-Do** — the task leaves `todo_tasks`.

- Screen Done: `completeTask` in `todo.tsx` filters the task out and `saveTasks`.
  It never writes `completed: true`. The reader's `if (task.completed) continue`
  in `readToDo` is a leftover guard. A To-Do banner has no Done button.

**Memory Test** — field `phase` on `memtest_session`.

- After delayed recall: `checkDelayed` in `memorytest.tsx` sets `phase: 'done'`
  via `saveSession`.
- Leaving the day: `finishSession` deletes the session key. Opening another day:
  `loadData` deletes a leftover session.

A save that goes through `saveData` / `saveTasks` / `saveSession` also calls
`runScheduler`. Banner Done does too. Siri and `finishSession` do not.

### 2. Where that record is cleared, and what has to run

**My Day and Pets.** `resetForNewDay` in `dailyreset.ts` sets `completed: false`
and drops `snoozedUntil`. `runDailyReset` in `scheduler.ts` is what writes that
back, and only when `isNewDay` says the saved date is not today. That function
runs from `runScheduler` (launch, return to the front, and after a save) and from
`refreshFromStorage` on those two screens. Yesterday's delivered banners are
dismissed separately by `sweepStaleBanners`, which also only runs inside
`runScheduler`. The phone's waiting reminder for today comes off only when
`runScheduler` then `reconcile` / `applyPlan` see that today's occurrence is no
longer wanted. Un-check on the screen is `undoDone` in `myday.tsx` and
`mollie.tsx`.

**My Week.** `applyWeeklyReset` in `myweek.tsx` clears `completed` and `doneAt`
when `doneAt` is older than `lastOccurrence`. That runs only from this screen's
`refreshFromStorage` (open, regain focus, or the app becoming active while this
screen is showing). `runScheduler` never resets My Week. Un-check is `undoDone`
in `myweek.tsx`. The weekly phone reminder is not taken off when the checkmark
is.

**Look Ahead.** The old date falling behind `now` is what stops `readLookAhead`
wanting a reminder. That happens when `advanceItem` (or the banner copy) writes
the next date, and then `runScheduler` runs. A spent delay stamp is dropped in
`refreshFromStorage` without calling `runScheduler`.

**To-Do.** There is no expiry. The task is gone from the list. Remaining
reminders come off when `saveTasks` calls `runScheduler`.

**Memory Test.** `readMemoryTest` wants a reminder only while
`phase === 'waiting'` and `recallDue` is still ahead. `checkDelayed` →
`saveSession` → `runScheduler` is what takes it off. `loadData` can move a
waiting session to `recall` without calling `runScheduler`.

None of this clearing happens if the app never runs. Two days of My Day / Pets
occurrences can already be sitting on the phone; past that, nothing new is armed
until `runScheduler` runs again.

### 3. Same way or not

They are not the same.

- My Day and Pets are twins: a boolean for today, cleared by the module's daily
  reset, and `nextOccurrences` in `occurrences.ts` skips today's moment when that
  boolean is true.
- My Week writes a boolean too, plus `doneAt`, but `readMyWeek` never looks at
  `completed`. The weekly repeat stays armed. Reset lives on the screen, not in
  the module.
- Look Ahead has no boolean. Done is a new date.
- To-Do removes the row. The banner cannot mark it done.
- Memory Test uses a phase on a single session, not a list item.

Snooze / postpone / delay are also split: My Day and Pets write `snoozedUntil`
and the module owns it. My Week postpone and Look Ahead delay are written on the
item the same way. My Week's own snooze is still armed straight onto the phone in
`_layout.tsx` and is not in `OWNED_SOURCES`.

### 4. Can a reminder fire for something already done? Fail to fire for something still undone?

**Yes, already done can still fire.**

My Week, by the reader itself. `confirmLog` or banner Done sets
`completed: true`. `saveData` / `runScheduler` calls `readMyWeek`, which still
pushes the weekly trigger. `reconcile` keeps it. It will fire on that weekday at
that time even after Done. The test `'A chore already ticked still gets its
weekly reminder'` is this path.

My Day / Pets snooze, independent of the tick. `readMyDay` and `readPets` ask for
`snoozedUntil` first, and do not look at `completed`. Screen Log and banner Done
drop that stamp. Siri's `applyPendingNote` does not, and does not run the module,
so a pending snooze can still fire after Siri marked the item done.

My Day / Pets today's occurrence, if `runScheduler` never sees the new tick. Siri
writes `completed: true` and stops. `runScheduler` also returns `null` when
`running` is already true, so a Log during an in-flight run can leave today's
date trigger on the phone. That trigger is still in the future, so it can fire.

My Week postpone after this screen rolls the cycle. `refreshFromStorage` can
clear `postponedTo` without calling `runScheduler`, so the postpone already on
the phone can still fire.

**Yes, still undone can fail to fire.**

`runDailyReset` fails, then `gatherWanted` still runs. Yesterday's
`completed: true` is still on the item. `nextOccurrences` skips today.
`reconcile` cancels today's occurrence. The item was not done today.

The app stays closed longer than `OCCURRENCES_AHEAD` (2). Later days were never
put on the phone. Nothing arms them until `runScheduler` runs.

Look Ahead: `readLookAhead` wants nothing once `due` is not after `now`, even if
the row was never logged. It sits on the screen with no banner.

To-Do: `readToDo` skips any reminder whose `fireTime` is not after `now`. A
missed lead-up is not rescheduled.

Memory Test: once `recallDue` is not after `now`, or `phase` is no longer
`waiting`, `readMemoryTest` wants nothing. If the phone never delivered that
banner, opening the screen is the only remaining ask.

`reconcile` trims whatever does not fit under the ceiling. Permission not
granted: `runScheduler` records a fault and schedules nothing. A list it cannot
parse is treated as empty, so that screen's reminders are taken off as leftovers.

I found no path where My Week's weekly repeat is suppressed by `completed`. I
found no To-Do banner path that marks a task done.

### 5. What the passing tests do not cover

They cover the plain readers, `reconcile`, `resetForNewDay` / `isNewDay`, queue
wording, and health copy. They never touch a screen, `_layout.tsx`, storage, or
the phone.

They do not run `runScheduler`, `gatherWanted`, `applyPlan`, `runDailyReset`'s
writes, or `applyPendingNote`.

They do not run `logItem`, `confirmLog`, `completeTask`, `advanceItem`,
`applyWeeklyReset`, `checkDelayed`, `finishSession`, or any banner button.

They do not check a snooze still wanted on a ticked My Day / Pets item,
`readToDo` skipping `completed: true`, a save while `running` is true, a failed
list parse cancelling that screen's reminders, or a reset fault leaving
yesterday's ticks in place.

The "day passing" tests feed the reader `completed: false` by hand. They do not
check that `runDailyReset` actually ran.

### 6. What I would not trust

The tick and the phone are not one record. The tick lives in storage. The banner
lives on the phone until a later `runScheduler` makes them match. Siri, the
`running` flag, and any reset/list fault are gaps in that match.

My Week's tick is for the screen. The weekly alarm does not care.

My Week's reset only runs if that screen is shown. The two daily screens were
moved into the module for that reason; this one was not.

A list the module cannot read is treated as "this screen wants nothing," which
cancels real reminders.

Two days of My Day / Pets are armed; after that, silence until the app runs. Look
Ahead and To-Do also go silent once their moment has passed, with the item still
sitting there undone.

I would not treat the green test run as covering "done means it will not sound"
or "undone means it will." Those joins live in `_layout.tsx` and the screen
saves, and nothing in the suite runs them.

## What Claude has and has not verified

Nothing above was taken on trust. This section says exactly which of it has been
checked against the code by Claude, and which has not. **The unchecked part is
the larger part.** A later session must not quote an unchecked claim as
established — that is the mistake this file exists to prevent.

### Checked, and confirmed true

Each of these was read in the code during #17-new.

- **`readMyWeek` never looks at `completed`.** Read entire. The reader pushes the
  weekly trigger unconditionally. A ticked chore still gets its reminder.
- **The reader's own comment contradicts this.** The header of
  `scheduler/readers/myweek.ts` says My Week "never had the fault", which under
  fix 2's rule is false.
- **A failed reset does not stop the readers.** `runDailyReset` catches a fault,
  records it and returns; `runScheduler` pushes those faults and carries straight
  on to `gatherWanted`. So a stale `completed: true` can reach a reader and
  suppress today's occurrence.
- **`runScheduler` returns null when already running.** `if (running) return
  null;` stands at the head of the function.
- **`resetForNewDay` clears the tick and the snooze**, and `runDailyReset` only
  writes when `isNewDay` says the saved date is not today.
- **`applyWeeklyReset` lives on the page**, in `app/myweek.tsx`, comparing
  `doneAt` against `lastOccurrence`, and runs from that screen's
  `refreshFromStorage`.
- **My Day and Pets ask for the snooze before looking at anything else**, and
  neither consults `completed` when doing so.

### Checked at #18-new, and confirmed true

`app/_layout.tsx` and `scheduler.ts` were read end to end, every `runScheduler`
call site in `app/` was found by search, and the test folder was listed.

- **Siri's `applyPendingNote` writes the tick and stops.** It sets
  `completed: true`, writes a history entry, clears the note and pushes to
  `/myday`. It does not drop `snoozedUntil` and it does not call `runScheduler`.
- **And landing on My Day does not make up for it.** `refreshFromStorage` in
  `myday.tsx` and `mollie.tsx` calls `runDailyReset` only. No screen but the
  housing calls `runScheduler` on becoming active, so nothing re-plans the phone
  after a Siri Done. On a cold launch the mount-time run in `_layout.tsx` races
  the Siri write rather than following it. **This is sharper than the report and
  was in no record.**
- **The banner Done branches are as described.** My Day and Pets drop the snooze
  and set the tick in one write, then run the module. My Week writes `completed`,
  `doneAt` and clears `postponedTo`, hunts down a `myweeksnooze` by hand, then
  runs the module.
- **My Week's snooze is still armed by hand**, in the `snooze15/30/60` branch
  that falls through to `scheduleNotificationAsync` for My Week and Orders only.
  It carries no key and no record of when it fires.
- **A To-Do banner really has no Done button.** Only the `todook` category is
  registered, carrying `ok` alone, and `ok` returns at the top of the handler.
- **The test files are ten, all of them plain pieces.** There is no test for
  `scheduler.ts`, none for any screen, and none for `_layout.tsx` — so every
  claim in section 5 holds. The test named *A chore already ticked still gets
  its weekly reminder* was read: it asserts `readMyWeek(...).length === 1` with
  the message *the repeat must survive a tick*.
- **`faultSpeaks` admits only `permission`, `create`, `list` and `stopped`.** So
  a `reset` fault never reaches the pop-up at all, and `faultSentence`'s reset
  wording is dead text. The report did not find this.

### Checked, and found to be deliberate rather than a fault

Patrick's own framing, and it accounts for most of the report: Cursor knew
nothing of the features this project decided on purpose. Each of these was put
to him at #18-new and confirmed as still standing.

- **Done never cancels the fired reminder** — the base repeat must fire again.
- **The To-Do banner's single OK** — his reason is now recorded in
  `reminder-rebuild.md`: an appointment cannot be snoozed, and a lead-up
  reminder has nothing to mark Done.
- **Orders has no reader** — verified rather than taken from the comment.
  `app/orders.tsx` arms nothing at all; `cancelForItem` only clears leftovers.
- **Two occurrences ahead, then silence** — his ruling at #16-new, with the
  missed-firing notice as the answer for a longer absence.
- **An unreadable list cancelling that screen's reminders** — known, commented,
  and it raises a loud fault the pop-up speaks.
- **`runScheduler` returning null while running** — a deliberate guard against
  two runs reading the queue at once, and already on the fix list.

### Still not checked

Everything the report says about these stands on the report alone.

- `scheduler/readers/lookahead.ts`, `readers/todo.ts`, `readers/memorytest.ts`.
- `scheduler/reconcile.ts`.
- `app/lookahead.tsx`, `app/todo.tsx`, `app/memorytest.tsx`.
- The test files other than My Day's, Pets' and My Week's.

### Partly seen

- **`logItem` in `myday.tsx` and `mollie.tsx`.** The line writing
  `{ ...rest, completed: true }` was seen through a search, which is consistent
  with the snooze being dropped, but the surrounding code was not read.

## The one thing this file settles

The oldest claim in the project's own documents — that My Week never had the
fault — is false, and it has been false in writing and true in the code at the
same time. It is held in place by a comment and by a test asserting it. That is
worth more than any single finding above, because it says the record and the code
were allowed to disagree without anything noticing.
