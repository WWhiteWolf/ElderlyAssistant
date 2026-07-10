# Session start — how we begin

> **Cross-project note:** The cross-project docs for all my apps live in
> **Projects → App-Docs** (a git repo, since #71): `master-handoff.md` (the one
> session chain — read it first) and `Publishing-Strategy.docx` (the strategy).
> (A pointer with the details sits at `docs/publishing.md` in this project.)

## Standing rules (read these first, every session)

- **Patrick does all git commits.** Claude must never run `git commit` or any git write command on this project — there are possible lockout problems if Claude does it. Claude makes the edits and leaves them for Patrick to review and commit himself.
- **No "boxed" multiple-choice questions — and no "Do you want X or Y?" either (Patrick, #48).** Don't use button/option-card questions, and don't embed Claude's own options in a prose question ("Do you want ... or ...?") — both feel like being pinned into Claude's choices. Ask genuinely open questions ("What would you like the scope to be?") and let Patrick answer in his own words.
- **Step reports use the "what → how" shape (Patrick, #39).** After each build step, report as: **"What happened"** — one or two quick sentences in plain English — then **"How it was done"** — short bullets with the details (files touched, behaviors, checks run). It helps Patrick organize the information; details-first prose was hard to follow.
- **Say explicitly WHERE to act — don't assume Patrick reads the intent.** When a step happens on a different device or surface than what we're discussing (e.g., we're talking about the iPhone app but he needs to do something on the Mac, the Simulator's macOS menu bar, Xcode, or the terminal), name the device/app and where to look. Spell it out; don't make him infer it from context.
- **Verify before asserting.** Read the actual code before describing behavior. When unsure, say so and offer to look.
- **One question at a time.** Never stack multiple questions in one turn — ask exactly one and wait.
- **Ask if Patrick wants to say something first, before questioning him.** Before asking him a question, first check whether he has something he wants to say.
- **Patrick leads; Claude doesn't steer (Patrick, #68).** Don't end replies by pushing toward Claude's chosen next step ("Ready for X when you are"). Finish the step, report it, and let Patrick decide what comes next.
- **No unnecessary urgency.** Patrick is retired and in no hurry. Go at his pace, discuss fully, and don't rush toward building or push to "finish." There's no clock on any of this.
- **One change at a time.** Discuss before building; make one edit, stop, let Patrick review before the next.
- **Patrick commits at the END of each session** (and sometimes mid-session to trigger a build — see "Build-and-test commit rhythm" below). At the next session's start the previous session's **code** should already be committed, but the **docs may still be pending a post-test commit — confirm, don't assume**.
- **Keep `handoff.md` short — only the last 2 sessions.** At session end, when refreshing the docs, drop any session entry older than the most recent two. Older detail isn't archived in the docs anymore — git history keeps the full record — so the working hand-off stays easy to read.

---

## How we start a session

Patrick names the session (shows in the left panel) and says **"read session-start.md."** The `elderlyassistant` folder is already connected in Cowork, so there's nothing to paste — Claude reads the app's code and the tracking docs straight from the folder.

## What I'll do at the start

1. Read **`docs/handoff.md`** first — current state, the active next step, decisions, standing rules.
2. Skim **`docs/parked-items.md`** — the eventual-work backlog (bugs / design / UI polish), so I know what's deferred and don't re-raise it as new.
3. Skim **`docs/pending.txt`** — Patrick's plain-language pending list, the menu he picks the session goal from. If he names an item from it (e.g. "Security Tidy-up"), pull that item into `handoff.md` as the active goal.
4. Confirm the previous session's work was committed (Patrick commits at session end).
5. Wait for Patrick's **one goal**, tell him roughly how heavy it looks, and wait for his "go" before changing anything.

## What I'll do at the end

- Refresh **`docs/handoff.md`** so the next session stays on course, and move any new eventual-work into **`docs/parked-items.md`**.
- Update **`docs/pending.txt`** — refresh the **"Where things stand right now"** snapshot at the top (what just finished/committed, what's in flight), tick off anything finished, and add anything new, so this one plain-text doc stays Patrick's accurate step-back-and-decide read.
- Patrick commits.

## Build-and-test commit rhythm (two commits, not one)

When a session's work needs a device test, Patrick splits it into **two commits at two different times:**

1. **Code commit (now, before the build).** Patrick commits just the code he needs so EAS builds the right state, then triggers the build and tests on the phone. (Code first — EAS captures git state when the build is triggered.)
2. **Docs commit (later, after testing).** Once the phone test confirms the work, Patrick tells Claude the result; Claude refreshes `handoff.md` + `parked-items.md` (recording it as device-validated, or noting what failed), and Patrick commits the docs **separately** — often in a later session.

**What this means at a session start:** the previous session's **code** should already be committed, but the **docs may lag** — they get their own commit after the device test. So if the docs still say "awaiting build/device test," confirm with Patrick how the test went before assuming the work shipped clean.

## The tracking docs (different jobs)

- **`handoff.md`** — keeps us on course session to session: current state, the active goal, decisions, what just changed. **Holds only the last 2 sessions**; older detail isn't kept in the docs (git history has it).
- **`parked-items.md`** — the backlog: things to do eventually, not the current goal. When a parked item becomes the live goal, it moves into the handoff; new spin-off work gets parked here.
- **`pending.txt`** — Patrick's single plain-text doc: opens with a **"Where things stand right now"** snapshot, then the plain-language backlog menu he picks the next goal from. Keep it in step with `parked-items.md` (tick off finished items, add new ones) and refresh the snapshot at session end.
