# Session hand-off — A Place To Remember (Memory, iPhone)

This file carries the continuity and nothing else: where the work
stands and what is open in front of it. Finished work goes to
`build-history.md`, opened only when something needs tracing.

## Where things stand

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
- **Step two, to do.** `occurrences.ts` counts only in days — `nextOccurrences`
  steps a day at a time and has no weekday in it, so it cannot serve a weekly
  chore. Its own comment about a weekly thing getting a fortnight describes
  Patrick's rule, not this function. A weekly companion is wanted beside it.
- **Step three, to do.** Rewrite `readMyWeek` on that companion and make it
  honour the tick, and replace the header comment and the test that assert the
  opposite.

**Nothing reached the phone**, and the reader has not been touched.

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

**Two layout fixes are waiting for the Scheduled Reminders screen** (Patrick,
#15-new), logged in `pending.txt`: the header sits too low, and the total
number of reminders should be noticeable directly under it. Showing the run
record on that screen was held back from #15-new so all three are done in one
visit.

**The tests run on the Mac in about a second**, headless under Node, with
no build and no simulator. 230 of 230 pass — and see the outside reading on what
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

**My Week steps two and three are the work in front of us**, in that order —
the weekly companion to `nextOccurrences`, then `readMyWeek` rewritten on it and
made to honour the tick. The header comment and the test that assert the
opposite go out with step three.

**Still unread, and the report's claims about them still stand on the report
alone**: `readers/lookahead.ts`, `readers/todo.ts`, `readers/memorytest.ts`;
`reconcile.ts`; `app/lookahead.tsx`, `app/todo.tsx`, `app/memorytest.tsx`; and
the test files other than My Day's, Pets' and My Week's.

**Nothing should reach the phone until the reminder work is whole** (Patrick,
#15-new). Three screens are cured or half-cured and none of it has been built.

**One loose end from #16-new is closed.** `OCCURRENCES_AHEAD` moved out of
`readers/pets.ts` into `readers/occurrences.ts`, where all three screens can see
it (#17-new).

**The rest of the fix list** is in `docs/reminder-rebuild.md` and unstarted:
holding a dropped run instead of discarding it, saying the banner instruction
once in the housing instead of on eight pages, bringing My Week's snooze under
the module, and the dead "+1 Day" button. The last two also stand on their own
below.

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

**My Week's Skip does not skip a postponed chore** (found #10-new, not acted
on). Skip cancels the postpone's reminder off the phone by hand, but #9-new
made the postpone something written down on the chore, so the module reads it
on its next run and puts the reminder straight back. It has never been on a
phone. The fix is small and belongs to a My Week session; a note sits beside
the code in the housing's Skip branch.

**The hour stepper fix** is small, separate, and not structural. Any time set
by spinning through the twelve o'clock boundary is stored in the wrong half of
the day and needs re-setting afterwards.

**Timer is not working right** (Patrick, #5-new), said in passing and not
examined. It is deliberately outside the module. Two things noticed since and
not chased: its alerts carry only a timer id, no name and no record of when
they fire; and the loud alarm meant to follow five minutes after the base
alert is created only when two conditions are both true, one of them a
`profile` value that has never been looked at. Patrick raised the loud alarm
himself at #12-new as something that was meant to work and does not.

**Kept on purpose:** Orders' `cancelForItem`, and the `myweeksnooze` hunt left
in the housing's My Week Done handler at #9-new. Both match by item, so they
still clear a banner snooze the module cannot see yet.

**My Week's banner snooze is still armed by hand**, in the housing at
`_layout.tsx` line 286. It carries the item's name, its id and its source but
no key and no record of when it fires, so it shows on the Scheduled Reminders
screen with its name and page and no time. It is the one source the module
does not own.

**Still to come, and untouched:** the three "What's Next" items in
`pending.txt` — Look Ahead's tile format and its Snooze changed or dropped,
the Timer tile's Stop (Pause) / Continue (Go) button and log, and the Vault
restructuring's "Home"-to-"Back" button change.

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
