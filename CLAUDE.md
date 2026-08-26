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
   that. `docs/pending.txt` is Patrick's plain-language list,
   opened at the end-of-session refresh.
   `docs/build-history.md` is opened only when something
   finished needs tracing.

   `docs/reminder-rebuild.md` is the record of #15-new through
   #18-new and is **not** the live design — `docs/reminder-shape.md`
   is, and wins wherever the two disagree. It is opened when a
   reminder fault needs tracing to what was found and cured. **The
   one live part of it is "What is already right, and is not to be
   'fixed'"**, which any session may add to when it establishes that
   something is deliberate rather than missing. It had no owner
   before Super-2-new, which is how it stood still from #16-new
   while the design moved on around it.

   `docs/pending.rtf` is the copy Patrick actually reads, and
   it is generated from the txt, never hand-edited (#12-new).
   He had been converting the txt to rich text himself every
   time, so the app does it for him. The txt stays because
   plain text is what Claude can edit precisely; the rtf is
   his, and it is never allowed to lag — regenerated word for
   word at every refresh and machine-checked against the txt,
   or the refresh is not done. There is no Word copy: one
   existed once and this rule had said there was none, which
   is how it went missing unnoticed.

3. At a session start, ask Patrick whether the previous
   session's work was committed — he prefers being asked. Never
   pre-assert a commit in his voice. When he says he has
   committed, mark it committed at once; do not hedge or ask
   him to verify.

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
