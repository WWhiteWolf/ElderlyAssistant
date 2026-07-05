# Hand-off note — paste at the start of the next session

## THIS SESSION — #62 (2026-07-05) "New Order & Delivery Page": **Patrick's "beat on" phone build HAPPENED between sessions — he tested on the phone and brought back 5 issues; 4 were FIXED this session (each Simulator-approved one at a time), 1 documented as Still Broken. Then the whole session's second half was the talk-through SPEC for the new "Orders" page — next session BUILDS it.**

**The 5 phone-test issues and what was done:**
1. **Look Ahead banner-Delay doesn't show "▶ Delayed" on the tile — NOT fixed, documented** as Still Broken (parked-items.md "Bugs" + pending.txt). Code-read diagnosis: `lookahead.tsx` only re-reads storage on MOUNT, so a banner delay stamped by `_layout.tsx` while the page is mounted never shows and can be overwritten. Fix shape: `useFocusEffect`. (Also verified: Delay writing no log entry is BY DESIGN.)
2. **Done now FIRST on routine banners** (`_layout.tsx`, `routineactions`: Done, OK, Skip, Delay 15/30/60) — Patrick's watch shows the buttons as a scrolling list and Done sat last. Old-order banners persist until they cycle out.
3. **Bridge redesign + header heights.** Home's 8px bridge is now FOUR 3-4px bands: page-color, bridge-color, page-color, bridge-color (Patrick iterated to this in the Simulator; dark band dropped). **Home only — rollout to the other 12 pages is PARKED** (plus unused `bridgeBottom` style cleanup). AND: Settings/Pets/Watch List/Vault headers were shorter than the rest (they had `edges={['top']}`; seven pages default to all edges). Patrick standardized on the TALLER look: those four lost `edges={['top']}` and their 8-12px header paddingBottom. Home + Look Ahead deliberately untouched (their 2nd line gives them height).
4. **Home tiles ~10% bigger** (for the phone, not the Sim): circle 44→48, emoji 22→24, cart icon 22→24 (`home.tsx`); label 18→20 both themes, halo radius 9→10 / 7→8 (`Themes.ts`). Watch how longer names wrap at 20 on the phone.
5. **Date/time spinner circles bigger + easier to tap** (`DateTimeControl.tsx`, all 6 pages at once): 34→40px, arrows 15→18pt, plus `hitSlop` 5 → ~50px tappable. Knock-on fixes, both Simulator-approved: To-Do New/Edit popup maxHeight 98→92% (`todo.tsx`) and Look Ahead New/Edit overlay paddingVertical 20→40 (`lookahead.tsx`) — both popup tops had crowded the clock/notch zone.

**Commit note:** NOT yet committed — all of the above + these docs. Patrick commits.

**➤ NEXT SESSION — the goal is set: BUILD the "Orders" page.** Full spec, all Patrick's calls (#62):
- **Home tile:** 📦 "Orders" (11th tile).
- **One entry PER ITEM** (a multi-item order = several entries): item name, price, store name, delivery address, order# (optional, reference only), expected **"by" date** (all he has at order time), and a **start/end time window** added by hand later when the store narrows it. He updates the date/window manually as estimates sharpen.
- **HERE button** on each entry: tap when the package arrives → arrival is logged, entry leaves the list.
- **Reminders per entry**, re-armed whenever the entry is edited: day-before at the Settings **Midday** time; morning-of at the Settings **Morning** time; **window-open** and — only if HERE not yet tapped — **window-close**, at the entered window times. Date-only = just the first two.
- **Banner buttons** (new category, register in `_layout.tsx` sequentially like the rest): **HERE, OK, Delay 15 / 30 / 60 min** — Done→HERE mapping of `routineactions`, Skip dropped (orders don't recur).
- **Build notes:** needs a **date-only face + a start/end time pair** added to the shared `DateTimeControl` (it does datetime and time-only today); storage as numbers (the app-wide standard); a log like the other pages'. Biggest build since Look Ahead — take it in steps.

---

## SESSION — #61 (2026-07-04) "Date/Time control — My Week & Pets Day" (grew to all four): **The time-only rollout is COMPLETE — My Week, Pets Day, My Day, AND Settings all got `<DateTimeControl mode='time'>` — `tsc` clean after each page, each Simulator-approved by Patrick one at a time. The #58 shared-control plan is fully done.**

**What changed (four files, same six-edit pattern each):**
- **`app/myweek.tsx`, `app/mollie.tsx`, `app/myday.tsx`:** the ~80-line inline Hour/Minute/AM-PM spinner block in each New/Edit popup replaced by `<DateTimeControl mode="time" timeLabel="Time">`; new `pendingTimeValid` flag set true whenever the popup opens (New AND Edit paths); Save blocked with the "Check Time — fix the box outlined in red" alert while a typed time isn't real; orphaned `timeAdjBtn`/`timeAdjText`/`timeDisplayText` styles deleted. Storage untouched — all three already keep `hour`/`minute` as numbers.
- **`app/settings.tsx`:** same treatment on the ONE shared time popup serving Morning/Midday/Evening; guard at the top of `saveTime`; flag set in `openTimeEditor`. Storage deliberately untouched — `saveTime` still writes the padded "HH:MM" strings.
- **Housekeeping note:** the `timeStepper`/`timeStepperBorder`/`timeStepperText` theme keys have NO users. Left in `Themes.ts` on purpose — removing theme keys is its own small decision. Parked.
- **This closed the #58 plan end to end:** To-Do (#58), Look Ahead (#59), To-Do number storage (#60), the four time-only pages (#61).

**Commit note:** COMMITTED (`6decf17`, code + docs). The "beat on" EAS build followed and Patrick phone-tested it — results are session #62 above.

---

*Only the last two sessions are kept here. Older session detail isn't archived in the docs anymore — git history holds the full record.*
