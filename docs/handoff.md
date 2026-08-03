# Session hand-off — A Place To Remember (Memory, iPhone)

This file carries the continuity and nothing else: where the work
stands and what is open in front of it. Finished work goes to
`build-history.md`, opened only when something needs tracing.

## Where things stand

**Alpha, mostly built, and #3-new is proven.** The round header
buttons on all fifteen screens (54-point circles, labels Home /
+ Add / Back), the optional times in My Day and Pets Day (no
time set = label only, no reminder), and the header re-leveling
were all phone-verified through a full EAS build and committed
by Patrick (2026-07-31). Store prep waits until the Mystery
rehearsal is done; Android eventually (#72).

## What is open in front of it

**Next session, #4-new — Patrick's word at #3-new:** the three
"What's Next" items in `pending.txt` — Look Ahead's tile format
and its Snooze changed or dropped, the Timer tile's Stop (Pause)
/ Continue (Go) button and log, and the Vault restructuring's
"Home"-to-"Back" button change. Each is a code change; scope
them together at the session start.

**Also open:** the Look Ahead banner-delay bug in `pending.txt`
"Still broken" — a small fix (re-read the saved items on every
visit).

## Quiet-file note (this one session only)

`docs/publishing.md` gained a "Build steps" section at its end —
Patrick's EAS build-and-submit steps, in his own words (#3-new).

## A fact worth carrying

`elyfont-home/index.html` in THIS project is the SOURCE of the
live elyfont.com home page. If it is ever edited, the live copy
must be re-uploaded to the public `WWhiteWolf/mystery-tracker`
repo — upload replaces; never rename anything to or from
`index.html` there (see `MysteryTracker/docs/DEPLOY.md`).
