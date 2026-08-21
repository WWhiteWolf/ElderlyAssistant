# Session hand-off — A Place To Remember (Memory, iPhone)

This file carries the continuity and nothing else: where the work
stands and what is open in front of it. Finished work goes to
`build-history.md`, opened only when something needs tracing.

## Where things stand

**Alpha, and five of the plan's eight steps are built. Only steps 1 and
2 have been on a phone, as build 57.** One module owns every reminder —
six readers, the reconcile, 93 tests — and no screen arms anything of
its own any more. My Day and Pets stopped at #7-new; My Week, Look
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

**What it has not had is a day.** Build 57 was installed and opened the
same session and nothing more. The real test is the morning after:
items checked off today must still remind tomorrow, which is exactly
what used to go silent. Steps 3, 4 and 5 have had no phone at all.

**The tests run on the Mac in about a second**, headless under Node,
with no build and no simulator. 93 of 93 pass:

    node --experimental-strip-types scheduler/tests/run-all.ts

## What is open in front of it

**Patrick wants the whole rest of the plan before the next build**
(#7-new). Told that today's untapped banner will still be sitting in
Notification Center tomorrow because the sweep is step 7, he said he
needs another build anyway and wants it sooner rather than later. Asked
how much of the plan he wants in first, his answer was "all" — one at a
time, each proven before the next starts. At the close of #11-new he
said he would load the phone with what is built and test what he can.

**Step 6 — the budget and the near-the-ceiling warning.** The budget
itself is already built and running: the reconcile trims to the
ceiling, keeps the soonest, and hands back what it left out. What is
missing is the warning, and it waits on Patrick's decision — what it
says and where it shows. Where it would fire from was looked at in
#11-new and needs no new plumbing: every screen that takes an entry
funnels through one save that already calls the module and waits for
it, so it is one line in each of six saves. Two things want settling
with it. The module answers with nothing at all when a run is skipped
because another is already going, so a save landing at that moment
would have nothing to warn from. And the plan's line between ordinary
rolling, which never warns, and the real case cannot yet be seen in
the code, which reports only that something did not fit.

**Step 7** moves the daily reset into the module, sweeps stale banners,
and takes the past-day branch out of the Done handler. **Step 8** builds
the screen that shows the pending queue; where it lives is the plan's
other open question. Until that screen exists, nothing on the phone
shows what is actually pending, so most phone testing can only be
judged by whether the right banner turns up.

**The hour stepper fix** is small, separate, and not structural. Any
time set by spinning through the twelve o'clock boundary is stored in
the wrong half of the day and needs re-setting afterwards.

**Timer is not working right** (Patrick, #5-new), said in passing and
not examined. It is deliberately outside the new module.

**Still to come, and untouched:** the three "What's Next" items in
`pending.txt` — Look Ahead's tile format and its Snooze changed or
dropped, the Timer tile's Stop (Pause) / Continue (Go) button and log,
and the Vault restructuring's "Home"-to-"Back" button change.

**Raised and not ruled on:** the comment heading the `done` handler in
`app/_layout.tsx` still says it cancels the fired reminder, which is
untrue of the My Day / Pets branch and has never been true of My
Week's. The plan removes that branch, so this closes itself at step 7.

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
logged, so a second test cannot be started. Worth knowing before
planning a phone test of step 5.

## A fact worth carrying

`elyfont-home/index.html` in THIS project is the SOURCE of the
live elyfont.com home page. If it is ever edited, the live copy
must be re-uploaded to the public `WWhiteWolf/mystery-tracker`
repo — upload replaces; never rename anything to or from
`index.html` there (see `MysteryTracker/docs/DEPLOY.md`).
