# Session start — how we begin

> **Cross-project note:** The overarching business/publishing strategy and learning
> tracker for all my apps lives in **OneDrive → App-Pubs** as `Publishing-Strategy.docx`.
> Connect that folder to read or update it — it's no longer kept in the Projects folder.

## Standing rules (read these first, every session)

- **Patrick does all git commits.** Claude must never run `git commit` or any git write command on this project — there are possible lockout problems if Claude does it. Claude makes the edits and leaves them for Patrick to review and commit himself.
- **No "boxed" multiple-choice questions.** Don't use button/option-card questions — they feel like being locked into Claude's choices. Ask open questions in plain prose and let Patrick answer in his own words.
- **Say explicitly WHERE to act — don't assume Patrick reads the intent.** When a step happens on a different device or surface than what we're discussing (e.g., we're talking about the iPhone app but he needs to do something on the Mac, the Simulator's macOS menu bar, Xcode, or the terminal), name the device/app and where to look. Spell it out; don't make him infer it from context.
- **Verify before asserting.** Read the actual code before describing behavior. When unsure, say so and offer to look.
- **One change at a time.** Discuss before building; make one edit, stop, let Patrick review before the next.
- **Patrick commits at the END of each session** (and sometimes mid-session to trigger a build — see "Build-and-test commit rhythm" below). At the next session's start the previous session's **code** should already be committed, but the **docs may still be pending a post-test commit — confirm, don't assume**.

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

## Build-and-test commit rhythm (two commits, not one)

When a session's work needs a device test, Patrick splits it into **two commits at two different times:**

1. **Code commit (now, before the build).** Patrick commits just the code he needs so EAS builds the right state, then triggers the build and tests on the phone. (Code first — EAS captures git state when the build is triggered.)
2. **Docs commit (later, after testing).** Once the phone test confirms the work, Patrick tells Claude the result; Claude refreshes `handoff.md` + `parked-items.md` (recording it as device-validated, or noting what failed), and Patrick commits the docs **separately** — often in a later session.

**What this means at a session start:** the previous session's **code** should already be committed, but the **docs may lag** — they get their own commit after the device test. So if the docs still say "awaiting build/device test," confirm with Patrick how the test went before assuming the work shipped clean.

## The tracking docs (different jobs)

- **`handoff.md`** — keeps us on course session to session: current state, the active goal, decisions, what just changed.
- **`parked-items.md`** — the backlog: things to do eventually, not the current goal. When a parked item becomes the live goal, it moves into the handoff; new spin-off work gets parked here.
