# Session hand-off — A Place To Remember (Memory, iPhone)

This file carries the continuity and nothing else: where the work
stands and what is open in front of it. Finished work goes to
`build-history.md`, opened only when something needs tracing.

## Where things stand

**Alpha, and steps 1, 2, 3 and two of step 4's three pieces are built.
Only steps 1 and 2 have been on a phone, as build 57.** One module owns
every reminder — six readers, the reconcile, 93 tests — and as of #8-new
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

**My Day's and Pets' snoozes came under the module at #10-new**, the
second of step 4's three pieces. Both screens gained a `snoozedUntil`
field on the item, in the shape `postponedTo` and `delayedUntil`
already had, and all four Snooze buttons — the two on the pages and the
two on the banners — now write that moment down instead of putting a
reminder straight on the phone. `mydaysnooze` and `petssnooze` joined
the owned list, and both readers gained the `now` argument they needed
to tell whether a snooze is still ahead. Snoozing twice moves the one
reminder rather than leaving two, and a snooze that goes missing comes
back like everything else.

**The one visible change is a line on the row**, reading "Snoozed till:
4:15 PM" under the item's name while a snooze is set — Patrick's own
wording and his own clock format. It appears on both screens.

**Three things beyond that had to move with it.** Skip used to cancel
the snooze off the phone by hand, which no longer holds once the snooze
is written down — the module would read the stamp and put the reminder
straight back — so Skip now rubs out the stamp for those two screens.
The on-page Log button clears it too, not just the banner's Done. And
the banner's Done now asks the module to run, which it never did; it had
relied on the app coming back to the front.

**One judgment call, Claude's:** a snooze stands on its own, so an item
whose time of day is cleared after it was snoozed still gets the snooze.
The alternative was to drop it, which breaks a promise the app has
already made to the person.

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
what used to go silent. Step 3 and both pieces of step 4 have had no
phone at all.

**The tests run on the Mac in about a second**, headless under Node,
with no build and no simulator. 93 of 93 pass:

    node --experimental-strip-types scheduler/tests/run-all.ts

## What is open in front of it

**Patrick wants the whole rest of the plan before the next build**
(#7-new). Told that today's untapped banner will still be sitting in
Notification Center tomorrow because the sweep is step 7, he said he
needs another build anyway and wants it sooner rather than later. Asked
how much of the plan he wants in first, his answer was "all" — steps 3
through 8, one at a time, each proven before the next starts.

**Step 4 was split into three pieces and two are done.** The four
screens that make these one-offs were not in the same state, so they
went in the order their records allowed. What is left is **To-Do's
snooze**, and it is the biggest of the three: the screen is 861 lines
against My Day's 957 and Pets' 855, but its reader is 152 lines where
the two daily ones are under fifty, and its snooze is tangled with the
one below that already buys nothing.

**A snooze is recorded on the item** — settled at #9-new, built at
#10-new for My Day and Pets, and To-Do follows the same shape. The
reader is already handed that screen's list, so there is no new plumbing
and no second pattern for the same idea, and a snooze dies with its item
instead of being orphaned.

**A To-Do banner snooze already buys nothing** (found #8-new, not acted
on). It is created with `source: 'todo'` and no name of its own
(`_layout.tsx`, in the snooze branch of the response handler), and To-Do
has been an owned source since step 1 — so the module reads it as a
leftover from the old way and cancels it on its next run. That is live
on build 57 today. It is cured in the third piece of step 4.

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

**My Week's Skip does not skip a postponed chore** (found #10-new while
working next door, not acted on). Skip cancels the postpone's reminder
off the phone by hand, but #9-new made the postpone a stamp on the
chore, so the module reads it on its next run and puts the reminder
straight back. It has never been on a phone, #9-new never having been
built. The fix is small and belongs to a My Week session; a note sits
beside the code in the housing's Skip branch.

**The Look Ahead banner-delay bug** sits in `pending.txt` under "Needs
a phone test". It was never separately confirmed, and the trial that
would have confirmed it is the one that failed.

## A fact worth carrying

`elyfont-home/index.html` in THIS project is the SOURCE of the
live elyfont.com home page. If it is ever edited, the live copy
must be re-uploaded to the public `WWhiteWolf/mystery-tracker`
repo — upload replaces; never rename anything to or from
`index.html` there (see `MysteryTracker/docs/DEPLOY.md`).
