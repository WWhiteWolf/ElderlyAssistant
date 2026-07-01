# Hand-off note — paste at the start of the next session

## THIS SESSION — #39 (2026-07-01) "Rebuild Step 4 (routine half)": ONE SHARED POPUP for My Day / My Week / Pets — new `routineactions` category (OK / Skip / Delay 15·30·60 / Done) wired in `_layout.tsx` and adopted by all three pages. Silent-snooze fixed; past-day Done guard added; My Week's banner "+1 Day" dropped (Patrick's call). `tsc` clean; all three popups Simulator-checked (screenshots). **All #39 code + docs UNCOMMITTED → Patrick commits.**

**Start-of-session fact:** working tree clean — all of #38 committed including docs (`4a431a8 Rebuild Step 4.4 #38 All of TO-DO`). Confirmed at session start. (Session is named "Rebuild Step 5" in the panel, but the actual goal became finishing Step 4 — the name is a misnomer.)

**Goal = STEP 4 of the Reminder Rebuild #34 BUILD PLAN, routine half:** fold My Day / My Week / Pets onto one shared popup. (To-Do deliberately excluded per #38; Timer excluded per #34.) **This completes Step 4** as far as the Simulator can take it — real-device confirmation still owed (checkpoints below).

**KEY DECISIONS (Patrick, #39):**
- **My Week's popup = identical to the other two.** The banner's old "+1 Day" button is gone; postponing still lives on the page itself (on-tile Postpone untouched).
- **Skip semantics:** dismiss + cancel the item's still-pending one-offs (snoozes / a My Week postpone) so it stops nagging this round; nothing marked done, nothing logged; base DAILY/WEEKLY repeat untouched, so it returns next cycle.
- **NEXT SESSION = structured reminder tests.** Patrick: "There are too many of too many kinds to keep track of" — next session is devoted to building an organized test checklist for ALL reminder kinds (To-Do one-shots, My Day/Pets daily, My Week weekly + postpone, Look Ahead long-lead, the new shared popup buttons, past-day rules). Natural fit: fold Phone Checkpoints A+B into it.
- **New standing rule (in session-start.md): step reports use the "what → how" shape** — 1–2 plain sentences of WHAT happened, then short bullets on HOW.

**What was done (5 small steps, built + reviewed one at a time):**
1. **Silent-snooze fix** (`_layout.tsx`) — banner-tapped Snooze/Delay reschedules now carry `sound: 'default'` (audit item #1; on-page snooze already had it).
2. **Shared category + new behaviors** (`_layout.tsx`) — registered `routineactions` (OK / Skip / Delay 15·30·60 / Done); new `skip` handler; **past-day guard on Done** (My Day/Pets: a banner fired on a past day logs the past completion but does NOT check off today; My Week: same idea per weekly cycle via last-occurrence math); Delay handler taught about My Week (`myweeksnooze` source + "Weekly Chore" title + routing); a delayed popup keeps the button set of the popup it came from.
3. **My Day switched over** (`myday.tsx`) — scheduled + on-page-snooze popups now use `routineactions`. Simulator-checked.
4. **Pets switched over** (`mollie.tsx`) — same two-line change. Simulator-checked.
5. **My Week switched over** (`myweek.tsx`) — weekly + postpone popups now use `routineactions`; old `postpone1`/`myweekactions` handler code left in place harmlessly for pre-switch banners. Simulator-checked.

**Verification:** `tsc --noEmit` clean after every step. Simulator (Patrick, screenshots): all three pages' popups show the six shared buttons. **NOT device-tested / not Simulator-testable:** sound actually playing, past-day guard (needs an overnight leftover popup), real lock-screen button behavior, tap-routing → all owed to the phone checkpoints / the structured test session.

**Also this session (docs):** the "per-appointment reminder time" item was moved out of "decisions to make" into "parked on purpose" in both pending.txt and parked-items.md (it was already decided — global only — and the old placement confused Patrick).

**Files touched (#39):** `app/_layout.tsx`, `app/myday.tsx`, `app/mollie.tsx`, `app/myweek.tsx` (code); `docs/session-start.md` (new reporting rule), `docs/handoff.md`, `docs/parked-items.md`, `docs/pending.txt`. **All UNCOMMITTED → Patrick commits.**

**➤ NEXT SESSION — Patrick's declared pick: STRUCTURED REMINDER TESTS.** Build one organized test checklist covering every reminder kind, then work through it (Simulator where possible; batch the rest into the phone checkpoints). Still queued behind it:
- **PHONE CHECKPOINTS A + B** (cloud build) — likely folded INTO the structured test plan.
- **STEP 5 — Integrate Watch List** as a home page (no notifications).

---

## SESSION — #38 (2026-06-30) "Rebuild Step 4 (To-Do half)": To-Do given its OWN self-contained reminder structure — not folded into the unified popup. New settable **Midday** time; rebuilt To-Do reminder presets; To-Do now sets up its own permission + handler; To-Do popup trimmed to **OK + Done**. `tsc` clean; Simulator-checked. Committed (`4a431a8` + 3 prior).

**KEY DECISION (Patrick, #38) — To-Do is NOT unified with the others.** A To-Do is a fixed one-time appointment: it can't be "done late," and it can't be delayed — if the time changes you delete it and make a new one. To-Do got its **own** complete reminder structure (own permission + handler, **no Delay/Snooze**, just **OK + Done**). The unified-popup consolidation was narrowed to the three repeating pages — completed in #39 above.

**What was done:** (1) Settings + backup: third settable time **"Midday"** (`reminder_midday_time`, default 12:00). (2) To-Do presets rebuilt: removed "At time"; new list = 1 hour · 2 hours · Morning of · Day Before (midday) · Night Before (evening) · 2 Days Before (midday) · Week · Month; Day Before / Night Before toggle independently. (3) To-Do now requests its own permission + sets its own handler on load. (4) `todosnooze` category trimmed to OK + Done (id kept — now a misnomer, cosmetic).

**Verification:** `tsc` clean; Simulator-checked presets. **NOT device-tested:** notification firing, OK/Done on a real lock screen, sound, tap-routing (soonest preset is now "1 hour before," so quick-fire Simulator tests aren't easy).

---

*Only the last two sessions are kept here. Older session detail isn't archived in the docs anymore — git history holds the full record.*
