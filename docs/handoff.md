# Hand-off note — paste at the start of the next session

## THIS SESSION — #34 (2026-06-30): REMINDER NOTIFICATION CONSOLIDATION — PLANNING/DESIGN ONLY. No app code changed. Audited every notification path and locked a full plan in `docs/reminder-audit.md`. Docs UNCOMMITTED → Patrick commits.

**Start-of-session fact:** working tree clean — all of #33 committed (`eb3ac85 New Issues 6/29 #33` + the cleanup commit). Confirmed at session start.

**Goal = rebuild the Reminder/Notification process so it behaves the same everywhere.** This was a discuss-and-design session — read the code, found the inconsistencies, agreed the target. **Nothing in `app/` was touched; only the docs.**

**What the audit found (why reminders feel inconsistent):** not one system but several. `_layout.tsx` is the hub for taps/buttons (To-Do, My Day, My Week, Pets); Timer is a separate island. Permission requests + the display handler are set in 4 screens but **not in To-Do** (To-Do only works if another screen ran first). Snooze reschedule in `_layout.tsx` omits `sound` (snoozes may be silent). Routine screens cancel+rebuild on load; To-Do schedules once. Titles/bodies/buttons and completion-log shapes all differ per screen. Full detail + table in `docs/reminder-audit.md`.

**Decisions locked this session (all in `reminder-audit.md`):**
1. **Scope = popups only** for the consolidation (in-app tile buttons stay as-is for now). **Timer is OUT** (Patrick's call — small/unique).
2. **Unified popup buttons everywhere:** **OK** (silence just this popup), **Skip** (this occurrence only — don't mark/log done; repeats still return), **Delay** (snooze), **Done** (log original time + done-tap time; a **past-day** banner logs that past completion but must NOT check off today's current one).
3. **To-Do → one-time only.** Remove Monthly + Yearly (live code) and the 3/6-month stubs. No existing monthly/yearly data to migrate (Patrick confirmed).
4. **New "Look Ahead" home-screen page** (works like My Day/Week/Pets): items grouped under **Monthly / 3 Months / 6 Months / Yearly**; each = label + first due date + time + repeat interval; nags, tap Done logs + re-arms next cycle; keeps its own history. **Delay amounts here = Day / Week / Month** (minutes don't suit long-lead items). iOS gives native repeats for Monthly & Yearly; 3/6-month have no native trigger → app re-arms a DATE one-shot each cycle from the item's due date.
5. **New "Watch List" page** — already built as a standalone Expo app in **`Projects/WatchList`** (movie/TV tracker, no notifications); fold in later as its own page. Independent of the reminder work.
6. **Sequencing:** nail the PAGES down first (strip To-Do, build Look Ahead), THEN do the popup consolidation on the stable screens. Take each piece one at a time in future sessions.
7. **Keep it ONE initiative, Simulator-first** (Patrick's directive). All these changes are tracked together as "Reminder Rebuild #34" with an ordered **BUILD PLAN** in `reminder-audit.md` so nothing gets lost in the backlog. Do as much as practical in the iOS Simulator (`npm run ios`, free) before spending an EAS cloud build; real-phone tests are BATCHED into two checkpoints (A: To-Do one-shots + Look Ahead reminders; B: unified popups / past-day Done / sound / tap-routing).

**Files touched (#34):** `docs/reminder-audit.md` (new, the master plan), `docs/handoff.md`, `docs/parked-items.md`, `docs/pending.txt`. **No `app/` code.** Docs UNCOMMITTED → Patrick commits.

**➤ NEXT SESSION — start at STEP 1 of the BUILD PLAN** in `docs/reminder-audit.md` (strip recurrence out of To-Do), unless Patrick chooses otherwise. Read that spec first — it's the full plan AND the running build checklist. Build in the Simulator first; save the phone for Checkpoints A/B.

---

## SESSION — #33 (2026-06-29): NEW ISSUES FROM TESTING — two code fixes, DEVICE-VALIDATED (To-Do on-tile Done button; My Week Done button now toggles to un-done/reactivate). `tsc` clean both times; Patrick confirmed both work on the phone. Code UNCOMMITTED → Patrick commits. Three other issues parked for future.

**Start-of-session fact:** working tree clean — all of #32 committed (Patrick confirmed at session start).

**Goal = fix new issues found through use/testing.** Patrick raised 5; we fixed 2 in code and parked the other 3 (one needs a clean phone re-test, two are future work).

**What was done (code, two files):**
1. **To-Do on-tile Done button** (`app/todo.tsx`) — added a green **"Done"** button on each task tile, in the top row just left of "Edit." It calls the existing `completeTask(task)` (same "Mark ___ as done?" confirm + log), so no new logic — just surfacing it. New styles: `taskBtnRow`, `doneBtn`, `doneBtnText`. Before this, the only way to complete a task was Edit → Status → "Completed" → Save.
2. **My Week Done button now toggles** (`app/myweek.tsx`) — the per-chore Done button already existed (shows "Done", turns to green "✓" once logged). Added `undoDone(id)`: tapping the **✓** now asks *"Mark ___ as not done?"* and clears `completed`/`doneAt`, reactivating the chore early (Patrick's case: out of food, need clean pants). The chore's weekly reminder and the prior log entry are left untouched, so when it's actually done again it logs a fresh entry. The button's `onPress` now branches: completed → `undoDone`, otherwise → `openLogModal` (unchanged).

**Verification:** `tsc --noEmit` clean (0 errors) after each edit, then **device-validated** — Patrick built and tested both fixes on the phone and confirmed they work.

**Files touched (#33):** `app/todo.tsx`, `app/myweek.tsx` (code); `docs/handoff.md` + `docs/parked-items.md` + `docs/pending.txt` (end-of-session refresh). Code UNCOMMITTED → Patrick commits.

**Parked this session (3 issues → `parked-items.md`):**
- **To-Do reminder fired early (23:30 task, fired ~21:15).** No bug found in the To-Do scheduling code — the only thing anywhere that produces an early fire is the "2 hours" before-preset, and 21:15 is exactly 2h before a 23:15 due time, so this is likely the preset working as designed. Needs a clean phone re-test (new task a few minutes out, **"At time" only**) before treating it as a real bug.
- **Name the backup folder.** Give the exported backup folder/file a clear, recognizable name.
- **To-Do Custom Category cancel bug.** In New Task, opening the "Custom Category" second popup and tapping **Cancel** closes BOTH popups and loses the in-progress task. Cancel should close only the category popup and return to the New Task form.

**➤ NEXT SESSION — #33's two fixes are device-validated; just needs Patrick's commit.** Then pick a parked item (the 23:30/21:15 reminder re-test, naming the backup folder, or the Custom Category cancel bug).

---

*Only the last two sessions are kept here. Older session detail isn't archived in the docs anymore — git history holds the full record.*
