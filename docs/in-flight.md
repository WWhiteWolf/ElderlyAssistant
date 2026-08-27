# In flight — the supervising session's desk

**This file is replaced every time, never added to.** The moment it starts
growing it becomes the thing that thins the next supervisor. Half a page is the
limit.

A supervising session opens this and `docs/reminder-shape.md`, and nothing else.

**The chain is Super-1-new, Super-2-new and so on** — one chain per project.

Last written: 2026-08-26, at the close of Super-3-new.

## Read this first, Super-4-new

- **Ask Patrick whether Super-3-new's commit went in** before anything else. He
  prefers being asked. #26-new went in; he confirmed it.
- **Nothing is out with a worker.** The next act is handing
  `build-sheet-lead-moments.md` to one, and nothing else with it.
- **Do not reopen the translator question, and do not reopen depth.** Both are
  settled with their evidence in `reminder-shape.md`.

## What Super-3-new did

**#26-new came back and is sound.** 319 of 319 passing, `tsc` clean apart from
the standing `app/settings.tsx` error. `translate.ts` was read in full. Its one
undocumented choice — spreading each due field in only when it is not undefined —
is right, and its banner headings and button sets were checked against all four
old readers and match word for word.

**Then Patrick asked why To-Do needs anything separate, and he was right.** Two
of the three things being called special cases were not: its lead times are one
more accessor, and its background banner was folded into the shape at
Super-2-new by `standsForGroupBit`. What is actually left is that the group
banner is made from the whole list rather than from one task, and that could
fold in too as one more entry in the rules.

**The real finding: a piece of the machine is missing.** Nothing turns a lead
time into a moment. To-Do is the first screen that cannot work without it, so it
is built first, on its own sheet.

**And the empty-list decision was replaced.** See `reminder-shape.md`, section
six and the replacement under it. Every screen now states its own lead times, so
an empty list means nothing to say, everywhere, with no branch on the kind.

## Two things Patrick corrected about how this session talked

- **"Rule" was doing two opposite jobs.** He built this as machinery precisely so
  nothing has to be remembered, and then heard "as a rule rather than as an
  exception" all session. Say the machine handles it. Keep the word out.
- **Shorthand loses him.** Say what a thing is in plain words before saying
  anything about it. When he says he does not understand, the fault is the
  wording, not his memory.

## The role

- **This session holds the design and the reasons.** It writes build sheets,
  judges what comes back, and decides the small things a worker cannot.
- **It never edits code**, and never writes to any file while a worker session
  is open. Corrections go to Patrick as a pasteable line.
- **One session has hands on the files at a time.** Everything else passes
  through Patrick, and that relay is how he oversees.
- **The commit is the handover.** When Patrick says he has committed, catch up
  by reading that worker's own entry in `build-history.md` and nothing more.
- **This session does the docs refresh for the worker** (Patrick, Super-3-new).
  A worker writes only its own `build-history.md` entry. `handoff.md`,
  `in-flight.md` and the design are this session's to keep current, and they are
  brought current after that worker's session is closed, never while it is open.
- **Finish all of a piece before handing it over.** A build sheet and this file
  are one piece of work. Do both, hand him one commit.

## Next, in order

1. Hand `build-sheet-lead-moments.md` to a worker. Nothing else with it.
2. Then To-Do's sheet, written against a lead-time piece that already exists.
   Its one open design question is whether the eight o'clock background banner
   folds into the table as an entry handed the whole list, or stays apart.
3. Then swapping the screens over one at a time, retiring each old reader as its
   replacement is proved. Then the phone.

## The loose threads, named on purpose

- **`BannerButtonsCode` lists `'mydaysnooze'`, `'petssnooze'` and
  `'myweekactions'`, and no reader uses any of the three.** The shape's comment
  claims they are exactly what the housing registers. For a session that opens
  `app/_layout.tsx`.
- **The three banner fields are optional** only because making them required
  would have broken test files a sheet forbade touching. Tighten it whenever
  something else opens `inputshape.ts`.
- **Each translator rule set imports its item type from the old reader it
  replaces.** Settled at the swap step, not before.
- **Nothing joins the shape or the blocks to `gatherWanted` yet.** Deliberate.
- **What would turn this into patchwork**: the moment a `sourceScreenCode`
  appears in `stillwanted.ts`, stop and redesign.
- **Look Ahead treats a missing hour as midnight and To-Do as noon**, both
  carried across from the old readers unchanged. Changing either is a behaviour
  change and belongs to the swap step.

## The pattern to watch for, seen four times

**A decision made under an older structure, still written down, nobody going
back once the ground moved**: the two-occurrences number, the five translators,
`reminder-rebuild.md` standing unowned, and now the empty-list rule. **When
something turns out to have been settled before the current design existed, that
is not a decision. It is a leftover.**

## Where the tests stand

**319 of 319 passing** as of #26-new. `npx tsc` reports only the standing Expo
router error in `app/settings.tsx`.

## Elsewhere, and parked

- **`App-Docs/master-handoff.md` has grown into a session-by-session history**,
  about 2,900 lines where its own opening allows three status lines. Patrick
  named a chain of its own for it, **Super-Projects**. Nothing here waits on it.
- **Running worker sessions on a different AI**, Claude in Cursor. Two things
  unchecked: whether Cursor picks up a `CLAUDE.md` on its own, and that **rule
  10, no git commands at all, would have to be said to it explicitly.**
