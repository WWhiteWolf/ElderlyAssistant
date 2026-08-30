# Making the reminders rock solid — the working file

> ## This file is the record of #15-new through #18-new. It is not the live design.
>
> **Headed this way at Super-2-new, 2026-08-26, at Patrick's asking.** He went
> looking in this file for decisions taken since, did not find them, and was
> right to expect them somewhere findable.
>
> **The live design document is `docs/reminder-shape.md`.** Everything from
> #19-new onward is there and none of it is here: the five pieces, the two
> decision blocks, the codes and bits, the field names, depth, recovery on
> opening, and the translator at the boundary. **When this file and the shape
> document disagree, the shape document wins.**
>
> **What this file is still good for**, and why it is kept whole rather than
> rewritten: it is the only record of what was actually found wrong and what was
> cured, finding by finding, across four sessions. "What is already right, and is
> not to be 'fixed'" is live and is added to — the newest entry there was written
> at Super-2-new.
>
> **Two things in it now read as current and are not:**
>
> - **Anything saying a daily item takes two of the phone's places.** That was
>   true when it was written. Depth was reopened at #22-new and settled at **one
>   for every kind**, the second copy's work being done instead by the app
>   re-queueing when it opens. The closing lines about a Pets feed taking two
>   places are the clearest instance.
> - **The fix list's note that how far ahead to arm was settled at #16-new.** It
>   was settled, then reopened by Patrick and re-settled the other way.
>
> **"What is not decided" is largely still live** — the Timer, the `doneAt`
> stamp, My Week's misses, the Scheduled Reminders screen. The shape document
> keeps its own list, which does not repeat these.
>
> **Why it drifted, recorded so it does not happen again.** This file was in no
> session's reading order. A supervising session opens `in-flight.md` and
> `reminder-shape.md`; a worker opens its build sheet; the project's opening read
> is `handoff.md`. Nothing named this file, so nobody owned it, and it stood still
> from #16-new while the design moved on around it. It now has a line in
> `CLAUDE.md` saying what it is and when it is opened.

Started at #14-new, 2026-08-25, as the account of a whole read of the
reminder machinery, the faults that read found, and the order they
would be fixed in. #15-new built the first of them and #16-new began
the second; what is done is marked as such below, and everything
unmarked is still only an account.

## Patrick's verdict, recorded at his asking (#15-new)

He is disappointed, and said so plainly: eight sessions — #5-new
through #13-new — had improving the reminders as their sole focus, and
the read at #14-new still found eight faults, one of them the very
thing he had reported. With a feature as established as this one, in
his own shorthand, it should have been plug-and-play.

Recorded beside it, and not as a defence of it: every one of those
eight sessions was proved by tests and by his eye on a screen, and the
one test that would have caught the main fault — a day passing, an item
ticked off still reminding tomorrow — has never run, going back to
#6-new. The faults were not exotic. They were in the half nobody
looked at.

## Why this file exists

**Patrick's ruling, and it governs everything below.** Reminders being
rock solid is the only purpose of this app. Nothing else in it matters
if a reminder does not arrive, or arrives when it should not.

**His second ruling.** When something has to give, the old reminder is
the one thrown away and the new one is the one kept.

**His standard.** The reminders should follow established practice and
be solid and robust, rather than being a private arrangement that
happens to work.

## What was read, so no session reads it again

All of it was read on 2026-08-25 and nothing was changed.

- The whole of `scheduler/`, apart from `queueview.ts`: `types.ts`,
  `scheduler.ts`, `reconcile.ts`, `dailyreset.ts`, `warn.ts`.
- All six readers: `myday.ts`, `pets.ts`, `myweek.ts`, `lookahead.ts`,
  `todo.ts`, `memorytest.ts`.
- The housing, `app/_layout.tsx`, entire.
- `app/myday.tsx`, entire.
- The published guidance on Apple's limit and on the notification
  library, checked against the copy of the library actually installed
  in this project.

