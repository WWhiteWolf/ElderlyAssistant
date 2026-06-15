# Session start — how we begin

## Standing rules (read these first, every session)

- **Patrick does all git commits.** Claude must never run `git commit` or any git write command on this project — there are possible lockout problems if Claude does it. Claude makes the edits and leaves them for Patrick to review and commit himself.
- **No "boxed" multiple-choice questions.** Don't use button/option-card questions — they feel like being locked into Claude's choices. Ask open questions in plain prose and let Patrick answer in his own words.
- **Verify before asserting.** Read the actual code before describing behavior. When unsure, say so and offer to look.
- **One change at a time.** Discuss before building; make one edit, stop, let Patrick review before the next.
- **Patrick commits at the END of each session.** So at the next session's start, the previous session's work should already be committed — confirm it, don't assume otherwise.

---

## How we start a session

Patrick names the session (shows in the left panel) and says **"read session-start.md."** The `elderlyassistant` folder is already connected in Cowork, so there's nothing to paste — Claude reads the app's code and the tracking docs straight from the folder.

## What I'll do at the start

1. Read **`docs/handoff.md`** first — current state, the active next step, decisions, standing rules.
2. Skim **`docs/parked-items.md`** — the eventual-work backlog (bugs / design / UI polish), so I know what's deferred and don't re-raise it as new.
3. Confirm the previous session's work was committed (Patrick commits at session end).
4. Wait for Patrick's **one goal**, tell him roughly how heavy it looks, and wait for his "go" before changing anything.

## What I'll do at the end

- Refresh **`docs/handoff.md`** so the next session stays on course, and move any new eventual-work into **`docs/parked-items.md`**.
- Patrick commits.

## The tracking docs (different jobs)

- **`handoff.md`** — keeps us on course session to session: current state, the active goal, decisions, what just changed.
- **`parked-items.md`** — the backlog: things to do eventually, not the current goal. When a parked item becomes the live goal, it moves into the handoff; new spin-off work gets parked here.
