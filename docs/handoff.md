# Hand-off note — paste at the start of the next session

## THIS SESSION — #38 (2026-06-30) "Rebuild Step 4 (To-Do half)": To-Do given its OWN self-contained reminder structure — not folded into the unified popup. New settable **Midday** time; rebuilt To-Do reminder presets; To-Do now sets up its own permission + handler; To-Do popup trimmed to **OK + Done**. `tsc` clean; Simulator-checked the new preset buttons. Steps 1–3 committed; **Step 4 code (`_layout.tsx`) + docs UNCOMMITTED → Patrick commits.**

**Start-of-session fact:** working tree clean — all of #37 committed (`75e29ba Rebuild Step 3 #37`). Confirmed at session start.

**Goal = STEP 4 of the Reminder Rebuild #34 BUILD PLAN** ("Unified popups"). After discussion it was **reshaped** (see decision below): this session did the **To-Do half**. The routine-page consolidation is still ahead.

**KEY DECISION (Patrick, #38) — To-Do is NOT unified with the others.** A To-Do is a fixed one-time appointment: it can't be "done late," and it can't be delayed — if the time changes you delete it and make a new one. Patrick's past trouble came from To-Do *riding on* the other pages' notification setup (To-Do never requested permission or set the handler — confirmed in code; My Day/Pets did it). So To-Do gets its **own** complete reminder structure (own permission + handler, **no Delay/Snooze**, just **OK + Done**). The unified-popup consolidation now applies only to the three repeating pages — **My Day, My Week, Pets** (Timer still excluded).

**What was done (4 small changes, built + reviewed one at a time):**
1. **Settings + backup** (`app/settings.tsx`, `app/backup.tsx`) — added a third settable time **"Midday"** (`reminder_midday_time`, default 12:00) between Morning and Evening, with its own picker + hint; included in backups. **[committed]**
2. **To-Do presets** (`app/todo.tsx`) — removed **"At time"**; new list = **1 hour · 2 hours · Morning of · Day Before (midday) · Night Before (evening) · 2 Days Before (midday) · Week · Month**. Added `'midday'` to the `timeOfDay` types and wired it into `scheduleReminders` (reads `reminder_midday_time`). Fixed preset match/toggle to key on `timeOfDay` too, since **Day Before** and **Night Before** share `daysBefore: 1` — they now toggle independently (Patrick confirmed via screenshot). **[committed]**
3. **To-Do own permission + handler** (`app/todo.tsx`) — the load `useEffect` now calls `requestPermissionsAsync` + `setNotificationHandler` (mirrors `lookahead.tsx`), so opening To-Do directly no longer depends on My Day/Pets. **[committed]**
4. **To-Do popup** (`app/_layout.tsx`) — `todosnooze` category trimmed to **OK + Done** (Snooze 15/30/60 removed). Category id kept as `todosnooze` (now a misnomer — cosmetic, could rename later). The shared snooze handler is left intact for My Day/Pets; To-Do's `done`/`ok` handlers unchanged (Done still logs + removes the one-time task). **[UNCOMMITTED → Patrick commits]**

**Verification:** `tsc --noEmit` clean after every step. Simulator (Patrick): new reminder buttons render and Day Before / Night Before toggle independently (screenshots). **NOT device-tested:** notification firing, the OK/Done buttons on a real lock screen, sound, tap-routing. Note: with "At time" gone, a quick-fire Simulator test isn't easy (soonest preset is 1 hour before) — **Patrick will test on his phone.**

**Files touched (#38):** `app/settings.tsx`, `app/backup.tsx`, `app/todo.tsx`, `app/_layout.tsx` (code); `docs/handoff.md` + `docs/parked-items.md` + `docs/pending.txt` (end-of-session refresh). Step 4 code + docs UNCOMMITTED → Patrick commits.

**➤ NEXT SESSION** — Patrick's pick:
- **PHONE CHECKPOINTS A + B** (cloud build): the big device test Patrick is about to do — confirm To-Do one-shots + Look Ahead reminders fire and route, and that the To-Do popup's OK/Done behave on a real lock screen. Patrick said he "has a lot of testing to do."
- **STEP 4, routine half** [Simulator]: fold **My Day / My Week / Pets** onto one shared popup helper (OK / Skip / Delay / Done). To-Do is now deliberately out of this.
- **STEP 5 — Integrate Watch List** as a home page (no notifications).

---

## SESSION — #37 (2026-06-30) "Rebuild Step 3": WIRED LOOK AHEAD REMINDERS + RE-ARM, plus a delay tile-line and an on-tile Delay button. Code in `app/lookahead.tsx` + `app/_layout.tsx`; `tsc` clean; Simulator-validated. Committed (`75e29ba Rebuild Step 3 #37`).

**Goal = STEP 3 of the Reminder Rebuild #34 BUILD PLAN:** give the Look Ahead page its reminders — schedule notifications, make Done roll each item to its next date, and add a long-lead Delay (Day / Week / Month).

**Key decision (Patrick, #37):** use ONE uniform mechanism for all four intervals — every item is a single dated reminder the app re-arms; the page self-heals on load. **Items only advance when marked done — never auto-roll on load.**

**What was done:** `app/lookahead.tsx` — on open: request permission + set the handler + `scheduleAll`; reschedules on add/edit/delete; the Log button now also rolls the item forward (`advanceItem`) and re-arms. `app/_layout.tsx` — registered the `lookaheadactions` category (Done, Delay 1 Day/Week/Month); Done logs + advances + re-arms; Delay buttons push just that one reminder out (tagged `lookaheaddelay`). Item gained `delayedUntil`/`delayedLabel` + an on-tile orange Delay button and a "▶ Delayed …" tile line that clears on done/edit/once passed.

**Verification:** `tsc` clean. Simulator (Patrick): a Look Ahead reminder fired with Done + three Delay buttons; Done rolled Phone Bill Jun 30 → Jul 30; the "▶ Delayed …" line appears from both the banner and the on-tile button. Not yet on a real device — first device gate is **PHONE CHECKPOINT A**.

---

*Only the last two sessions are kept here. Older session detail isn't archived in the docs anymore — git history holds the full record.*
