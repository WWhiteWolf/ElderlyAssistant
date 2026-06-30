# Hand-off note — paste at the start of the next session

## THIS SESSION — #37 (2026-06-30) "Rebuild Step 3": WIRED LOOK AHEAD REMINDERS + RE-ARM, plus a delay tile-line and an on-tile Delay button. Code in `app/lookahead.tsx` + `app/_layout.tsx`; `tsc` clean; Simulator-validated. Code UNCOMMITTED → Patrick commits.

**Start-of-session fact:** working tree clean — all of #36 committed (`434845c Rebuild Step 2 #36 Done`). Confirmed at session start.

**Goal = STEP 3 of the Reminder Rebuild #34 BUILD PLAN** (`docs/reminder-audit.md`): give the Look Ahead page its reminders — schedule notifications, make Done roll each item to its next date, and add a long-lead Delay (Day / Week / Month). Simulator-first; the real-device gate is **PHONE CHECKPOINT A** (still pending).

**Key decision (Patrick, this session):** use ONE uniform mechanism for all four intervals — NOT the spec's split (native repeats for Monthly/Yearly, re-arm for 3/6-month). Every item is a single dated reminder that the app re-arms; the page self-heals on load. **Items only advance when marked done — never auto-roll on load.**

**What was done (code, two files):**
1. **`app/lookahead.tsx`** — on open: request permission + set the handler (mirrors Pets) + `scheduleAll` (cancel this page's own `source:'lookahead'` reminders, then schedule one `DATE` reminder per item whose due date/time is still future). Reschedules on add / edit / delete so the page stays self-healing. The on-screen **Log** button now also rolls the item forward (`advanceItem` adds the interval's months, repeating until the date is in the future, clamping to the anchor day) and re-arms — in Step 2 Log only wrote history. New `lookaheadactions` category buttons handled.
2. **`app/_layout.tsx`** — registered the **`lookaheadactions`** category (Done, Delay 1 Day / 1 Week / 1 Month). **Done** (source `lookahead`/`lookaheaddelay`): logs the completion fire-time-dated, advances the item to its next future date, cancels that item's base + delayed reminders, arms the next one. **Delay** buttons: push just that one reminder out a day/week/month from now (tagged `lookaheaddelay` so reschedule-on-load leaves it alone), replacing any prior delay. Plain tap routes to `/lookahead`.
3. **Delay add-ons (Patrick asked mid-session):** item gained `delayedUntil` + `delayedLabel`. Both the banner Delay (handled in `_layout.tsx`) and a new **on-tile Delay button** (orange, between Edit and Log, with a Day/Week/Month picker mirroring Pets' Snooze) stamp them, and the tile shows an orange **"▶ Delayed 1 day/1 week/1 month"** line. The stamp clears when the item is marked done, when it's edited, or once the delayed time has passed (swept on load).

**Verification:** `tsc --noEmit` clean (0 errors). Simulator (Patrick): a Look Ahead reminder fired showing Done + the three Delay buttons; **Done** logged it and rolled Phone Bill Jun 30 → **Jul 30** (stayed on the list, logged from fire time); **Delay 1 Day** from the banner dismissed without logging; the **"▶ Delayed …"** line appears from both the banner and the on-tile button; the three row buttons (Edit / Delay / Log) fit even on the wrapped "Furnace Filter Replacement". Not yet on a real device — first device gate is **PHONE CHECKPOINT A**.

**Files touched (#37):** `app/lookahead.tsx`, `app/_layout.tsx` (code); `docs/handoff.md` + `docs/parked-items.md` + `docs/pending.txt` (end-of-session refresh). Code + docs UNCOMMITTED → Patrick commits.

**➤ NEXT SESSION** — two things outstanding from the BUILD PLAN, Patrick's pick:
- **PHONE CHECKPOINT A** (1 cloud build): confirm on the real device that To-Do one-shots + Look Ahead reminders fire, route on tap, and the Done/Delay buttons behave. This is the device gate that Steps 1–3 have been deferring.
- **STEP 4 "Unified popups"** [Simulator]: one shared helper + the same OK / Skip / Delay / Done behavior across To-Do, My Day, My Week, Pets (popups only; Timer excluded) → then **PHONE CHECKPOINT B**.

---

## SESSION — #36 (2026-06-30) "Rebuild Step 2": BUILT THE "LOOK AHEAD" PAGE. New `app/lookahead.tsx` + home tile/route + `_layout.tsx` Stack.Screen; `tsc` clean; Simulator-validated. NO notification code (reminders + re-arm were STEP 3, now done in #37). Committed (`434845c Rebuild Step 2 #36 Done`).

**Goal = STEP 2 of the Reminder Rebuild #34 BUILD PLAN:** build the new **Look Ahead** home-screen page — page + home tile + route + add/edit form + Monthly / 3 Months / 6 Months / Yearly subheadings + its own history. Simulator-first. Reminders explicitly NOT part of this step.

**What was done (code, three files):**
1. **`app/lookahead.tsx`** (new) — built in the Pets (`mollie.tsx`) style: header, items grouped under four subheadings shortest-first (Monthly → 3 Months → 6 Months → Yearly), each row = label + first-due date + time, with Edit / Log / swipe-to-delete / tap-to-select reorder (reorder swaps only within the item's own interval group). Add/Edit modal = Name + a Date stepper + Time stepper + Repeat-Every selector. Own Look Ahead Log + Clear All + per-entry swipe-delete + note-edit. Item model `{id,label,year,month,day,hour,minute,interval}`; storage keys `lookahead_items` + `lookahead_history`.
2. **`app/home.tsx`** — added a `{ id: 'lookahead', label: 'Look Ahead', icon: '🔭' }` tile + its route.
3. **`app/_layout.tsx`** — added `<Stack.Screen name="lookahead" ... />`.

**Verification:** `tsc` clean. Simulator: Patrick added items across all four intervals and confirmed grouping, the add/edit modal, date/time steppers, and Repeat Every. (Reminders were added in #37.)

---

*Only the last two sessions are kept here. Older session detail isn't archived in the docs anymore — git history holds the full record.*
