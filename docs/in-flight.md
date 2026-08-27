# In flight — the supervising session's desk

**This file is replaced every time, never added to.** The moment it starts
growing it becomes the thing that thins the next supervisor. Half a page is the
limit.

A supervising session opens this and `docs/reminder-shape.md`, and nothing else.

**The chain is Super-1-new, Super-2-new and so on** — one chain per project.

Last written: 2026-08-26, at the close of #27-new.

## Read this first, Super-4-new

- **Ask Patrick whether #27-new's commit went in** before anything else. He
  prefers being asked.
- **The next act is the phone**, not more engine. All five reminder screens
  already go through the one machine.
- **Do not reopen the translator, depth, or the eight o'clock banner.** The
  banner is not part of the machine. Claude's claim that it was needed for
  reset is false.

## What #27-new did

Lead moments, To-Do in the table, the join, and the live swap of My Day, Pets,
My Week, Look Ahead and To-Do. **391 of 391 passing.** `tsc` clean apart from
the standing `app/settings.tsx` error. No screen was edited. The old readers
are still in the project; the live run no longer calls them, except the Memory
Test.

**Patrick settled the eight o'clock banner.** Two items labelled background,
one on My Day and one on To-Do, both with no time and no banner, for opposite
reasons. The group banner is gone from the live run.

**The phone has not been proved.** That is the next act.

## The role

- **This session holds the design and the reasons.** It writes build sheets,
  judges what comes back, and decides the small things a worker cannot.
- **It never edits code**, and never writes to any file while a worker session
  is open. Corrections go to Patrick as a pasteable line.
- **One session has hands on the files at a time.** Everything else passes
  through Patrick, and that relay is how he oversees.
- **The commit is the handover.** When Patrick says he has committed, catch up
  by reading that worker's own entry in `build-history.md` and nothing more.
- **This session does the docs refresh for the worker.** A worker writes only
  its own `build-history.md` entry. `handoff.md`, `in-flight.md` and the design
  are this session's to keep current.

## Next, in order

1. Phone proof of the five swapped screens.
2. Then retiring each old reader once its replacement is proved.
3. Miss-telling still covers My Day and Pets only. Extending it is building,
   not deciding.

## The loose threads, named on purpose

- **`BannerButtonsCode` lists `'mydaysnooze'`, `'petssnooze'` and
  `'myweekactions'`, and no reader uses any of the three.** For a session that
  opens `app/_layout.tsx`.
- **Each translator rule set still imports its item type from the old reader.**
  Fine while those files exist. When a reader is deleted, the type moves with
  the deletion.
- **What would turn this into patchwork**: the moment a `sourceScreenCode`
  appears in `stillwanted.ts`, stop and redesign.
- **`docs/reminder-shape.md` still has leftover empty-list wording** in the
  field-names list and the background-banner section. The live mechanism is
  section six, replaced, and the code.

## Where the tests stand

**391 of 391 passing** as of #27-new. `npx tsc` reports only the standing Expo
router error in `app/settings.tsx`.

## Elsewhere, and parked

- **`App-Docs/master-handoff.md` has grown into a session-by-session history.**
  Patrick named a chain of its own for it, **Super-Projects**. Nothing here
  waits on it.
- **#27-new was a Cursor worker**, reading the same `CLAUDE.md` and docs. No
  git commands were run.
