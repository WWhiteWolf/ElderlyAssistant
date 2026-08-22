# Session rules — read before anything else

1. How Claude conducts itself lives in `Projects/CLAUDE.md`, at
   the root of the parent folder, which arrives on its own at
   every session start. None of it is repeated here. This file
   arrives on its own too, whenever this project's folder is
   connected.

2. This project's opening read is `docs/handoff.md`, and only
   that. `docs/pending.txt` is Patrick's plain-language list,
   opened at the end-of-session refresh.
   `docs/build-history.md` is opened only when something
   finished needs tracing.

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
