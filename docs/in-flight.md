# In flight — the supervising session's desk

**This file is replaced every time, never added to.** The moment it starts
growing it becomes the thing that thins the next supervisor, which is exactly
what happened to the hand-offs. Half a page is the limit.

A supervising session opens this and `docs/reminder-shape.md`, and nothing else.

**The chain is Super-1-new, Super-2-new and so on** — one chain per project, not
one across all of them. Each project keeps its own `in-flight.md` in its own
docs.

Last written: 2026-08-26, at the close of Super-2-new.

## Read this first, Super-3-new

**Super-2-new ended here, tired, having spent the whole session on one question
Patrick asked in passing: why five translators?** No code was written. Six
documents were, and the commit for them was handed to Patrick at the close.

- **Ask him whether that commit went in** before anything else. He prefers being
  asked.
- **Nothing is out with a worker.** The next act is handing
  `build-sheet-translator-table.md` to one, and nothing else with it.
- **Do not reopen the translator question.** It is settled and the evidence is in
  `reminder-shape.md`. Reopening it is how this session went.

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
- **Finish all of a piece before handing it over** (Patrick, Super-1-new).
  Writing a build sheet and bringing this file current are one piece of work,
  not two. Do both, then hand him one commit.

## No worker out right now

**Nothing is out, and nothing should go out until Patrick has committed this
session's docs.** The My Week worker opener was written at the start of
Super-2-new and deliberately **never sent** — see below.

**What was not touched at the close, so nobody assumes it was:**
`docs/handoff.md`, `docs/pending.txt` and `docs/pending.rtf`. This session
changed no code and nothing a person sees on the phone, so it had nothing to add
to Patrick's own list. The one item that may belong there one day is his
short-range "did I do it today" record, and it is described in
`reminder-shape.md` rather than promised anywhere.

## What Super-2-new found, and it is the thing to know

**Patrick asked why we were going with five translators, and the answer did not
survive the question.**

- **`stillwanted.ts` never mentions `sourceScreenCode`.** It branches on the
  capability bits, the state fields and `hasDueTimeBit`, and nothing else.
- **`armdepth.ts` branches on `triggerKindCode` alone.**
- **The two built translators differ by two string literals** —
  `sourceScreenCode` and `bannerTitleText`. Every other difference between
  `translators/myday.ts` and `translators/pets.ts` is comment text, "item"
  reworded to "feed". #24-new and #25-new built the same file twice.

**Nothing in the engine goes by page.** That is not luck — it is what Patrick's
codes and bits were designed to do, and his own words on seeing it: *that is what
I wanted when we designed the fields of codes and bits.*

**How the five arose.** Chosen at #19-new, when the shape did not exist and the
only division available was the readers' own one-function-per-screen. The shape
settled at #21-new and #22-new dissolved that division, and nobody went back.
**It is the same fault as the two-occurrences number** — decided under the old
structure, carried forward as though still settled. Watch for it a third time.

## What was done about it, all in docs, no code touched

- **`reminder-shape.md`** — the translator section keeps its road and loses its
  count. New subsection "The translator is one, not five" carries the evidence
  and the history. **The nine-hundred-lines claim is struck** as unverified: it
  was the stated evidence for the whole road, and #19-new's own note says the
  screens were never opened.
- **`build-sheet-translator-myweek.md`** — **withdrawn**, header at the top, file
  kept. Its field-by-field section is a table row written out as two hundred
  lines of English, which is the clearest evidence there is.
- **`build-sheet-translator-table.md`** — **written, and this is what goes to the
  next worker.** One translator, a `ScreenRules` table, four screens: My Day,
  Pets, My Week, Look Ahead. The two per-screen translator files are deleted.

## Three rulings settled writing that sheet

- **The weekday stays as the app saves it**, Sunday 0. Carried unchanged from the
  withdrawn sheet.
- **The chore's tick goes into the shape** though the old reader ignores it.
  Carried unchanged from the withdrawn sheet.
- **A date item carries `dueMoment` alone**, leaving `dueHour` and `dueMinute`
  off. **This one is new.** `inputshape.ts` says hour and minute are used by all
  three kinds; for a date item that is the same fact stored twice, and two copies
  can disagree. **Patrick has not seen this ruling yet — it wants his eye.**

## The proof the sheet leans on

