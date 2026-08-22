# Session hand-off — A Place To Remember (Memory, iPhone)

This file carries the continuity and nothing else: where the work
stands and what is open in front of it. Finished work goes to
`build-history.md`, opened only when something needs tracing.

## Where things stand

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

**The tests run on the Mac in about a second**, headless under Node, with
no build and no simulator. 146 of 146 pass:

    node --experimental-strip-types scheduler/tests/run-all.ts

**One TypeScript error stands and is not a fault.** Expo keeps its own
generated list of the app's screens at `.expo/types/router.d.ts`, gitignored
and untracked, and it predates the Scheduled Reminders page. It rewrites
itself on the next build. Nothing else reports.

## What is open in front of it

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

**Wanted, and not written down anywhere else yet:** a reminder tapped with the
app closed should open the app, land on the right page, and highlight the item
that fired, rather than only opening the page. Patrick raised it at #11-new as
a question carried since the original build. The half usually hard is already
done — every reminder the module creates carries the item's own id, and the
housing already reads that id for its buttons — and both My Day and Pets
already draw a highlighted row for the reorder selection, with a matching
border color in the theme they do not yet use. What is missing is carrying the
id along when the housing opens the page, and the page turning it into that
highlight. The housing's page-opening carries nothing with it today; the Vault
is the one screen that already receives something that way, so there is a
working example. Scrolling to the row is separate and harder, the lists having
no handle to scroll with — but Patrick said scrolling is not wanted, only the
highlight. This entry supersedes the parked line in `pending.txt` that says the
same thing more briefly.

## A fact worth carrying

`elyfont-home/index.html` in THIS project is the SOURCE of the
live elyfont.com home page. If it is ever edited, the live copy
must be re-uploaded to the public `WWhiteWolf/mystery-tracker`
repo — upload replaces; never rename anything to or from
`index.html` there (see `MysteryTracker/docs/DEPLOY.md`).