**Both remaining reads were done at #16-new** and nothing is owed:
`app/mollie.tsx` (Pets) and `app/myweek.tsx`, entire. What they showed
is recorded under "What #16-new found in the two pages" below.
`app/lookahead.tsx` and `app/todo.tsx` are already the right shape and
are not needed for this work.

**Also read at #16-new, and not to be read again:** `scheduler/types.ts`,
`scheduler/reconcile.ts`, `scheduler/scheduler.ts` and the three readers
for My Day, Pets and My Week, gone over specifically for how a reminder
is named. The account of the naming is under the #16-new rulings below.

## What is already right, and is not to be "fixed"

Recorded so that a later session does not undo good work by mistake.

**The shape of the module is the established one.** It works out the
whole set of reminders that ought to exist, compares that against what
the phone is holding, and changes only the difference. Every reminder
carries a name built from what it is — its screen, its item, and which
of that item's reminders it is — so the same reminder can never be
armed twice. Apple's own published advice is to work the set out again
each time the app opens, which is exactly what this does.

**The ceiling is handled correctly.** Apple keeps only the soonest
sixty-four reminders that have not yet fired and throws the rest away
without saying so. The reconcile keeps the soonest, trims the furthest
away, leaves room for the reminders the module does not own, and never
touches a reminder belonging to something else, such as the Timer.

**The repeating alarms are asked for correctly.** Some versions of the
notification library need an extra setting on a daily or weekly alarm.
The copy installed in this project, version 0.32, does not. This was
read in the installed package rather than taken from memory.

**The readers are plain and testable.** None of them touches storage or
the phone, each is handed the moment it should treat as "now", and 146
tests run against them under Node on the Mac in about a second.

