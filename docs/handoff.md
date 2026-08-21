# Session hand-off — A Place To Remember (Memory, iPhone)

This file carries the continuity and nothing else: where the work
stands and what is open in front of it. Finished work goes to
`build-history.md`, opened only when something needs tracing.

## Where things stand

**Alpha, and seven of the plan's eight steps are built.** One module owns
every reminder — six readers, the reconcile, the daily reset, 103 tests —
and no screen arms anything of its own any more. My Day and Pets stopped at #7-new; My Week, Look
Ahead and To-Do stopped at #8-new; Memory Test stopped at #11-new.

**Step 4 is finished.** My Week's postpone and Look Ahead's delay came
under the module at #9-new, and My Day's and Pets' snoozes at #10-new.
All four are written down on the item itself — `postponedTo`,
`delayedUntil` and `snoozedUntil` — so the readers turn them back into
reminders and nothing arms them by hand. Snoozing twice moves the one
reminder rather than leaving two, and My Day's and Pets' rows show
"Snoozed till:" with the time while a snooze is set.

**The third piece of step 4 was a removal, not a build** (#11-new).
To-Do has no snooze anywhere and is not meant to have one: its banner
carries a single OK button, Patrick's own call at #56. His reason is
worth keeping — a To-Do reminder is advance warning that something is
coming, an appointment fifteen minutes out for instance, rather than a
prod to do the task, and other reminders for the same task are still
coming behind it. So the code that could never run came out: the To-Do
paths in the housing's snooze and Done handlers, and `cancelReminders`
in the To-Do screen with both of its calls.

**That corrects something the record carried.** #8-new said a To-Do
banner snooze "already buys nothing" and that it was live on build 57.
It was never live — the snooze could not be made at all, the button
having gone at #56.

**Step 5 came in at #11-new.** The Memory Test screen no longer arms
its five-minute recall banner and no longer cancels anything; its save
asks the module to run, and the module reads the moment the recall
falls due straight from the saved session. The reader and the owned
source had been there since step 1.

**Orders is out of the reminding altogether** (Patrick, #7-new — the
page is dead to him). It got no reader, its scheduling came out at step
3, and its two sources are named to the module as owned so the reconcile
sweeps everything the page ever set. Nothing re-creates them.

**Why it exists.** The #4-new notification work failed its phone trial.
#5-new found the fault: My Day and Pets cancel an item's daily repeat
when it is checked off, and nothing ever puts it back, because only the
owning screen re-arms and only while it is open. The module answers the
whole question from the saved lists every time it runs — on launch and
on every return to the front — so a reminder that goes missing comes
back on its own.

**Three things passed on the phone at the close of #11-new.** Patrick
rebuilt and loaded, and tested what he could in the time he had. The
build number was not recorded.

- **Memory Test's five-minute recall** — step 5's own work. He tapped
  "I Got It", left the app, and the banner arrived. Tapping it brought
  him to the recall screen. He took the first banner before a second
  had a chance to appear, so "only one arrives" is still unconfirmed.
  He had to delete today's logged score to get a second test started,
  the once-a-day block having held.
- **Pets' snooze, end to end** — step 4's first confirmation on a
  device. The reminder came back at the snoozed time, tapping it opened
  the Pets page, and the "Snoozed till:" line was gone afterward.
- **My Week** — the banner arriving from the module, its buttons, a
  postpone made on the page, and Done. His verdict was that it does it
  correctly.

**What it still has not had is a day.** The real test is the morning
after: items checked off today must still remind tomorrow, which is
exactly what used to go silent. Nothing else of steps 3 and 4 has been
tried on a device.

**The "Snoozed till:" line cannot be read.** Patrick's find on the
phone: barely legible on the dark theme, invisible on the light one, on
both My Day and Pets. The cause was traced and is plain — the line's
style uses `t.delayText`, which is the color for text sitting on a
solid delay button. In the light theme that is white, and the row
behind it is white; in the dark theme it is a very dark brown on a dark
brown row. It wants a color meant for text on a row. Not fixed.

**"+1 Day" is dead on every My Week banner.** Found while working out
what to test. Both the base weekly and the postpone now carry the
shared routine buttons, so `myweekactions` is registered but never
asked for, and the `postpone1` branch in the housing cannot fire. It is
the same kind of unreachable code that came out of To-Do earlier in the
session. Postponing still works, but only from the page. Nothing is
proposed about it.

**The tests run on the Mac in about a second**, headless under Node,
with no build and no simulator. 103 of 103 pass:

    node --experimental-strip-types scheduler/tests/run-all.ts

## What is open in front of it

**Patrick wants the whole rest of the plan before the next build**
(#7-new). Told that today's untapped banner will still be sitting in
Notification Center tomorrow because the sweep is step 7, he said he
needs another build anyway and wants it sooner rather than later. Asked
how much of the plan he wants in first, his answer was "all" — one at a
time, each proven before the next starts. At the close of #11-new he
said he would load the phone with what is built and test what he can.

**Step 6 is built** (#11-new). The budget
itself was already running — the reconcile trims to the ceiling, keeps
the soonest and hands back what it left out — so this step only gave it
a voice. `scheduler/warn.ts` holds the wording in one place and the
check that decides whether to speak, and each of the six saves hands it
the module's answer: My Day, Pets, My Week, Look Ahead, To-Do and Memory
Test. It stays silent on the housing's own runs, which is what makes it
speak as an item goes in and at no other time. The words and the
reasoning behind them are recorded in `docs/scheduler-plan.md`, which
now has no open questions left. No test came with it — the check is one
comparison and it raises a pop-up, so it sits outside what Node can run.
One judgment call, Claude's: the Memory Test screen asks the module to
run in two places, and only the save warns, since throwing away a stale
session is not an item going in.

**Step 7 is built** (#11-new), the clean slate in both its halves.
`scheduler/dailyreset.ts` decides whether the day has turned and what a
cleared list looks like, and the module does the reading and writing, so
the checkmarks, the snoozes, the coffee and water counts and the treat
count all clear on launch and on every return to the front whether or
not My Day or Pets is opened. The module also takes down any banner
delivered before today. The past-day branch is gone from the My Day and
Pets Done handler, and My Week's past-cycle guard went with it — a Done
always means now, because a banner still sitting to be tapped is one
from today. Ten new tests came with it, 93 to 103. Two judgment calls
were Claude's and were named: removing My Week's guard, which the plan
did not name but the same reasoning covers; and having both daily
screens still ask the module to roll the day over before they read, so
neither can draw yesterday's checkmarks while waiting for the module's
own run. **The honest limit is recorded in the code:** the sweep can
only happen while the app is running or as it comes to the front, so a
phone left unopened for two days keeps those banners until it is opened.

**Step 8 is the only one left** — the screen that shows the pending
queue, which goes into Settings (Patrick, #5-new; this hand-off had
wrongly carried its home as an open question). Patrick said at the close
of #11-new that he will take it up next session. Until it exists,
nothing on the phone shows what is actually pending, so most phone
testing can only be judged by whether the right banner turns up.

**The hour stepper fix** is small, separate, and not structural. Any
time set by spinning through the twelve o'clock boundary is stored in
the wrong half of the day and needs re-setting afterwards.

**Timer is not working right** (Patrick, #5-new), said in passing and
not examined. It is deliberately outside the new module.

**Still to come, and untouched:** the three "What's Next" items in
`pending.txt` — Look Ahead's tile format and its Snooze changed or
dropped, the Timer tile's Stop (Pause) / Continue (Go) button and log,
and the Vault restructuring's "Home"-to-"Back" button change.

**Kept on purpose:** Orders' `cancelForItem`, and the `myweeksnooze`
hunt left in the housing's My Week Done handler at #9-new. Both match
by item, so they still clear a banner snooze the module cannot see yet.
To-Do's `cancelReminders`, which was on this list, came out at #11-new.

**My Week's Skip does not skip a postponed chore** (found #10-new, not
acted on). Skip cancels the postpone's reminder off the phone by hand,
but #9-new made the postpone something written down on the chore, so
the module reads it on its next run and puts the reminder straight
back. It has never been on a phone, #9-new never having been built. The
fix is small and belongs to a My Week session; a note sits beside the
code in the housing's Skip branch.

**The Look Ahead banner-delay bug** sits in `pending.txt` under "Needs
a phone test". It was never separately confirmed, and the trial that
would have confirmed it is the one that failed.

**Memory Test allows one session a day.** The screen shows the day's
score and "Come back tomorrow" once an entry with today's date is
logged, so a second test cannot be started. Deleting the day's entry
brings the Start button back, at the cost of that day's real score —
which is what Patrick did at #11-new to test twice.

**Wanted, and not written down anywhere else yet:** a reminder tapped
with the app closed should open the app, land on the right page, and
highlight the item that fired, rather than only opening the page.
Patrick raised it at #11-new as a question carried since the original
build. The half usually hard is already done — every reminder the
module creates carries the item's own id, and the housing already reads
that id for its buttons — and both My Day and Pets already draw a
highlighted row for the reorder selection, with a matching border color
in the theme they do not yet use. What is missing is carrying the id
along when the housing opens the page, and the page turning it into
that highlight. The housing's page-opening carries nothing with it
today; the Vault is the one screen that already receives something that
way, so there is a working example. Scrolling to the row is separate
and harder, the lists having no handle to scroll with — but Patrick
said scrolling is not wanted, only the highlight. This entry supersedes
the parked line in `pending.txt` that says the same thing more briefly.

## A fact worth carrying

`elyfont-home/index.html` in THIS project is the SOURCE of the
live elyfont.com home page. If it is ever edited, the live copy
must be re-uploaded to the public `WWhiteWolf/mystery-tracker`
repo — upload replaces; never rename anything to or from
`index.html` there (see `MysteryTracker/docs/DEPLOY.md`).
