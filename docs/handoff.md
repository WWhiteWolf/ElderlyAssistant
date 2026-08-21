# Session hand-off — A Place To Remember (Memory, iPhone)

This file carries the continuity and nothing else: where the work
stands and what is open in front of it. Finished work goes to
`build-history.md`, opened only when something needs tracing.

## Where things stand

**Alpha, and step 1 of the scheduler plan is built but has never run on
a phone.** The whole of `docs/scheduler-plan.md` step 1 went in at
#6-new: one module that owns every reminder, six readers, the
reconcile, a test setup with 66 tests, and the housing calling the
module on launch and on every return to the front.

**Why it exists.** The #4-new notification work failed its phone trial.
#5-new found the fault: My Day and Pets cancel an item's daily repeat
when it is checked off, and nothing ever puts it back, because only the
owning screen re-arms and only while it is open. The module answers the
whole question from the saved lists every time it runs, so a reminder
that goes missing comes back on its own.

**What changed in the app.** Almost nothing. `app/_layout.tsx` gained
one import and one small effect, and `tsconfig.json` gained one line so
Node can run the scheduler's files without a build. No screen was
touched. The screens still arm their own reminders as well, which is
what step 1 is meant to be — the reconcile matches by name, so nothing
can be created twice.

**The tests run on the Mac in about a second**, headless under Node,
with no build and no simulator:

    node --experimental-strip-types scheduler/tests/run-all.ts

Behind it, #3-new is still the last thing proven on the phone: the
round header buttons on all fifteen screens, the optional times in My
Day and Pets Day, and the header re-leveling, all phone-verified
through a full EAS build (2026-07-31). Store prep waits until the
Mystery rehearsal is done; Android eventually (#72).

## What is open in front of it

**First, a build and a week of living with it.** Nothing in the
scheduler has run on a device. Until it has, none of it is proven.

**Then step 2 of the plan:** take the scheduling out of My Day and
Pets. Steps 3 through 8 follow in the plan's own order.

**Orders is coming out** (Patrick, #6-new), as soon as it is
convenient. It deliberately has no reader, and the module leaves its
reminders alone until the page goes — at which point its old reminders
want one sweep.

**The plan's one open item** is the wording of the budget warning and
where it shows, deliberately left until there is a screen to put it on.

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
