# Session rules — read before anything else

1. How Claude conducts itself lives in `Projects/CLAUDE.md`, at
   the root of the parent folder, which arrives on its own at
   every session start. None of it is repeated here — with one
   exception, which Patrick asked to stand in every rules file:

   > **Instead of spending my time and money on proving yourself
   > right, work much harder to understand what I tell you**
   > (Patrick, SA-17).

   This file arrives on its own too, whenever this project's
   folder is connected.

2. This project's opening read is `docs/handoff.md`, and only
   that. `docs/pending.txt` is Patrick's plain-language list
   and **is brought up to date at every update from now on**
   (his instruction, #31-new) — it is how he tracks the work,
   so it is never left for a later pass.
   `docs/build-history.md` is opened only when something
   finished needs tracing.

   `docs/index.md` says what every file in `docs` holds and
   whether it is live or history. It is **not** part of the
   opening read and adds nothing to it — it is there for the
   moment a session needs to know whether a document about
   some particular thing exists, instead of searching or
   guessing (#30-new). A stale index is worse than none, so a
   file added, retired or renamed changes its line at the same
   refresh.

   `docs/reminder-rebuild.md` is the record of #15-new through
   #18-new and is **not** the live design — `docs/reminder-shape.md`
   is, and wins wherever the two disagree. It is opened when a
   reminder fault needs tracing to what was found and cured. **The
   one live part of it is "What is already right, and is not to be
   'fixed'"**, which any session may add to when it establishes that
   something is deliberate rather than missing. It had no owner
   before Super-2-new, which is how it stood still from #16-new
   while the design moved on around it.

   **`docs/pending.docx` is the copy Patrick actually reads**,
   generated from the txt by `docs/make-pending-docx.py` and
   never hand-edited. The txt stays because plain text is what
   Claude can edit precisely; the Word copy is his. **A Word
   copy is what he wanted originally** — one existed at session
   0, was replaced by an rtf at #12-new, and is restored at
   #31-new at his word. `docs/pending.rtf` and
   `docs/make-pending-rtf.py` are history and are not kept
   current.

   **The Word copy is generated when Patrick asks for it, and
   not on any schedule** (his ruling, #31-new: regenerating a
   file whose source has not moved is useless work, and a rule
   that says do it every time is a ceremony rather than a
   condition). `docs/check-docs.py` reports whether it differs
   from the txt, so a stale copy is visible rather than silent.
   That watching is the point: the first Word copy went missing
   unnoticed because this rule said there was none, and nothing
   was looking.

3. At a session start, ask Patrick whether the previous
   session's work was committed — he prefers being asked. Never
   pre-assert a commit in his voice. When he says he has
   committed, mark it committed at once; do not hedge or ask
   him to verify.

4. **Keeping the record** (settled with Patrick, #31-new, after
   half a dozen earlier attempts that did not hold). Every one
   of those attempts added, moved or removed a file, and a file
   does not change behaviour, which is why each one had to be
   done again. What follows are conditions, not ceremonies: a
   condition is either true or it is not, and `docs/check-docs.py`
   reports the three that can be machine-checked in one command.
   **A failing condition is not an instruction to act** — it is
   something to put in front of Patrick, who decides.

   - **A decision is written into `docs/handoff.md` the moment it
     is made, in that turn.** Not saved for the end. Writing at
     the end is what loses things: a conversation gets compressed
     to its conclusion, so the headline survives and the reasoning
     and the open questions behind it do not. Patrick cannot be
     expected to remember at the end of a day what he decided at
     the start of it, and neither can a session.
   - **`handoff.md` holds live work and open questions only, and
     stays under 400 lines.** Over that it stops being read whole
     and starts being skimmed, and what is being carried there is
     finished work.
   - **Nothing is deleted from `handoff.md` until it exists in
     `docs/build-history.md`.** At #31-new a prune done on trust
     would have destroyed five whole sessions, none of which had
     ever been written into the history.
   - **Every session has an entry in `build-history.md`**, written
     at its close. That is the one write the end of a session
     still owes, because the handoff is already current.
   - **The test for a block being pruned**: finished, so it goes to
     the history; still decides something, so it goes to the
     handoff's standing rulings; undone or unanswered, so it
     stays. A block answering none of the three is already gone.
   - **Write the condition, not the ceremony.** A rule that says
     what to perform does the work whether or not it is needed and
     fails silently the once it is skipped. A rule that says what
     must be true can be checked.

# Working notes for this project

- **The name is "A Place To Remember"; the badge under the icon
  is "Memory".** Bare session numbers mean the old shared
  chain; this project's own chain is written "#1-new, #2-new, …".
  No old reference is ever edited.
- **Patrick's EAS build-and-submit steps**, in his own words,
  live at the end of `docs/publishing.md` under "Build steps".
- **TypeScript checks (npx tsc) are fine here.** Git never is —
  that rule lives in App-Docs.
- **The quiet files** — `docs/parked-items.md`,
  `docs/publishing.md`, `docs/roadmap.md` — are from before the
  transition (153 > 0). They stay in place, quiet until needed,
  and belong to no reading order. A change to one of them is
  noted in `docs/handoff.md` for the next one session only,
  then dropped.
