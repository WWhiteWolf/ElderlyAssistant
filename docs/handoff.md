# Session hand-off — A Place To Remember (Memory, iPhone)

This file carries the continuity and nothing else: where the work
stands and what is open in front of it. Finished work goes to
`build-history.md`, opened only when something needs tracing.

## Where things stand

**Pets no longer reminds about a feed already seen to** (#16-new). That is the
first screen of fix 2, the fault Patrick reported, and it is cured for Pets
alone — My Day and My Week are untouched and still on the phone's repeating
alarms. Before it, #15-new made a failing run impossible to hide and a missed
reminder told. The account of all of it, including everything still unbuilt,
lives in `docs/reminder-rebuild.md` and is the file to open for this work —
what was read, what is already right and must not be undone, eight findings, a
fix list in order, Patrick's rulings, and what is still undecided. It is not
repeated here.

**Two occurrences ahead is Patrick's number** (#16-new). A single moment is
spent once it fires, so several stand ready; it counts occurrences rather than
days, so a weekly chore gets a fortnight. At fourteen items across the three
screens that is twenty-eight of the fifty-six places the module has to spend.
What covers a longer stretch away is the missed-firing notice, which tells him
afterwards rather than making the reminder arrive.

**An occurrence is named for the day it falls on**, `pets:p1:20260825`, so it
keeps its name until it fires and the reconcile leaves it alone. Naming by
place in the run was tried first and is wrong — those names slide as days pass,
so every run would take all of them down and put them all back. Whatever My Day
and My Week do, they should do this.

Patrick's ruling opens the work and governs it: reminders being rock solid is
the only purpose of this app. His second is that when something has to give,
the old reminder is thrown away and the new one kept. His third is that the
reminders should follow established practice rather than a private arrangement
that happens to work.

**His verdict on the eight sessions before it is on the record at his asking**,
at the top of `docs/reminder-rebuild.md`. He is disappointed that #5-new
through #13-new had the reminders as their sole focus and the read still found
eight faults, one of them the thing he had reported.

**The move to single moments is agreed**, on his condition that a missed firing
is noted when he opens the app. That safety net is built; the move itself is
not.

**The two faults Patrick reported are one fault, and it is still there on two
screens of three.** An item ticked off before its time still reminds, because
the repeating screens arm the phone's own repeating alarm and their readers
never look at the checkmark. The banner that then arrives for an
already-finished item lands on a row correctly showing its checkmark, which is
what he saw first. `app/myday.tsx` was read to be sure of it; the page draws
from the item's own saved state and clears yesterday's before it draws, so no
second mechanism is involved. Pets was cured at #16-new; My Day and My Week
still have it.

**Pets and My Week are not built alike, and nothing has been decided about it**
(#16-new, both pages read entire). Pets carries a plain `completed` and leans on
the module's daily reset. My Week carries `doneAt` and clears its own checkmarks
on the page, in `applyWeeklyReset`, weekly and only when the page is opened — so
the daily clearing named in fix 2 never reaches it. My Week also already holds
the next-occurrence arithmetic, in `lastOccurrence` and `nextDateForWeekday`.
The open question is whether Pets gains a stamp like `doneAt` or My Week's reset
moves into the module. Pets did not need it; My Week may.

**The module's own shape is sound and is not the fault.** Working the whole set
out afresh, matching by a name built from what a reminder is, and trimming the
furthest away under Apple's ceiling is the established practice, confirmed
against Apple's and the notification library's own published guidance. The
repeating alarms are also asked for correctly for the version of the library
installed here, which was read in the package rather than recalled.

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
no build and no simulator. 202 of 202 pass:

    node --experimental-strip-types scheduler/tests/run-all.ts

**One TypeScript error stands and is not a fault.** Expo keeps its own
generated list of the app's screens at `.expo/types/router.d.ts`, gitignored
and untracked, and it predates the Scheduled Reminders page. It rewrites
itself on the next build. Nothing else reports.

## What is open in front of it

**My Day is next, and should be nearly a copy of Pets** (#16-new). It is the
same shape — a list of items, each with a time of day, leaning on the module's
daily reset — so the same two occurrences ahead, the same day-stamped names,
and the same narrow skip of today's occurrence when the item is ticked.
`scheduler/readers/myday.ts` and its tests, with the snooze half left alone.

**My Week goes last and is the odd one.** Its checkmarks clear on the page
rather than in the module, so the asymmetry above has to be settled before it
is built.

**Two loose ends from #16-new, neither acted on.** The comment at the head of
`scheduler/readers/myweek.ts` says My Week "never had the fault" and is "the
shape the two daily screens are being brought round to" — which stops being
true the moment My Week itself moves. And `OCCURRENCES_AHEAD` lives inside
`readers/pets.ts`; it belongs somewhere all three screens can see once they
have all moved.

**All the reading fix 2 was owed is done** (#16-new). `app/mollie.tsx` and
`app/myweek.tsx` were read entire, and so were the types, the reconcile, the
scheduler's top and the three readers.

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
