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

**The Pets translator, and its sheet is written**:
`docs/build-sheet-translator-pets.md`. Hand that to a worker session and nothing
else. Pets is My Day's twin, differing in one word — the banner title is `'Pets
Routine'` — so the sheet is the My Day one with three changes: no field is added
to `inputshape.ts`, since #24-new already put them there; the translator leaves
`dueHour` and `dueMinute` out entirely when a feed has no time, rather than
writing zeros; and the snooze-that-stands-on-its-own is already protected by the
#24-new question order, so the worker only has to prove it rather than find it.

**One trap the sheet names outright.** `petssnooze` means two things in this
app: it is a registered category, so it sits in `BannerButtonsCode`, and it is
also the `source` name the old reader puts in a snoozed feed's key. The old
reader uses `routineactions` as the actual button set in both places, which is
what the translator sets. A worker following the name rather than the code would
get it wrong.

After Pets: My Week, then Look Ahead, then To-Do. Then swapping the screens over
one at a time, retiring each old reader as its replacement is proved. Then the
phone.

## Running elsewhere: the Super-Projects chain

**`App-Docs/master-handoff.md` has grown into a session-by-session history**,
which its own opening forbids — 2,914 lines, about sixty-six thousand tokens,
where its stated job is three status lines and the cross-project loose ends. It
is the same disease `in-flight.md` was invented to stop, in a file that never
got the cure.

Patrick named a chain of its own for it, **Super-Projects**, because the file
belongs to all three projects rather than to this one. Its opener is written and
the work is: cut the file back to what its header says it is, prove every
removed paragraph already exists in that project's own `build-history.md` and
move rather than drop what does not, give the file this file's rule — replaced
each time, never added to, with a stated size limit — and bring the Memory
status line current to #24-new, which it is one session behind on.

**Nothing here waits on it**, and this chain should not do it.

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
