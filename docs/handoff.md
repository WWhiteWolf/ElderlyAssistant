# Session hand-off — A Place To Remember (Memory, iPhone)

This file carries the continuity and nothing else: where the work
stands and what is open in front of it. Finished work goes to
`build-history.md`, opened only when something needs tracing.

## Where things stand

**Alpha, and #4-new's notification work is written but unbuilt.**
The three defects in `docs/ElderlyAssistant-notification-findings.md`
are all fixed: My Day's and Pets' banner Done no longer destroys
the daily repeat and now sweeps up the item's pending snoozes, and
all five routine screens — My Day, Pets, My Week, Look Ahead and
Orders — re-read storage when they regain focus and when the app
returns to the front. Six files changed, TypeScript clean, nothing
run and nothing on the phone.

Behind it, #3-new is still the last thing proven: the round header
buttons on all fifteen screens, the optional times in My Day and
Pets Day, and the header re-leveling, all phone-verified through a
full EAS build and committed by Patrick (2026-07-31). Store prep
waits until the Mystery rehearsal is done; Android eventually (#72).

## What is open in front of it

**First, the build and the trial.** Patrick's own word is that he
will only know the notifications work after using them on the phone
for a while. Nothing else should be decided about them until he has.

**Still to come, and untouched:** the three "What's Next" items in
`pending.txt` — Look Ahead's tile format and its Snooze changed or
dropped, the Timer tile's Stop (Pause) / Continue (Go) button and
log, and the Vault restructuring's "Home"-to-"Back" button change.
Each is a code change; scope them together at the session start.

**Raised and not ruled on:** the comment heading the `done` handler
in `app/_layout.tsx` still says it cancels the fired reminder, which
is no longer true of the My Day / Pets branch and has never been
true of My Week's.

**Recorded, not diagnosed:** the 64-request ceiling, Finding 4 of
the review. Patrick holds about a dozen reminders at a time, so it
is probably not in play.

**The Look Ahead banner-delay bug** has moved from "Still broken" to
"Needs a phone test" in `pending.txt` — its own described fix was
re-reading the saved items on every visit, which is what Look Ahead
received.

## The other thing #4-new produced

A feature draft for a college student's assistant, which would live
on the web first. It and a copy of the chat behind it now sit in a
folder of their own at `Projects/Sudents-Assistant` —
`college-app-draft-v1.md` and `Campus travel.rtf`, the second still
unread. That folder name went in misspelled; Patrick renames it to
`Students-Assistant` next session. The new app has no session of its
own yet.

One fact from the draft worth carrying: an iPhone web app saved to
the Home Screen cannot schedule its own local alarms, so Memory's
notification code will not carry across to it — only the thinking
behind it will.

## Quiet-file note (this one session only)

`docs/publishing.md` gained a "Build steps" section at its end —
Patrick's EAS build-and-submit steps, in his own words (#3-new).

## A fact worth carrying

`elyfont-home/index.html` in THIS project is the SOURCE of the
live elyfont.com home page. If it is ever edited, the live copy
must be re-uploaded to the public `WWhiteWolf/mystery-tracker`
repo — upload replaces; never rename anything to or from
`index.html` there (see `MysteryTracker/docs/DEPLOY.md`).
