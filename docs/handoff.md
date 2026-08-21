# Session hand-off — A Place To Remember (Memory, iPhone)

This file carries the continuity and nothing else: where the work
stands and what is open in front of it. Finished work goes to
`build-history.md`, opened only when something needs tracing.

## Where things stand

**Alpha, and steps 1 and 2 of the scheduler plan are built and on the
phone as build 57.** One module owns every reminder — six readers, the
reconcile, 66 tests — and as of #7-new My Day and Pets no longer
schedule anything themselves. The module is the only thing arming those
two screens now.

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
what used to go silent.

**The tests run on the Mac in about a second**, headless under Node,
with no build and no simulator:

    node --experimental-strip-types scheduler/tests/run-all.ts

## What is open in front of it

**Patrick wants the whole rest of the plan before the next build**
(#7-new). Told that today's untapped banner will still be sitting in
Notification Center tomorrow because the sweep is step 7, he said he
needs another build anyway and wants it sooner rather than later. Asked
how much of the plan he wants in first, his answer was "all" — steps 3
through 8, one at a time, each proven before the next starts.

**Step 3's shape is agreed and not started.** My Week, Look Ahead and
To-Do stop setting their own reminders and the module takes them over.
Orders stops with them and its old reminders are swept off the phone
for good — **Orders is dead to him** (Patrick, #7-new, his own words),
so it gets no reader and nothing of its reminding is preserved.

**Steps 4 through 8 follow in the plan's own order**, and two of them
carry questions the plan leaves open: the budget warning's wording and
where it shows, and where the pending-queue screen lives.

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

**The Look Ahead banner-delay bug** sits in `pending.txt` under "Needs
a phone test". It was never separately confirmed, and the trial that
would have confirmed it is the one that failed.

## A fact worth carrying

`elyfont-home/index.html` in THIS project is the SOURCE of the
live elyfont.com home page. If it is ever edited, the live copy
must be re-uploaded to the public `WWhiteWolf/mystery-tracker`
repo — upload replaces; never rename anything to or from
`index.html` there (see `MysteryTracker/docs/DEPLOY.md`).
