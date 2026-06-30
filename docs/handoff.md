# Hand-off note — paste at the start of the next session

## THIS SESSION — #35 (2026-06-30) "Rebuild Step 1": STRIPPED RECURRENCE FROM TO-DO → one-time only. Code changed in `app/todo.tsx` + `app/_layout.tsx`; `tsc` clean; Simulator-validated. Device check BATCHED into Checkpoint A. Code + docs UNCOMMITTED → Patrick commits.

**Start-of-session fact:** working tree had only a one-line `handoff.md` edit pending from #34 (renaming the next session "#35 Rebuild Step 1"); all #34 work was committed (`b818a81 Reminder Rebuild #34`). Confirmed at session start.

**Goal = STEP 1 of the Reminder Rebuild #34 BUILD PLAN** (`docs/reminder-audit.md`): make To-Do one-time only by removing all recurrence. No data to migrate (Patrick re-confirmed: no existing Monthly/Yearly tasks).

**What was done (code, two files):**
1. **`app/todo.tsx`** — removed the `RecurType` type, the `DAYS_IN_MONTH` constant, the `recurring`/`recurDay`/`recurMonth` Task fields + their form state + resets, the **Recurring picker UI** and its Monthly day-picker / Yearly month+day pickers, the **Monthly & Yearly blocks** in `scheduleReminders` (only the one-time DATE path remains), the **🔁 tile badge** (+ its now-dead `recurringText` style), and the recurrence matching in the **Week-Ahead** view. `completeTask` now always logs then removes the task (the recurring "keep + re-arm" branch is gone).
2. **`app/_layout.tsx`** — the To-Do **"Done"** notification handler dropped the monthly/yearly `scheduledFor` fallback and the "only delete if not recurring" guard; a To-Do Done now always logs + removes the task + cancels its alerts.

**Verification:** `tsc --noEmit` clean (0 errors). Simulator: Patrick confirmed the New Task form now shows **no Recurring row** (Title → Category → Priority → Status → Due Date → Due Time → Notes → Reminders) and tiles show no 🔁 badge. Not yet exercised on a real device — folded into **PHONE CHECKPOINT A** (To-Do one-shots + Look Ahead reminders).

**Files touched (#35):** `app/todo.tsx`, `app/_layout.tsx` (code); `docs/handoff.md` + `docs/parked-items.md` + `docs/pending.txt` (end-of-session refresh). Code + docs UNCOMMITTED → Patrick commits.

**➤ NEXT SESSION = "#36 Rebuild Step 2"** — STEP 2 of the BUILD PLAN: build the new **"Look Ahead"** home-screen page (page + home tile + route + add/edit form + Monthly / 3 Months / 6 Months / Yearly subheadings + its own history), Simulator-first. Read `docs/reminder-audit.md` for the spec. Look Ahead reminders + re-arm are STEP 3 (still Simulator), then **PHONE CHECKPOINT A**.

---

## SESSION — #34 (2026-06-30): REMINDER NOTIFICATION CONSOLIDATION — PLANNING/DESIGN ONLY. No app code changed. Audited every notification path and locked a full plan in `docs/reminder-audit.md`. Committed (`b818a81 Reminder Rebuild #34`).

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

**Files touched (#34):** `docs/reminder-audit.md` (new, the master plan), `docs/handoff.md`, `docs/parked-items.md`, `docs/pending.txt`. **No `app/` code.** Committed in `b818a81`.

---

*Only the last two sessions are kept here. Older session detail isn't archived in the docs anymore — git history holds the full record.*
