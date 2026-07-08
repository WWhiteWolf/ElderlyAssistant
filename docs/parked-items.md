# Parked items — running backlog (open work only)

Future / deferred work for "Remember When." Not for the current session — the active
goal lives in `handoff.md`. Pull an item from here when you're ready to take it on;
move it back into `handoff.md` once it's the live goal. Add new ideas as they come up.

This file holds only still-open work. Finished items aren't archived in the docs —
git history keeps the full record.

Last updated: 2026-07-07 (session #66 — the MEMORY TEST page was
built: five learning rounds + 5-minute recall, 🧠 Home tile,
banner routing, backup keys. New parked items below.)

---

## MEMORY TEST — later ideas (page built #66)

- **Mask-start marker + trend view.** When Patrick starts sleeping with
  the PAP mask, record that date so the score history splits visibly
  into before-mask / after-mask — maybe a simple chart once enough
  days accumulate. Talk-through first.
- **Spoken words (audio) option.** The clinical tests read the words
  aloud. Deliberately skipped — Patrick had trouble with audio in an
  earlier attempt, and displayed text kept the test dependable and
  consistent. Revisit only if he asks.

---

## SHARED DATE/TIME CONTROL ROLLOUT (#58 plan, Patrick's call #57) — ✅ COMPLETE (#61)

One shared component — **BUILT in #58: `components/DateTimeControl.tsx`**
(Look Ahead's spinners sized down + a type-in box under each group;
typed input auto-padded/validated; `mode='time'` ready for the
time-only pages; themed both palettes, no new keys). One page per
session, like the theme rollout:

