# Where the Memory documents live

One line per file, live or history, so a session can tell whether a
document exists and which file is the home. Written at #30-new.

**`docs` is the live desk.** History lives in `docs-ref`. The sixteen
build sheets are in `docs-ref/build-sheets`. If the index has no file
for a thing, ask Patrick. Do not invent a home.

**This file is not a reading order.** The opening read is `handoff.md`
only, per rule 2 of this project's `CLAUDE.md`. Nothing here is opened
just because it is listed.

**Keep it true or delete it.** A stale index is worse than none.

## The desk — in `docs`

- **`handoff.md`** — the opening read. Where the work stands and what is open.
- **`in-flight.md`** — this session's desk. Replaced every time, never added to.
- **`pending.txt`** — Patrick's list, and the source of the Word copy. Brought up to date at every update.
- **`pending.docx`** — the copy Patrick reads. Generated from the txt, never hand-edited.
- **`make-pending-docx.py`** — makes the Word copy. `python3 docs/make-pending-docx.py`
- **`check-docs.py`** — checks the record. Changes nothing. `python3 docs/check-docs.py`
- **`Memory features.docx`** — the inventory of what the app is and does, not the sell. Home of the substance for the store description (#47-new).
- **`rfc-eval.md`** — #52-new evaluation of the app against RFC 5545 and RFC 8984. Live for this sitting.
- **`clock-places.md`** — #52-new. Where the live app still asks the real clock. Written for a different idea than dating items near today.

## Live design — in `docs`

- **`reminder-shape.md`** — the live engine design. Wins where others disagree.
- **`spec-pages.md`** — the live spec for the reminder pages.

## History still in `docs`

- **`automated-test-load.md`** — settled design of the temporary test load. Built, then removed from the app at #45-new.
- **`test-load-sitting.md`** — Patrick's follow-along for that load. History.

## Tracing — in `docs`

- **`handoff-history.md`** — the archive of the handoff. Headings are its index. Never read whole.
- **`reminder-rebuild.md`** — #15-new through #18-new. Not the live design. One live part: "What is already right."
- **`outside-review.md`** — Grok's #17-new reading of the reminder code, marked later true or not.
- **`ElderlyAssistant-notification-findings.md`** — a read-only review of the notification faults, 19 August 2026.
- **`grok-review-2026-09-05.md`** — Grok 4.6 High read-only review of the live app, September 2026.

## Quiet — in `docs`

- **`parked-items.md`** — the deferred backlog. Last touched at #66.
- **`publishing.md`** — pointer to App-Docs, and Memory's publishing picture from #46-new and #47-new. Patrick's EAS steps are at the end.
- **`roadmap.md`** — step-back milestones. Rewritten at #68.

## Retired — in `docs-ref`

- **`pending.rtf`** — old reading copy. Not kept current. Do not edit.
- **`make-pending-rtf.py`** — made that rtf. Retired. Do not run.

## Reference — in `docs-ref`

- **`chalendar.md`** — the RFC note and the calendar page picture, and the ref for `build-sheet-chalendar.md`.

## Build sheets — in `docs-ref/build-sheets`

History, not the road. Record of what was built and why.

- **`build-sheet.md`** — standing description of the three shape files. Not level with the #24-new reorder.
- **`build-sheet-daily.md`** — Daily, and the one list. Built at #33-new.
- **`build-sheet-pages.md`** — Weekly through Options, and + Add. Built at #34-new.
- **`build-sheet-automated-load.md`** — the test-load job sheet. Built at #44-new.
- **`build-sheet-translator-myday.md`** — Super-1-new. Built at #24-new.
- **`build-sheet-translator-pets.md`** — Super-1-new. Built at #25-new.
- **`build-sheet-translator-table.md`** — Super-2-new. The one translator and its table.
- **`build-sheet-translator-myweek.md`** — withdrawn at Super-2-new. Never sent. Evidence only.
- **`build-sheet-lead-moments.md`** — Super-3-new. Lead moments.
- **`build-sheet-optional-date.md`** — Super-4-new / #27-new. A To-Do with no date and no time.
- **`build-sheet-input-page.md`** — #29-new. The one Input page. Plan dropped. Page came out at #35-new.
- **`build-sheet-chalendar.md`** — #48-new. The calendar page. Built at #49-new.
- **`build-sheet-where-helper.md`** — #57-new. The Where? helper from Home and the calendar. Built at #58-new.
- **`build-sheet-calendar-fire-time.md`** — #59-new. 24-hour fire time on the calendar day list. Built at #59-new.
- **`build-sheet-notification-names.md`** — #61-new. Current source and category names through the live notification road. Built at #62-new.
- **`build-sheet-cleanup.md`** — leftover cleanup. Written at #68-new. Built at #69-new.

## Not here any more

- **`reminder-shape.drawio`** — at `Projects/Reminder Engine/docs-ref/reminder-shape.drawio`.
