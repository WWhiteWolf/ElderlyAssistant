# Hand-off note — paste at the start of the next session

## THIS SESSION — #59 (2026-07-04) "Polish 4": **Look Ahead is on the shared date/time control — `tsc` clean, Patrick Simulator-approved ("That works"). PLUS an empty-box fix inside the control itself (To-Do inherits it). AND the plan was reset: the next EAS build is the "beat on" build — everything below lands BEFORE it.**

**What changed:**
- **`app/lookahead.tsx`:** the New/Edit popup's inline Month/Day/Year + Hour/Minute/AM-PM spinners are GONE, replaced by `<DateTimeControl>` with labels **"First Due Date" / "Time"** (Patrick kept the page's existing wording, not To-Do's). Validity flag resets on open; a bad typed value blocks Save with To-Do's exact "Check Date & Time" alert. Dead spinner helpers + six unused styles removed (`MONTH_NAMES` / `daysInMonth` KEPT — tiles and re-arm still use them, grep-verified). Storage (already numbers), reminders, re-arm, delay: untouched.
- **`components/DateTimeControl.tsx` — empty-box fix (Patrick found it in Simulator):** typing a bad value went red and blocked Save (correct), but CLEARING the box left it red with Save stuck. Now an empty box means "never mind what I typed": it counts as valid (the spinners always hold a real value), the red clears the moment the box empties, and tapping away refills the box from the spinners. Applied to BOTH boxes (date and time) — To-Do gets it too, and the time-only pages inherit it from day one.

**➤ THE PRE-BUILD PLAN (Patrick, #59 — supersedes #58's "build next" order):** the next EAS build is the one Patrick "can beat on" — ALL of this lands before it, in this order:
1. **To-Do storage conversion to numbers — NEXT SESSION.** Patrick's long-run call: separate numbers (year/month/day/hour/minute, Look Ahead's pattern) are the app-wide standard; To-Do is the last real string outlier (`dueDate`/`dueTime`). Old data carries no weight (his standing rule) — NO compat code; old tasks open through the existing today-noon fallback until edited. Its own session because the read points include reminder scheduling — the heart of the app.
2. **The three #58 form items** (details in parked-items.md): remove Priority entirely, remove Status entirely, add the "30 min." reminder preset.
3. **Time-only rollout: My Day, My Week, Pets, Settings** — light wiring (`mode='time'` was built for them), plausibly two pages a session.
4. **THEN the EAS build**, carrying everything from #56 on; the whole "NEEDS A PHONE TEST" list in pending.txt gets judged on it. BUILD POLICY stands (#50): no per-session builds — Patrick handles Expo billing.

**Commit note:** NOT yet committed — code (`app/lookahead.tsx`, `components/DateTimeControl.tsx`) + these docs. Patrick commits.

**➤ NEXT SESSION — pick up here:** item 1 above, the To-Do storage conversion to numbers.

---

## SESSION — #58 (2026-07-04) "Polish 3": **The shared date/time control is BUILT and To-Do is converted — `tsc` clean, Patrick Simulator-approved ("That looks good"). The single-digit padding bug is dead at its source.** COMMITTED. NEW `components/DateTimeControl.tsx` (Look Ahead's spinners sized down + type-in boxes; date MM/DD/YY, time 24-hour typed / 12-hour AM-PM spun; auto-padding on blur; invalid → red border + `onValidityChange`; `mode='time'` ready; themed both palettes, existing keys; exports `formatDateMMDDYY` / `formatTime24`). `app/todo.tsx` converted: typed boxes gone, date AND time required, new task opens today-noon, invalid blocks save ("Check Date & Time"), the #55 fold-in ("Are you sure you don't want to set a Reminder?" Go Back / Save Anyway) on both save paths; old tasks open via `storedToDate` fallback. Reminders machinery untouched. Three NEW To-Do form items scoped and PARKED (now item 2 of the #59 pre-build plan).

---

*Only the last two sessions are kept here. Older session detail isn't archived in the docs anymore — git history holds the full record.*
