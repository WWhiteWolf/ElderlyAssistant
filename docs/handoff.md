# Session hand-off — A Place To Remember (Memory, iPhone)

This file carries the continuity and nothing else: where the work
stands and what is open in front of it. Finished work goes to
`build-history.md`, opened only when something needs tracing.

## Where things stand

**Alpha, and steps 1, 2, 3 and the first third of step 4 are built.
Only steps 1 and 2 have been on a phone, as build 57.** One module owns
every reminder — six readers, the reconcile, 81 tests — and as of #8-new
no screen arms anything of its own. My Day and Pets stopped at #7-new;
My Week, Look Ahead and To-Do stopped at #8-new, each one's save asking
the module to run instead.

**My Week's postpone and Look Ahead's delay came under the module at
#9-new.** Both were already written down on the item — `postponedTo` on
the chore, `delayedUntil` on the entry — so the readers now turn those
stamps back into reminders and nothing arms them by hand any more. The
one visible change is a banner: a postponed chore's popup now carries
Done, OK, Skip and the three Delays instead of Done and "+1 Day",
because the page and the banner had been arming two different button
sets for the same act and one reader can only send one.

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
what used to go silent. Step 3 and the #9-new work have had no phone at
all.

**The tests run on the Mac in about a second**, headless under Node,
with no build and no simulator. 81 of 81 pass:

    node --experimental-strip-types scheduler/tests/run-all.ts

## What is open in front of it

**Patrick wants the whole rest of the plan before the next build**
(#7-new). Told that today's untapped banner will still be sitting in
Notification Center tomorrow because the sweep is step 7, he said he
needs another build anyway and wants it sooner rather than later. Asked
how much of the plan he wants in first, his answer was "all" — steps 3
through 8, one at a time, each proven before the next starts.

**Step 4 was split into three pieces and one is done.** The four
screens that make these one-offs were not in the same state, so the
piece whose record already existed went first. What is left:

- **My Day and Pets snoozes**, which are written down nowhere at all.
  Both the on-page button and the banner button put a reminder straight
  on the phone and record nothing, so tapping Snooze twice leaves two —
  nothing replaces the first. This is the next piece, and it needs the
  two screens, their two readers and their tests.
- **To-Do's snooze**, the one below.

**A snooze is to be recorded on the item**, the same shape as
`postponedTo` and `delayedUntil` — settled at #9-new, Claude's call on
Patrick's invitation. The reader is already handed that screen's list,
so there is no new plumbing and no second pattern for the same idea; a
snooze dies with its item instead of being orphaned; and the screen can
show it, where a snooze today shows nothing.

**A To-Do banner snooze already buys nothing** (found #8-new, not acted
on). It is created with `source: 'todo'` and no name of its own
(`_layout.tsx` line 230), and To-Do has been an owned source since step
1 — so the module reads it as a leftover from the old way and cancels it
on its next run. That is live on build 57 today. It is cured in the
third piece of step 4.

**Steps 5 through 8 follow in the plan's own order**, and two of them
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

**Kept on purpose, and due to come out with the snoozes:** To-Do's
`cancelReminders`, Orders' `cancelForItem`, and the `myweeksnooze` hunt
left in the housing's My Week Done handler at #9-new. All three match by
item, so they still clear a banner snooze the module cannot see yet.

**The Look Ahead banner-delay bug** sits in `pending.txt` under "Needs
a phone test". It was never separately confirmed, and the trial that
would have confirmed it is the one that failed.

## A fact worth carrying

`elyfont-home/index.html` in THIS project is the SOURCE of the
live elyfont.com home page. If it is ever edited, the live copy
must be re-uploaded to the public `WWhiteWolf/mystery-tracker`
repo — upload replaces; never rename anything to or from
`index.html` there (see `MysteryTracker/docs/DEPLOY.md`).
