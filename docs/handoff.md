# Hand-off note — paste at the start of the next session

## THIS SESSION — #36 (2026-06-30) "Rebuild Step 2": BUILT THE "LOOK AHEAD" PAGE. New `app/lookahead.tsx` + home tile/route + `_layout.tsx` Stack.Screen; `tsc` clean; Simulator-validated. NO notification code (reminders + re-arm are STEP 3). Code UNCOMMITTED → Patrick commits.

**Start-of-session fact:** working tree clean — all of #35 committed (`c05da9a Rebuild Step 1 Done.`). Confirmed at session start.

**Goal = STEP 2 of the Reminder Rebuild #34 BUILD PLAN** (`docs/reminder-audit.md`): build the new **Look Ahead** home-screen page — page + home tile + route + add/edit form + Monthly / 3 Months / 6 Months / Yearly subheadings + its own history. Simulator-first. Reminders are explicitly NOT part of this step.

**What was done (code, three files):**
1. **`app/lookahead.tsx`** (new) — built in the Pets (`mollie.tsx`) style: header (← Home / "Look Ahead 🔭" / + Add Entry), items grouped under four subheadings shortest-first (**Monthly → 3 Months → 6 Months → Yearly**), each row = label + first-due date + time, with Edit / Log / swipe-to-delete / tap-to-select reorder (reorder swaps only within the item's own interval group). Add/Edit modal = Name + a **Date** stepper (Month/Day/Year, same ▲/▼ style as the time picker) + the **Time** stepper + a **Repeat Every** selector (Monthly / 3 Months / 6 Months / Yearly). Own **Look Ahead Log** history section + Clear All + per-entry swipe-delete + note-edit. Item model: `{id,label,year,month,day,hour,minute,interval}`. Storage keys `lookahead_items` + `lookahead_history`. **No `expo-notifications` import at all.**
2. **`app/home.tsx`** — added a `{ id: 'lookahead', label: 'Look Ahead', icon: '🔭' }` tile (after Pets) + its `router.push('/lookahead')` route.
3. **`app/_layout.tsx`** — added `<Stack.Screen name="lookahead" ... />`.

**Decision held to:** in Step 2 the **Log** button only writes to history (date/time/label/note). **Advancing the due date to the next cycle (re-arm) is STEP 3** — Log does not move the date yet.

**Verification:** `tsc --noEmit` clean (0 errors). Simulator: Patrick added items across all four intervals (Phone Bill / Test 3 M → Monthly, Scripts Refilled → 3 Months, Heart Checkup → 6 Months, Furnace Filter → Yearly) and confirmed grouping, the add/edit modal, date/time steppers, and Repeat Every all render and work. Not exercised on a real device (no reminders in this step; first device gate is still **PHONE CHECKPOINT A** after Step 3).

**Files touched (#36):** `app/lookahead.tsx` (new), `app/home.tsx`, `app/_layout.tsx` (code); `docs/handoff.md` + `docs/parked-items.md` + `docs/pending.txt` (end-of-session refresh). Code + docs UNCOMMITTED → Patrick commits.

**➤ NEXT SESSION = "#37 Rebuild Step 3"** — STEP 3 of the BUILD PLAN: **Look Ahead reminders + re-arm.** Wire notifications for Look Ahead items (Monthly & Yearly can use iOS native repeats; 3/6-month have no native trigger → app re-arms a DATE one-shot each cycle from the item's due date), make Log/Done advance to the next cycle, and add the Delay = Day / Week / Month control. Test firing with near-future / shortened intervals in the Simulator. Then **PHONE CHECKPOINT A** (1 cloud build): To-Do one-shots + Look Ahead reminders fire and route on the real device.

---

## SESSION — #35 (2026-06-30) "Rebuild Step 1": STRIPPED RECURRENCE FROM TO-DO → one-time only. Code changed in `app/todo.tsx` + `app/_layout.tsx`; `tsc` clean; Simulator-validated. Committed (`c05da9a Rebuild Step 1 Done.`).

**Goal = STEP 1 of the Reminder Rebuild #34 BUILD PLAN** (`docs/reminder-audit.md`): make To-Do one-time only by removing all recurrence. No data to migrate (Patrick re-confirmed: no existing Monthly/Yearly tasks).

**What was done (code, two files):**
1. **`app/todo.tsx`** — removed the `RecurType` type, the `DAYS_IN_MONTH` constant, the `recurring`/`recurDay`/`recurMonth` Task fields + their form state + resets, the **Recurring picker UI** and its Monthly day-picker / Yearly month+day pickers, the **Monthly & Yearly blocks** in `scheduleReminders` (only the one-time DATE path remains), the **🔁 tile badge** (+ its now-dead `recurringText` style), and the recurrence matching in the **Week-Ahead** view. `completeTask` now always logs then removes the task (the recurring "keep + re-arm" branch is gone).
2. **`app/_layout.tsx`** — the To-Do **"Done"** notification handler dropped the monthly/yearly `scheduledFor` fallback and the "only delete if not recurring" guard; a To-Do Done now always logs + removes the task + cancels its alerts.

**Verification:** `tsc --noEmit` clean. Simulator: Patrick confirmed the New Task form shows **no Recurring row** and tiles show no 🔁 badge. Real-device check folded into **PHONE CHECKPOINT A**.

---

*Only the last two sessions are kept here. Older session detail isn't archived in the docs anymore — git history holds the full record.*
