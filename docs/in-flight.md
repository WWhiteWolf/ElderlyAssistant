# In flight — the supervising session's desk

**This file is replaced every time, never added to.** The moment it starts
growing it becomes the thing that thins the next supervisor, which is exactly
what happened to the hand-offs. Half a page is the limit.

A supervising session opens this and `docs/reminder-shape.md`, and nothing else.

**The chain is Super-1-new, Super-2-new and so on** — Patrick's name, with the
project carried in it the way his other chains do. One chain per project, not
one across all of them: a supervisor's value is depth in a single design, and a
chain that switches between projects is the thinning this whole arrangement
exists to stop. Each project keeps its own `in-flight.md` in its own docs.

Last written: 2026-08-26, end of #22-new, which was the last session before the
supervising chain had a name of its own.

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

## Out with a worker right now

A worker session built the third step of the #19-new order — `inputshape.ts`,
`stillwanted.ts`, `armdepth.ts` and their tests, nothing calling them. 248 of
248 tests pass. It has been asked to write the note recording the five choices
it made where the build sheet was silent, and then to refresh the docs and hand
Patrick the commit paste.

## What came back, and what was done about it

- **Five choices where the sheet was silent** — the four-part answer from the
  wanted-block, done clearing the push-back, `sourceScreenCode` as a named set,
  optional fields, and no test file for `inputshape.ts`. All five reviewed and
  all five stand.
- **One mistake in the sheet, mine.** It said the output store speaks `once`;
  `types.ts` says `date`. Settled by keeping `date` everywhere, because it was
  already in the working code and `once` was in one new file. Fixed in the code
  and in the sheet.

## Open on purpose, not overlooked

**Nothing joins the two blocks to `gatherWanted` yet**, and the worker was right
to put that under what is open rather than treat it as missed. It is the same
thing `reminder-shape.md` lists as the arrow from the store to the block, and it
is deliberately unanswered until the swap step: the translators are built first,
and the join is made when the first screen is actually swapped over, one screen
at a time. Deciding it now would be deciding it without a single translator to
look at.

## Owed

- That worker's note and docs refresh, then Patrick's commit.

## Next piece

**The My Day translator, and its sheet is written**:
`docs/build-sheet-translator-myday.md`. Hand that to a worker session and
nothing else. My Day was chosen first because it is the smallest and already
runs on single moments, so proving the pattern there makes the other four
repetition rather than design.

Settled while writing it: **the banner's words live in the shape**, as
`bannerTitleText`, `bannerBodyText` and `bannerButtonsCode`, set by the
translator. The words were already the translator's work from #21-new; the only
question was whether they ride inside the shaped item or beside it, and inside
means the engine has everything in one thing. Deliberately reversible, because
the output side has not been designed yet.

**One thing that sheet asks the worker to check and not fix**: My Day's snooze
stands on its own, armed before the guard on the item having a time, so an item
whose time was cleared still owes the reminder it promised. If
`stillwanted.ts` throws that away at its first step, the worker writes it up as
a defect and leaves it — the decision is this session's.

## The one thing not to reopen

**Depth is one, for every kind.** The reasoning is in `reminder-shape.md` under
the depth section and under recovery on opening. A worker that proposes arming
two has not read it.
