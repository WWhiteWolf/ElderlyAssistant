# Hand-off note — paste at the start of the next session

## THIS SESSION — #33 (2026-06-29): NEW ISSUES FROM TESTING — two code fixes, DEVICE-VALIDATED (To-Do on-tile Done button; My Week Done button now toggles to un-done/reactivate). `tsc` clean both times; Patrick confirmed both work on the phone. Code UNCOMMITTED → Patrick commits. Three other issues parked for future.

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

## SESSION — #32 (2026-06-28): RETIRED TO-DO'S DAILY & WEEKLY — code change, DEVICE-VALIDATED. Removed the Weekly recurring feature and the leftover Daily traces from To-Do. Patrick confirmed on the phone: the Daily and Weekly buttons are gone from the picker. Code UNCOMMITTED, Patrick commits.

**Start-of-session fact:** working tree was clean — all of #31 (the roadmap) committed in `2d74022` ("ADD Road Map"). Nothing hanging.

**Goal = retire To-Do's Daily & Weekly** (My Day owns daily, My Week owns weekly). Patrick confirmed there was **no existing weekly To-Do data** to migrate, so Weekly could be removed outright. Done Daily-first (small/safe), then Weekly (real feature removal), one step at a time.

**What was done (code, two files):**
1. **Daily traces removed** (`app/todo.tsx`) — dropped `'daily'` from the `RecurType` union and the leftover `t.recurring === 'daily'` line in the Week-Ahead filter. (Daily was already mostly gone — no picker option, no scheduling branch.)
2. **Weekly feature removed** (`app/todo.tsx`) — pulled `'weekly'` from the recurring picker, deleted the Sun–Sat "Which day?" day-picker block, removed the repeating-weekly scheduling branch (the `WEEKLY` trigger), and stripped the weekly cases from the tile label (`scheduleLabel`), the completion-log `scheduledFor`, and the Week-Ahead filter. Removed the now-unused `DAY_NAMES`, `DAYS`, and `dayOfWeek` locals and updated stale comments.
3. **`app/_layout.tsx`** — removed the one dead To-Do weekly `scheduledFor` line in the "Done" handler (+ its now-unused `DAYS` local) and fixed two comments. **My Week's own weekly machinery was left untouched** (the `postpone1` / `myweek` `WEEKLY` base reminders are a separate feature).

**Kept on purpose:** the `recurDay` field (Monthly still uses it, 1–28) and the unrelated 8am background-tasks `DAILY` trigger in `scheduleBackgroundReminder`.

**Verification:** `tsc --noEmit` clean (0 errors); eslint introduced no new warnings (the 2 unused-var warnings my edits created — `DAYS`, `dayOfWeek` — were then removed; remaining `showToday` + router-dep warnings are pre-existing, out of scope). Then **device-validated** — Patrick saw the buttons gone on the phone.

**Files touched (#32):** `app/todo.tsx`, `app/_layout.tsx` (code); `docs/handoff.md` + `docs/parked-items.md` + `docs/pending.txt` (end-of-session refresh). No new backlog items to park. Code UNCOMMITTED; Patrick commits.

**➤ NEXT SESSION — Patrick's pick from `pending.txt`.** No docs cleanup pending. Open code items include the Monthly/Yearly recurring-reminder phone test, the To-Do on-tile Snooze button, and the 3/6-month repeat options.

---

*Only the last two sessions are kept here. Older session detail isn't archived in the docs anymore — git history holds the full record.*
