# What is in this folder

One line per file, and whether it is live or history. Written at #30-new
so a session can find out whether a document about something exists
without searching for it.

**This file is not a reading order.** The reading order is rule 2 of this
project's `CLAUDE.md`, and it wins. Nothing here is opened just because
it is listed.

**Keep it true or delete it.** A stale index is worse than none. When a
file is added, retired or renamed, its line changes at the same refresh.

## Opened every session

- **`handoff.md`** — the opening read, and the only one. Where the work
  stands and what is open in front of it.
- **`in-flight.md`** — half a page, replaced every session, never added
  to. The desk: what is in, what is next, what not to reopen.
- **`pending.txt`** — Patrick's plain-language list, opened at the
  end-of-session refresh.
- **`pending.docx`** — the copy Patrick actually reads. **Generated from
  the txt and never hand-edited.** Restored at #31-new; a Word copy is
  what he wanted originally.
- **`make-pending-docx.py`** — what generates it. It writes the docx,
  reads it back, and compares against the txt line by line, so he cannot
  be handed a stale file. Written by hand rather than with a library, so
  there is nothing to install. `python3 docs/make-pending-docx.py`. **It
  is run when Patrick asks for the Word copy, not on a schedule**
  (#31-new).
- **`check-docs.py`** — reports the three conditions the record has to
  satisfy: the handoff's size, any session missing an entry in the build
  history, and whether the Word copy differs from the txt. It changes
  nothing. `python3 docs/check-docs.py`. Written at #31-new, and the rule
  it serves is `CLAUDE.md` rule 4.
- **`pending.rtf`** and **`make-pending-rtf.py`** — **history.** The rich
  text copy stood in for the Word one from #12-new to #31-new. Neither is
  kept current; the rtf on disk is the last one generated and will not
  match the txt.

## The live design

- **`reminder-shape.md`** — the design of the reminder work, from
  #19-new onward. **This is the live one** and it wins wherever another
  document disagrees. The five pieces, the two decision blocks, the codes
  and bits, the field names, depth, recovery on opening, and the
  translator at the boundary.
- **`build-sheet.md`** — written as a sheet at #22-new, and now the
  standing description of what `inputshape.ts`, `stillwanted.ts` and
  `armdepth.ts` hold. It has not been brought level with the #24-new
  reorder of the wanted-block's questions.

## Opened only when something needs tracing

- **`build-history.md`** — the session-by-session record. Its headings
  carry the session number, the date and a one-line summary, so **the
  list of headings is its own index.** 3,030 lines; never read whole.
- **`reminder-rebuild.md`** — the record of #15-new through #18-new.
  **Not the live design.** Opened when a reminder fault needs tracing to
  what was found and cured. Its one live part is "What is already right,
  and is not to be 'fixed'", which any session may add to.
- **`outside-review.md`** — a reading of the reminder code by Grok 4.6 in
  Cursor at #17-new, done deliberately without this project's
  assumptions. Marked item by item with what was later confirmed and what
  was not.
- **`ElderlyAssistant-notification-findings.md`** — a read-only review of
  the repository at 19 August 2026: the causes of the notification
  faults, with locations. No fixes in it.

## Build sheets — history, not the road

Each was self-contained, carrying its answers rather than pointing
elsewhere, so a worker could build without asking a design question.
They are kept as the record of what was built and why.

- **`build-sheet-translator-myday.md`** — Super-1-new. Built at #24-new.
- **`build-sheet-translator-pets.md`** — Super-1-new. Built at #25-new.
- **`build-sheet-translator-table.md`** — Super-2-new. The one translator
  and its table, which replaced the idea of five per-screen files.
- **`build-sheet-translator-myweek.md`** — **WITHDRAWN at Super-2-new and
  never sent to anyone.** It asked for a fifth per-screen translator,
  which turned out not to be a thing. Kept as the evidence for why.
- **`build-sheet-lead-moments.md`** — Super-3-new. Lead moments, and the
  one line each translator gained.
- **`build-sheet-optional-date.md`** — Super-4-new / #27-new. A To-Do
  task with no date and no time.
- **`build-sheet-input-page.md`** — #29-new. The one Input page.
  **The plan it belongs to was dropped at #30-new**; the page is still in
  the app as a try.

## The quiet files

From before the transition. They belong to no reading order and stay
quiet until needed.

- **`parked-items.md`** — the deferred backlog. Last touched at #66.
- **`publishing.md`** — a pointer page: the publishing documents live in
  `Projects/App-Docs`. Patrick's own EAS build-and-submit steps, in his
  words, are at the end of it under "Build steps".
- **`roadmap.md`** — the step-back milestones for the whole project.
  Rewritten at #68.

## Not here any more

- **`reminder-shape.drawio`** — the drawing of the shape. It is **not in
  this folder**; only draw.io's hidden backup of it is. The drawing lives
  at `Projects/Reminder Engine/docs-ref/reminder-shape.drawio`. Places in
  `handoff.md` that name it as `docs/reminder-shape.drawio` are pointing
  at where it used to be.
