# Hand-off note — paste at the start of the next session

## THIS SESSION — #41 (2026-07-01) "Rebuild Step 5": **STEP 5 DONE — Watch List integrated** as a home page, Simulator-validated by Patrick (screenshots). Port of the standalone `Projects/WatchList` app; no notifications. Patrick also raised **7 new backlog items** at session end (recorded in parked-items.md / pending.txt). `tsc` clean. **All #41 code + docs UNCOMMITTED → Patrick commits.**

**Start-of-session fact:** #40 was still uncommitted at session start (expected — docs said "Patrick commits"); Patrick committed it at session start (`db57791 Reminder organization review #40`), leaving a clean tree before Step 5 began.

**What was done (3 steps, one at a time, each `tsc`-clean):**
1. `app/watchlist.tsx` — NEW. The three standalone files (`App.js` / `useWatchListState.js` / `types.js`) combined into one TypeScript page. Behavior unchanged: add movie / TV show with a provider tag (YouTube TV, Netflix, Paramount, HBO); movies toggle To Watch ↔ Watched ("Mark Seen" / "Watch Again"); shows track season/episode (+Ep / +Seas, season bump resets episode to 1). **Restyled to match the app** (Patrick's call): blue header + ← Home pill, bridge stripe, white cards, blue buttons. Same storage keys as the standalone app (`watchlist_movies`, `watchlist_shows`) — no overlap with other app data. **No notification code.**
2. `app/home.tsx` — 🎬 "Watch List" tile (after Project Planner, before Vault) + route.
3. `app/_layout.tsx` — one `Stack.Screen name="watchlist"` line.

**Verification:** `tsc --noEmit` clean after each step. Simulator (Patrick, screenshots): tile shows and opens the page; blue styling right; added a movie (ET) and a show (Monk); Mark Seen flipped to Watched/"Watch Again"; +Ep/+Seas stepped to S2 E3 with the correct episode reset. **Not phone-tested** — a quick Watch List once-over is batched into the phone checkpoints. NOTE: `watchlist_movies` / `watchlist_shows` are NOT yet in backup.tsx's key list — Watch List data won't be in backups until that's added (parked).

**NEW BACKLOG ITEMS (Patrick, end of #41)** — all recorded in parked-items.md + pending.txt, none built:
1. **Name the backup folder — PROMOTED**, Patrick wants it done (was nice-to-have).
2. To-Do Custom-Category cancel bug — already tracked; now expected to **vanish via item 6**.
3. **NEW: Import files/docs into Vault.**
4. My Day: banner Done on *yesterday's* reminder checked off *today's* — most likely the phone's older TestFlight build (the #39 past-day guard isn't device-tested yet). Patrick tracks it; folded into the structured tests.
5. **NEW: Look Ahead New/Edit popups — move Cancel & Save up near the input** (like To-Do's).
6. **NEW: Remove Categories from To-Do entirely** (kills bug 2 with it).
7. **NEW: Done button should toggle back (un-check) in My Day, Pets, AND My Week.**

**➤ NEXT SESSION — Patrick picks the goal.** Still queued:
- **STRUCTURED REMINDER TESTS** (open since #39) — now also covering item 4 above.
- **PHONE CHECKPOINTS A + B** (cloud build) — buttonless To-Do banner (#40) + a quick Watch List once-over (#41).
- The 7 items above, in whatever order Patrick chooses.

---

## SESSION — #40 (2026-07-01) "Reminder organization & Test": DESIGN REVIEW of each page's reminder machinery (goal corrected at session start — NOT the test-checklist build the #39 notes predicted). Result: **To-Do banners now carry NO buttons**; My Day / My Week / Pets reviewed and kept as-is (Patrick's calls). `tsc` clean. Committed at the start of #41 (`db57791`).

**KEY DECISIONS (Patrick, #40):**
- **To-Do banner = no popup, no buttons at all.** Patrick's reasoning: a To-Do is a one-time appointment — he wants EVERY set reminder to fire, the banner's only job is to remind, and nothing changes until after he attends anyway; Done happens in-app afterward. Code review backed it: banner-Done was redundant (in-app `completeTask` does the same: log + remove + cancel remaining alerts) and counterproductive (Done on an early preset, e.g. Day Before, would cancel the later reminders he set). Swipe dismisses; tapping the banner body still opens the app to To-Do.
- **My Week stays as-is** — after reviewing all four parts (weekly base, six-button popup, on-page Postpone, on-page Log). Clarified in review: Postpone and Delay are the same one-off mechanism at different scales (days vs minutes); OK and Skip are identical UNLESS a snooze/postpone is pending — Skip also wipes those pending one-offs.
- **My Day and Pets stay as-is** (reviewed My Day's machinery; Pets is its twin).
- **Look Ahead, Timer, Project Planner: not reviewed** — Patrick ended the session before those.

**What was done (one change, discussed first):**
1. `app/todo.tsx` — removed `categoryIdentifier: 'todosnooze'` from reminder scheduling; comment records the reasoning. New To-Do banners carry no button set.
2. `app/_layout.tsx` — removed the `todosnooze` category registration (OK + Done); the old banner Done handler code left in place harmlessly for banners scheduled before the change.

**Verification:** `tsc --noEmit` clean. Not practically Simulator-testable (soonest To-Do preset is "1 hour before") — confirming the buttonless banner on a real phone is batched into the phone checkpoints. Note: banners scheduled BEFORE this change may still show OK/Done until they cycle out.

---

*Only the last two sessions are kept here. Older session detail isn't archived in the docs anymore — git history holds the full record.*