**The two existing translator tests must pass with only their import line
changed.** They were written against the files being deleted, so if the table
produces the same shaped items they pass untouched. A test that needs altering
means behaviour moved, which is the one thing the build must not do. 286 tests
before, none of them to be lost or edited.

## Next, after this commit

1. Hand `build-sheet-translator-table.md` to a worker. Nothing else with it.
2. Then To-Do's own sheet. **It has one thing that does not fit the table**, and
   it is not its lead times — those are another accessor. It is the eight
   o'clock background banner with `standsForGroupBit`, built from the whole list
   rather than from one saved item: a reduction where everything else is a
   mapping. That is a difference in kind, which the shape already names, not a
   difference in page.
3. Then swapping the screens over one at a time, retiring each old reader as its
   replacement is proved. Then the phone.

## One thing written down this session that is not about translators

**What a To-Do background task is for** — Patrick's own words, settled at
Super-2-new and written into `reminder-shape.md` under section seven. **It is a
long-range reminder that something is NOT done yet**, so the eight o'clock banner
is correct and `standsForGroupBit` keeps its user.

**The trap, and it is a live one.** Background tasks are deliberately absent from
`runDailyReset`, which names `my_routine` and `pets_feeds` only. Adding
`todo_tasks` to that loop would un-finish every background task every morning,
because `resetForNewDay` clears `completed` on everything handed to it. **The
absence is correct. Do not "fix" it.**

**The opposite kind exists too and must not be merged with it** — the
short-range record that something WAS done, kept for recall, one day long, never
leaving its page. The daily-cleared counters `my_coffee`, `my_water` and
`pets_treats` look to be it, though only their storage keys were read.

**Claude had these two backwards inside one conversation** and would have written
the mistake into a build sheet. That is why they are written down.

## The docs themselves, sorted at Super-2-new

**Patrick went looking in `reminder-rebuild.md` for decisions taken since
#18-new and found none of them.** He was right to expect them findable.

- **`reminder-rebuild.md` had no owner.** No reading order named it, so it stood
  still from #16-new while the design moved on. It now carries a header saying it
  is the record of #15-new through #18-new, names `reminder-shape.md` as the live
  design and the winner wherever the two disagree, and flags the two places in it
  that read as current and are not — anything saying a daily item takes two of
  the phone's places, depth having been re-settled at one.
- **`CLAUDE.md` now gives it a line**, so it cannot drift unowned again. **Its
  one live part is "What is already right, and is not to be 'fixed'"**, which any
  session may add to.

**The pattern to watch for, now seen three times.** A decision made under an
older structure, still written down, nobody going back once the ground moved:
the two-occurrences number, the five translators, and this file. **When something
turns out to have been settled before the current design existed, that is not a
decision. It is a leftover.**

## The loose threads, named on purpose

- **The three banner fields are optional** because making them required would
  have broken test files a sheet forbade touching. A build constraint showing
  through into the shape. Tighten it whenever something else opens
  `inputshape.ts`.
- **Each translator imports its item type from the old reader it replaces**, so
  it is tied to a file meant to be retired. **Settled at the swap step, not
  before.**
- **Nothing joins the shape or the two blocks to `gatherWanted` yet.** Deliberate
  — the join is made when the first screen is actually swapped over, one screen
  at a time.
- **What would turn this into patchwork**: conditions starting to be added to
  `stillwanted.ts` for one screen's sake. The moment a `sourceScreenCode` appears
  in that file, stop and redesign.

## Where the tests and the checks stand

**286 of 286 passing** as of #25-new. `npx tsc` reports only the standing Expo
router error in `app/settings.tsx`, which nothing in this work touches.

## Running elsewhere: the Super-Projects chain

**`App-Docs/master-handoff.md` has grown into a session-by-session history**,
which its own opening forbids — about 2,900 lines where its stated job is three
status lines and the cross-project loose ends. Same disease this file was
invented to stop, in a file that never got the cure. Patrick named a chain of its
own for it, **Super-Projects**. **Nothing here waits on it**, and this chain
should not do it.

## Parked, at Patrick's choosing

**Running the worker sessions on a different AI**, Claude in Cursor being the one
he named. Two things unchecked — whether Cursor picks up a `CLAUDE.md` on its own,
and that **rule 10, no git commands at all, would have to be said to it
explicitly.**

## The one thing not to reopen

**Depth is one, for every kind.** The reasoning is in `reminder-shape.md` under
the depth section and under recovery on opening. A worker that proposes arming
two has not read it.
