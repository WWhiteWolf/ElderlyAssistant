# In flight — the supervising session's desk

**This file is replaced every time, never added to.** The moment it starts
growing it becomes the thing that thins the next supervisor, which is exactly
what happened to the hand-offs. Half a page is the limit, and Super-2-new's
copy ran to two hundred lines in breach of it — that is why this one is short.

A supervising session opens this and `docs/reminder-shape.md`, and nothing else.

**The chain is Super-1-new, Super-2-new and so on** — one chain per project.

Last written: 2026-08-26, at the close of Super-3-new.

## Read this first, Super-4-new

- **Ask Patrick whether Super-3-new's commit went in** before anything else. He
  prefers being asked. Super-2-new's went in; he confirmed it.
- **Nothing is out with a worker.** The next act is handing
  `build-sheet-translator-table.md` to one, and nothing else with it.
- **Do not reopen the translator question, and do not reopen depth.** Both are
  settled with their evidence in `reminder-shape.md`. Reopening the first is how
  Super-2-new spent itself.

## What Super-3-new did, and it was small

**Ruling three was the only open thing and it now stands, checked first-hand.**
A date item sets `dueMoment` and leaves `dueHour` and `dueMinute` off.

- **Patrick agreed with it, then asked that it be read before being given.** The
  reading confirmed it and turned up one thing the record had not said:
  **nothing anywhere reads any of the four due fields.** Only the two
  translators write hour and minute. So the ruling costs nothing today.
- **The sheet gained a second comment fix.** Its "one comment to fix" section
  became two: the `dueHour`/`dueMinute` doc comment still says *used by all
  three kinds*, which ruling three makes false. The file list at the top moved
  from one stale comment to two.

**`docs/handoff.md`, `docs/pending.txt` and `docs/pending.rtf` were not
touched.** No code changed and nothing a person sees on the phone changed.

## The role

- **This session holds the design and the reasons.** It writes build sheets,
  judges what comes back, and decides the small things a worker cannot.
- **It never edits code**, and never writes to any file while a worker session
  is open. Corrections go to Patrick as a pasteable line.
- **One session has hands on the files at a time.** Everything else passes
  through Patrick, and that relay is how he oversees — not a cost to engineer
  away.
- **The commit is the handover.** When Patrick says he has committed, catch up
  by reading that worker's own entry in `build-history.md` and nothing more.
- **Finish all of a piece before handing it over** (Patrick, Super-1-new). A
  build sheet and this file are one piece of work. Do both, hand him one commit.

## Next, in order

1. Hand `build-sheet-translator-table.md` to a worker. Nothing else with it.
2. Then To-Do's own sheet. **The one thing that does not fit the table** is its
   eight o'clock background banner with `standsForGroupBit`, built from the whole
   list rather than one item — a reduction where everything else is a mapping.
   Its lead times are not a special case; they are another accessor.
3. Then swapping the screens over one at a time, retiring each old reader as its
   replacement is proved. Then the phone.

## The pattern to watch for, seen three times

**A decision made under an older structure, still written down, nobody going
back once the ground moved**: the two-occurrences number, the five translators,
and `reminder-rebuild.md` standing unowned. **When something turns out to have
been settled before the current design existed, that is not a decision. It is a
leftover.**

## The loose threads, named on purpose

- **The three banner fields are optional** only because making them required
  would have broken test files a sheet forbade touching. Tighten it whenever
  something else opens `inputshape.ts`.
- **Each translator imports its item type from the old reader it replaces.**
  Settled at the swap step, not before.
- **Nothing joins the shape or the two blocks to `gatherWanted` yet.**
  Deliberate — the join is made one screen at a time, at the swap.
- **What would turn this into patchwork**: the moment a `sourceScreenCode`
  appears in `stillwanted.ts`, stop and redesign.

## Where the tests stand

**286 of 286 passing** as of #25-new. `npx tsc` reports only the standing Expo
router error in `app/settings.tsx`, which nothing here touches.

## Elsewhere, and parked

- **`App-Docs/master-handoff.md` has grown into a session-by-session history**,
  about 2,900 lines where its own opening allows three status lines. Patrick
  named a chain of its own for it, **Super-Projects**. Nothing here waits on it.
- **Running worker sessions on a different AI**, Claude in Cursor. Two things
  unchecked: whether Cursor picks up a `CLAUDE.md` on its own, and that **rule
  10, no git commands at all, would have to be said to it explicitly.**
