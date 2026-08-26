# In flight — the supervising session's desk

**This file is replaced every time, never added to.** The moment it starts
growing it becomes the thing that thins the next supervisor, which is exactly
what happened to the hand-offs. Half a page is the limit.

A supervising session opens this and `docs/reminder-shape.md`, and nothing else.

**The chain is Super-1-new, Super-2-new and so on** — one chain per project, not
one across all of them. Each project keeps its own `in-flight.md` in its own
docs.

Last written: 2026-08-26, at Super-1-new, after #25-new closed.

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

**#24-new and #25-new are both closed and committed.** Two of the five
translators are built and proved. Nothing calls any of them and nothing has
reached the phone.

## Where the translator work stands

**286 of 286 tests pass.** `npx tsc` reports only the standing Expo router error
in `app/settings.tsx`, which nothing in this work touches.

- **#24-new built the My Day translator**, and the defect it was sent to look
  for was real. `stillwanted.ts` asked *no due time* first and returned before
  the push-back question, so an item whose time was cleared after it was snoozed
  lost the reminder it had already promised. The questions now run done,
  push-back, no due time. A no-time item with a live push-back answers wanted,
  this occurrence dropped, the moment standing. It stays a rule rather than an
  exception because `canBePushedBackBit` gates the branch.
- **`dueHour` and `dueMinute` were made optional** in the same session, matching
  `dueWeekday` and `dueMoment` and the #23-new reasoning that an absent field
  says plainly what a zero has to be interpreted into.
- **#25-new built the Pets translator**, My Day's twin, differing only in the
  banner title `'Pets Routine'`. The `petssnooze` trap the sheet named is real
  in the file and the worker left a comment in the code about it.
- **The twins were made even.** The Pets tests checked that `dueHour` and
  `dueMinute` are absent, which the My Day tests had not been brought forward to
  do. Those two tests were widened rather than added to, so the count did not
  move.

## The loose threads, named on purpose

- **The three banner fields are optional** because making them required would
  have broken test files a sheet forbade touching. That is a build constraint
  showing through into the shape. Tighten it whenever something else opens
  `inputshape.ts`.
- **Each translator imports its item type from the old reader it replaces**, so
  it is tied to a file meant to be retired. Both workers were told to note it
  and not act. **It is settled at the swap step, not before.**
- **What would turn this into patchwork**: another screen wanting the push-back
  question answered differently, and conditions starting to be added to the
  block. That is the moment to stop and redesign, not to add a third case.

## What the two sheets taught, for the next one

- **A sheet's read list must include everything the build legitimately needs to
  read.** The Pets sheet banned editing several files and the worker rightly
  stopped, because it needed to *read* two of them — the item type and
  `isStillWanted`. Say reading and editing separately.
- **The sheets work.** Both workers built from the sheet alone and asked nothing
  about the design. Every question either raised was about acting or about a gap
  in the sheet, which is what they are for.

## Open on purpose, not overlooked

**Nothing joins the shape or the two blocks to `gatherWanted` yet.** It is the
arrow from the store to the block in `reminder-shape.md`, and it is deliberately
unanswered until the swap step: the translators are built first, and the join is
made when the first screen is actually swapped over, one screen at a time.

## Next piece

**The My Week translator. Its sheet is not written.** Write it from
`docs/build-sheet-translator-pets.md` as the pattern. My Week is the first that
is not a twin: it is weekly rather than daily, its push-back is saved as
`postponedTo` rather than `snoozedUntil`, and its old reader arms one true
weekly repeat rather than single moments — which is the thing curing it changes,
and which `reminder-shape.md` covers under the depth section. Read its reader
before writing the sheet.

After it: Look Ahead, then To-Do. Then swapping the screens over one at a time,
retiring each old reader as its replacement is proved. Then the phone.

## Running elsewhere: the Super-Projects chain

**`App-Docs/master-handoff.md` has grown into a session-by-session history**,
which its own opening forbids — 2,914 lines, about sixty-six thousand tokens,
where its stated job is three status lines and the cross-project loose ends. It
is the same disease this file was invented to stop, in a file that never got the
cure.

Patrick named a chain of its own for it, **Super-Projects**, because the file
belongs to all three projects rather than to this one. Its opener is written and
the work is: cut the file back to what its header says it is, prove every
removed paragraph already exists in that project's own `build-history.md` and
move rather than drop what does not, give the file this file's rule, and bring
the Memory status line current — it is now two sessions behind, ending at
#23-new.

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
