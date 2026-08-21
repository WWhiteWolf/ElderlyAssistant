# Session hand-off — A Place To Remember (Memory, iPhone)

This file carries the continuity and nothing else: where the work
stands and what is open in front of it. Finished work goes to
`build-history.md`, opened only when something needs tracing.

## Where things stand

**Alpha, and the #4-new notification work failed its phone trial.**
Patrick built it, loaded it, and the reminders still do not work. He
uses this app daily and calls the notifications his biggest gripe; a
second app is being modelled on this one, and his word is that without
reliable reminders there are no apps.

**#5-new read the whole reminder path and found why.** My Day and Pets
cancel an item's daily repeat when it is checked off and re-create it
only for items not yet done, so the repeat is destroyed. Nothing puts
it back, because only the owning screen re-arms and only while it is
open — the housing arms nothing, the Home screen arms nothing, and
there is no background task. A separate bug in the hour stepper of
`components/DateTimeControl.tsx` stores a nine o'clock morning time as
9:00 PM. The detail is in `build-history.md`.

**The answer is written and decided: `docs/scheduler-plan.md`.** One
module owns every reminder, rebuilds the queue from the saved data, and
runs on launch and on every return to the front. Nothing has been built
and no code has been changed.

Behind it, #3-new is still the last thing proven on the phone: the
round header buttons on all fifteen screens, the optional times in My
Day and Pets Day, and the header re-leveling, all phone-verified
through a full EAS build (2026-07-31). Store prep waits until the
Mystery rehearsal is done; Android eventually (#72).

## What is open in front of it

**First, step 1 of the plan.** Build the module with its readers and
its reconcile, add the test setup, and have the housing call it on
launch and on return to the front. No screen changes at that stage —
the app arms in two places, which the reconcile makes safe. Steps 2
through 8 follow in the plan's own order.

**The plan's one open item** is the wording of the budget warning and
where it shows, deliberately left until there is a screen to put it on.

**The hour stepper fix** is small, separate, and not structural. Any
time Patrick set by spinning through the twelve o'clock boundary is
stored in the wrong half of the day and needs re-setting afterwards.

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
