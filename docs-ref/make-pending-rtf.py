#!/usr/bin/env python3
"""Build docs/pending.rtf from docs/pending.txt, and prove they agree.

`pending.txt` is the plain-text list Claude edits precisely.
`pending.rtf` is the copy Patrick actually reads. The rtf is generated
from the txt and never hand-edited, and it is never allowed to lag —
that rule lives in this project's CLAUDE.md, and this script is what
carries it out (#16-new).

It does two things, and the second is the point: it writes the rtf, then
reads that rtf back into plain text and compares it against the txt line
by line. If they differ in one character it says where and stops with a
failure, so a refresh cannot quietly hand Patrick a stale file.

Run it from anywhere:

    python3 docs/make-pending-rtf.py

There is no Word copy of this list and there never should be. One
existed once, the rule said there was none, and that is how it went
missing unnoticed.
"""

import re
import sys
from pathlib import Path

DOCS = Path(__file__).resolve().parent
TXT = DOCS / "pending.txt"
RTF = DOCS / "pending.rtf"

# The preamble TextEdit itself writes: Georgia, the size Patrick reads at,
# and nothing else. Kept byte for byte so the file he opens tomorrow looks
# exactly like the one he opened today.
HEADER = (
    "{\\rtf1\\ansi\\ansicpg1252\\cocoartf2870\n"
    "\\cocoatextscaling0\\cocoaplatform0"
    "{\\fonttbl\\f0\\fnil\\fcharset0 Georgia;\\f1\\fnil\\fcharset0 LucidaGrande;}\n"
    "{\\colortbl;\\red255\\green255\\blue255;}\n"
    "{\\*\\expandedcolortbl;;}\n"
    "\\vieww17540\\viewh16440\\viewkind0\n"
    "\\deftab720\n"
    "\\pard\\pardeftab720\\sl276\\slmult1\\partightenfactor0\n"
    "\n"
    "\\f0\\fs36 \\cf0 "
)


def to_rtf(line: str) -> str:
    """One line of plain text, written the way an rtf file spells it."""
    out = []
    for ch in line:
        if ch in "\\{}":
            # These three mean something to rtf itself, so they are marked
            # as ordinary characters.
            out.append("\\" + ch)
        elif ord(ch) < 128:
            out.append(ch)
        else:
            try:
                # An em dash and its like: written as the byte the file's
                # own character set uses.
                out.append("\\'%02x" % ord(ch.encode("cp1252")))
            except UnicodeEncodeError:
                # Anything that character set has no room for — the ▶ in
                # the Look Ahead item is the only one today. Rtf's own
                # escape, with a "?" behind it for readers too old to
                # show it.
                out.append("\\u%d ?" % ord(ch))
    return "".join(out)


def from_rtf(line: str) -> str:
    """The same journey backwards, so the two can be compared."""
    line = re.sub(r"\\u(\d+) \?", lambda m: chr(int(m.group(1))), line)
    line = re.sub(
        r"\\'([0-9a-f]{2})",
        lambda m: bytes([int(m.group(1), 16)]).decode("cp1252"),
        line,
    )
    return re.sub(r"\\([\\{}])", r"\1", line)


def main() -> int:
    wanted = TXT.read_text(encoding="utf-8")

    lines = wanted.split("\n")
    # A file ending in a newline leaves an empty last piece, which is not a
    # line of the list.
    if lines and lines[-1] == "":
        lines = lines[:-1]

    # Every line but the last carries the rtf line break.
    RTF.write_text(
        HEADER + "\\\n".join(to_rtf(line) for line in lines) + "}",
        encoding="ascii",
    )

    # Now read back what was just written, and hold it against the txt.
    body = RTF.read_text(encoding="ascii").split("\\f0\\fs36 \\cf0 ", 1)[1]
    got = "\n".join(from_rtf(piece) for piece in body[:-1].split("\\\n")) + "\n"

    if got == wanted:
        print(f"pending.rtf written and checked — {len(lines)} lines, word for word.")
        return 0

    mine, theirs = got.split("\n"), wanted.split("\n")
    print(f"MISMATCH — rtf {len(mine)} lines, txt {len(theirs)} lines.")
    for number, (a, b) in enumerate(zip(mine, theirs), start=1):
        if a != b:
            print(f"first difference at line {number}")
            print(f"  rtf: {a!r}")
            print(f"  txt: {b!r}")
            break
    print("The refresh is not done until this says it matches.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
