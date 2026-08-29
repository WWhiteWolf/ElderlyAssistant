# Session hand-off — A Place To Remember (Memory, iPhone)

This file carries the continuity and nothing else: where the work
stands and what is open in front of it. Finished work goes to
`build-history.md`, opened only when something needs tracing.

> **That work is done** (#23-new). `docs/build-sheet.md` was the self-contained
> sheet the input shape and the two decision blocks were built from, and it
> served exactly as intended. It is now the standing description of what those
> three files hold, corrected at #23-new where it and the code disagreed, and it
> is kept current with them rather than reopened.

## Where things stand

**The live work is one Input page** (#29-new Cursor, 2026-08-28). A
session that opens this file starts here. It does not start from the
engine brief below. It does not make Patrick re-teach the four lines
or Repeat. Think for him. Do not ask him what the session is for.

**One Input page.** The five reminder pages become viewing pages after
that page is known, and not before. The old + Add boxes are still on
those pages on purpose, so nothing breaks while Input is tried.

**First glance** is four lines: a name, a date or none, a time or none,
and Repeat or none. Date and time start asleep, each half on its own.
The Repeat panel begins with how often, every how many, which weekdays
when it is a week, and stops on. Time zone is not on this page.
Options and holidays stay later.

**It is built and checked on the simulator.** Home's first tile opens
Input. Enter writes to the existing lists, then opens that page:

- Repeat **Day** and a time → My Day, or Pets if **For** is Pets
- Repeat **Week**, a weekday, and a time → My Week
- Repeat **Month** or **Year**, a date, and a time → Look Ahead
  (every 3 or 6 months uses Every how many)
- Repeat **None** → To-Do. A name is enough. A date is optional. A
  time is stored only when there is a date. No "remind me before"
  chips, so a task may sit on the list and stay quiet

Patrick tried all five. A My Week item fired. Look Ahead's Log still
rolls the date forward by the interval. To-Do's Done logs the task
and it goes away. The sheet was `docs/build-sheet-input-page.md`.
Enter to the five lists was added in this same session after that
sheet, which had said not to write lists.

**The phone build waits.** Plan usage is short. One later build will
prove the whole app. Until then, work stays on the simulator. The old
Add boxes stay.

**Next is an automated test load on the simulator**, not more Input
design and not a phone build. Mystery has a long sitting with no
waiting on the clock. Memory's proof waits on firing times, so a
sitting never finishes unless the firings are brought in close. The
load writes one soon item on each of the five lists, a minute or two
apart, so he can watch each banner and tap it. That load is settled
and not built.

**Five fixes went in at #27-new, and Patrick checked every one on the
simulator.** The Scheduled Reminders page had been sitting half an inch low —
`app/reminders.tsx` was the only route never registered in `app/_layout.tsx`, so
it drew the navigator's default header above its own; the reminder count moved
from the foot of that page to a band under its header; the hour stepper's
twelve-hour fault is cured; the Vault's header button says Back inside a
category and Home on the list, with the "← All Categories" row gone; and **a
To-Do task may now be saved with no date and no time.**

- **Blank now means blank on To-Do.** The pop-up had always asked whether he
  meant to save without a reminder, and the page then wrote today's date at noon
  on anyway. `DateTimeControl` gained an optional-date mode built to match its
  optional-time one; the two halves sleep independently, so a task may have a
  date and no time; and `onChange` now says which half was touched, or spinning
  the date would have claimed a time was set. `Task`'s five date fields are
  optional and **absent is the form that means "no date"** — never a zero or a
  null. `taskDueDate` is the one place that decides.
- **Most of that already worked.** `taskDueDate`, `scheduleLabel` and the sort
  all coped with a dateless task already, and the translator gives back no due
  time when there is no date. The work was letting the blank through.
- **A dateless task shows its title and nothing else** (Patrick, #27-new, on
  consistency). My Day and Mollie already show an item with no time that way.
  The "No time set" wording is a hint inside the entry box, never on a tile.
- **The hour fix leaves a tail**: any time set by spinning through noon or
  midnight before #27-new is stored in the wrong half of the day.

**The way of working changed** (Patrick, #27-new). The supervisor-and-worker
split is retired — one session does the work, in the conversation that discussed
it, and **big mechanical builds go to Cursor** with a sheet written here. The
value was always in the sheet rather than in the second session. Build sheets
are still the pattern for a big piece;
`docs/build-sheet-optional-date.md` is the most recent, and it was built the same
day it was written.

**All five reminder screens now go through the one machine** (#27-new).
`gatherWanted` sends My Day, Pets, My Week, Look Ahead and To-Do through the
translator, then `scheduler/remindersfor.ts`, which writes the reminders the
phone should hold. Lead moments are in `scheduler/leadmoments.ts`. To-Do is one
more row in the table, not a special case.

**Reminder Engine 4 Cursor built the repeat group, skip, and
floating-or-named-zone time into that machine** (2026-08-28). The
three-word trigger is gone. My Day and Pets write a daily repeat, My
Week a weekly one, Look Ahead and To-Do stay one-offs. Skip arms the
next event on the same run. Every row floats with the phone; a named
zone is honoured when the bit is later written false. No screens were
touched, and the translator does not read a repeat rule, a skip stamp
or a zone from saved lists. **413 of 413 tests pass.** `npx tsc` was
silent. **This has not been proved on the phone.**

- **Depth is one**, live. My Day and Pets arm one reminder each, not two.
  Opening the app arms the next. That is recovery on opening.
- **A ticked My Week chore stays quiet this week.** The old path was a weekly
  repeat, which could not skip. It is now one moment on the next due day.
- **The eight o'clock To-Do banner is gone from the live run.** A background
  task is an item with no time. Patrick's two items labelled background — one
  on My Day, one on To-Do — both expect no banner, for opposite reasons. Claude
  had said the banner was needed or the item would not reset. That claim is
  not to be listened to again.
- **A To-Do task with no reminders stays silent**, even at the appointment.
- **The old readers are still in the project.** The live run no longer calls
  them, except the Memory Test, which still skips the common shape. The Timer
  sits outside the module.
- **Banner words were kept.** Snooze, postpone and delay still use the source
  names the housing already routes.

**The engine is on the phone** from an earlier load. My Day and To-Do
have each sent a notice. Input is on the simulator only. Retiring
each old reader still waits. Miss-telling still covers My Day and
Pets only. Skip, a named zone, and the extra repeat shapes have no
screen yet. **None of that is the live work.** The live work is the
Input page and the test load, at the top of this file.

**The second of the five translators is built, and it needed no design decision
at all** (#25-new). `scheduler/translators/pets.ts` turns a saved Pets feed into
a shaped item and **nothing in the app calls it**. `scheduler/readers/pets.ts` is
untouched and still does all the work. **286 of 286 tests pass**, up from 267,
and `npx tsc` reports only the standing Expo router error. It was built from
`docs/build-sheet-translator-pets.md` alone.

- **Pets is My Day's twin and the file says so on its face.** Same fields in the
  same order with the same comments, differing only in the banner's words —
  `'Pets Routine'` where My Day says `'Daily Routine'`. The body sentence and the
  button set are identical.
- **The `'petssnooze'` trap was named in the sheet and held.** That word is both
  a registered category name and the `source` name the old reader puts in a
  snoozed feed's key, but the old reader uses `'routineactions'` as the actual
  button set in both places. The translator sets `'routineactions'`, with a
  comment in the file saying why, so the next reader does not reach for the
  apt-looking name.
- **The reordered wanted-block carried Pets' snooze across untouched.** The cure
  made at #24-new was general, so the case that needed a change to the block for
  My Day needed nothing at all here. It is proved by its own test.
- **`translatormyday.test.ts` was brought up to the standard the Pets tests set**
  (Patrick, #25-new). Its two null-time tests checked only `hasDueTimeBit` and
  now also assert that `dueHour` and `dueMinute` are absent. They were written
  before those fields became optional at #24-new and were never brought forward.
  `translators/myday.ts` already behaved correctly and was not touched, so the
  count is unchanged.
- **The build sheet's read list was incomplete and the worker stopped rather
  than guessing** (#25-new). It named two files to read, but the twin pattern
  needs `PetsItem` from `readers/pets.ts` and the last required test needs
  `isStillWanted` from `stillwanted.ts`. Patrick's ruling: the ban on those two
  files was about editing, not reading, and reading them was right. **A sheet's
  read list should name what the pattern it points at actually imports.**
- **Noted by Patrick and deliberately not acted on**: the translator takes its
  item type from the old reader, which ties it to a file meant to be retired.
  That is his to solve at the swap step, not the translator's.

**The first of the five translators is built, and the wanted-block's questions
were reordered to let it work** (#24-new). This is the fourth step of the
#19-new order, begun. `scheduler/translators/myday.ts` turns a saved My Day item
into a shaped item and **nothing in the app calls it**, the same deliberate way
the shape and the blocks were built. `scheduler/readers/myday.ts` is untouched
and still does all the work; it is retired only when this replacement is proved,
which is Patrick's own order from #19-new. **267 of 267 tests pass**, up from
248, and `npx tsc` reports only the standing Expo router error.

- **The translator sets what a My Day item IS and nothing more.** Daily kind
  always; done and push-back both allowed; done does not end the item, because
  a routine comes back tomorrow; no lead times, so it speaks at the moment
  itself; the banner's three words word for word as the old reader writes them.
  It drops nothing — dropping is a judgment and belongs to `stillwanted.ts`.
- **The snooze that stands on its own survived the move, but only after the
  block was changed.** The old reader arms a My Day snooze *before* its own
  guard on the item having a time, because an item whose time was cleared after
  it was snoozed still owes the reminder it promised. `stillwanted.ts` asked no
  due time first and returned straight away, which threw that promise out. The
  worker session found it, left the block alone and reported it, and Patrick
  ruled the order be changed.
- **The questions are now done, then the push-back, then no due time.** The done
  rules are exactly as they were. The push-back gained one new answer for the
  case this is all about: an item with no due time, not done, with a live
  push-back is **wanted, this occurrence dropped, the moment standing** — dropped
  because there is no base occurrence left to arm, standing because the promise
  was already made. No due time is asked last, and answers exactly what it always
  answered when nothing above it has spoken.
- **`dueHour` and `dueMinute` are optional now**, the way `dueWeekday` and
  `dueMoment` already are, on the reasoning settled at #23-new: an absent field
  says plainly what a zero has to be interpreted into, and midnight is a real
  time. The translator leaves them out rather than writing zeros.
- **Three banner fields joined the shape** — `bannerTitleText`, `bannerBodyText`
  and `bannerButtonsCode`, the last a named set of the seven category names
  `app/_layout.tsx` actually registers. The words are the translator's work, the
  way #21-new settled the background banner's count, so the engine has everything
  one reminder needs in one thing. They are optional, and **the placement is
  deliberately reversible**: the output side is not designed yet, and moving them
  later is three fields in five small files.
- **Two tests in `stillwanted.test.ts` were rewritten** to hold the new order
  rather than the old, and the section heading above them corrected. Nothing else
  in that file assumed the old order. The test that holds *done before push-back*
  was already holding a real rule and stands untouched.

**The shape and the two decision blocks are built** (#23-new), which is the
third step of the #19-new order. `scheduler/inputshape.ts`,
`scheduler/stillwanted.ts` and `scheduler/armdepth.ts` stand with their tests
and **nothing in the app calls any of them**, which is deliberate — the piece
was specified to be built before anything depends on it, so the shape can be
argued with while changing it costs nothing. No reader, no screen, no engine
file was touched; the only existing file edited is `scheduler/tests/run-all.ts`,
which gained its two new lines. **248 of 248 tests pass**, up from 230, and
`npx tsc` reports only the standing Expo router error. It was built from
`docs/build-sheet.md` alone and asked Patrick nothing about the design, which is
what that sheet was written to make possible.

- **`inputshape.ts`** is types and comments and no behaviour, every field name
  as settled at #22-new, the four groups kept apart on the page.
- **`stillwanted.ts`** asks its questions in order, with the capability bits
  gating the state throughout. It was built asking no due time first; **the
  order was changed at #24-new** to done, then the push-back, then no due time,
  and the entry above says why.
- **`armdepth.ts`** answers one for every kind, written as a switch on the
  trigger kind so a later change is a change to one line.
- **The five choices made where the sheet was silent** are recorded at the foot
  of this file and are settled.

**The trigger kind is `'daily' | 'weekly' | 'date'`, not `once`** (Patrick,
#23-new). The shape had been settled at #22-new with `once` as its third kind,
on the belief that it matched the output store; it did not — `WantedTrigger` in
`types.ts` has said `date` since long before any of this. His instruction was to
change the shape rather than the engine, and the reason is worth keeping:
`types.ts` is what the phone's own queue speaks in and is already on the phone,
so a translator bridging one word between two documents that mean the same thing
would be a cost paid at every boundary forever in exchange for nothing.
`docs/build-sheet.md` was corrected to match. **The other documents keep their
`once`** on his ruling — that word is history there and a session record is
wrong the moment it is tidied.

**The work has a shape now, and it is Patrick's** (#19-new). He stopped the
session at its first sentence with an epiphany: the heart and the original
purpose of this app is the reminder pages, the scheduler is the engine, and
everything else is packaging and screens. What the sessions before it had been
doing was piecing and patching one screen at a time. What replaces it is one
shape, designed once. **The whole of it lives in `docs/reminder-shape.md`, with
the same thing drawn in `docs/reminder-shape.drawio`, and it is not repeated
here.** In outline: five pieces, two of them stores that act as the contracts;
a loop rather than a line, with the returning arrow landing on the same block
the store feeds; and two decision blocks, *is this still wanted?* and *how far
ahead do we arm?*

**The engine has been read first-hand and it holds up** (#20-new,
`scheduler.ts` and `reconcile.ts`, 718 lines). Three things it settled, all
in the shape's favour. The **output store is the phone's own queue**, not a
file — `applyPlan` writes the key, the firing times, the source, the item and
the label into each banner's own data and `readQueue` reads them straight
back. The **input store is five saved lists plus one session**, all read in one
place, `gatherWanted`, so the five translators plug in exactly there. And the
**depth block already half exists where Patrick said it belongs**: the real
judgment is in `reconcile`, sixty-four less eight less whatever belongs to
something else, furthest away trimmed first. *Is this still wanted?* is the
block with no home — every reader answers it its own way.

**My Week's snooze is gone, and with it the last reminder the module could not
see** (#20-new). Patrick ruled it be fixed first, before the shape work, his
reason being that leaving it is patching. The cure was his own question —
whether a postpone could be treated as a long snooze. It can: both are one
moment in the future for this occurrence only, both leave the chore's home day
and time alone, both are cleared by Done, and the only difference is distance.
So a Delay tapped on a My Week banner writes `postponedTo`, exactly as the
page's Postpone button does.

- **The reader needed no new code.** It already turns that stamp into a
  reminder. `myweeksnooze` stopped existing altogether.
- **Both hand-written notification searches went**, in Skip and in Done. They
  existed only because the module could not see that snooze.
- **The #10-new Skip fault is cured as a side effect.** Skip now clears the
  stamp instead of cancelling a reminder the module would put straight back.
- **The tile shows the time when the stamp lands on today**, and the day name
  when it does not — because a postpone moves the day and a delay moves the
  time, so the line shows whichever part actually changed.
- **One test changed**: the Scheduled Reminders test that used `myweeksnooze`
  as its unreadable-trigger example now uses a My Week postpone.

**The reading changed the size of the job** (#19-new, `types.ts`,
`readers/occurrences.ts` and all six readers, about seven hundred lines).
`WantedReminder` is already the one common output and all six readers produce
it. Every one of the six shapes is on the input side, and four of their five
differences are only different words. The fifth — a To-Do task carrying several
reminders — Patrick collapsed himself: one end date, and the several reminders
are lead times off it.

**The road is a translator at the boundary, not a bulldoze** (#19-new).
Patrick asked directly whether it was worth starting over. It is not: half of
what he wants is built. Leave what the screens save exactly as it is and put
the one shape between them and the scheduler, so the readers become five small
translators plus one engine. No screen changes and nothing on the phone breaks.

**Five screens go through the shape** — My Day, Pets, My Week, Look Ahead and
To-Do. The Memory Test and the Timer are handled their own way (Patrick). They
skip the input shape but **not** the engine: they still produce a
`WantedReminder` and still pass the depth block, or they spend places nothing
is watching.

**The input shape is settled and on paper** (#21-new). It is written into
`docs/reminder-shape.md` under "The input shape, settled at #21-new" and is
not repeated here. In outline: a value that can only be one thing is a code
and an independent fact is a bit, both set by the translator; the trigger
kind is a code; capability bits and state are kept apart; done is one state
plus a bit for how far it reaches; push-back is one stamp that adds rather
than replaces; how far ahead to speak is a list of lead times each carrying
its own form code; an empty lead-time list is answered by the kind; and one
bit says a reminder stands for a group rather than one item. **All five
screens go through the shape and nothing is left outside it.**

**The field names are settled too, and the rule behind them is Patrick's**
(#22-new). The name says what the thing does and carries its own kind in the
name, so a bit reads as a bit and a code reads as a code. The full list is in
`docs/reminder-shape.md` under "The field names, settled at #22-new" and is not
repeated here. He asked what established practice said about holding the bits
and then took the answer: **separate named fields rather than one packed field
of bits**, because this app saves plain text on the phone where packing buys
nothing, and **codes written as named sets of allowed words**, which is what
makes an impossible value impossible to write down. The three files have their
names and their homes as well — `scheduler/inputshape.ts`,
`scheduler/stillwanted.ts` and `scheduler/armdepth.ts`, with tests beside the
others — so nothing about where they live is still open.

**The depth number was reopened by Patrick and it survived** (#22-new). He
raised it himself: two occurrences ahead was decided under the old structure, so
it should not be carried across as settled. The reading is written up in
`docs/reminder-shape.md` under "How far ahead do we arm — the number, reopened
at #22-new" and is not repeated here. In outline: the number is imported by My
Day and Pets alone; the reason recorded for it describes something the code does
not do; the second occurrence buys exactly one day on which the app is never
opened; it is worth more to a daily item than to a weekly one; and it is still
needed, because it exists only to serve single moments and single moments exist
only because a repeating alarm cannot skip the day an item was ticked off.
**Curing My Week is what makes the number expensive** — a chore costs one place
today as a true weekly repeat, and will cost one per occurrence once it moves
across.

**The plain fact under all of it is Patrick's, and he found it himself**
(#22-new). He had been thinking the intelligence could tell these things, and
then saw it: *if the app isn't open, then the intelligence isn't running.* The
decision blocks are code inside the app, so when the app is not running nothing
is deciding anything, and everything the phone will do while he is away must be
in the queue before he leaves. **The blocks do not react — they decide, at the
moment they do run, how much to leave standing for the stretch when nothing will
be running at all.** It had never been said plainly to him, only in pieces.

**Two roads that do not need the app opened were checked and both are weak**
(#22-new, written up in `docs/reminder-shape.md`). A banner button registered
not to open the app does reach the module — `skip` already calls the scheduler
and `ok` throws the chance away by returning immediately — but the housing
handles presses with a React hook and nothing background is registered, so a
press does nothing once the phone has shut the app down, which is the likely
state after a day unused. And the background-task road has none of its pieces
installed. Patrick's answer to that was **"we can repackage"**, and the rebuild
is indeed not the obstacle; the obstacle is that the phone gives fewest
background runs to the app that has gone unused and none at all after a
swipe-away.

**Patrick's ruling: "rock solid is for when you use it"** (#22-new). The top
goal covers the app in use, not a stretch when it is not — an app that is not
being opened is not being used, and what the second occurrence protects is one
day and no more. That places it outside the standard.

**Recovery on opening is the heart of it, and it is his** (#22-new, written up
in `docs/reminder-shape.md`). The phone's queue is the phone's best effort and
may drop things, but the truth was never in the queue — it is in the app's own
saved lists, so on opening the app can look and know where things stand. **His
two parts: it tells you what you missed, and it puts back what you need going
forward.** And **it is not a rule, it is part of the decision machinery**, which
are his words — the block, from
data it already holds, sees an occurrence whose moment has gone by and which was
never marked done, and both the telling and the re-queueing fall out of that, so
nothing anywhere has to remember to recover.

**That settles the depth, and settles it his way: one, for every kind.** Rather
than a spare copy of everything queued constantly against a day that mostly does
not come, one reminder stands per item and the app re-queues when it opens and
sees the gap. Nothing is doubled anywhere and My Week comes across for the same
one place a chore costs today. **And the telling is deliberately small** (Patrick, asked directly at #22-new).
It tells you what you missed, and that is it; then the firings are reissued and
the queue rebuilt. **Two acts on opening and nothing more** — no screen to
design and no flow.

**Both halves are already built, and the record had said otherwise** (#22-new,
read in `health.ts`, `notice.ts` and the daily reset). The re-queueing is every
run rebuilding the whole set from the lists. The telling exists too, tested, and
does very nearly what Patrick had just specified from nothing: misses worked out
at the rollover because that is the last moment the truth can be seen, **the
unopened-day case handled by name** through a `hadGap` flag that makes every
reminding item a miss when the app has been shut for a whole day or more, one
miss per item as he ruled, his own sentence — *"<name> from yesterday is
hanging!"* — and one pop-up carrying faults and misses together on launch and on
returning to the front. **The one real gap is that it covers My Day and Pets
only**: the rollover loop names those two lists and no others, so My Week, Look
Ahead and To-Do record no misses at all. **So the work is extending the telling
to those three, not building it.**

**The order of work is agreed** (#19-new), and its first three steps are done.
Read `scheduler.ts` and `reconcile.ts` — done at #20-new; settle the input
shape on paper with Patrick — done at #21-new, its field names at #22-new;
build the shape and the two decision blocks as plain tested files nothing yet
calls — done at #23-new; write the five translators one at a time — **My Day is
built at #24-new and Pets at #25-new, so My Week is where the next session
starts**, then Look Ahead and To-Do; swap the screens over one at a time, retiring each
old reader as its replacement is proved; then the phone.

**The outside report has been checked, and the answer is mend rather than
rebuild** (#18-new). Patrick asked to verify what could be verified before
deciding, and set the lens himself: *Cursor knew nothing of the "helpful"
features we are considering.* That turned out to be most of it. `_layout.tsx`
and `scheduler.ts` were read entire, every `runScheduler` call site was found,
and the test folder was listed. The joins are careful and reasoned, not loose.
What is left is a short list of specific holes.

**Six things the report flagged are deliberate, and all six still hold**
(#18-new, put to Patrick one at a time and confirmed by him). Done never
cancelling the fired repeat; the To-Do banner carrying only OK; Orders having no
reader — checked rather than taken from the comment, `app/orders.tsx` arms
nothing at all now; two occurrences ahead; the snooze written on the item; and
the loud fault on an unreadable list. Only one was decided this month.

**Patrick's reason for the To-Do banner is now on record**, in
`docs/reminder-rebuild.md` under what is not to be "fixed": an appointment
cannot be snoozed, and a lead-up reminder has nothing to mark Done, because the
appointment has not happened yet. He said he had given that reason more than
once before it was written down.

**The three real holes.** My Week's reader ignores the tick — the header comment
of `scheduler/readers/myweek.ts` and a test named *A chore already ticked still
gets its weekly reminder* both hold the old rule in place, and both were read
this session. Siri marks an item done without telling the module. And a failed
`runDailyReset` does not stop `gatherWanted`, so a stale tick can cancel a day
that was never done.

**One hole is new and was in no record** (#18-new). `applyPendingNote` in
`_layout.tsx` writes `completed: true`, writes history, and sends Patrick to My
Day — and nothing re-plans the phone. My Day's `refreshFromStorage` calls
`runDailyReset` but never `runScheduler`; every call site was checked. On a cold
launch the mount-time run happens, but it races the Siri write rather than
following it. Siri also leaves any `snoozedUntil` stamp in place.

**A failed reset is classed as quiet, and that classification is now wrong**
(#18-new). `faultSpeaks` admits only `permission`, `create`, `list` and
`stopped`, so a `reset` fault never reaches the pop-up and `faultSentence`'s
reset wording is dead text. It was called quiet because no reminder was thought
to be lost by it. A failed reset can cancel a day that was never done, so one
is. **Patrick's call was to leave it** — the dead sentence stays as it is.

**The test suite has no test for the module's top, any screen, or the housing**
(#18-new, confirmed by listing the folder). Ten test files, every one of them a
plain piece on its own.

**My Week's cure is three steps and the first is built** (#18-new). The order
matters and the reason is the durable part: My Week's reminder is a weekly
repeat, so a reader that simply skipped a ticked chore would cancel that repeat,
and it would only return when the tick cleared — which happened only when the
page was opened. A chore ticked once, page never revisited, would have gone
silent for good. **So the reset had to move before the reader could be touched.**

- **Step one, built.** `scheduler/weeklyreset.ts` holds the arithmetic lifted
  off `app/myweek.tsx`, unchanged in what it decides, with `now` handed in so
  tests can say what time it is. `runWeeklyReset` in `scheduler.ts` is its
  sibling — a sibling and not part of `runDailyReset`, because My Week has no
  single boundary to turn on: each chore rolls on its own weekday. It runs in
  the same clean-slate step and writes only when something has come round.
  `app/myweek.tsx` asks for it before it reads, the way the two daily pages ask
  for theirs, and its own two copies of the arithmetic are gone. 230 of 230
  tests pass, up from 210.
- **Steps two and three are superseded** (Patrick, #19-new). They were a
  weekly companion to `nextOccurrences`, then `readMyWeek` rewritten on it to
  honour the tick. Both sit inside the thing the shape redesigns — the tick
  question *is* the first decision block and the weekly arithmetic *is* the
  common due rule — so building them the old way would be one more patch. My
  Week gets cured by being one of the five screens that go through the shape.
  What still goes out with that work, whenever it lands: the header comment of
  `scheduler/readers/myweek.ts` and the test named *A chore already ticked
  still gets its weekly reminder*, both of which assert the opposite of what
  is wanted.

**Nothing has reached the phone.** `readers/myweek.ts` still decides exactly
what it always decided — #20-new changed only its comment, where the
`postponedTo` field now says that a banner's Delay writes it too.

**My Day is cured** (#17-new). It moved to single moments the way Pets did, two
occurrences ahead, keys `myday:a1:20260825`, snooze half untouched. The shared
calendar arithmetic now lives in `scheduler/readers/occurrences.ts` and both
daily readers use it, which closes the #16-new note about `OCCURRENCES_AHEAD`.
**Pets was cured at #16-new.** Before them, #15-new made
a failing run impossible to hide and a missed reminder told. The account of the
reminder work, including everything still unbuilt, lives in
`docs/reminder-rebuild.md` — what was read, what is already right and must not
be undone, eight findings, a fix list in order, Patrick's rulings, and what is
still undecided. It is not repeated here.

**Two occurrences ahead is Patrick's number** (#16-new). A single moment is
spent once it fires, so several stand ready; it counts occurrences rather than
days, so a weekly chore gets a fortnight. At fourteen items across the three
screens that is twenty-eight of the fifty-six places the module has to spend.
What covers a longer stretch away is the missed-firing notice, which tells him
afterwards rather than making the reminder arrive.

**An occurrence is named for the day it falls on**, `pets:p1:20260825`, so it
keeps its name until it fires and the reconcile leaves it alone. Naming by
place in the run was tried first and is wrong — those names slide as days pass,
so every run would take all of them down and put them all back. Pets and My
Day both do this. Whatever My Week does, it should do this too.

Patrick's ruling opens the work and governs it: reminders being rock solid is
the top goal. **He corrected this at #17-new: it is the top goal but not the
only one, and consistency is another high priority.** That correction reversed a
recommendation Claude had made minutes earlier — a change dismissed as tidiness
becomes worth making once consistency is a goal in its own right. His second
ruling is that when something has to give, the old reminder is thrown away and
the new one kept. His third is that the reminders should follow established
practice rather than a private arrangement that happens to work.

**His verdict on the eight sessions before it is on the record at his asking**,
at the top of `docs/reminder-rebuild.md`. He is disappointed that #5-new
through #13-new had the reminders as their sole focus and the read still found
eight faults, one of them the thing he had reported.

**The move to single moments is agreed**, on his condition that a missed firing
is noted when he opens the app. The safety net is built, and the move itself is
done on Pets (#16-new) and My Day (#17-new). My Week has not moved.

**The two faults Patrick reported are one fault, and it is still there on My
Week.** An item ticked off before its time still reminds, because the reader
never looks at the checkmark. The banner that then arrives for an
already-finished item lands on a row correctly showing its checkmark, which is
what he saw first. `app/myday.tsx` was read to be sure of it; the page draws
from the item's own saved state and clears yesterday's before it draws, so no
second mechanism is involved. Pets was cured at #16-new and My Day at #17-new.
My Week still has it, and until #17-new the record said it never did.

**The three screens record "done" three different ways, and one of the three
differences is now closed.** Pets and My Day carry a plain `completed` cleared
by the module's daily reset. My Week carries `completed` plus `doneAt`, and as
of #18-new those clear in the module too — but its reader still reads neither.
The outside report says Look Ahead, To-Do and Memory Test each use a fourth,
fifth and sixth way — a moved date, a deleted row, and a phase. The Look Ahead
roll-forward and To-Do's missing Done were both seen in `_layout.tsx` at
#18-new; the readers behind them are still unopened.

**My Week's own arithmetic was never the arithmetic in `occurrences.ts`**
(#17-new, read directly). `lastOccurrence` looks backwards to the most recent
past occurrence and `nextDateForWeekday` forward to one date only, so neither is
the run of the next few. The #16-new note saying My Week "already holds the
next-occurrence arithmetic" was too generous. `lastOccurrence` has since moved
into `scheduler/weeklyreset.ts` (#18-new); `nextDateForWeekday` stays on the
page, where the postpone buttons use it.

**"The module's own shape is sound" was a claim under question and now has an
answer** (#17-new, answered #18-new). It had been quoted back as evidence before
anything was verified, which is how a borrowed conclusion does its damage. The
verifying was done at #18-new and the shape held up: the joins in `_layout.tsx`
are careful and reasoned. What is still true and was checked at the time: working the
whole set out afresh, matching by a name built from what a reminder is, and
trimming the furthest away under Apple's ceiling is established practice,
confirmed against Apple's and the notification library's own published guidance;
and the repeating alarms are asked for correctly for the version installed here,
read in the package rather than recalled. What the outside reading disputes is
narrower and sharper: that the tick in storage and the banner on the phone are
not one record, and that everything joining them sits outside the tested part.

**A tapped reminder now lands on its own item, on all five pages that have
one** (#13-new). **Patrick has run it on the phone and it works** (#14-new),
which closes the last open piece of that session. The housing hands the item's id to the page it opens, as
`highlight`, and the page draws an outline round that row. The id was already
travelling with every reminder the module makes and was simply being dropped
at the last step. My Day, Pets, My Week and Look Ahead share one shape; To-Do
took a shape of its own. Memory Test gets none — one reminder comes off that
page, so there is nothing to point at (Patrick).

- **The highlight is its own piece of state on every page**, never the reorder
  selection. Borrowing that one would have put the ▲▼ arrows on screen the
  moment a banner was tapped.
- **A tap on the lit row puts it out and does nothing else** (Patrick). On the
  four reorder pages the row-tap handler answers the highlight first and
  returns, so the clearing tap cannot select for reorder; the next tap selects
  in the ordinary way.
- **The outline has a colour name of its own, `rowReminderBorder`** — a light
  teal `#6dc6e3` in the light theme, the same orange as `rowSelectedBorder` in
  the dark. It is deliberately not `rowSelectedBorder` itself: Shopping uses
  that one on its pale filled row and needs its darkness to stand apart from
  it, while this outline sits on the plain page and reads better lighter.
  Patrick asked for the light one to be halved after seeing it on the phone.
  He said nothing about the dark theme's orange, so it was left as it was.
- **Outline only, no filled background** (Patrick's ruling, and the reason is
  the durable part): if the highlight took the reorder selection's background
  as well, the two lit states would differ by a thin line alone, which is the
  hardest difference to catch at a glance. Reorder fills the row; a reminder
  outlines it.
- **Nothing shifts when a row lights up or goes out.** The four reorder pages
  hold the outline's space open on every row in a transparent colour; To-Do's
  card already had a hairline border, so there the extra thickness is taken
  back out in the margins.
- **To-Do's background daily is about a group, not a task.** It carries the
  word `background` rather than any task's id and stands for all of them at
  once, so there is no card to light — the page instead arrives with the
  background list open, which is otherwise shut.
- **To-Do's task card had no tap at all** before this; the Done and Edit
  buttons carried the only ones. It now has a tap that does one thing only,
  put out its own highlight, and nothing at all when no row is lit.

**Scrolling to the row was never wanted** (Patrick, #11-new) — only the
highlight. The lists have no handle to scroll with, so this is the whole of it.

**Alpha, and the scheduler plan is finished — all eight steps are built.**
One module owns every reminder: six readers, the reconcile, the daily
reset, the budget warning, the queue view, and 146 tests. No screen arms
anything of its own any more. My Day and Pets stopped at #7-new; My Week,
Look Ahead and To-Do stopped at #8-new; Memory Test stopped at #11-new.

**The plan itself is gone as a live file** (#12-new). It is kept whole as
an appendix at the foot of `build-history.md`, which is where to look for
why the ceiling is sixty-four less eight, why a reader stays plain enough
for Node to run it, why the always-arm rule exists, why Orders gets no
reader, and why the clean slate works by a day boundary. Patrick's ruling
behind the move: these documents are Claude's and `pending.txt` is his, so
a document Claude has no use for should go.

**`pending.rtf` is what Patrick reads** (#12-new), generated from the txt and
never hand-edited. He had been converting the txt to rich text himself every
time. The txt stays because plain text is what can be edited precisely; the
rtf is his and is never allowed to lag — regenerated word for word at every
refresh and machine-checked against the txt, or the refresh is not done. The
rule sits in this project's `CLAUDE.md`. There is no Word copy.

**Step 8 is the Scheduled Reminders screen** (#12-new), `app/reminders.tsx`,
reached from a row of that name in Settings under the three reminder times.
It lists every reminder the phone is holding, broken under Today, Tomorrow,
This Week and Later, soonest first inside each, with a plain sentence at
the foot saying how full the phone is. A tap opens a pop-up carrying the
item's name, its page, when it fires and whether it repeats, when it was
last due and when it is next due, the exact heading and sentence the banner
will show, and its buttons.

- **The arithmetic is in `scheduler/queueview.ts`**, plain and testable, and
  every sentence the screen says lives there too. The screen only draws.
- **Timer alerts are counted but never listed** (Patrick, #12-new). The
  Timer is for short stretches, a pot left on the stove; it does not need
  looking up.
- **There is no firing history and there cannot be one.** iOS keeps no
  record of a delivered banner once it is dismissed. The last-due line is
  arithmetic from the trigger, not a log.
- **The banner's buttons are asked of the phone** rather than written down
  a second time, so the screen cannot drift from what the housing
  registers.

**Everything named above is on the phone and readable** (#12-new). Patrick
built, loaded and looked; his word was that it all came out very readable.
The screen's own behaviour beyond that has not been put through its paces.

**The "Snoozed till:" line is fixed** (#12-new). It had been given
`delayText`, the colour for text on a solid delay button, which was white
on a white row in the light theme and near-black brown on a dark brown row
in the dark one. It is now `delay` itself, matching My Week's postponed
line and Look Ahead's delayed line. All four read identically. Patrick's
ruling, his reason being consistency, and he has looked at every one of
those screens in both themes. Every other use of `delayText` in the app was
checked and all of them sit correctly on a solid delay button.

**What it still has not had is a day.** The real test is the morning after:
items checked off today must still remind tomorrow, which is exactly what
used to go silent. Most of steps 3 and 4 has never been tried on a device.

**The build waits on purpose** (Patrick, #15-new). He wants the reminder
improvements to go onto the phone together and be lived with over time, rather
than a build per session.

**Both Scheduled Reminders layout fixes are done** (#27-new). The header no
longer sits low — the page had never been registered in `app/_layout.tsx` — and
the reminder count now sits under the header instead of at the foot. Showing the
run record on that screen was held back from #15-new and has still not been
built.

**The tests run on the Mac in about a second**, headless under Node, with
no build and no simulator. 286 of 286 pass — and see the outside reading on what
that does not mean:

    node --experimental-strip-types scheduler/tests/run-all.ts

**One TypeScript error stands and is not a fault.** Expo keeps its own
generated list of the app's screens at `.expo/types/router.d.ts`, gitignored
and untracked, and it predates the Scheduled Reminders page. It rewrites
itself on the next build. Nothing else reports.

## What is open in front of it

**The scope question is settled: mend** (#18-new). The verifying was done and
most of what the outside reading widened turned out to be deliberate. Nothing
about the joins argues for starting over.

**Lead moments, To-Do and the swap are all built** (#27-new).
`scheduler/leadmoments.ts` exists, To-Do is one more row in the table, and the
live run goes through the translator for all five screens. **What is left is the
phone**, then retiring each old reader once its replacement is proved.

**My Week's cure still rides on the swap, not on the translator.** Its reader
still ignores the tick, and the header comment of `scheduler/readers/myweek.ts`
and the test named *A chore already ticked still gets its weekly reminder* both
assert the opposite of what is wanted. Both go out when the screen is swapped
over. The translator already tells the truth about the tick.

**The build sheets are the pattern for this work** — each self-contained,
carrying the answers themselves rather than pointing at other documents, which is
what lets a worker session build without asking a design question.

**`docs/build-sheet.md` has not been brought level with the reorder** (#24-new).
It is the standing description of what the three shape files hold, and it
describes `stillwanted.ts` asking no due time first. The code no longer does.

**One thing to settle before or during the first translator**: nothing yet joins
the two new blocks to `gatherWanted`, which is where the five translators plug
in. The blocks were deliberately built with nothing calling them, so how they
are called is still to be decided.

**The depth is settled at one for every kind** (#22-new), because recovery on
opening carries what the second copy was carrying. The telling that goes with it
is settled too and is deliberately small — say what was missed, then reissue and
rebuild the queue, and nothing more. **It is also already built**, and the one
piece of work left on it is extending it from My Day and Pets to My Week, Look
Ahead and To-Do.

**One claim still unchecked**: that a repeating alarm cannot be told to skip a
single instance. The whole case for arming ahead rests on it, and it is general
knowledge of the phone rather than something read in the installed notification
package.

**A thing to add later if wanted, and never underneath**: a background task, so
the phone can top the queue up on days the app is not opened. None of its pieces
are installed. It can only ever sit on top of arming ahead, because the days it
fails are the days the arming is for.

**Still open from the shape work**: how the arrow from the store to the block
is actually made so a write cannot fail to turn the loop, and whether any
screen is ever brought round to save in the common shape rather than being
translated at the boundary for good.

**Still unread**: `app/lookahead.tsx`, `app/memorytest.tsx`; and the test
files other than My Day's, Pets' and My Week's. The six readers and
`types.ts` were read at #19-new, the two engine files at #20-new, and all
five readers again at #21-new, so the outside report's claims about any of
those no longer stand on the report alone. `app/todo.tsx` has had its save
path read at #21-new and nothing else of it.

**Nothing should reach the phone until the reminder work is whole** (Patrick,
#15-new). Three screens are cured or half-cured and none of it has been built.

**One loose end from #16-new is closed.** `OCCURRENCES_AHEAD` moved out of
`readers/pets.ts` into `readers/occurrences.ts`, where all three screens can see
it (#17-new).

**The rest of the fix list** is in `docs/reminder-rebuild.md` and unstarted:
holding a dropped run instead of discarding it, saying the banner instruction
once in the housing instead of on eight pages, and the dead "+1 Day" button,
which still stands on its own below. Bringing My Week's snooze under the
module came off that list at #20-new, by the snooze becoming a postpone rather
than by being brought across.

**Check My Reminders, from Still To Do** (raised by Patrick, #15-new). Its six
checks and its shape are already settled in that project at SA-19 and SA-20 —
whether it was ever actually built there has not been checked. It answers a
different half than the failure record does: it asks why the phone stayed
quiet, where the record asks whether the app armed anything at all. Agreed to
come after the reminders themselves are solid.

**Nothing of the scheduler plan.** It is finished. What follows belongs to
the app at large.

**"+1 Day" is dead on every My Week banner** (found #11-new). Both the base
weekly and the postpone now carry the shared routine buttons, so
`myweekactions` is registered but never asked for and the `postpone1` branch
in the housing cannot fire. Postponing still works from the page. Nothing is
proposed about it.

**My Week's Skip is cured** (found #10-new, fixed #20-new). It had cancelled
the postpone's reminder off the phone by hand, which could not hold — the
module read the stamp on its next run and put the reminder straight back. Skip
now clears the stamp and asks the module to run. It has never been on a phone.

**The hour stepper is fixed** (#27-new). `adjustHour` now steps on the 24-hour
clock and nothing there knows about AM and PM. Any time set by spinning through
the twelve o'clock boundary **before** that is still stored in the wrong half of
the day and needs re-setting.

**Timer is not working right** (Patrick, #5-new), said in passing and not
examined. It is deliberately outside the module. Two things noticed since and
not chased: its alerts carry only a timer id, no name and no record of when
they fire; and the loud alarm meant to follow five minutes after the base
alert is created only when two conditions are both true, one of them a
`profile` value that has never been looked at. Patrick raised the loud alarm
himself at #12-new as something that was meant to work and does not.

**Kept on purpose:** Orders' `cancelForItem`. The `myweeksnooze` hunt that
stood beside it in the housing's My Week Done handler came out at #20-new,
along with the one in Skip — both existed only because the module could not
see that snooze, and there is no longer a snooze for them to find.

**Every reminder in the app is now written down where the module can see it**
(#20-new). Nothing is armed by hand any more except Orders' own delay, and
Orders has no reader because the page is being taken out.

**Still to come, and untouched:** the two "What's Next" items left in
`pending.txt` — Look Ahead's tile format and its Snooze changed or dropped, and
the Timer tile's Stop (Pause) / Continue (Go) button and log. **The Vault's
"Home"-to-"Back" change was done at #27-new**, along with both Scheduled
Reminders layout fixes.

**The Look Ahead banner-delay bug** sits in `pending.txt` under "Needs a
phone test". It was never separately confirmed, and the trial that would have
confirmed it is the one that failed.

**Memory Test allows one session a day.** The screen shows the day's score and
"Come back tomorrow" once an entry with today's date is logged, so a second
test cannot be started. Deleting the day's entry brings the Start button back,
at the cost of that day's real score.

**The reminder highlight is finished and confirmed** (#13-new, run on the phone
at #14-new). Patrick tapped a banner and it landed on the right item with the
row lit. Nothing is owed on it.

## A fact worth carrying

`elyfont-home/index.html` in THIS project is the SOURCE of the
live elyfont.com home page. If it is ever edited, the live copy
must be re-uploaded to the public `WWhiteWolf/mystery-tracker`
repo — upload replaces; never rename anything to or from
`index.html` there (see `MysteryTracker/docs/DEPLOY.md`).

## Choices made where the build sheet was silent

These five came up while the shape and the two blocks were built at #23-new.
The sheet said nothing about any of them, each was put to Patrick afterwards,
and all five stand as made. They are settled, not open.

**The wanted-block answers in four parts rather than yes or no.**
`isStillWanted` returns whether the item wants reminders at all, whether this
one occurrence is dropped, the pushed-back moment if there is one, and a plain
sentence saying why. A single yes or no cannot carry the difference the sheet
itself draws — a task finished outright and a chore ticked off for today are
both "done", and only one of them has occurrences still standing behind it.

**Done clears the push-back.** When an occurrence is dropped because it is
done, no pushed-back moment comes back with it. The stamp belongs to the
occurrence it was written on, and Done already clears it on the pages, so the
block behaving otherwise would put back a reminder the page had taken away.

**`sourceScreenCode` is a named set of the five screen words** — `myday`,
`pets`, `myweek`, `lookahead`, `todo` — rather than plain text. It is a value
that can only ever be one thing, which by the settled rule makes it a code, and
writing it as a named set is what stops a sixth screen name being written down
by mistake.

**Three fields are optional rather than always present.**
`pushedBackToStamp`, `dueWeekday` and `dueMoment` are absent on the items they
do not apply to, rather than carrying a stand-in value. A weekly item has no
due moment and a daily one has no weekday, and an absent field says that
plainly where a zero would have to be interpreted. **`dueHour` and `dueMinute`
joined them at #24-new** on this same reasoning, once a translator had a real
item with no time to write down.

**`inputshape.ts` has no test file**, because it holds no behaviour — it is
types and comments and nothing else, so there is nothing a test could ask it.
It is therefore not named in `run-all.ts` either. The moment anything in it
does something, it earns its test file.
