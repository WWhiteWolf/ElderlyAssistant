# Hand-off note — paste at the start of the next session

## THIS SESSION — #64 (2026-07-06) "Polish 6 — App name & Home screen buttons"

**1. The "Elyfont" reminder-popup mystery — SOLVED, zero code.** The code and `app.json` have said "Remember When" since #54 (grep-verified; the only real "Elyfont" strings left are backup.tsx's file naming/wording and the inert Siri intent files). Patrick's lock-screen banners still said "Elyfont" while his icon label said "Remember When" → stale iOS name cache from a pre-#54 build. **A phone restart fixed it** — banners now say "Remember When". Nothing rides a build.

**2. NAME DECIDED (not built): App Store listing → "A Place To Remember"; icon label → "Remember".** The full name came to Patrick mid-test ("it hit me") and checked out free: App Store search on his phone shows nothing using it (web checks agreed). It won't fit under the icon (~13-14 char truncation, which Patrick rejected), so the icon label is the short "Remember" — noted and accepted that it sits visually near Apple's "Reminders".

**3. ICON DECIDED (not built): first custom icon** (replaces the Expo placeholder). Approved via mockup rounds: a line-drawn smiling face — "the happy face when you remember something good" — brick-red lines (`#b04a1a`) on gold (`#eec55a`), 4-point sparkle + small dot at the upper-right temple. Final art must be an edge-to-edge 1024×1024 square (iOS rounds the corners itself — no baked-in rounding). Same icon everywhere: Patrick declined notification-specific art (iOS can't swap the banner icon; the attachment-thumbnail workaround was offered and declined).

**4. BUILT + Simulator-approved (the session's one code change): crisp Home-tile outlines, halo dropped.** Patrick: the tiles "seem a little blurry" (both themes). Cause read from the code: 1.5px borders in near-fill colors plus the #56 halo glow. Fix: `Themes.ts` got a new `tileCircleBorderWidth` key (light **2** / dark **3**, Patrick's picks); light border `#43a297` → `#1a6e8a` (header teal), dark `#a3481f` → `#f0a83a` (the outlined-gold convention); `home.tsx`'s iconCircle reads the width key instead of the hard-coded 1.5. The halo was softened, nudged up twice, then turned **OFF** (Patrick: "That is the best") — `tileHaloOpacity: 0` in both themes, radius left in place; pre-#64 restore values if ever missed: light 0.75/10, dark 0.55/8. `tsc` clean.

**Phone-test status (#63 build, reported at session start): still mid-test, multi-day.** To-Do "2 Days Before" expected at noon today, Day/Night Before tomorrow, the rest over the following days. The #63 docs commit stays pending accordingly.

**Commit note:** #64 code (`Themes.ts` + `home.tsx`) + these docs NOT yet committed — Patrick commits.

**➤ NEXT SESSION — the RENAME PACKAGE (Patrick's call, all decisions already made):**
- `app.json` `"name"` → `"Remember"` (the icon label).
- The approved icon as `assets/images/icon.png` (Android variants + splash can follow later).
- In-app texts — the Home greeting and Settings' "Remember When v1.0": Patrick decides full name vs short.
- `backup.tsx` naming (the parked #48 half): the `Elyfont-Backup-<date>.json` filename, dialog/alert wording, and the internal `type: 'elyfont-backup'` marker — old backups MUST stay restorable. Pairs with the "name the backup folder" item (proof wants the real phone / iCloud).
- Patrick's own step, in the browser on the Mac: App Store Connect listing name → "A Place To Remember" (check Apple's current rules on when a name edit is allowed — not yet verified).
- Everything rides the next EAS build.

---

## SESSION — #63 (2026-07-05) "Orders Page": **The WHOLE Orders page was BUILT in one session — all six planned steps, each `tsc`-clean and Simulator-approved one at a time (Patrick's #63 structure: Simulator work first, phone-test work last). Banner fired and showed HERE/OK/Delay 15-30-60 in the Simulator. Phone judgment rides the next EAS build.**

**What was built, step by step (spec: #62, all Patrick's calls):**
1. **`DateTimeControl` gets `mode='date'`** (`components/DateTimeControl.tsx`): date-only face — time half hidden, validity ignores the time box. ~6 lines, the 6 existing pages untouched. **Decision (#63): NO pair machinery in the control** — the Orders window is two `mode='time'` controls in the form.
2. **Skeleton:** `app/orders.tsx` (new) + 📦 "Orders" as the 11th Home tile/route (`home.tsx`) + Stack.Screen (`_layout.tsx`). Taller-header standard, single 8px bridge (four-band rollout still parked), existing theme keys only throughout the whole page.
3. **New/Edit form + list:** "+ Add Order" header pill → popup (Cancel/Save up top, clock-safe padding). Fields: Item Name (only required one), Price, Store, Delivery Address, Order # — free text; "Expected By" on the new date-only face; time window hidden behind "+ Add Time Window" → Window Start/End time controls + "Remove Time Window" (defaults 12:00–5:00 PM). Save blocks on: no name, bad typed date/time, window end ≤ start. Storage `orders_items`, date+window as numbers. List sorted soonest-by-date first; row shows name / store · price / "By <date> · <window>" / address / order#; Edit button; swipe-delete.
4. **HERE + Arrivals Log:** HERE button (solid buttonPrimary, #51 mark-done rule) with a confirm alert → logs arrival (dated when tapped) + removes entry. "Arrivals Log" below the list: Look Ahead's log pattern (`orders_history`, 50-cap, entry "date | time | name (store)", tap-to-add-note, swipe-delete, Clear All). **Backup:** `orders_items` + `orders_history` added to `backup.tsx` READABLE_KEYS same-session (no #57-style miss).
5. **Reminders** (`orders.tsx`): page requests permission + sets handler (Look Ahead pattern); self-heals (re-arms from storage) on every open. Per entry, one-shot dated, only-if-future: day-before @ Settings Midday, morning-of @ Settings Morning, window-open, window-close (window ones only when a window is set). "Close only if HERE not tapped" = HERE/delete cancel everything pending for the entry (`cancelForItem`: sources 'orders' + 'orderssnooze'); edit cancels + re-arms. Settings times read as "HH:MM" (defaults 08:00/12:00, To-Do's pattern).
6. **Banner category** (`_layout.tsx`): `orderactions` = HERE (first, #62 watch rule), OK, Delay 15/30/60 — no Skip (orders don't recur). Banner HERE mirrors the page's (logs arrival dated at TAP time — Patrick's call that arrival = in hand; unlike the routine pages' fire-time dating), removes entry, cancels its pending reminders+snoozes. Snooze handler learned orders (re-banner "📦 Orders", source 'orderssnooze', keeps buttons). Plain tap routes to /orders.

**Simulator-verified live:** window-open banner fired on the minute; press-and-hold showed HERE/OK/Delay 15/30/60 in order; page HERE moved the entry to the Arrivals Log.

**Also built during the phone test (still #63): the FOUR-BAND BRIDGE ROLLOUT — done, Simulator-approved, then PHONE-VERIFIED the same day (Patrick built a second time: bridges on all 14 pages confirmed, hitSlop Edit/gear "easier to tap" confirmed).** New shared `components/Bridge.tsx`; Home switched onto it (pixel-identical); all 13 other pages swapped their single 8px strip for it; orphaned `bridge` styles + Home's unused `bridgeBottom` deleted. Future bridge changes are one edit. (Patrick promoted this from parked earlier the same session, then called for the build.)

**Added during Patrick's phone test (still #63):** he found the Edit buttons and Home's Settings gear hard to tap. Fix: `hitSlop` (invisible tap-widening to ~44-48px, NO visual change) on the Edit button in To-Do (both sites), Look Ahead, My Day, My Week, Pets, Planner, Vault, Orders — vertical 10, horizontal only 4 so neighboring buttons' tap areas don't collide — and on the Home gear (12/10). If his finger still argues after the next build, the escalation is drawing them bigger (like #62 did for the spinners). Phone-test results captured so far: all five #62 fixes PASS; Orders first reminder fired with the right buttons, Delay 15 dismissed it (re-banner + rest of checklist still in progress). "At time" stays gone (reaffirmed; old "fired early" test closed). Four-band bridge rollout PROMOTED to What's Next (his call).

**Commit note:** NOT yet committed — all #63 code + these docs. Patrick commits the CODE first and triggers the EAS "beat on" build (two-commit rhythm; docs commit follows the phone test).

**➤ NEXT: phone test of the build.** What rides it (also in pending.txt):
- Orders: day-before Midday + morning-of Morning timing; banner buttons on the real device (the #39 category-registration lesson — worked in Sim, lost one on device once); banner HERE end-to-end; window-open/close; snooze/Delay from the banner; tap-routing to the Orders page.
- Plus the #62 fixes' phone checks still owed (Done-first banners, four-band Home strip, header heights, bigger tiles, bigger spinners).

---

*Only the last two sessions are kept here. Older session detail isn't archived in the docs anymore — git history holds the full record.*
