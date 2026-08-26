# In flight — the supervising session's desk

**This file is replaced every time, never added to.** The moment it starts
growing it becomes the thing that thins the next supervisor, which is exactly
what happened to the hand-offs. Half a page is the limit.

A supervising session opens this and `docs/reminder-shape.md`, and nothing else.

**The chain is Super-1-new, Super-2-new and so on** — one chain per project, not
one across all of them. Each project keeps its own `in-flight.md` in its own
docs.

Last written: 2026-08-26, at Super-1-new, after #24-new closed.

## The role

- **This session holds the design and the reasons behind it.** It writes build
  sheets, judges what comes back, and decides the small things a worker cannot.
- **It never edits code**, and it never writes to any file while a worker
  session is open. Corrections go to Patrick as a pasteable line.
- **One session has hands on the files at a time.** Everything else passes
  through Patrick, and that relay is the point — it is how he oversees, not a
  cost to be engineered away.
- **The commit is the handover.** When Patrick says he has committed, this
  session catches up by reading that worker's own entry in `build-history.md`
  and nothing more.

## No worker out right now

**#24-new is closed and committed.** Its docs refresh is done and `pending.rtf`
was regenerated and machine-checked.

## What came back, and what was done about it

**The My Day translator is built and the defect it was sent to look for was
real.** 267 of 267 tests pass. Nothing calls any of it and nothing reached the
phone.

- **The defect, settled here and built as a correction.** `stillwanted.ts` asked
  *no due time* first and returned before the push-back question, so an item
  whose time was cleared after it was snoozed lost the reminder it had already
  promised. The questions now run done, push-back, no due time. A no-time item
  with a live push-back answers wanted, this occurrence dropped, the moment
  standing.
- **It is a rule, not an exception**, because `canBePushedBackBit` gates the
  branch. A screen that cannot be pushed back never enters it.
- **`dueHour` and `dueMinute` were made optional**, matching `dueWeekday` and
  `dueMoment` and the #23-new reasoning that an absent field says plainly what a
  zero has to be interpreted into.
- **Two tests in `stillwanted.test.ts`** were rewritten rather than removed,
  because a test whose job is to hold an ordering must hold the new one. A stale
  section heading there was corrected too.
- **`docs/build-sheet.md` was corrected here**, in the gap after #24-new closed,
  since it describes code that exists now and must agree with it. Patrick
  commits it with this file, separately from the worker's commit.

## The one loose thread, named on purpose

**The three banner fields are optional because making them required would have
broken test files the sheet forbade touching.** That is a build constraint
showing through into the shape. It was left because the output side is not
designed yet and the placement is already marked reversible — but it is the one
thing in this batch that is not elegant, and it should be tightened whenever
something else opens `inputshape.ts`.

**And the thing that would turn this into patchwork**: if another screen later
wants the push-back question answered differently and conditions start being
added to the block. That is the moment to stop and redesign, not to add a third
case.

## Open on purpose, not overlooked

**Nothing joins the shape or the two blocks to `gatherWanted` yet.** It is the
arrow from the store to the block in `reminder-shape.md`, and it is deliberately
unanswered until the swap step: the translators are built first, and the join is
made when the first screen is actually swapped over, one screen at a time.

## Next piece

**The Pets translator, which is My Day's twin. Its sheet is not written yet.**
Write it from `docs/build-sheet-translator-myday.md` as the pattern — that sheet
carried every decision, and a worker ran the whole build from it without asking
a single design question, which is what it was written to do. Then My Week, Look
Ahead and To-Do. Then swapping the screens over one at a time, retiring each old
reader as its replacement is proved. Then the phone.

## Parked, at Patrick's choosing

**Running the worker sessions on a different AI**, Claude in Cursor being the one
he named, because two sessions open here eats his time. The arrangement already
suits it: the handover is a plain sheet and a commit rather than a conversation.
Two things unchecked — whether Cursor picks up a `CLAUDE.md` on its own or wants
its own rules file, and that **rule 10, no git commands at all in his repos,
would have to be said to it explicitly**, since its agent can run a terminal.

## The one thing not to reopen

**Depth is one, for every kind.** The reasoning is in `reminder-shape.md` under
the depth section and under recovery on opening. A worker that proposes arming
two has not read it.