1. ✅ **DONE (#58) — To-Do**: typed date/time fields replaced by the
   control; date AND time now required; single-digit bug killed at
   the source; the "no reminder set" confirm is in (Go Back / Save
   Anyway). Simulator-approved; phone judgment rides the next build.
2. ✅ **DONE (#59) — Look Ahead**: inline spinners swapped for the
   shared control (labels "First Due Date" / "Time"); bad typed value
   blocks Save; dead spinner code removed. Plus the empty-box fix in
   the control itself (clearing a bad entry snaps back to the
   spinners — To-Do inherits it). Simulator-approved.
3. ✅ **DONE (#61) — My Week, Pets Day, My Day, Settings** (all four
   in one session): each inline Hour/Minute/AM-PM spinner block
   replaced by `<DateTimeControl mode='time'>`; bad typed time blocks
   Save ("Check Time" alert); orphaned spinner styles deleted.
   Storage untouched everywhere (the routine trio already stored
   numbers; Settings keeps its padded "HH:MM" strings). Each page
   `tsc`-clean and Simulator-approved individually. Phone judgment
   rides the "beat on" build.

✅ **DONE (#60) — To-Do storage conversion to numbers.** `dueDate`/
`dueTime` strings replaced by year/month/day/hour/minute (Look Ahead's
pattern); no compat code — old string tasks ride the today-noon
fallback until edited. Simulator-approved (banner fired on the
minute). (Still noted: Settings' "08:00" strings are harmless —
written only by controlled buttons — could be aligned later for
consistency. And `_layout.tsx`'s dead old To-Do banner-Done handler
still reads the strings harmlessly — goes with the parked popup-
plumbing retirement below.)

Old entries stored with single digits stay as-is (Patrick, #57:
"Old data is not a concern") — no belt-and-braces padding at the
read points.

---

## TO-DO FORM SLIM-DOWN + 30-MIN PRESET — ✅ COMPLETE (#60)

All three parts built and Simulator-approved in #60, exactly as
scoped in #58: Priority removed entirely (theme keys stay for the
Planner), Status removed entirely (the tile's green Done is the one
way to complete), and the "30 min." preset sits before "1 hour".
Old stored priority/status values are simply ignored on load (the
#42 categories treatment). #60 also added popup polish on top:
title gap tightened, popup taller (98%), scroll hint removed,
Reminders moved up under the date/time (they were getting forgotten
at the bottom), Notes last with a "↓" on its label and a ~3-line
starting height. DECIDED AGAINST (Patrick, #60): moving the type-in
boxes' direction lines into placeholders — don't re-raise.

---

## TWO-THEME ROLLOUT (was "dark theme rollout"; rescoped #45) — ✅ COMPLETE (#53): all 13 pages converted

Patrick's call (#45): the light theme is NOT going away — every page gets
BOTH themes, shared via `constants/Themes.ts` (both palettes, same keys),
switched later by a Settings toggle (see Nice-to-have). Converting a page
now means: agree its light + dark treatment (mockups first if it has new
elements), wire it to `useTheme()` + the `makeStyles(theme)` pattern that
`home.tsx` demonstrates, and add any new keys to BOTH palettes. One file
(or small pair) per session, `tsc` clean + Simulator-checked in BOTH themes
before moving on. **The Settings toggle EXISTS as of #48** (Appearance →
App Colors, saved on the phone) and as of #53 switches EVERY page live —
no page reads `Colors.ts` anymore. `DEFAULT_THEME` in `Themes.ts` is now
just the first-launch fallback (committed as `'light'`).

1. ✅ **DONE — `home.tsx`** (#44 dark build; #45 converted to `Themes.ts`
   + light design approved). Dark: as #44 (cart/gear swapped to
   `@expo/vector-icons` — VS16 emoji glyphs ignore RN `color`). Light:
   soft-teal circles `#4caba1`/`#348f86`, cart `#eaeff2`, gear `#4caba1`,
   original typography. Header title/subtitle are 28/22 in BOTH themes
   (Patrick wants no size jump between themes). Known accepted quirk:
   28px title wraps on the Simulator's narrower screen, fits on the real
   phone — auto-shrink fix offered and declined ("simulator thing").
2. ✅ **DONE (#46) — `backup.tsx` + `watchlist.tsx`.** Mockup-first design
   pass approved for both themes; both files on `makeStyles(theme)`;
   eight new keys in both palettes (see Themes.ts comments). backup's
   back pill now says "← Back" (the old "← Settings" wrapped to two
   lines in the fixed-width pill — Patrick chose the shorter word).
   Light `cartIcon` changed to `#d8dde3` (Patrick, supersedes #45).
3. ✅ **DONE (#47) — `shopping.tsx` + `vault.tsx`.** Mockup-first, both
   themes approved. Eleven new keys (see Themes.ts comments). New dark
   convention set here: solid orange = action, outlined gold = quiet
   (Stocked, Edit, Cancel). Dark creams brightened app-wide. Vault's
   "Missing Info" alert reworded ("Tap a Label..."). Light unchanged.
4. ✅ **DONE (#48) — `timer.tsx` + `settings.tsx`.** Mockup-first, both
   themes Simulator-approved. Ten new keys (see Themes.ts comments);
   switches unified app-wide on the new switch keys (settings' light
   switch changed look slightly — Patrick approved); Done stays green in
   both themes (green means done). PLUS the theme toggle + popup choice
   built (Appearance section) and Settings spacing tightened to fit one
   screen without scrolling.
5. ✅ **DONE (#49) — `todo.tsx`.** First conversion with colors in the
   page logic: `PRIORITY_COLORS` became `priorityColors(theme)` /
   `priorityTextColors(theme)` maps over six new priority keys (+
   `statusOnHold`) in both palettes. (Docs commit for #49 was never
   made — reconstructed from git in #50's handoff.)
6. ✅ **DONE (#50) — `planner.tsx`.** Mockup-first, both themes
   Simulator-approved. Same map pattern as #49 plus `statusColors(t)`;
   four new keys (statusActive/-Text, statusOnHoldText, progressTrack);
   Completed status reuses prioritySomeday. Dark: +Task/Edit Project
   solid orange, Log/Complete Project outlined gold. Title set to 24
   (Patrick's pick — the long name crowds the pill at 26). Reminder
   fields still unwired (see Nice-to-have below).
7. ✅ **DONE (#51) — `lookahead.tsx`.** Mockup-first, both themes
   Simulator-approved (page, tiles, all three popups). Two new keys:
   `delay`/`delayText` — the #FF9500 delay orange, identical in BOTH
   themes (dark gets dark-brown text on it). Edit button + group
   headers ride the existing `pill` key (teal light / gold dark).
   Patrick's call: per-tile Log is SOLID orange in dark (mark-done =
   action) — unlike Planner's outlined-gold Log. Title set to 24 with
   the telescope deliberately on its own line beneath it.
8. ✅ **DONE (#52) — `myday.tsx`.** Mockup-first, both themes
   Simulator-approved (page, tiles, all five popups). Five new keys:
   counterMinus/counterMinusText (#ffcc00 "−" circle, identical both
   themes, dark-brown text in dark) + timeStepper/-Border/-Text (spinner
   ▲▼ circles: solid blue light via the invisible-border trick, outlined
   gold dark). Patrick's calls: done-state ✓ is GREEN both themes
   (Timer's buttonDone — "green means done"); Log solid orange in dark
   (mark-done action, #51 rule); Snooze rides the delay keys. Title 24.
   This is the pattern for the routine-tracker trio.
9. ✅ **DONE (#53) — `myweek.tsx` + `mollie.tsx`.** Mockup-first for
   My Week; Pets needed no mockup (no new elements). ZERO new theme
   keys — everything rode existing ones. ✓ done state green in BOTH
   themes (was teal in light — Patrick approved); Postpone / Snooze /
   "▶ moved to" on the `delay` keys; My Week's day chips: unselected =
   pageBackground/cardBorder/bodyText (light pixel-true), selected =
   solid buttonPrimary (two solid oranges in the dark New Chore popup —
   Patrick OK'd, Timer precedent); Pets Treats "−" on counterMinus,
   "+" on bridge; Pets New/Edit popup kept borderless. Titles to 24.

(`constants/Colors.ts` was retired — grep-verified and deleted — in #57.)

---

## BIG PLANNED WORK from #34 (master spec: `docs/reminder-audit.md`)

A multi-session effort to make reminders behave the same everywhere, plus two new
pages. Take ONE piece per session. **Order: pages first, then the popup consolidation.**

- **✅ DONE (#35, Simulator-validated) — Stripped recurrence out of To-Do → one-time
  only** (`app/todo.tsx`, `app/_layout.tsx`). Removed Monthly + Yearly live code and the
  3/6-month stubs; To-Do is now one-time tasks only. `tsc` clean. Real-device check is
  folded into Checkpoint A. (Superseded the old "3/6-month" + "Monthly/Yearly firing
  test" items below — nothing left to do there.)
- **✅ DONE (#36, Simulator-validated) — Built the "Look Ahead" home-screen page**
  (`app/lookahead.tsx` + home tile/route + `_layout.tsx` Stack.Screen). Items grouped under
  Monthly / 3 Months / 6 Months / Yearly; add/edit form (name + first-due date + time +
  repeat interval); own history log; reorder within group; swipe-delete. `tsc` clean.
  **No notification code yet** — that's Step 3 below.
- **✅ DONE (#37, Simulator-validated) — Look Ahead reminders + re-arm**
  (`app/lookahead.tsx`, `app/_layout.tsx`). Patrick chose ONE uniform mechanism for all
  four intervals (not the spec's native-repeat / re-arm split): every item is a single
  dated reminder the app re-arms; the page self-heals on load; items advance only when
  marked done. Log/Done rolls the item to its next future date and logs it. Added the
  **Delay = Day / Week / Month** control on the notification banner AND as an on-tile
  button (orange, Pets-Snooze style), plus an orange **"▶ Delayed …"** line on the tile
  that clears on done / edit / once the delay time passes. `tsc` clean. Real-device check
  is **PHONE CHECKPOINT A**, still pending.
- **✅ DONE (#38, Simulator-checked) — Step 4, To-Do half: To-Do gets its OWN reminder
  structure** (`app/settings.tsx`, `app/backup.tsx`, `app/todo.tsx`, `app/_layout.tsx`).
  **Decision (Patrick): To-Do is NOT unified with the others** — it's a fixed one-time
  appointment (can't be done late, can't be delayed; a change = a new appointment), and
  its old trouble was *riding on* the other pages' notification setup. So: To-Do now
  requests its own permission + sets its own handler; its popup is **OK + Done only** (no
  Snooze/Delay); presets rebuilt (dropped "At time", added Day Before/Night Before/2 Days
  Before, plus a new settable **Midday** time). `tsc` clean. Real-device check is part of
  the checkpoints below.
- **✅ DONE (#39, Simulator-checked) — Step 4, routine half: ONE shared popup for
  My Day / My Week / Pets** (`app/_layout.tsx`, `app/myday.tsx`, `app/mollie.tsx`,
  `app/myweek.tsx`). New `routineactions` category: OK / Skip / Delay 15·30·60 / Done.
  Skip = dismiss + cancel the item's pending one-offs, nothing marked/logged. Done got
  the past-day guard (logs a past completion, doesn't check off today's / this cycle's).
  Silent-snooze fixed (banner snoozes now carry sound). My Week's banner "+1 Day"
  dropped (Patrick's call — postpone stays on the page). Real-device check owed below.
- **✅ DONE (#40) — Design review of each page's reminder machinery.** Patrick's
  per-page calls: **To-Do banners now carry NO buttons** (`app/todo.tsx` dropped the
  `categoryIdentifier`; `app/_layout.tsx` dropped the `todosnooze` registration, old
  handler left harmlessly) — a To-Do is a one-time appointment, every set reminder
  should fire, Done happens in-app afterward. My Day / My Week / Pets reviewed and
  kept as-is. Look Ahead / Timer / Planner not reviewed. `tsc` clean; phone check of
  the buttonless banner batched into the checkpoints below.
- **STRUCTURED REMINDER TESTS — still owed** (was #39's pick; #40 became the design
  review instead). One organized test checklist covering every reminder kind: To-Do
  one-shots (now buttonless banners), My Day / Pets daily, My Week weekly + postpone,
  Look Ahead long-lead + Delay, the shared routine popup's six buttons,
  past-day/past-cycle guards, sound, tap-routing. Work through it Simulator-first;
  batch the device-only parts into the checkpoints below. **Add (#41, Patrick's
  item 4): he saw a banner Done on YESTERDAY'S My Day reminder check off TODAY'S —
  almost certainly the phone's older TestFlight build (the #39 past-day guard isn't
  device-tested yet), but verify the guard explicitly. Patrick is tracking it.**
- **PHONE CHECKPOINTS A + B — ✅ essentially DONE (#55/#56).** Verified on the
  phone in #55: Look Ahead reminders + Done/Delay (#37), tap-routing to the
  right page, the shared routine popup (#39 — six buttons, Skip, snooze
  sound), the My Day past-day guard (tested past midnight — logged under
  yesterday, today untouched), the Watch List once-over (#41), and the #42
  once-over. The buttonless To-Do banner (#40) passed in #56 — and was then
  SUPERSEDED the same session: banners now carry a single OK (`todook`).
  **Still owed at the next batched build: the NEW OK banner** (press-and-hold
  → one OK, closes without opening the app) and the To-Do early-fire re-test
  (see Bugs above).
- **✅ DONE (#41, Simulator-validated) — Watch List integrated as a home page**
  (`app/watchlist.tsx` new + home tile/route + `_layout.tsx` Stack.Screen). The
  standalone `Projects/WatchList` app's three files combined into one TS page,
  restyled to the app's blue look; behavior unchanged (movies To Watch/Watched,
  shows +Ep/+Seas); same storage keys (`watchlist_movies`, `watchlist_shows`); no
  notifications. `tsc` clean. Phone once-over batched into the checkpoints above.
  **This closes the #34 plan's five steps** (device validation still owed).

---

## Patrick's #41 list — what's still open (items 2, 5, 6, 7 done in #42)

Raised by Patrick at the end of #41. Items 5, 6, 7 built and Simulator-validated
in #42 (item 2's bug died with item 6); their phone once-over is batched into the
checkpoints above. Still open:

1. **Name the backup folder — PROMOTED from nice-to-have.** Give the exported
   backup folder/file a clear, recognizable name so it's easy to find where it's
   saved. (Detail still in "Nice-to-have" below; it's now wanted, not just nice.
   Best confirmed on a real phone, where iCloud Drive is involved.)
3. **Import files/docs into Vault.** Bring outside files/documents into the
   Vault. Scope is undefined (file types? where from? how shown/stored/encrypted?)
   — needs a discussion session before any build.
4. ✅ **My Day past-day banner Done — PHONE-VERIFIED (#55)**, tested just past
   midnight: the past completion logged under yesterday's date, today's items
   untouched, as designed. (Spin-off nice-to-have in pending.txt: log BOTH
   times on a banner Done.)

Done in #42, for the record: **5** — Look Ahead New/Edit popup's Cancel & Save
moved up under the title (matching To-Do). **6** — Categories removed from To-Do
entirely (`app/todo.tsx`: picker, Custom-Category popup, filter bar, tile labels
and machinery all removed; `todo_categories` dropped from backup's key list; old
tasks' stored `categoryId` is simply ignored) — **item 2's cancel bug is gone**.
**7** — tapping ✓ in My Day / Pets asks "Mark as not done?" and clears just the
checkmark, history log untouched (Patrick's rule); My Week already worked this way.

---

## In plain English — what's still on this list (read first)

This is the "someday" list: things worth doing eventually, not what we're working on
right now. Nothing here is urgent.

The still-open work falls into: a few **small bugs / unfinished bits** (the missing
backup keys, a couple of minor logging quirks, tap-to-exact-item), a few
**decisions to make** (Backup Merge, Vault import scope), some
**nice-to-have polish**, and a couple of **bigger items parked on purpose** (Siri voice,
the louder timer alarm). (The To-Do Custom-Category cancel bug is gone — #42 removed
categories from To-Do entirely.)

---

## Bugs / correctness (still open)

- **Look Ahead: banner Delay doesn't show "▶ Delayed" on the tile (Patrick's phone test
  of the #61 build, reported #62).** Code-read diagnosis: the banner Delay handler
  (`app/_layout.tsx`) writes the `delayedUntil`/`delayedLabel` stamp into storage, but
  `app/lookahead.tsx` only re-reads storage on MOUNT (`useEffect([])`), not on every
  return to the page. If the page was already mounted when the banner Delay was tapped,
  the tile won't show the line — and any later save from the page (log/edit/delete)
  writes the stale state back over the stamp and loses it. The on-tile Delay button is
  fine (updates state directly). Patrick doesn't recall his exact steps, so the repro is
  unconfirmed, but this stale-mount path is the likely cause. Fix shape: re-read storage
  on screen focus (`useFocusEffect`) instead of only on mount. Also verified: a Delay
  writes NOTHING to the log by design ("No log, no change to the item's real due date")
  — only Done/logging creates a log entry, so no log line is correct behavior.

- **Vault "Custom" label may save as the word "Custom" (spotted #47, UNVERIFIED)**
  (`app/vault.tsx`). The save path checks `selectedPreset === 'custom'` (lowercase)
  but the chip sets `'Custom'` (capital C) — read straight from the code, so tapping
  Custom and typing your own label would save an item literally labeled "Custom",
  ignoring what was typed. Found by code-reading during the #47 theme conversion;
  NOT yet reproduced. Verify in the Simulator first: Vault → any category → + Add →
  tap Custom → type a label → Add, and see what label the saved item shows. If it
  reproduces, the fix is a one-word case correction (its own small session/step).

- **[SUPERSEDED by #34 plan] To-Do recurrence (Monthly / Yearly / 3 / 6 Months).**
  These were all open To-Do items (3/6-month stubs did nothing; Monthly/Yearly needed a
  phone test). Per #34, **recurrence leaves To-Do entirely** and moves to the new Look
  Ahead page. So don't fix them in To-Do — handle them as part of "Strip recurrence out
  of To-Do" + "Build Look Ahead" above. The 3/6-month anchor-date approach (a starting
  date, pre-schedule one-shots, top up on open within the iOS 64-pending cap) and the
  Yearly 0-based-month gotcha both carry over to Look Ahead.
- **My Week on-screen "Done" stamps tap-time, not the chore's day** (`app/myweek.tsx`,
  `confirmLog`). Minor, identical to My Day's accepted limitation: the *banner* Done is
  correct (fired time); only the in-app Log modal dates from `new Date()`. Only matters
  if a chore is logged well after its day. Same fix shape as My Day's would need (a
  cutoff-hour rule).
- **Tapping a reminder opens the screen, not the exact item** (`app/_layout.tsx`). Routes
  by `data.source` to the right screen but never lands on the specific item, and has
  never been confirmed with a real tap. To-Do reminders carry `taskId` (landing on the
  task is feasible); My Day / "Background" reminders carry no item id.

## Design decisions to make

- **Remove categories from Vault (Patrick, #47).** Like #42 did for To-Do:
  drop the Vault's category layer (Identity / Property / Financial / Medical /
  Digital / Legal / Other). Scope to decide before any build: does the
  two-level navigation (category list → items) collapse into one flat list;
  what happens to the per-category preset label chips (keep one combined set,
  or drop presets); and how existing items' stored `category` field is
  handled (To-Do's approach: just ignore it). Needs a discussion session
  first — related open item: "Import files/docs into Vault" above, since both
  reshape the same page.

- **Backup "Merge" option.** Restoring a backup currently **replaces** everything. Patrick
  wants the *choice* to **merge** a backup into existing data. Its own session — the
  combine rule differs per data type and each is Patrick's call:
  - **ID-keyed arrays** (`todo_tasks`, `vault_items`, `planner_projects`, the routine
    lists `my_routine` / `week_routine` / `pets_feeds`): add items whose IDs aren't
    already present; decide the rule when the same ID exists in both (keep current / take
    backup / keep both).
  - **Append-only logs** (`my_history`, `week_history`, `pets_history`, `todo_log`,
    `planner_log`): concatenate then de-duplicate (dup key e.g. date+label+time).
  - **Counters** (`my_coffee`, `my_water`, `pets_treats`): pick higher, sum, or keep?
  - **Single values** (`user_name`, reminder times, flags, last-date keys): backup-wins
    vs current-wins per field.
  - Likely UX: after a file is picked + validated (and Vault decrypted), ask "Replace or
    Merge?", then run the chosen path. Replace already exists (`applyRestore` in
    `app/backup.tsx`); merge would be a sibling. Scope each rule first; build one at a time.

## Nice-to-have later (UI polish)

- ✅ **DONE (#63) — Four-band bridge on all 14 pages.** Built as the
  shared `components/Bridge.tsx` (page 3px / bridge 4px / page 3px /
  bridge 4px, existing theme keys); Home switched to it and every
  other page's single 8px strip replaced; orphaned `bridge` styles
  and Home's unused `bridgeBottom` deleted. Simulator-approved.
  Future bridge changes = one edit in the component.
- **Home & Look Ahead header padding — decide someday (#62).** The
  other 11 pages now share the taller header (safe-area default
  edges). Home and Look Ahead were deliberately left on
  `edges={['top']}` because their second line (greeting / telescope
  icon) already gives them height. If they ever look short next to
  the rest, same two-line fix as #62 used on Settings & friends.
- **Remove the orphaned `timeStepper` theme keys (#61)**
  (`constants/Themes.ts`). `timeStepper`/`timeStepperBorder`/
  `timeStepperText` lost their last user when My Day moved to the
  shared control — no page reads them now (grep-verified #61). Left
  in place on purpose; deleting theme keys is its own small step.
- **Name the backup folder — filename half DONE (#65), findability
  check still owed** (`app/backup.tsx`). The file is now named
  `Remember-Backup-<date>.json` (#65 rename). What remains is the
  real-phone proof: where the file lands in iCloud Drive / Files
  and how findable it is — rides the #65 build's phone test.
- **Project Planner reminders do nothing yet** (`app/planner.tsx`). The screen has reminder
  fields, but they aren't wired to any notifications. Low priority.
- **The "Memory Assist" tagline still needs a home** (left over
  from the rename, which was fully BUILT in #65 — store name,
  icon, in-app spots, backup naming all done). Possible homes:
  the App Store subtitle field (30 chars, sits empty today), the
  listing description, or somewhere in-app.
- **Android icon variants + splash image still carry the old
  placeholder art** (`assets/images/android-icon-*.png`,
  `splash-icon.png`). Deliberately deferred at #65 when
  `icon.png` got the new happy-face art. Small session: derive
  the Android foreground/background/monochrome set and the
  splash from the approved design.
- **Retire the leftover pre-#39/#40 popup plumbing (cosmetic, after device validation).**
  `_layout.tsx` still registers the now-unused `mydaysnooze` / `petssnooze` /
  `myweekactions` categories and keeps the old `postpone1` (+1 Day) handler and the
  old To-Do banner Done handler — all left in place on purpose so banners
  scheduled before the switches still work. Once the changes are
  device-validated and old banners have cycled out, they can be removed.
  Purely internal; no behavior change. (Note #56: To-Do banners now use the
  NEW `todook` category — a single OK riding the shared no-op 'ok' handler —
  which is live code, NOT part of this retirement.)
- **"At time" reminder option, possibly revisit.** Removed from To-Do in #38 (Patrick's
  call — soonest preset is now "30 min." before, since #60). Patrick reaffirmed in #63
  after living with it: "leave as is for now." If he ever misses an exact-time alert,
  it can be added back as a preset. This also closed the old "fired early" test —
  it needed the removed preset, and the early fire was the 2-hour preset working.
- **Add an on-tile Snooze button to To-Do** (`app/todo.tsx`). My Day and Pets Day each have
  an on-page Snooze (15/30/60) on every tile; To-Do only has Snooze on the notification
  banner. Add the same on-tile control for consistency.

## Parked on purpose (bigger items / accepted limitations)

- **Siri voice control — PARKED** (Patrick's decision, session #20). Tap-from-Shortcuts
  works, but Siri won't voice-match the spoken item name; no high-confidence fix remains,
  and part may be an iOS-side regression. All scaffolding stays in place, inert. **Full
  self-contained resume guide: `docs/siri-voice-resume.md` — read it first if revisited.**
- **Timer "Loud alert" isn't actually louder.** It's the normal alert tone. A genuinely
  louder, distinct alarm needs a custom sound file bundled into the app (a full rebuild),
  and breaking through Silent / Do-Not-Disturb needs Apple's Critical Alerts entitlement
  (medical/safety apps). Heavy — deferred.
- **A running Timer's tile disappears if the app reloads or restarts** (active timers are
  in memory only). Accepted as-is: tapping Done still stops the alerts whether or not the
  tile is showing. To make it survive: persist `activeTimers` to AsyncStorage + reconcile
  on Timer-page focus against `getAllScheduledNotificationsAsync`.
- **Reminder times stay global — DECIDED, nothing to do.** Morning / Midday / Evening
  times are set once in Settings and apply to everything. Patrick considered a
  per-appointment override and chose global only. Kept here solely in case it's ever
  revisited.