**A To-Do banner carries a single OK button and nothing else**
(Patrick, #18-new, said more than once before it was written down). An
appointment cannot be snoozed, and a lead-up reminder has nothing to
mark Done, because the appointment has not happened yet. Acknowledging
the notice is all that is wanted.

**Background tasks are absent from the daily reset, and the absence is
correct** (Patrick, Super-2-new). After #39-new that loop rolls only
every-day items on `reminder_items`. Extended items must never join it.

A To-Do background task is a **long-range reminder that something is not
done yet**. It has no appointment, so nothing says when — but it stands
until it is finished, and its `completed` is the lasting answer to
whether it is, not a mark about today. `resetForNewDay` clears
`completed` on everything it is handed, so sweeping To-Do with it would
un-finish every background task every morning and resurrect work already
done. **Adding `todo_tasks` to that loop looks like a missing line and is
not one.**

**The eight o'clock background banner is correct** for the same reason.
It says something is still outstanding, which is its job. It is not
nagging about a record.

**And there is an opposite kind of record that only looks the same.** It
says a thing WAS done, is kept for recall rather than for prompting, is
one day long, and never leaves its page — Patrick's own example being
whether he has had a second coffee today, too routine to remember and
genuinely unrecoverable by evening. It wants no banner and no report
anywhere. The daily-cleared counters `my_coffee`, `my_water` and
`pets_treats` appear to be it, though only their storage keys were read
at Super-2-new and not the screens.

**The two are told apart by what they are for, never by their shape.**
One must survive the rollover; the other must be wiped by it. Anything
that would give the first a daily clear, or the second a banner, has
confused them. This is written down because Claude had them the wrong way
round inside a single conversation and would otherwise have written the
mistake into a build sheet.

## The findings

Eight, largest first. None has been ruled on and none has been acted
on.

### 1. A finished item still reminds — CURED FOR PETS (#16-new) AND MY DAY (#17-new); MY WEEK PART-WAY (#18-new)

**Where it lives:** `scheduler/readers/myday.ts` and
`scheduler/readers/pets.ts`, which both declare `completed` on the item
and never read it; and `scheduler/readers/myweek.ts`, which does the
same with a chore.

**What was found:** all three arm the phone's own repeating alarm — a
daily one for My Day and Pets, a weekly one for My Week. Once that
alarm is set, the phone fires it on its own and never asks the app
anything. So ticking an item off does not and cannot take that day's
reminder away.

**It is deliberate, and the reasoning is written into the file.** The
note above `readMyDay` says that a daily reminder's next firing is
tomorrow, that tomorrow the item needs doing again, and that a
checkmark therefore has nothing to say about it. That was written to
cure the opposite fault — the two daily screens going silent — and it
did cure it.

**Why it is still wrong:** today's reminder and tomorrow's are the same
alarm. The reasoning is true of tomorrow and false of today, and there
is no way to separate the two while the phone is holding one repeating
alarm for both.

**This is both of the faults Patrick reported at #14-new.** The second
is it directly: an item ticked off an hour early still fires. The first
is the same thing seen from the other end: the banner arrives for an
item already done, and tapping it lands on a row correctly showing its
checkmark. `app/myday.tsx` was read to be sure of this — the page draws
the checkmark from the item's own saved state, and it clears
yesterday's before it draws, so it cannot be showing a stale one. No
second mechanism is needed to explain what he saw, and none was found.

**Built for Pets at #16-new**, and the rule it was built to is
Patrick's: a thing ticked off should not remind for that occurrence.
**My Day followed at #17-new.** See "What #16-new built" at the foot of
this file.

**My Week is three steps, and #18-new built the first.** The order was
forced by the code and is worth keeping, because the obvious order is
the wrong one:

- **The reset had to move before the reader could be touched.** My
  Week's reminder is the phone's weekly repeat. A reader that simply
  skipped a ticked chore would cancel that repeat, and it would only
  come back when the tick cleared — and until #18-new the tick cleared
  only when `app/myweek.tsx` was opened. A chore ticked once, page
  never revisited, would have gone silent for good. That is worse than
  the fault being cured.
- **Step one, built.** The arithmetic came off the page into
  `scheduler/weeklyreset.ts`, unchanged in what it decides, with `now`
  handed in so tests can say what time it is. `runWeeklyReset` in
  `scheduler.ts` applies it — a sibling of `runDailyReset` rather than
  part of it, because My Week has no single boundary to turn on: each
  chore rolls on its own weekday, so each is judged against its own
  last occurrence. It runs in the same clean-slate step, writes only
  when something has come round, and the page asks for it before it
  reads the way the two daily pages do. Twenty new tests; 230 of 230
  pass.
- **Step two, still to do.** `occurrences.ts` counts only in days.
  `nextOccurrences` steps a day at a time and has no weekday in it, so
  it cannot serve a weekly chore — its own comment about a weekly thing
  getting a fortnight describes Patrick's rule rather than this
  function. A weekly companion is wanted beside it.
- **Step three, still to do.** Rewrite `readMyWeek` on that companion
  and make it honour the tick. The header comment calling My Week "the
  one screen that never had the fault" and the test named *A chore
  already ticked still gets its weekly reminder* both go out with it.

### 2. A failure is swallowed and never recorded — CURED (#15-new)

**Where it lives:** throughout `scheduler/scheduler.ts`. The whole run
is wrapped so that any error returns nothing at all. Reading a saved
list swallows its own errors and answers with an empty list. Rolling
the day over swallows one screen's failure so the other still runs.
Sweeping yesterday's banners swallows its own. Arming a single reminder
swallows its own so the rest still go. Reading the memory test's saved
session swallows its own.

**Why it matters most after the first:** if any of it fails, the app
looks exactly as it does when everything is well. Nothing is written
down, so there is nothing to look at afterwards and no way to tell a
real fault from a mis-set time. Each of those guards is individually
sensible — one reminder failing should not stop the rest — but together
they mean the module can fail completely and silently.

**Built at #15-new.** Each of the six places still catches, so one failure
never stops the rest, but every one of them now says what happened. See
"What #15-new built" at the foot of this file.

### 3. A second run is thrown away rather than held

**Where it lives:** the `running` flag at the foot of
`scheduler/scheduler.ts`.

**What was found:** a run that begins while another is still going
answers with nothing and does no work. The guard is right in itself —
two runs at once would each read the phone's queue before the other had
changed it — but it discards the second run instead of holding it until
the first has finished.

**Why it matters:** the module is run after every save. A save made
while a launch run or a return-to-front run is still going may not
reach the phone until the next time the app comes to the front. With
finding 2 above, nothing says so.

**Decided:** nothing.

### 4. The instruction that lets a banner show is set on eight pages
and not in the housing

**Where it lives:** `app/myday.tsx`, `app/mollie.tsx`,
`app/myweek.tsx`, `app/lookahead.tsx`, `app/todo.tsx`,
`app/memorytest.tsx`, `app/orders.tsx` and `app/timer.tsx`, each with
its own copy of the same instruction. `app/_layout.tsx`, `app/home.tsx`
and `app/index.tsx` carry none.

**What was found:** the notification library will not show a banner for
a reminder that falls due while the app is open unless the app has told
it to, and its own default is to show nothing. This was confirmed in
the library's published documentation.

**Why it matters:** on a fresh start, a reminder falling due while the
app is still on the home page — before any of those eight pages has
been opened — shows no banner at all. Once any one of the eight has
been opened the setting holds for the rest of that run, so the window
is narrow rather than constant. It is real all the same, and it is the
same scattering as the rest: a thing that should be said once at the
top is said eight times below.

**Decided:** nothing.

### 5. My Week's snooze is armed outside the module

**Where it lives:** `app/_layout.tsx`, in the snooze branch, where My
Week and Orders still arm a reminder onto the phone by hand.

**What was found:** the reminder is created directly and carries no
name of the module's kind and no record of when it fires. The module
therefore cannot see it, cannot move it, and cannot take it off. It is
the one source the module does not own, and it shows on the Scheduled
Reminders screen with its name and its page and no time.

**This was already known** and stands in `docs/handoff.md`. It is
repeated here because it belongs to this piece of work.

**Decided:** nothing.

### 6. My Week's "+1 Day" button cannot fire

**Where it lives:** the `myweekactions` button set registered in
`app/_layout.tsx`, and the `postpone1` branch that answers it.

**What was found:** both of My Week's reminders — the base weekly one
and the postponed one — carry the shared routine button set instead, so
`myweekactions` is registered and never asked for and the branch
answering it can never run. Postponing still works from the page.

**This was already known** and stands in `docs/handoff.md`.

**Decided:** nothing.

### 7. The same question gets two different answers

**Where it lives:** across the six readers.

**What was found:** three screens use the phone's own repeating alarms
and three use single moments aimed at one time. Good practice picks one
and stays with it. Because this app uses both, whether a reminder can
answer to the state of its item depends on which screen it came from —
which is finding 1 stated as a rule rather than as a fault.

**The alternative is already proven in the other project.** In
Students-Assistant every reminder is a single moment aimed at the next
occurrence, worked out afresh on every run, and the reader steps past
an occurrence already marked done. Patrick settled that himself there
at SA-13. Its cost was named at the time and applies here too: a single
moment is spent once it fires, so a stretch in which the app is never
opened arms nothing further ahead.

**Decided:** nothing.

### 8. Nothing checks that the phone matches

**Where it lives:** nowhere, which is the point.

**What was found:** the Scheduled Reminders screen shows what the phone
is holding. Nothing compares that against what the saved lists say
ought to be there, so a reminder that should exist and does not is
invisible until it fails to arrive.

**Decided:** nothing.

## The fix list, in the order it would be done

Nothing here is agreed. The order is by what makes the next fix safer
rather than by size.

1. **Make a failure visible.** — **DONE (#15-new).** Until this was in,
   every other fix would have been built without being able to tell
   whether it worked. What it became is below.

2. **One rule for a finished item, applied the same way everywhere.**
   — **PETS DONE (#16-new); MY DAY DONE (#17-new); MY WEEK ONE STEP OF
   THREE (#18-new).** This is the fix for both of the reported faults.
   It means moving the three repeating screens onto single moments
   aimed at the next occurrence, so that the reader can step past an
   occurrence already marked done. Pets went first because it is the
   smallest and My Day is its twin. My Week went last because it is the
   odd one, and the reason it is odd has now been dealt with: its
   checkmarks cleared on the page, and as of #18-new they clear in the
   module. The reader itself is still owed. See finding 1 for the three
   steps and why the reset had to move first.

3. **Tell the module when Siri marks something done** (found #18-new,
   in no earlier record). `applyPendingNote` writes the tick and stops.
   Nothing re-plans the phone, and the snooze stamp is left in place.
   This is the smallest of the real holes and probably the cheapest.

4. **Make a failed clear-out speak.** A `reset` fault is classed quiet
   and never reaches the pop-up, on the reasoning that no reminder is
   lost by it. That reasoning is now known to be false: a failed reset
   leaves yesterday's tick in place and the readers then cancel today's
   reminder. Patrick's call at #18-new was to leave it for now; the
   corrected wording is already in `faultSentence` and unused.

5. **Hold a dropped run instead of discarding it**, so a save always
   reaches the phone.

6. **Say the banner instruction once, in the housing**, and take the
   eight copies out.

7. **Bring My Week's snooze under the module**, written down on the
   chore the way My Day's and Look Ahead's already are.

8. **The dead "+1 Day" button** — either wake it or take it out.

## What is not decided

- Whether the Timer comes under the module. It is outside it today, its
  alerts are counted but not owned, and Patrick has said twice that it
  is not working right.
- Whether Pets keeps a stamp of when it was done, the way My Week's
  `doneAt` does. The other half of this question is now answered: My
  Week's page-side reset moved into the module at #18-new, so both
  clear where the module runs. What is still open is the stamp itself —
  Pets and My Day carry a plain `completed` and lean on a saved date,
  My Week carries `doneAt` and is judged against its own last
  occurrence. Neither was made to match the other.
- **Whether My Week records misses.** The daily reset writes down what
  was left undone before it wipes a tick, so the pop-up can say what
  never reached Patrick. `runWeeklyReset` does not, because that was
  not in the piece agreed at #18-new. `missesForRollover` is built
  around a day — it takes `yesterday` and a gap flag — so a weekly
  equivalent needs arithmetic of its own and a decision about what the
  notice says.
- Whether the Scheduled Reminders screen wants anything doing now that
  one feed shows as two rows rather than one. Nobody has looked at that
  screen's code since the change.

Settled at #16-new and no longer open: that the move is made at all,
that one screen is proven first rather than all three moving together,
and how far ahead a single moment is armed. See the rulings below.

Two questions that stood here at #14-new are now answered and are
recorded with the rulings below: what a failure looks like when it is
made visible, and what happens to the cost of single moments.

## Patrick's rulings at #15-new

**The move to single moments is agreed, on one condition** — that a
missed firing is noted when he opens the app. His words: "Yes as long
as a missed firing is noted on opening."

**A failure speaks in a pop-up when the app is opened.** Four of the
six faults speak, because each one means a reminder he is expecting
will not arrive: a reminder that failed to go onto the phone, a saved
list that could not be read, a run that stopped part-way, and
permission being off. Two are written down and never interrupt him —
the day failing to roll over, and yesterday's banners not coming
down — because neither stops a reminder arriving. The run skipped
because another was already going is not a failure at all and says
nothing; fix 3 cures it properly.

**The pop-up comes back once a day, not on every open.** Tapping a
fault away silences that same fault until the next day; a fault he has
not tapped away shows at once. His agreement to the reasoning is the
durable part: a notice that appears every time the app comes to the
front is one you learn to tap away without reading, which costs the
very thing it was for.

**A miss is cleared by having been shown, never by the item being done
again.** This was his correction of a rule proposed the other way
round, and his reason is that the pop-up always comes first — the app
cannot be used without being opened, and opening it is what raises the
pop-up. So a miss is written down as the day rolls over, shown the next
time he opens the app, and gone for good once he taps it away.

**One pop-up carries both kinds**, faults first and then misses,
because two pop-ups stacking on opening is what teaches a person to tap
without reading. The heading widened to cover both.

**His Still To Do wording is carried across whole** for a miss —
"[This] from [when] is hanging!" — with his rule from there that a
repeating item lists its most recent miss only, so a fortnight away
gives one line per item rather than fourteen.

**And an instruction about how the work is done:** give a suggestion
without being asked for it, especially where the good answer is already
known. He said this after being asked three times in a row what he
wanted when there was a plain recommendation to make.

## What #15-new built

Nothing of fix 2 itself. Two pieces, both plain-and-tested in the shape
the six readers already use, and 192 of 192 tests pass where 146 did
before.

**The record and the pop-up.**

- `scheduler/health.ts` is the new plain file: what a run's outcome
  looks like, which faults speak and which stay quiet, the once-a-day
  rule, the misses, and every sentence either kind puts on screen.
  Node tests all of it.
- `scheduler/notice.ts` is its thin impure half — the alert box and the
  storage reading — which is exactly the split `warn.ts` already has.
- `scheduler/scheduler.ts` stops swallowing silently. Every one of the
  six places still catches, so one failure never stops the rest, and
  each now says what happened. The last ten runs are kept, so a failure
  at breakfast is not wiped out by a good run at noon.
- The pop-up is raised from `app/_layout.tsx` after the run finishes,
  not from the home page. On a cold launch the first page draws long
  before the run is done, so a pop-up hung on a page would miss the
  very moment it is for; from the housing it also finds him wherever
  he is.
- It is the phone's own alert box, the same one the near-the-ceiling
  warning uses, so the closing line is not in smaller type.
- One thing is now a fault that was not before: a saved list holding
  something that is not a list at all. It used to be read silently as
  empty, which is the path where a screen's reminders vanish and the
  ones on the phone are then taken off as leftovers.

**The missed-firing safety net**, which is the condition his ruling
put on fix 2 and is built ahead of it.

- The day's rollover is the only moment the truth can still be seen,
  because it wipes the checkmarks and afterwards yesterday's undone
  item and today's not-yet-done item look exactly alike. So each
  undone item leaves one line behind as it rolls over.
- A gap needs nothing written down. The app already saves the last day
  it rolled over, so every day between that and today is a day nothing
  was done — which is arithmetic, and it closes the hole where a
  fortnight away would otherwise have caught the last day only.
- Yesterday is counted back from the clock rather than parsed out of
  the saved date, because that date is written in the phone's own
  wording — 8/25/2026 here, 25/08/2026 elsewhere — and cannot be
  safely read back.
- A week-old drop rule was proposed and deliberately not built: one
  miss per item, plus a miss cleared for good on the tap, already
  bounds the list, and a rule that can never fire is worse than none.
- My Day and Pets only. My Week clears on its own cycle and that page
  is still unread.

**Still owed as reading before fix 2:** nothing. Both were read at
#16-new.

## What #16-new found in the two pages

Both were read entire and nothing in either was changed.

**Pets, `app/mollie.tsx`.** A feed carries a plain `completed` boolean
and no record of when it was done. Whether it counts as done today
rests entirely on the module's daily reset having cleared it, which the
page asks for by calling `runDailyReset()` at the top of
`refreshFromStorage`. The snooze is already written down as
`snoozedUntil` rather than armed, and logging the feed strips it. The
page arms nothing itself; every save calls `runScheduler()`.

**My Week, `app/myweek.tsx`, and it is not built like Pets.** It does
not use the module's daily reset at all. It has its own
`applyWeeklyReset`, running on the page, which clears a chore's
checkmark once its `doneAt` is older than the chore's most recent
occurrence, and drops a stale `postponedTo` the same way. So the daily
clearing named in fix 2 does not reach My Week: its clearing is weekly,
page-side, and happens only when the page is opened or the app comes
back to the front. The page also already holds the arithmetic fix 2
needs, in `lastOccurrence` and `nextDateForWeekday`.

**The asymmetry is the thing to carry.** Pets has no `doneAt`; My Week
has one and clears itself. Neither was changed. It is listed above
under what is not decided.

## Patrick's rulings at #16-new

**Two occurrences ahead, not two days.** A single moment is spent once
it fires, so several have to stand ready. He first said three and
settled on two once the arithmetic was in front of him. It counts
occurrences rather than days on purpose, so a weekly chore gets a
fortnight of cover rather than nothing at all.

**His arithmetic, which is the reason.** The module has fifty-six
places to spend — Apple's sixty-four less the eight held back for the
Timer and anything else the module does not own. He has twelve items
across My Day, Pets and My Week with two more to enter, so fourteen.
Three deep is forty-two of the fifty-six; two deep is twenty-eight,
which leaves room for To-Do, Look Ahead, Memory Test and any snoozes
standing at the time. He said "I think 2 will have to be enough. And
with notices everything should be covered."

**What the notice actually covers was stated back to him and accepted:**
it tells him a reminder was missed when he next opens the app; it does
not make the reminder arrive. A stretch away longer than two
occurrences is told rather than armed for.

**Pets first, then My Day, then My Week**, one screen at a time, with
both halves of the fix built together in each. His agreement closed the
question #15-new had left open about whether all three move at once.
The reasoning he agreed to: both halves live in the same few lines of
each reader, so splitting them means writing that code twice; and My
Week goes last because it is the odd one.

**Best practice was checked rather than recalled**, at his asking. What
was found: Apple's own engineers confirm the sixty-four limit is on
scheduled requests rather than deliveries, and that a repeating trigger
is one request however many times it fires — so leaving repeating
alarms has a real cost, and that cost is what fix 2 spends. The common
documented pattern for a conditional reminder, which a repeating
trigger cannot express, is to fill the queue with the nearest upcoming
occurrences on every launch and top it up each run. That is what the
reconcile already does. A recommendation had been made against this
from memory and was withdrawn once the sources were read.

**And a small one about wording:** "nothing has gone onto the phone"
was said at the end of several reports and he asked for it to stop.

## What #16-new built

Pets only, both halves of fix 2 together. Nothing else in the app was
touched. 202 of 202 tests pass, up from 192, and `npx tsc` reports only
the stale generated-route error that predates this work.

- `scheduler/readers/pets.ts` now asks for a feed's next two
  occurrences as single moments instead of one repeating daily alarm.
  `OCCURRENCES_AHEAD` sits in that file with Patrick's reasoning beside
  it, and belongs somewhere all three screens can see it once My Day
  and My Week follow.
- **The skip is deliberately narrow.** An upcoming occurrence falling
  **today** is dropped when the feed is ticked. One on any later day is
  never dropped, because `completed` only ever means "done today" and
  the daily reset clears it as the day turns.
- **Each occurrence is named for the day it falls on** —
  `pets:p1:20260825`. The first attempt named them by their place in
  the run, `next1` and `next2`, and that was wrong: those names slide
  as days pass, so every run would find every name pointing at a new
  moment and take them all down and put them all back. Named by its own
  day, an occurrence keeps its name until it fires and the reconcile
  leaves it where it is. The day is built from the date's own parts
  rather than a written-out date, which would come in the phone's own
  locale.
- The day is stepped a day at a time rather than by adding twenty-four
  hours, so a feed keeps its time of day across the clocks changing.
- The snooze half of the reader is untouched.
- `scheduler/tests/pets.test.ts` went from eleven tests to twenty-one,
  and was rebuilt around a real date rather than a bare number, since
  the change is about calendar days and times of day. **The test that
  had never run since #6-new now runs:** a day passing, an item ticked
  off, and whether it still reminds tomorrow.
- Nothing else in the module assumed Pets repeated. The Scheduled
  Reminders screen's own `repeats()` is general, and will now say a
  Pets reminder does not repeat, which is true.

**Two consequences worth carrying.** Each feed now takes two of the
phone's places instead of one. And the Scheduled Reminders screen will
show two rows per feed rather than one — expected, not verified, since
that screen's code was not opened.
