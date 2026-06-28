# Hand-off note — paste at the start of the next session

## THIS SESSION — #32 (2026-06-28): RETIRED TO-DO'S DAILY & WEEKLY — code change, DEVICE-VALIDATED. Removed the Weekly recurring feature and the leftover Daily traces from To-Do. Patrick confirmed on the phone: the Daily and Weekly buttons are gone from the picker. Code UNCOMMITTED, Patrick commits.

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

## SESSION — #31 (2026-06-28): CREATED THE PROJECT ROADMAP — docs only, no app code touched. New `docs/roadmap.md`: vision, current state, full feature inventory, road-ahead phases, a Deployment & distribution (long-range) section, guiding principles, and a tools/stack appendix. Committed in `2d74022`.

**Start-of-session fact:** working tree was clean — all of #30 (docs simplification) committed in `33d0db3`. Nothing hanging.

**Goal = create a roadmap.** Patrick realized the project had no big-picture roadmap and wanted one. He chose the broader form: vision + what's already built + milestones + what's ahead (not just a forward task list).

**What was done (docs only):**
1. **NEW `docs/roadmap.md`** — built from verified facts, not guesses: stack from `package.json`/`app.json`/`eas.json`/`.vscode/extensions.json`, the eleven screens from `app/`, and open work from the tracking docs. Sections: Vision; Where it stands today; What's already built; The road ahead (4 phases + parked); Deployment & distribution (long-range); Guiding principles; Tools & stack appendix.
2. **Patrick's corrections, applied:**
   - Not "nothing in the cloud" — an exported **backup file** can be saved to a cloud location (iCloud Drive). Reworded both spots.
   - Added the **Deployment & distribution (long-range)** section — current path is EAS Build → TestFlight → (eventually) App Store; an *optional, uncommitted* web version of Elyfont on GitHub Pages at **elyfont.com** (already owned), same approach as MysteryTracker's web build; the **two-app picture** (MysteryTracker: mobile + web **both done, web published live**; Elyfont: mobile working, web a maybe). Points to OneDrive `Publishing-Strategy.docx` + the MysteryTracker deployment doc rather than duplicating steps.
   - Added a sub-idea under Elyfont: offering the individual pages (To-Do, My Day, …) as **optional tailored modules**. Marked not committed.

**Verified detail worth keeping:** `app.json` already carries the new name **"Elyfont"**, but the in-app home greeting and the TestFlight listing still say **"Remember When"** — so the rename is partly underway (recorded in the roadmap's Identity/renaming milestone).

**Files touched (#31):** `docs/roadmap.md` (new); `docs/handoff.md` + `docs/pending.txt` (end-of-session refresh). No new backlog items to park. Committed in `2d74022`.

---

*Only the last two sessions are kept here. Older session detail isn't archived in the docs anymore — git history holds the full record.*
