#!/usr/bin/env python3
"""Report the three conditions the record has to satisfy.

This script checks; it changes nothing. It exists because every previous
attempt to keep these documents true relied on somebody remembering, and
that is the part that keeps failing (#31-new).

It states conditions rather than ceremonies. There is nothing here that
has to be done on a schedule — each condition is either true or it is
not, and the answer is one command:

    python3 docs/check-docs.py

The three conditions:

1. `handoff.md` is under the size at which it stops being read whole.
   Past that it carries finished work, and finished work belongs in
   `build-history.md`.

2. Every session has an entry in `build-history.md`. This is the fault
   that hid five whole sessions until #31-new — nobody could see the gap,
   because seeing it meant reading a 2,900-line file.

3. `pending.docx` says what `pending.txt` says. The Word copy is
   generated only when Patrick asks for it (his ruling, #31-new:
   regenerating a file whose source has not moved is useless work). This
   condition is here so that a stale copy is visible rather than silent —
   the earlier Word copy went missing unnoticed precisely because nothing
   was watching it.

A failing condition is not an instruction to act. It is something to put
in front of Patrick, who decides.
"""

import importlib.util
import re
import sys
from pathlib import Path

DOCS = Path(__file__).resolve().parent

# Past this, the handoff stops being a file that is read whole and starts
# being one that is skimmed. The number is deliberate rather than felt: a
# judgment about length is made differently on a tired day, and a number
# is not.
HANDOFF_LINE_LIMIT = 400

# #14-new and #15-new have no entry and never will unless somebody writes
# them. Both are accounted for in `reminder-rebuild.md` and the gap is
# recorded in `build-history.md` itself, so they are not reported again.
KNOWN_GAPS = {14, 15}


def handoff_size() -> tuple[bool, str]:
    lines = (DOCS / "handoff.md").read_text(encoding="utf-8").splitlines()
    count = len(lines)
    if count <= HANDOFF_LINE_LIMIT:
        return True, f"handoff.md is {count} lines, under {HANDOFF_LINE_LIMIT}."
    return False, (
        f"handoff.md is {count} lines, over {HANDOFF_LINE_LIMIT}. "
        "Something finished is being carried there."
    )


def history_gaps() -> tuple[bool, str]:
    history = (DOCS / "build-history.md").read_text(encoding="utf-8")

    # Headings only. A wrapped line of body text can begin with "#31-new"
    # and would otherwise count as an entry that does not exist — which it
    # did, on the first run of this check.
    recorded = {
        int(number)
        for line in history.splitlines()
        if re.match(r"#{1,6}\s", line)
        for number in re.findall(r"#(\d+)-new", line)
    }

    # The highest session anybody has written down anywhere, so the check
    # does not depend on being told which session this is.
    mentioned = set()
    for path in sorted(DOCS.glob("*.md")) + sorted(DOCS.glob("*.txt")):
        mentioned |= {
            int(n) for n in re.findall(r"#(\d+)-new", path.read_text(encoding="utf-8"))
        }
    if not mentioned:
        return True, "No sessions mentioned anywhere yet."

    highest = max(mentioned)
    missing = sorted(set(range(1, highest + 1)) - recorded - KNOWN_GAPS)

    # The session running right now has no entry because its entry is
    # written at its close. That is not a gap.
    in_progress = highest in missing
    if in_progress:
        missing.remove(highest)

    tail = (
        f" #{highest}-new is the session in progress; its entry is owed at the close."
        if in_progress
        else ""
    )
    if not missing:
        return True, f"build-history.md has an entry for every session.{tail}"
    names = ", ".join(f"#{n}-new" for n in missing)
    return False, f"build-history.md has no entry for {names}.{tail}"


def docx_matches_txt() -> tuple[bool, str]:
    txt, docx = DOCS / "pending.txt", DOCS / "pending.docx"
    if not docx.exists():
        return False, "pending.docx does not exist."

    # The reading-back lives in the generator, so there is only ever one
    # copy of it to be wrong.
    spec = importlib.util.spec_from_file_location(
        "make_pending_docx", DOCS / "make-pending-docx.py"
    )
    generator = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(generator)

    got = "\n".join(generator.read_back(docx)) + "\n"
    wanted = txt.read_text(encoding="utf-8")

    if got == wanted:
        return True, "pending.docx matches pending.txt."
    for number, (a, b) in enumerate(zip(got.split("\n"), wanted.split("\n")), start=1):
        if a != b:
            return False, (
                f"pending.docx differs from pending.txt, first at line {number}. "
                "Run make-pending-docx.py when Patrick wants the Word copy."
            )
    return False, (
        "pending.docx differs from pending.txt in length. "
        "Run make-pending-docx.py when Patrick wants the Word copy."
    )


def main() -> int:
    failed = False
    for check in (handoff_size, history_gaps, docx_matches_txt):
        ok, sentence = check()
        print(("  ok  " if ok else "PLEASE") + "  " + sentence)
        failed = failed or not ok
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
