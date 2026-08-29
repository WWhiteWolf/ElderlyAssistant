#!/usr/bin/env python3
"""Build docs/pending.docx from docs/pending.txt, and prove they agree.

`pending.txt` is the plain-text list Claude edits precisely.
`pending.docx` is the copy Patrick actually reads. It is generated from
the txt and never hand-edited.

**A Word copy is what Patrick wanted originally** (#31-new). One existed
at session 0 and was replaced by an rtf at #12-new; this brings it back at
his word. The earlier docx went missing unnoticed because the rule of the
day said there was no Word copy — so the rule now says there is one, and
`check-docs.py` reports when it has drifted from the txt.

**It is generated when Patrick asks for it, not on a schedule** (his
ruling, #31-new: regenerating a file whose source has not moved is useless
work).

    python3 docs/make-pending-docx.py

It does two things, and the second is the point: it writes the docx, then
reads that docx back into plain text and compares it against the txt line
by line. If they differ in one character it says where and stops with a
failure, so he cannot quietly be handed a stale file.

The file is written by hand rather than with a library, so the script has
nothing to install and cannot rot when a package moves on. A .docx is a
zip holding three small XML parts, and all three are below.
"""

import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree
from xml.sax.saxutils import escape

DOCS = Path(__file__).resolve().parent
TXT = DOCS / "pending.txt"
DOCX = DOCS / "pending.docx"

W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"

# Arial at 14 point, Patrick's own choice at #31-new after reading the
# first Word copy. Word counts in half-points, so 28 is 14pt.
FONT = "Arial"
HALF_POINTS = "28"

# Section headings are shown in bold. They are recognised by their shape
# rather than marked up, because the text of this file has to stay exactly
# equal to `pending.txt` — the whole guarantee is that the two can be
# compared word for word. Styling may differ; wording may not.
HEADINGS = (
    re.compile(r"^A PLACE TO REMEMBER"),
    re.compile(r"^#\d+-new — "),
    re.compile(r"^[A-Z][A-Z0-9 '\u2019\".,()/-]{3,}$"),
)


def is_heading(line: str) -> bool:
    return any(pattern.match(line) for pattern in HEADINGS)

CONTENT_TYPES = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>"""

RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"""

# A fixed timestamp inside the zip, so generating the same list twice gives
# the same file byte for byte rather than a fresh one every run.
FIXED_TIME = (2026, 1, 1, 0, 0, 0)


def paragraph(line: str) -> str:
    """One line of plain text, written the way a Word document spells it."""
    bold = "<w:b/>" if is_heading(line) else ""
    return (
        '<w:p><w:pPr><w:spacing w:line="276" w:lineRule="auto"/></w:pPr>'
        f'<w:r><w:rPr><w:rFonts w:ascii="{FONT}" w:hAnsi="{FONT}"/>{bold}'
        f'<w:sz w:val="{HALF_POINTS}"/></w:rPr>'
        f'<w:t xml:space="preserve">{escape(line)}</w:t></w:r></w:p>'
    )


def document(lines: list[str]) -> str:
    body = "".join(paragraph(line) for line in lines)
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        f'<w:document xmlns:w="{W}"><w:body>{body}<w:sectPr/></w:body></w:document>'
    )


def read_back(path: Path) -> list[str]:
    """The same journey backwards, so the two can be compared."""
    with zipfile.ZipFile(path) as archive:
        xml = archive.read("word/document.xml")
    root = ElementTree.fromstring(xml)
    body = root.find(f"{{{W}}}body")
    lines = []
    for para in body.findall(f"{{{W}}}p"):
        lines.append("".join(t.text or "" for t in para.iter(f"{{{W}}}t")))
    return lines


def main() -> int:
    wanted = TXT.read_text(encoding="utf-8")

    lines = wanted.split("\n")
    # A file ending in a newline leaves an empty last piece, which is not a
    # line of the list.
    if lines and lines[-1] == "":
        lines = lines[:-1]

    with zipfile.ZipFile(DOCX, "w", zipfile.ZIP_DEFLATED) as archive:
        for name, text in (
            ("[Content_Types].xml", CONTENT_TYPES),
            ("_rels/.rels", RELS),
            ("word/document.xml", document(lines)),
        ):
            info = zipfile.ZipInfo(name, date_time=FIXED_TIME)
            info.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(info, text)

    got = "\n".join(read_back(DOCX)) + "\n"

    if got == wanted:
        print(f"pending.docx written and checked — {len(lines)} lines, word for word.")
        return 0

    mine, theirs = got.split("\n"), wanted.split("\n")
    print(f"MISMATCH — docx {len(mine)} lines, txt {len(theirs)} lines.")
    for number, (a, b) in enumerate(zip(mine, theirs), start=1):
        if a != b:
            print(f"first difference at line {number}")
            print(f"  docx: {a!r}")
            print(f"   txt: {b!r}")
            break
    print("The docx is not done until this says it matches.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
