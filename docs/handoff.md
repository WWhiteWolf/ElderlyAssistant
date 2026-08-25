# Session hand-off — A Place To Remember (Memory, iPhone)

This file carries the continuity and nothing else: where the work
stands and what is open in front of it. Finished work goes to
`build-history.md`, opened only when something needs tracing.

## Where things stand

**An outside reading of the whole reminder machinery now exists, and it changes
the ground** (#17-new). Grok 4.6, in Cursor, was pointed at `scheduler/` and
`app/` with the documents and Claude's own conclusions deliberately withheld.
The full report, the request it answers, and a section marking every finding
checked or unchecked live in `docs/outside-review.md`. **The unchecked part is
the larger part, and a session must not quote an unchecked claim as
established.** Nothing in it has been acted on.

**My Week has the fault, and this project's own record says it does not**
(#17-new, verified in the code). `readMyWeek` never looks at `completed`, so a
ticked chore still gets its weekly reminder. The header comment of
`scheduler/readers/myweek.ts` calls My Week "the one screen that never had the
fault", and a test named *A chore already ticked still gets its weekly reminder*
holds it in place. That reverses what #16-new recorded. The comment and the test
were both written in good faith and both describe an older rule.

**Two more verified in the code** (#17-new). A failed `runDailyReset` records
its fault and `runScheduler` carries on to `gatherWanted` regardless, so a stale
`completed: true` can reach a reader and cancel a day that was never done. And
`runScheduler` returns null when already running, so a save landing mid-run
never reaches the phone.

**Whether this wants mending or rebuilding is open.** Patrick offered to start
over and was not talked out of it — he was told it did not need one, pushed
back, and was right to. Nothing is decided.

**My Day is cured** (#17-new). It moved to single moments the way Pets did, two
occurrences ahead, keys `myday:a1:20260825`, snooze half untouched. The shared
calendar arithmetic now lives in `scheduler/readers/occurrences.ts` and both
daily readers use it, which closes the #16-new note about `OCCURRENCES_AHEAD`.
210 of 210 tests pass. **Pets was cured at #16-new.** Before them, #15-new made
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

**The three screens record "done" three different ways, and nothing has been
decided about it.** Pets and My Day carry a plain `completed` cleared by the
module's daily reset. My Week carries `completed` plus `doneAt`, clears on the
page in `applyWeeklyReset`, and its reader reads neither. The outside report
says Look Ahead, To-Do and Memory Test each use a fourth, fifth and sixth way —
a moved date, a deleted row, and a phase — which is unverified.

**My Week's own arithmetic is not the arithmetic that was lifted out** (#17-new,
read directly). `lastOccurrence` looks backwards to the most recent past
occurrence and `nextDateForWeekday` forward to one date only, so neither is the
run of the next few that `occurrences.ts` provides. The #16-new note saying My
Week "already holds the next-occurrence arithmetic" was too generous.

**"The module's own shape is sound" is a claim under question, not a fact**
(#17-new). It was written before the outside reading and it was quoted back as
evidence in this session by Claude, which is exactly how a borrowed conclusion
does its damage. What is still true and was checked at the time: working the
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
no build and no simulator. 210 of 210 pass — and see the outside reading on what
that does not mean:

    node --experimental-strip-types scheduler/tests/run-all.ts

**One TypeScript error stands and is not a fault.** Expo keeps its own
generated list of the app's screens at `.expo/types/router.d.ts`, gitignored
and untracked, and it predates the Scheduled Reminders page. It rewrites
itself on the next build. Nothing else reports.

## What is open in front of it

**The scope question comes before any build.** The outside reading widened the
problem from three screens to six and from the readers to the joins around
them. Deciding whether this is mended or rebuilt is Patrick's, and he has said
he is willing to spend what it takes either way. Nothing should be built until
that is settled.

**Verifying the outside report is the obvious next read**, and it has not been
done. Unopened: `app/_layout.tsx` entire, including the Siri path and the
banner Done branches; `readers/lookahead.ts`, `readers/todo.ts` and
`readers/memorytest.ts`; `reconcile.ts`, and `gatherWanted`, `applyPlan` and
`sweepStaleBanners` in `scheduler.ts`; the pages for those three screens; and
every test file but My Day's and Pets'.

**My Week, whenever it is built, is no longer a copy of anything.** Its
checkmarks clear on the page in `applyWeeklyReset`, weekly and only when the
page is opened, and its reader ignores the tick entirely. Its header comment now
says the opposite of the truth and must be corrected whenever the file is next
opened.

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
