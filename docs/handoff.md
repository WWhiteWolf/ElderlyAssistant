# Hand-off note — paste at the start of the next session

## THIS SESSION — #16 (2026-06-25): Audio input Stage 2 — the REAL "mark item done" Siri intent BUILT (Steps 1–3, code-complete, tsc clean). NOT committed, NOT yet runtime-confirmed.

Built the real Siri "mark item done" feature end-to-end in code. **Decisions locked with Patrick:** keep the app display name **"Remember When" for now** (his coined name **"Elyfont" / "Ely Font"** is **TABLED, not dropped** — revisit later; a short distinctive name can modestly help Siri voice recognition because "Remember When" is itself an English phrase, but it means renaming the app's *display* name, bundle id unchanged); use a **LIVE** item list (the app shares its current My Day items so new items become speakable with no rebuild); **My Day only** first (To-Do later). Data bridge is the #15-chosen **Approach B** ("Siri drops a note," RN applies it). **Patrick commits everything; nothing committed yet.**

**What got built (one reviewed step at a time, all `tsc --noEmit` clean):**

- **Step 1 — shared-box native bridge.** NEW local Expo module **`modules/app-group/`** (clean/standard route, New-Arch friendly, no new deps). iOS Swift `AppGroupModule` (`Name("AppGroup")`) exposes three functions over **App Group UserDefaults** (suite `group.com.molliedog.ElderlyAssistant`, the entitlement `withSiriIntent.js` already adds): `setMyDayItems(json)`, `getPendingNote()`, `clearPendingNote()`. `index.ts` wraps them in a typed API (`setMyDayItems(items)`, `getPendingNote(): PendingNote|null`, `clearPendingNote()`) + `MyDayItem`/`PendingNote` types. Android + web are **no-ops** so the unconditional JS import never crashes those platforms.
- **Step 2 — app side (RN).** `app/myday.tsx`: `saveData` (the single write path for add/edit/delete/reorder) + the same-day load branch now **publish the current items** to the box (live list). `app/_layout.tsx`: a NEW effect runs on mount and on **every AppState 'active'** — it (a) republishes `my_routine` items so Siri stays fresh even if My Day wasn't opened this session, and (b) reads any pending Siri **note**, finds the item (by the id Siri returns, else a label match), marks it complete in `my_routine`, writes a dated `my_history` entry from `note.firedAt` (same shape/50-cap and after-midnight-correct dating as the banner-Done path), clears the note, and routes to `/myday`. Guarded by an `applyingNote` ref.
- **Step 3 — Siri intent (Swift, via the plugin).** NEW `plugins/ios/MarkItemDoneIntent.swift`: `MarkItemDoneIntent` (writes `{action:'markDone',itemId,label,firedAt(ms)}` into the App Group + `openAppWhenRun=true`), `MyDayItemEntity`, and `MyDayItemQuery` whose `suggestedEntities()` reads the **live** `myDayItems` list from the box. Added the "Mark item done" `AppShortcut` (phrases like "Mark \<item\> done in \<app name\>") into the **single existing `AppShortcutsProvider`** in `OpenRememberWhenIntent.swift` (an app may have only ONE provider). Generalized `plugins/withSiriIntent.js` to inject **every `.swift`** in `plugins/ios/` (was one hardcoded filename) — future intents need no plugin edit.

**THE BUG WE HIT + FIXED — don't re-derive: the local module was missing its `package.json`.** `npx create-expo-module --local app-group` **crashed partway** (EPERM unlinking template files on the mounted FS), leaving a junk `modules/app-group/package/` dir (since deleted) and — critically — **no top-level `index.ts` and no `package.json`.** Claude hand-wrote `index.ts`, but without `package.json` the iOS autolinking that `pod install` runs (`use_expo_modules!` → `generate-modules-provider`) **silently skipped the local module**, even though the standalone `expo-modules-autolinking search` listed it. Symptom on the Simulator: red-screen **"Cannot find native module 'AppGroup'"** at the `_layout.tsx` import. Root-caused by reading the generated `ios/`: `AppGroup` absent from `ExpoModulesProvider.swift`, no `AppGroup` pod in `Local Podspecs`. **FIX: added `modules/app-group/package.json`** (name `app-group`, `main: index.ts`, peerDeps expo/react/react-native). **Verified** `expo-modules-autolinking resolve -p apple` now returns a COMPLETE app-group entry — pod `AppGroup` + podspecDir, `swiftModuleNames:["AppGroup"]`, `modules:["AppGroupModule"]`, `packageVersion:0.1.0`.

**Runtime status — compiles + installs, but NOT yet confirmed launching.** After the package.json fix, Patrick's `cd ios && pod install && npm run ios` **compiled, linked, and INSTALLED** RememberWhen.app on the iPhone 17 Simulator (iOS 26.5) — so the module is now in the binary (crash fix strongly evidenced). BUT the app never actually launched: the CLI's auto-open step (`xcrun simctl openurl exp+elderlyassistant://…`) failed with **LSApplicationWorkspaceErrorDomain error 115** — a benign Expo+Simulator auto-open hiccup, NOT our code. So "Cannot find native module" is **not yet runtime-confirmed gone.**

**Sandbox note:** Claude could NOT run `expo prebuild` in its Linux sandbox (mounted FS blocks directory creation); one attempt cleared the gitignored `ios/` (harmless — regenerated). Patrick regenerated `ios/` on his Mac and confirmed both intent swifts land in `ios/RememberWhen/` + the entitlement is present.

**NEXT SESSION (resume here, one step at a time):**
1. **Get past error 115 (auto-open):** on the Simulator, tap the Remember When icon **manually** (connect to the Metro entry if the dev launcher shows). Confirm it launches with **NO "Cannot find native module 'AppGroup'" crash.** (If it still crashes, the module still isn't linked — recheck that `pod install` picked up `AppGroup` and that `ExpoModulesProvider.swift` now lists it.)
2. **Shortcuts smoke test:** open **My Day** once (that publishes the items), then open the **Shortcuts** app — confirm both "Open Remember When" and "Mark item done" appear, and "Mark item done" lists the real My Day items.
3. If good: **Patrick commits the code**, then the **single EAS device build** to confirm the real goal — "Mark \<item\> done in Remember When" by voice wakes the app, marks it done in My Day, and logs it.
4. **Device-build prerequisite:** enable the **App Group capability** for the App ID in Apple's developer portal / provisioning profile — the in-code entitlement isn't enough on a real device (the Simulator doesn't enforce it, so the smoke test works without it).

**Files touched this session (#16):**
- `modules/app-group/` — **NEW** local Expo module: `index.ts`, `package.json` (the fix), `expo-module.config.json`, `ios/AppGroupModule.swift`, `ios/AppGroup.podspec`, `src/AppGroupModule.ts`, `src/AppGroupModule.web.ts`, `src/AppGroup.types.ts`, `android/.../AppGroupModule.kt`.
- `app/myday.tsx` — publish items to the App Group in `saveData` + same-day load branch; import `app-group`.
- `app/_layout.tsx` — NEW effect: republish items + apply pending Siri note on mount/foreground (`AppState`); imports `AppState` + `app-group`.
- `plugins/ios/MarkItemDoneIntent.swift` — **NEW** (intent + entity + query).
- `plugins/ios/OpenRememberWhenIntent.swift` — added the "Mark item done" `AppShortcut` to the provider.
- `plugins/withSiriIntent.js` — inject ALL `.swift` in `plugins/ios/` (was one hardcoded file).
- `docs/handoff.md` + `docs/parked-items.md` — this update.

---

## SESSION — #15 (2026-06-25): Audio input — data-bridge decided + Siri App Intents FEASIBILITY SPIKE built & proven (Stage 0 + Stage 1). Plus after-midnight med fix DEVICE-VALIDATED.

Two things this session. (A) Logged a device-test result — the session #10 after-midnight med fix is now **DEVICE-VALIDATED**. (B) Continued scoping audio input and **ran a real feasibility spike for Siri App Intents**, which **passed**. New code added this session is the spike scaffolding only (a no-op intent + its config plugin) — NOT the real feature yet. **Patrick commits everything at session end.**

### (A) After-midnight My Day med fix — DEVICE-VALIDATED 2026-06-25
Patrick let the **Medication** reminder fire at 11:55 PM (06/24), tapped **Done on the banner after midnight** (06/25). The Log filed it as **06/24 | 23:55 | Medication** — dated from the FIRE time, under the prior day, exactly as the #10 fix intended. He confirmed he's happy with the behavior (today's tile staying un-done is correct — the dose belongs to the day it fired). **Pets Day half (`pets_history`, same mirrored code path) still not separately device-tested** — high confidence, left noted as unconfirmed. Marked validated in `parked-items.md` + the in-flight list below.

### (B) Audio input → Siri App Intents — DATA-BRIDGE DECIDED + SPIKE PROVEN

**Data-bridge decision (the architecture question from #14): APPROACH B — "Siri drops a note."** The app's data lives in AsyncStorage, which a Swift Siri intent can't read directly; the App Group is a shared folder both can see. Two options were weighed:
- **A — share the real data:** mirror My Day's list into the App Group; Swift reads/marks/writes it back. **Rejected** — duplicates the "mark done" logic (history entry, reschedule) in Swift, two stores to keep in sync.
- **B — Siri drops a note (CHOSEN):** the Swift intent only writes a tiny instruction (e.g. `{action: markDone, label, firedAt}`) into the App Group; the **existing React Native code** reads it on next app-active and runs the already-tested done-logic, then clears the note. Swift stays a tiny sliver; all real logic stays in JS. The "when does it take effect" worry is answered by App Intents being able to wake the app the way a banner Done does today (to be confirmed on device).

**FEASIBILITY SPIKE — built and PASSED (Stage 0 + Stage 1).** Goal: prove a config plugin can inject a *compiling, registering* Swift Siri App Intent into this app, given `ios/` is **gitignored / regenerated every build (CNG)** so hand-editing `ios/` is impossible.
- **Key project fact (verified):** `.gitignore` lines 42–43 ignore `/ios` + `/android` → Continuous Native Generation. Native Swift MUST come through a config plugin, not by editing `ios/`.
- **Stage 0 — config plugin + no-op intent — PASS (no build).** After `npx expo prebuild --platform ios --clean`, verified in the generated `ios/`: (1) `ios/RememberWhen/OpenRememberWhenIntent.swift` landed; (2) it's a `PBXBuildFile` **in the Sources build phase** of the app target (will compile, not just referenced); (3) the App Group entitlement `group.com.molliedog.ElderlyAssistant` is in `RememberWhen.entitlements`.
- **Stage 1 — Simulator (iOS 26.5, iPhone 17) — PASS (no EAS build).** `npm run ios` built and launched (so the Swift **compiled**). In the **Shortcuts** app the action **"Remember When → Open Remember When"** appeared by name with the app icon, alongside system apps — so the intent **registered and is discoverable**. (My earlier guess that the Simulator lacks Shortcuts was WRONG — it's present on iOS 26.5.)
- **NOT yet watched:** the app actually foregrounding when the intent runs — Patrick couldn't easily drive the Simulator's shortcut-builder, and it's not worth fighting. The app-wake is the `openAppWhenRun = true` contract; **confirm it for real on the phone in Stage 2.** Feasibility question is otherwise **answered: yes** — native Siri code goes into this app cleanly via a config plugin.

**Files added this session (spike scaffolding — keep as the foundation, or replace with the real intent later):**
- `plugins/ios/OpenRememberWhenIntent.swift` — NEW. No-op App Intent (`openAppWhenRun = true`, `@available(iOS 16.0, *)`) + an `AppShortcutsProvider` exposing phrases "Open/Show <app name>". Does NOT touch My Day / AsyncStorage / App Group yet.
- `plugins/withSiriIntent.js` — NEW. Config plugin: copies the Swift into `ios/RememberWhen/`, adds it to the Xcode app target's Sources phase, adds the App Group entitlement. Idempotent. Loads clean (`@expo/config-plugins`).
- `app.json` — registered `"./plugins/withSiriIntent"` in `plugins`.
- (`ios/` is gitignored, so the regenerated native files are NOT committed — only the three above + the doc updates are.)

**NEXT SESSION — Stage 2 (the first and only EAS build of this effort so far):** build to the phone and confirm (a) **"Hey Siri, open Remember When"** invokes by voice, and (b) running the intent **wakes the app**. If that holds, move to the REAL feature: a `MarkItemDoneIntent` that takes a spoken item label, writes the Approach-B note into the App Group, plus a small native module so the RN side can read the note on app-active and run My Day's existing done-logic. Scope the exact command + how a spoken phrase matches a My Day item before building. One change at a time; Patrick decides + commits.

---

## SESSION — #14 (2026-06-24): Audio input — INITIAL PLANNING ONLY (no app code changed; direction decided)

Planning/scoping session for the audio-input feature. **No production code changed.** A throwaway UI experiment (a mic button in My Day's New-Entry popup) was added and then **fully reverted** — `app/myday.tsx` is back to its committed state, `tsc --noEmit` clean. Nothing to commit in `app/`; only the docs changed this session.

**What we decided (the heart of it):**

- **Custom in-app mic button — DROPPED.** iOS's built-in **keyboard dictation mic** already turns speech into text in any field (Patrick noticed it appears when he taps a text box), so a custom "dictate into the Name box" button just duplicates it. Not worth building.
- **Patrick's real priority is HANDS-FREE.** He wants to talk to the app without tapping in first. His examples: "Remember When, Open" and "mark early text done."
- **A custom always-listening wake word inside our app is NOT POSSIBLE on iPhone (verified this session).** Apple reserves always-on background microphone for **Siri only** (battery + privacy). A third-party app can only listen while it's open and on-screen — it can never sit in the background waiting to hear its own name. So "Remember When, Open" as *our* listener is ruled out.
- **Hands-free therefore runs THROUGH SIRI, not our own listener.** Confirmed live: side-button → Siri → "open Remember When" **already opens the app today, zero code.** (Tip given Patrick: Settings → Siri, enable voice activation so no button press is needed — fully hands-free "Siri, open Remember When.")
- **The build goal, when Patrick is ready: Siri App Intents.** Teach Siri a small set of commands ("mark early text done in Remember When," "add a task …") so he can act on items hands-free. Needs **native Swift** wired into the Expo app via a config plugin / local Expo module, plus an **App Group shared container** to pass data between Siri and the app. The heavier native lift — its OWN scoping session and its OWN build.

**Feasibility facts gathered (don't re-derive):**
- **In-app speech-to-text** (if a foreground mic is ever wanted): `expo-speech-recognition` (jamsch) has an **SDK-54** build, wraps iOS `SFSpeechRecognizer`, installs via config plugin, needs a dev/EAS build (not Expo Go), asks mic + speech-recognition permissions. Fits the app's setup (SDK 54, New Arch) — New-Arch compat unproven until a test build.
- **Read-aloud (text-to-speech):** `expo-speech`, official Expo module, trivial, no special permission — available whenever wanted.
- **Siri App Intents:** pure Swift (iOS 16+), unreachable from RN directly; needs the config-plugin/native-module bridge above. Community helper exists (`@config-plugins/react-native-siri-shortcut`); App Intents proper may need custom Swift.

**Pros/cons of the native-Swift step (discussed with Patrick):** Pro — it's the *only* route to Siri App Intents; best reliability; Apple's tooling is first-class. Con — Swift is a new language for Patrick (not in his studied list); the Siri code sits in a separate native piece with a shared-storage bridge (more moving parts); native debugging needs Xcode; Apple API churn across iOS versions. **Agreed approach: do NOT rewrite the app in Swift — add a small, walled-off Swift slice via Expo's plugin system for the Siri feature only, keep everything else in React Native.**

**NEXT SESSION:** scope the Siri App Intents build — which command(s) first (likely "open" + one action like "mark <item> done"), how the spoken phrase names an item, and a small feasibility spike before committing to a full build. One change at a time; Patrick decides the command list.

---

## THIS SESSION — #13 (2026-06-23): My Week banner-buttons device fix + popup Cancel-button + "Clear All" UI fixes (`tsc` clean, not yet committed)

Two things this session: (A) the **My Week notification-banner buttons not appearing on the phone** (worked in the Simulator) — root-caused, fixed, and **DEVICE-VALIDATED on Patrick's phone**; and (B) pure-UI cleanup of the Cancel buttons and "Clear All" pills (Simulator-validated, and shipped in the same phone build). `tsc --noEmit` clean throughout. **Code committed + built to the phone this session; docs commit (this update) can follow.**

### (A) My Week banner buttons missing on device — FIXED + DEVICE-VALIDATED 2026-06-23 (session #13)

**✅ PHONE TEST PASSED (Patrick, 2026-06-23):** on the device he postponed from the **banner** and from **in the page**, and tapped **Done on the banner** — it checked the tile and logged the event. The banner buttons now appear and work on the phone. The sequential-registration fix resolved it.


**Symptom.** My Week banner's **Done / "+1 Day"** buttons appeared and worked in the Simulator but **not on the phone** — on the device a banner just opened the My Week page with no action buttons.

**Root cause (verified in native code).** All four notification categories were registered in one `useEffect` (`_layout.tsx`) with the four `setNotificationCategoryAsync(...)` calls fired **concurrently (no `await`)**. Expo registers a category via a **read-modify-write of the whole category set** (`node_modules/expo-notifications/ios/.../CategoriesModule.swift`: load current set → add this one → write back). The manager is a Swift `actor` but `await`s a fetch mid-method (`loadCategories()`), and on a **cold first-launch cache** that `await` is a reentrancy point — so four concurrent calls can each read the same initial set, each add only their own category, and the **last write wins**, dropping the others. `myweekactions` is registered **last**, so it's the one most likely dropped on device. The Simulator's timing happened to register all four; the phone's slower first-launch fetch widened the race window.

**Fix.** Made the effect register the categories **sequentially** — wrapped them in an `async` IIFE and `await`ed each `setNotificationCategoryAsync` so every read-modify-write completes before the next starts. Same four categories, same actions; only timing changed. Also hardens the other three. (`app/_layout.tsx`.)

**Phone test to run:** long-press / pull down a My Week reminder banner on the device → **Done** and **+1 Day** should now appear and work (Done logs to My Week's Log; +1 Day pushes to tomorrow). If still missing on device, the race wasn't the only factor — investigate further.

### (B) Popup Cancel-button + "Clear All" UI cleanup (SIMULATOR-VALIDATED)

`tsc --noEmit` clean. Simulator-validated by Patrick.

**What was wrong.** The shared `cancelBtn` style (grey `#ccc`, `flex: 1`, `marginRight: 8`) was built to sit in a **row** next to a Save/Confirm button (the Edit popups, via `modalBtns`). When reused for a **lone** Cancel button it collapsed into a thin, unlabeled grey bar — Patrick literally couldn't see it (screenshot confirmed). This affected three popups: **My Week Postpone**, **My Day snooze**, **Pets Day snooze**.

**The fix (3 files).** Wrapped each lone Cancel in a `<View style={styles.modalBtns}>` row, so it now renders exactly like the Edit popup's Cancel (a proper grey labeled button) — Patrick's stated preference. In a row, `flex: 1` governs width (full-width button) instead of collapsing height, so the "Cancel" label shows.

- `app/myweek.tsx` — Postpone popup Cancel wrapped in `modalBtns`.
- `app/myday.tsx` — snooze popup Cancel wrapped in `modalBtns`.
- `app/mollie.tsx` — snooze popup Cancel wrapped in `modalBtns`.

**Also (Patrick's request): "Clear All" pill above the log greyed on all three screens.** Was red (`borderColor`/text `#e74c3c`); now grey (`borderColor: '#999'`, text `#666`) to match the other buttons. Changed in `myweek.tsx`, `myday.tsx`, `mollie.tsx` (`clearAllBtn` / `clearAllBtnText`). (The Clear-All *action* still uses iOS's native destructive-styled confirm alert — unchanged.)

**▶ Banner fix applied this session — see section (A) above.** The "no banner buttons on device" issue was root-caused (concurrent category registration racing on a cold cache, dropping `myweekactions`) and fixed by registering the categories sequentially. **Awaiting a phone build to confirm** (device-only timing bug; the Simulator already showed the buttons, so it can't validate the fix).

---

## SESSION — #12 (2026-06-23): logged device-test results — #11 sort VALIDATED; Morning-of/1hr/2hr reminders VALIDATED; scoping "My Week"

**Device-test results logged this session (from Patrick's phone):**

- **Session #11 To-Do soonest-first sort — DEVICE-VALIDATED.** The list shows the soonest item at the top, with its time. Done.
- **2026-06-19 build — three more reminders confirmed firing:** **Morning of**, **1 hour**, and **2 hours** all fire. Still untested: **At time** offset, **Day/Week/Month** timing (~5 PM at 1/7/30 days before), Settings Morning/Evening time changes, and **Monthly + Yearly** recurring firing (Yearly month especially).
- **Session #10 after-midnight banner-Done fix — STILL PENDING.** Patrick can't test it quickly (needs a real late-night/after-midnight run). Leave marked device-test-pending; do not mark validated.

### ▶ MY WEEK — AGREED SPEC (locked with Patrick 2026-06-23, session #12; NOT yet built)

A new **My Week** screen (`app/myweek.tsx`), mirroring My Day's single-page structure and interactions, for **weekly** chores. Scoped in full with Patrick before any building.

**What it is.** One always-visible list of every weekly chore (trash, laundry, groceries, yard work, cleaning, etc.) — the chores never disappear from the page, the same way My Day shows the daily routine. Mirrors My Day's UI: tiles, an Add/Edit modal, reorder ▲▼ arrows, a history **Log**, swipe-to-delete. **No Coffee/Water counters** (those stay My Day–only).

**Each chore has** a label, a **day of the week**, and a **time** (so the Edit modal gets a Sun–Sat day picker added next to My Day's existing Hour/Minute/AM-PM time picker). Tiles show day + time + label.

**The reminder model (REVISED 2026-06-23, session #12 — replaces the earlier "nag daily automatically" idea).** A chore reminds **once** on its day at its set time, then automatically returns next week on its normal day. There is **NO automatic daily nagging.** The only thing that makes a chore keep reminding on following days is Patrick pressing **Postpone** — that pushes the reminder to the next day (or a day he picks), and from that pushed reminder he can Done it or Postpone again. **No postpone, no continuing nag.** Marking **Done** ends it for the week. (Patrick's words: "Have the nag follow the postpone push only. No postpone no continuing nag.")

**Why this is better (and kills the 64-slot worry).** The earlier auto-daily-nag idea needed the app to pre-schedule a week of reminders, because iOS won't run app code when a notification merely fires in the background — so it couldn't reschedule itself day to day. Postpone sidesteps that entirely: it's a deliberate button tap, so the app is awake at that moment and can reliably schedule the pushed reminder right then. Net effect: just ONE base weekly alert per chore (plus at most one live postpone), so the iOS 64-pending cap is no longer a concern.

**Postpone (per-occurrence, repeatable).** Each tile has a **Postpone** action separate from Done: either a one-tap **+1 day** (bump to tomorrow) or **pick a particular day**. Postpone keeps the chore nagging on the new day (never forgotten) and **stays available every day** so Patrick can keep pushing it. Postpone affects **only the current week** — a chore's *home* day/time never changes from postponing. Covers both "tired today, do it tomorrow" and "holiday week, trash is Wednesday this once."

**Weekly reset.** A chore's home day/time is permanent; postpone only moves the current week's reminders. Next week the chore is automatically back on its normal day. If a chore is never marked Done, when its normal day comes around again the new week simply **starts fresh** (the old, un-done cycle is dropped/"forgotten").

**Editing vs postponing.** **Edit** changes a chore's permanent day/time/label. **Postpone** is temporary (current week only). Two different actions.

**Honest note on weight / the hard part.** Nag-until-done + per-occurrence Postpone + weekly reset is genuinely new logic, NOT a straight copy of My Day's single DAILY trigger. iOS's plain "daily at 7 PM" repeating alarm has no built-in notion of "don't start until Tuesday," "stop when done," or "reset next week," so the scheduling needs custom logic on top. This is the careful part.

**AGREED BUILD ORDER (smallest-risk first, one stage per edit, Patrick commits + tests between):**

1. **The page itself — ✅ BUILT + SIMULATOR-VALIDATED 2026-06-23 (session #12).** `app/myweek.tsx` created mirroring My Day: always-visible "Weekly Chores" list (each tile shows day + time + name), Edit / Done / reorder ▲▼ / "My Log" history / swipe-delete; Add/Edit modal has a **Sun–Sat day-chip picker** above the Hour/Minute/AM-PM time picker; **no Coffee/Water counters**; seeds 3 starter chores (Trash Tue 7 PM, Laundry Sat 9 AM, Groceries Sat 10 AM). Home got a "My Week" 🗓️ tile + route; `_layout.tsx` registers the `myweek` screen. `tsc --noEmit` clean. Patrick tested reorder, add, edit, clear-all, delete-chore, delete-log in the Simulator — **all work as expected.** NOT yet committed/built to phone (no reminders yet — fine to keep testing locally).
2. **The base reminder — ✅ BUILT + SIMULATOR-VALIDATED 2026-06-23 (session #12).** Each chore fires **once** on its day/time via a native **WEEKLY repeating trigger** (1 per chore, weekday = `day + 1` — verified against the working To-Do weekly code: `(recurDay ?? 0) + 1`, 0=Sun; auto-returns next week, survives restarts), tagged `source:'myweek'`, tap routes to `/myweek`. Plus a per-chore **weekly reset** of the `completed`/✓ flag (helpers `lastOccurrence` + `applyWeeklyReset`, tracked via a `doneAt` epoch-ms on each chore; on load, clears ✓ once a new occurrence has passed since completion). `_layout.tsx` got `source:'myweek'` → `/myweek` tap routing. `tsc` clean. Patrick tested in the Simulator — permission prompt, add/edit/delete, Done ✓, no crash — **all working.** (Live once-a-week fire timing not separately stress-tested; code matches the proven To-Do/My Day pattern.)
3. **Postpone + Done banner** — split into 3a (tile) + 3b (banner).
   - **3a — tile Postpone — ✅ BUILT + SIMULATOR-VALIDATED 2026-06-23 (session #12).** Each tile got a **Postpone** button → popup with **"Tomorrow (+1 day)"** + a Sun–Sat pick-a-day row; schedules a one-off **DATE** reminder (`source:'myweekpostpone'`) at the chore's same time, stamps `postponedTo` (tile shows "▶ moved to <day>"). Re-postpone replaces the prior one (`cancelPostpone`); Done + delete clear it; the weekly reset drops a stale postpone. Helpers: `cancelPostpone`, `nextDateForWeekday`, `schedulePostpone`, `postponeTomorrow`, `postponeToDay`. `_layout.tsx` routes `myweekpostpone` taps → `/myweek`. `tsc` clean. Patrick tested the popup, both choices, the "moved to" label, and Done/re-postpone clearing — **all worked well.** (Live postpone *firing* is ≥1 day out → phone-test only.)
   - **3b — banner Done / +1 Day — ✅ BUILT + SIMULATOR-VALIDATED 2026-06-23 (session #12), `tsc` clean. Banner fired and its buttons worked in the Simulator; AWAITING PHONE BUILD for final confirmation.** New `myweekactions` notification category (Done + +1 Day) registered in `_layout.tsx`, attached to BOTH the base weekly and the postpone notifications (myweek.tsx). `_layout.tsx` handlers: **postpone1** ("+1 Day") pushes the chore's reminder to tomorrow at its time (cancels any prior postpone, writes `postponedTo` to `week_routine`); **done** marks the chore complete + logs to `week_history` (dated from the fired time, `response.notification.date`×1000) + clears any pending postpone. **Important:** the done/postpone1 handlers deliberately do NOT cancel the fired notification's identifier — for the base WEEKLY reminder that would kill the repeat; iOS auto-clears the shown banner on an action tap. Like My Day's banner buttons, tapping Done/+1 Day briefly brings the app to the foreground (that's what makes the reschedule run reliably — a fully-silent action wouldn't run JS until next app open). **Whole My Week feature is now code-complete; needs one phone build to test live firing + banner actions.**

**Stage 1 storage + model (for stage 2 to build on):** chores live under **`week_routine`** as `Chore[]` = `{ id, label, day (0=Sun…6=Sat), hour, minute, completed }`; the log under **`week_history`** (same `HistoryEntry` shape + 50-cap as My Day). Stage 1 does NOT schedule notifications and does NOT do any daily/weekly reset yet — both are stage 2's job. `DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']`. "Done" writes a history entry + sets `completed:true` (via the Log modal).

**TESTING NOTE (Patrick, session #12): test in the iOS Simulator FIRST, before the phone.** Local dev build via `npm run ios`; Metro picks up edits live. So each stage gets a Simulator check before any EAS/TestFlight build. (Reminder: the assistant must NOT type into Simulator fields — accent-popup bug; Patrick types directly. Assistant swipe/tap on the Simulator is unreliable — Patrick does direct manipulation.)

---

## PRIOR SESSION — #11 (2026-06-23): To-Do list now sorts soonest-first — one fixed sort, buttons removed (code done, tsc clean, COMMITTED — sort DEVICE-VALIDATED #12)

The long-parked "sort To-Do by soonest time on top" enhancement is built. **The To-Do list now has ONE fixed sort — by due date + time, soonest on top.** Patrick's decisions this session: no manual reorder in To-Do (unlike My Day — appointments have moving dates, so automatic self-maintains the "next thing on top"); recurring tasks don't need sorting (he positions them); and Due-Date sort should just be the permanent default, so the sort buttons are gone entirely.

What changed, all in **`app/todo.tsx`**:

- `getSortedTasks` collapsed from three branches (priority/dueDate/category) to **one fixed sort**: it builds a date+time stamp per task (`dueDate` `MM/DD/YYYY` + `dueTime` `HH:MM`, mirroring the scheduler's own parse) and sorts ascending. **Same-day tasks order by time, earliest first.** A dated task with **no time** sorts as `00:00` (start of its day). **Undated + recurring (weekly/monthly/yearly) tasks fall to the bottom**, where Patrick's manual positioning stands.
- Removed the `sortRow` UI block (the "Sort:" label + the 3 buttons), the `sortBy` state, and the orphaned `sortRow`/`sortLabel`/`sortBtn*` styles.
- The category **filter** row (All + category chips) is **untouched** — that's filtering, not sorting; Patrick said leave it as is.

`tsc --noEmit` clean. **Patrick is committing this and building it now in its OWN build** — deliberately segregated from other changes so this sort can be tested in isolation. **Device test once built:** add a few dated To-Dos with different dates/times → list shows the soonest at the top, and same-day items order by their time.

**▶ NEXT SESSION — the design change Patrick wants: a "My Week" page.** Add a new **"My Week"** screen that **mirrors the other "My" pages** (My Day = `myday.tsx`; Pets Day = `mollie.tsx` already mirrors it) **but for weekly recurrences** — a single always-visible list of weekly-recurring routine items with the same structure and interactions as My Day (tiles, edit modal, Done/Snooze, manual ▲▼ reorder, history/log), scoped to things that recur weekly rather than daily. **Not yet scoped in detail** — Patrick will name it as the goal and we scope it together before building (one change at a time). This connects to the long-parked design question "where do weekly/recurring reminders live": My Week would become the weekly engine, the way My Day is the daily engine.

---

## LAST SESSION — #10 (2026-06-23): fixed the My Day after-midnight med bug (code COMMITTED — DEVICE-VALIDATED 2026-06-25, session #15)

The raised-priority bug — a My Day item marked **Done from the notification banner** left no durable record and (when any record was written) was dated wrong after midnight — is now fixed in code. **One edit, `app/_layout.tsx`, the `action === 'done'` non-To-Do branch.** Patrick will commit.

What the fix does: banner Done now **writes a dated history entry** (it previously wrote none, so the next-day reset erased the dose). The entry's date + time come from when the reminder **FIRED** (`response.notification.date`), not the tap moment — so an item marked just after midnight files under the day the reminder was issued. **iOS reports `notification.date` in SECONDS** (verified in `EXNotificationSerializer.m`: `notification.date.timeIntervalSince1970`, NO ×1000 — unlike `getNextTriggerDateAsync` which does ×1000), so the code multiplies by 1000 before `new Date(...)`. Entry shape + 50-cap match each screen's on-screen Log.

**Patrick asked for Pets Day to mirror My Day, so it does:** the branch picks the history key by source — `pets_history` for pets, `my_history` for My Day — and writes for both. Pets' `HistoryEntry` shape is identical (verified in `mollie.tsx`).

**Deliberately left as-is (Patrick's call):** the on-screen **Log** buttons still stamp tap-time (no fired-notification date to borrow; fixing them would need a cutoff-hour rule — discussed, deferred). Known edge: a Snooze that crosses midnight files under the new day.

**`tsc --noEmit` clean.** Not yet built or device-tested. **Device test to run:** mark a My Day item (ideally the med, after midnight) Done from the banner → My Day log shows it under the prior day; repeat for a Pets feed → Pets log shows it.

---

## TEST RESULTS — partial (logged 2026-06-22, session #9)

The TestFlight build (committed 2026-06-19) bundling "Reminder Options" + Group 1 was device-tested. Patrick reported a **partial** set of findings — several pieces are still untested, so the docs commit (this update) records what's confirmed and leaves the rest pending. Code stays committed; this is a docs-only logging pass.

**Confirmed working (device-validated 2026-06-22):**

- **The seven "Reminders before" buttons toggle/light correctly** (Reminder Options, `app/todo.tsx`).
- **The banner OK button clears the alert without deleting the event** (`app/_layout.tsx` `action === 'ok'` no-op).
- (Implicit) a **"Day" reminder fired and produced a banner** with Done/OK actions — so that preset schedules + displays. Its *timing accuracy* (~5 PM, 1 day before) is NOT yet confirmed.
- **Morning of, 1 hour, and 2 hours reminders fire (device-validated 2026-06-23, session #12).** The two offset presets (1hr/2hr before the appointment time) and "Morning of" (morning clock time on the appointment day) all produced alerts.

**Bug found (device-observed 2026-06-22) — My Day medication logs on the wrong day after midnight. RAISED PRIORITY.** Patrick's medication is a **My Day daily routine item** (when he said "recurring Day tasks" he meant My Day daily, NOT the To-Do "Day" reminder preset). He takes it before bed, sometimes after midnight, and marks it done via the **banner Done on the notification popup**. **Verified in code:** banner Done (`_layout.tsx` ~122–137, `source !== 'todo'`) writes NO `my_history` entry and only sets `completed:true`, which the next-day reset (`myday.tsx` ~119) then clears → no durable record of the dose. (The on-screen Log does write history, but dates it from `new Date()` at tap-time — `myday.tsx` ~204 — still wrong after midnight.) **Open before fixing:** the desired late-night rule, and whether banner Done should write a dated history entry. A *separate* verified To-Do "Done" date bug also exists (not where meds live). Both parked under Bugs/correctness; see `parked-items.md`. **UPDATE (session #10, 2026-06-23): the My Day med bug is now FIXED in code — see "THIS SESSION" at the top. The To-Do "Done" date bug remains parked, unfixed.**

**Enhancement requested (2026-06-22) — sort the To-Do list by time, soonest/"closest" on top.** New behavior, not part of this build's scope. Parked under UI polish.

**Still UNTESTED (leave marked device-test-pending, do NOT mark validated):** "Day/Week/Month" firing ~5 PM at 1/7/30 days before (timing); the **"At time"** offset firing exactly at the appointment time; Settings Morning/Evening time changes taking effect; **Monthly** recurring firing each month; **Yearly** recurring firing on the right month+day (**Expo's 0-based month is the risky spot — still needs a real check**). (**Validated 2026-06-23, session #12:** "Morning of", "1 hour", "2 hours" all fire.)

Everything before these two sessions is **COMMITTED and DEVICE-VALIDATED**: the "Remove Daily & Date for weekly" session (Weekly To-Dos fire a dateless repeating weekly alert; To-Do Done + Snooze banner), plus the My Day + Pets Day Done/Snooze enhancements, Pets reminders, and counter persistence. Don't re-open finished work.

**Build economy (Patrick, 2026-06-19):** Patrick wants to minimize EAS builds (cost/plan). Default approach: make + review several related edits across a session, he commits, then **one** build/TestFlight cycle tests them all together. One-change-at-a-time still governs *edits*, not builds.

Note on process (Patrick, 2026-06-15): one-change-at-a-time is the default, but for very small, low-risk edits it's fine to group them and still stop for review. Keep strict one-at-a-time for anything bigger or with logic changes.

**Git/sandbox note (session 3):** never run `git status` (or any index-refreshing git command) from the assistant's Linux sandbox — it creates `.git/index.lock` and can't clean it up, which then BLOCKS Patrick's commits ("Another git process seems to be running…"). Use only read-only commands that don't touch the index: `git show :path`, `git log`, `git diff`, plus `sed`/`ls`. If a lock does appear, Patrick clears it with `rm -f .git/index.lock` (or by closing & reopening the folder in Cowork, which also worked).

## To the next session: what I need to be fresh and synced (read this first)

I start each session blank. I do NOT automatically open any file in this repo, and folder access does not carry over. One thing must happen before I can help:

- **Connect the folder in Cowork.** Patrick selects/connects the `elderlyassistant` (or parent `Projects`) folder in Cowork's folder picker — a UI action. **If I ever say the folders look empty or ask Patrick to "upload the file," that's the missing step — ask Patrick to connect it; don't ask him to upload files.**

Once connected, I read the app's code and the tracking docs straight from the folder. Patrick tells me **the one goal**, I say how heavy it looks, and I wait for his "go" before changing anything. At session end I write a fresh version of this note.

**Two tracking docs, different jobs.** This `handoff.md` keeps us on course session to session — current state, the active goal, decisions, and what just changed. `docs/parked-items.md` is the backlog: things to do *eventually* (bugs, design decisions, UI polish), not the current goal. When a parked item becomes the live goal, move it here; when something is done but more spin-offs remain, park them there.

## Standing rules (always apply)

- **Patrick does all git commits.** Claude must never run `git commit` or any git write command — possible lockout. Claude edits files and leaves them for Patrick to commit.
- **No "boxed" multiple-choice questions.** Ask open questions in plain prose; let Patrick answer freely.
- **Verify before asserting.** Read the actual code before describing behavior. When unsure, say so and offer to look.
- **One change at a time.** Discuss before building; make one edit, stop, let Patrick review/commit before the next. (Patrick: retired, does this for fun — "there's always time to do it right, without being a zealot." Favor the clean/standard approach; don't rush him.)

## Project

Remember When (elderlyassistant) — Expo / React Native app in `Projects/elderlyassistant`. Runs on Patrick's iPhone via TestFlight. No OTA updates — changes reach the phone only through a new TestFlight build. Private GitHub repo. iOS bundle id `com.molliedog.ElderlyAssistant`. New Architecture + React Compiler enabled.

**Purpose / direction (from Patrick).** Patrick is 72, retired; built this app for memory support. The **heart of the app is the To-Do list with its flexible reminder scheme** — the reminders are what his memory leans on, so they must be rock-solid. **My Day** handles the daily routine (meals, meds, etc.) — things nearly identical day to day that blur together; it resets each item at a new date and logs what's done with a timestamp/history. Day-to-day screens: **Shopping List, My Day, To-Do, Pets Day** (Pets Day = `mollie.tsx`). Shopping List (`shopping.tsx`) has NO notification code. Pets Day (`mollie.tsx`) has NO notification code (parked: add feeding reminders).

## Build / release workflow

- Path to phone: `eas build --platform ios --profile production` → "Build finished" → `eas submit --platform ios --profile production` → pick build → Apple processes (5–15 min, email when ready) → update **Remember When** in TestFlight.
- **Commit FIRST, then build.** EAS captures git state when the build is *triggered*; building mid-commit grabs the OLD file.
- **At submit, verify the Build number line** before pressing Return. Build numbers AUTO-INCREMENT (`eas.json` production has `autoIncrement: true`, `appVersionSource: remote`). If submit fails with **"build number N already used for version 1.0.0,"** it usually means a build was already accepted by Apple (e.g. an accidental double-submit) — just check App Store Connect / TestFlight; the build is likely already there. A genuine bump needs a fresh BUILD (the number is baked into the binary), not a resubmit.
- "Set up Push Notifications?" during build → always **No** (app uses only LOCAL notifications, no remote push/APNs).
- Local testing: dev build into iOS Simulator via `npm run ios`. Metro picks up edits live.

## Latest session — 2026-06-22 (#9, log partial device-test results)

Docs-only session: logged Patrick's partial phone-test findings for the 2026-06-19 build. No code changed; read `app/_layout.tsx` to verify the Done-date bug. Confirmed working: the 7 reminder buttons toggle/light, banner OK clears without deleting. New bug: To-Do "Done" on a stale banner logs today's date (cause verified in code — `completedDate` from `new Date()` at tap-time, no fire-date in payload). New enhancement: sort To-Do by soonest time on top. Untested still pending: reminder timing, Settings time changes, Monthly + Yearly recurring. Patrick commits the docs.

## Prior session — 2026-06-19 (#8, "Group 1": Monthly + Yearly recurring To-Dos)

Goal: make Monthly and Yearly recurring To-Dos actually fire (only Weekly did). Patrick scoped Group 1 down — **3-month / 6-month parked** (no native repeating trigger, and they have no anchor-date picker in the form), Monthly + Yearly are enough for now. Built one step at a time, `tsc` clean after each. **Committed; built into a TestFlight build that also carries the prior "Reminder Options" work; Patrick was device-testing as the session ended (results pending).**

- **Verified first (don't re-derive):** the installed `expo-notifications@~0.32.16` has native repeating **MONTHLY** and **YEARLY** triggers; its own validation requires **month 0–11 (Jan=0)**, day 1-based, weekday 1–7. So Yearly passes `recurMonth − 1`.
- **Step 1 — Monthly (`app/todo.tsx`, `scheduleReminders`).** New `monthly` branch after the weekly one: repeating MONTHLY trigger, `day: recurDay || 1` (picker caps at 28), `dueTime` parsed HH:MM (default 9:00), `todosnooze` banner, returns before the dated path.
- **Step 2 — Yearly (`app/todo.tsx`, `scheduleReminders`).** New `yearly` branch: repeating YEARLY trigger, `month: (recurMonth||1) − 1`, `day: recurDay || 1`, same time/banner pattern. Body uses an inline `MONTH_NAMES` (e.g. "Oct 15 at 09:00").
- **Edge case flagged, not fixed (parked):** the Yearly day picker offers 1–31 for every month, so an invalid date (e.g. Feb 30) would throw at schedule time. Unlikely in practice; tighten the picker later if wanted.
- Use cases Patrick gave: Monthly = paying bills; Yearly = annual physical, furnace-filter change, smoke-detector batteries.

### Prior session — 2026-06-19 ("Reminder Options": flexible appointment reminders)

Goal: build the appointment-reminder scheme Patrick has always wanted (the original reason for the app) — fire alerts at 1 hour before, 2 hours before, morning of, day before, week before, month before. Scoped fully in conversation first, then built one step at a time, `tsc` clean after each. **Committed; in the same build as Group 1 above, device test pending.**

- **Step 1 — Settings global times (`app/settings.tsx`).** Added a "Reminders" section: Morning Reminder Time (default 08:00) + Evening Reminder Time (default 17:00), each tappable to the Hour/Minute/AM-PM stepper picker (mirrors My Day's picker, with its modal styles copied in), saved to `reminder_morning_time` / `reminder_evening_time`. Imports added: `KeyboardAvoidingView`, `Modal`, `Platform`.
- **Step 2 — Reminder model + buttons (`app/todo.tsx`).** Extended `Reminder` with `kind`/`daysBefore`/`timeOfDay`. New `REMINDER_PRESETS` (typed `ReminderPreset`) of seven. (Originally also added a `reminderLabel` chip helper — removed later this session when the chip list was dropped.)
- **Step 3 — Scheduler (`app/todo.tsx`, `scheduleReminders`).** Before the dated-reminder loop it reads the two global times (default 08:00/17:00). Per reminder: `kind:'clock'` → fire date = appointment date minus `daysBefore` days, at the morning or evening time; else offset (minutes/hours/days before the appointment time, unchanged). Still only schedules if the fire time is future. Weekly-recurring branch and `background` early-return are unchanged above this.
- **Step 4 — OK dismiss (`app/_layout.tsx`).** Added `ok` action to `todosnooze` (`opensAppToForeground:false`); response handler early-returns on `action === 'ok'` (placed before the snooze/done branches).
- **Follow-up UI tweak (same session, after Patrick's first on-device look).** Replaced the per-reminder chip list with **toggle-highlight buttons** (tapping a preset lights it via the existing `recurBtnActive`/`recurBtnTextActive` style and toggles it off; `addPresetReminder`→`isPresetSelected`+`togglePreset`). Heading "Reminders — tap to add" → **"Reminders before"**. Button labels lost the word "before": now At time / 1 hour / 2 hours / Morning of / Day / Week / Month. Removed the now-unused `reminderLabel`, `removeReminder`, and `reminderRow`/`reminderText` styles.

### Already shipped (committed + device-validated — don't re-open)

History of finished work, kept short. The "Verified code facts" below are the live reference for how this code behaves now.

- **To-Do recurring + Done/Snooze** (2026-06-19) — removed 'Daily' from the recurring picker (kept in the type + week-view for legacy); Weekly To-Dos fire a dateless repeating WEEKLY alert and the tile shows day+time; To-Do banner got Done + Snooze 15/30/60 (`todosnooze`). (`todo.tsx` + `_layout.tsx`.)
- **My Day + Pets Day Done banner + on-page Snooze** (2026-06-19) — a `done` action on `mydaysnooze`/`petssnooze` marks the item complete by `itemId`; every My Day/Pets tile got an on-page Snooze (15/30/60). (`_layout.tsx` + `myday.tsx` + `mollie.tsx`.)
- **Pets Day reminders + counter persistence** (2026-06-17, build 18) — Pets Day mirrors My Day's notifications (`scheduleAllPetsNotifications`, DAILY per feed, `petssnooze`); Coffee/Water/Treats counters persist (`my_coffee`/`my_water`/`pets_treats`) and reset daily.
- **To-Do due-time on tiles, Pets "Routine" rename, deleteTask cancels reminders, settings.tsx:165 TS fix** (2026-06-15, `d7b4e81`).
- **My Day & Pets Day single-page restructure** (2026-06-15) — both are one always-visible list; My Day uses `my_routine` (migrated from `my_schedule`+`my_meds`); Pets uses `pets_feeds`/`pets_history`/`pets_last_date`; AM/PM tiles + Hour/Minute/AM-PM picker; `KeyboardAvoidingView` on edit modals. (Old `pets_data` left orphaned — parked.)

## Verified code facts (don't re-derive)

- **My Day list is now `routine`** (single `ScheduleItem[]`), persisted under **`my_routine`**, reset `completed:false` daily. `scheduleAllNotifications` reads `my_routine`, cancels only `data.source === 'myday'`, and schedules a repeating **DAILY** trigger per incomplete item with `sound: 'default'`. (Sound fix from earlier 2026-06-15 is committed + device-validated.) Coffee/Water counters are **now persisted** under `my_coffee` / `my_water`, reset daily (session 4).
- **Pets Day is `feeds`** (single `FeedItem[]`), persisted under **`pets_feeds`**, reset daily. **Now HAS notifications** (session 4): `scheduleAllPetsNotifications` cancels only `source: 'pets'`, reads `pets_feeds` from storage, schedules a repeating DAILY trigger per incomplete feed (title "Pets Routine", body `Time for ${label}!`, `petssnooze` category, `sound: 'default'`); permission + handler requested on mount. Treats counter is **now persisted** under `pets_treats`, reset daily; logging a Treat still writes a history entry.
- **Both screens' time picker** stores 24h internally; the UI shows/edit in AM/PM. `format12Hour` (both files) outputs real 12-hour AM/PM.
- **To-Do (`todo.tsx`) — UPDATED in "Reminder Options" (committed, awaiting device test).** `Reminder` now has optional `kind: 'offset' | 'clock'`, `daysBefore`, `timeOfDay`; legacy reminders with no `kind` are treated as offset. **Seven toggle-highlight preset buttons** (heading "Reminders before"): At time, 1 hour, 2 hours (offset) + Morning of, Day, Week, Month (clock, daysBefore 0/1/7/30). `isPresetSelected`/`togglePreset` drive the lit-button selection; there is **no chip list** anymore. `scheduleReminders`: `background` returns early; **weekly** tasks schedule a repeating WEEKLY trigger (`weekday: recurDay + 1`, `dueTime` parsed as HH:MM / default 9:00) with **NO date**; otherwise the dated path runs ONLY if `dueDate` set AND `reminders.length > 0`. In the dated loop it reads `reminder_morning_time` / `reminder_evening_time` (default 08:00/17:00) and per reminder: `kind:'clock'` → fire = (date − daysBefore days) at the morning/evening clock time; else offset = that many minutes/hours/days before the appointment time. Schedules only if fire time is future. All To-Do notifications carry `data: { taskId, itemId, label, source:'todo' }` + `categoryIdentifier: 'todosnooze'`, so banners show **Done + Snooze 15/30/60 + OK**. 'Daily' removed from the picker (still in the type + week-view handler for legacy tasks). **Recurring scheduling (session #8, committed, device test pending):** `scheduleReminders` now has early-return branches for **weekly** (WEEKLY trigger, `weekday recurDay+1`), **monthly** (MONTHLY trigger, `day recurDay` 1–28), and **yearly** (YEARLY trigger, `month recurMonth−1` [0-based], `day recurDay`), each at `dueTime` (default 9:00). **every3months / every6months still schedule NOTHING** (no native trigger + no anchor-date picker — parked). `updateTask`/`deleteTask` cancel via `cancelReminders`. **To-Do `loadData` does NOT reschedule on load** (repeating OS triggers survive restarts). `scheduleBackgroundReminder` fires a DAILY 8am reminder for all `background` tasks, no per-item id.
- **Settings (`settings.tsx`) — global reminder times (new).** A "Reminders" section with Morning (default 08:00) + Evening (default 17:00) times, edited via the Hour/Minute/AM-PM stepper picker, stored under `reminder_morning_time` / `reminder_evening_time` as 24h "HH:MM". These are the clock anchors the To-Do scheduler reads. No per-appointment override (parked).
- **Notification action handling lives in `app/_layout.tsx`.** Categories `mydaysnooze` + `petssnooze` + **`todosnooze`** each have **Done + Snooze 15/30/60**; `todosnooze` additionally has an **OK** action (`opensAppToForeground:false`) that the handler treats as a no-op (`if (action === 'ok') return;`, placed before the snooze/done branches) — it just clears that one fired alert. The response effect (on `useLastNotificationResponse`) handles `snooze15/30/60`, `done`, `ok`, and a plain tap (route by `source`). **Snooze** branches: `todo` → re-tagged `todo`/`todosnooze` one-off; pets → `petssnooze`; else `mydaysnooze`. **Done** branches: `todo` → log to `todo_log`, then if `recurring !== 'none'` leave schedule+task (repeats on its own) else remove from `todo_tasks` + cancel all alerts matching `taskId`; pets/myday → mark `completed:true` in `pets_feeds`/`my_routine` by `itemId`, **write a dated history entry** to `pets_history`/`my_history` (session #10 — date+time from `response.notification.date`×1000, since iOS reports it in SECONDS; same entry shape + 50-cap as each screen's Log), + cancel the fired notif. All run via the foreground effect, so action taps bring the app forward. On-page Snooze in `myday.tsx`/`mollie.tsx` reuses the same TIME_INTERVAL + tagging scheme.
- iOS caps an app at **64 pending scheduled local notifications** (a DAILY/repeating trigger counts as ONE). Keep this in mind if Pets Day notifications get added.

## Tooling notes

- **Don't type into Simulator text fields with the assistant's tools** — triggers iOS accent popups and mangles input. Have Patrick type directly.
- **Assistant swipe/tap gestures on the Simulator are unreliable.** Patrick does direct manipulation/typing on the device; Claude reasons/guides, reads code, does menu-level actions.

## Active next step (the named goal for next session)

**THE NAMED GOAL FOR NEXT SESSION: finish Audio input Stage 2 — confirm the "mark item done" Siri intent on the Simulator, then the EAS device build.** Session #16 BUILT the real feature in code (Steps 1–3, tsc clean; see "THIS SESSION — #16" at top) and fixed the local-module `package.json` bug; the app now compiles/links/installs but has NOT been seen launching (Simulator auto-open died on the benign LSApplicationWorkspaceErrorDomain error 115). **Resume:** (1) open the app manually on the Simulator, confirm NO "Cannot find native module 'AppGroup'" crash; (2) Shortcuts smoke test (open My Day once → Shortcuts shows "Open Remember When" + "Mark item done" with the real items); (3) Patrick commits the code; (4) single EAS **device** build to confirm voice "Mark \<item\> done in Remember When" → wakes app, marks done, logs — after enabling the App Group capability in Apple's portal. One change at a time. Full detail in "THIS SESSION — #16."

**▶ Audio input → Siri App Intents — SPIKE PROVEN (session #15, 2026-06-25). NEXT = Stage 2 device build.** Hands-free is the priority; custom mic + wake word ruled out (#14). Data bridge decided: **Approach B — "Siri drops a note,"** the existing RN code applies it. **Feasibility spike PASSED** — a config plugin injects a compiling, Shortcuts-discoverable Swift App Intent into this gitignored-`ios/` (CNG) app. Spike scaffolding committed this session (`plugins/withSiriIntent.js`, `plugins/ios/OpenRememberWhenIntent.swift`, `app.json`). **Next session: Stage 2** — one EAS device build to confirm voice invocation ("Hey Siri, open Remember When") + app-wake; then build the real `MarkItemDoneIntent` + App Group note + RN reader. Full detail in "THIS SESSION — #15 (B)" at the top and the Audio entry in `parked-items.md`.

**MY WEEK IS BUILT + banner actions DEVICE-VALIDATED (session #13).** Code-complete; the banner Done/Postpone path passed on the phone. Only low-priority, time-based pieces remain unconfirmed (long-run weekly cycle, "moved to <day>" persistence, a days-out postpone firing) — they'll just confirm in normal use; see in-flight item #0. No action needed next session unless Patrick raises it.

**In flight, awaiting a device test:**

0. **MY WEEK — banner actions now DEVICE-VALIDATED 2026-06-23 (session #13).** On the phone, Patrick postponed **from the banner** and **from the page**, and tapped **Done on the banner** → it checked the tile and logged the event. (This required the session #13 sequential-category-registration fix — see "THIS SESSION — #13" (A).) **Still not separately confirmed on device (low priority, time-based):** (a) the long-run weekly cycle — a chore fires on its day and auto-returns the *following* week, and the ✓ clears when its day comes around again; (c) the tile shows "moved to <day>" persists across reopen; (d) a tile Postpone scheduled days out actually fires on the chosen day. These are days/weeks out so they'll just confirm in normal use; the action plumbing itself is now proven on device.
1. **Session #11 sort (To-Do soonest-first) — DEVICE-VALIDATED 2026-06-23 (session #12).** List shows soonest on top, with time. Done — no longer pending.
2. **Session #10 fix (My Day after-midnight banner Done) — DEVICE-VALIDATED 2026-06-25 (session #15).** Patrick let the **Medication** reminder fire at 11:55 PM (06/24), tapped **Done on the banner after midnight** (06/25); the Log filed it as **06/24 | 23:55 | Medication** — dated from the FIRE time, under the prior day, exactly as the fix intended. He confirmed he's happy with the behavior (today's tile staying un-done is expected — the dose belongs to the day it fired). **Pets Day half (same mirrored code path, `pets_history`) not separately device-tested** — same handler, high confidence, but leave noted as un-confirmed for Pets.
3. **The 2026-06-19 build's PARTIAL test is still ongoing.** Confirmed: 7 reminder buttons toggle/light; banner OK clears without deleting; **Morning-of / 1hr / 2hr fire (session #12)**. Still untested: At-time offset, Day/Week/Month timing, Settings time changes, and Monthly + Yearly recurring firing (Yearly month especially). See "TEST RESULTS" up top.

**Still parked:** To-Do "Done" stamps today's date on stale banners (Bugs/correctness — separate from the now-fixed My Day bug). (The "sort To-Do by soonest" item is now BUILT — session #11 — so it's no longer parked.)

**Likely next goals (let Patrick name one):**

- **▶ Audio input → Siri App Intents — DIRECTION SET (session #14).** Hands-free via Siri (custom mic + wake word ruled out). Next: scope the command set + native-Swift feasibility spike, then its own build. See "THIS SESSION — #14" and `parked-items.md`.
- **Fix the separate To-Do "Done" wrong-date bug** — carry the reminder's intended date in the notification `data` (or stamp `completedDate` from it) instead of `new Date()` at tap-time. (`app/_layout.tsx`.)
- **Sort the To-Do list by closest due time on top** (`app/todo.tsx`).

- **Group 2 — To-Do convenience:** add an on-tile Snooze button to To-Do (My Day + Pets Day have one; To-Do only has the banner Snooze).
- **3-month / 6-month recurring** (the parked half of Group 1): needs a design decision (reschedule-on-fire vs pre-scheduling the next few one-shots, within the iOS 64-notification cap) AND a new anchor-date picker in the form. Heavier; its own session.
- **Group 3 — housekeeping:** confirm/fix the Timer-cancel bug (cancelled timer's alert may still fire — never device-confirmed); clear the orphaned `pets_data` storage key.
- **Group 4 — smarter reminder taps:** land on the exact item, not just the screen (touches the shared tap-routing in `_layout.tsx` — test taps from all screens together).
- **Group 5 — Project Planner reminders:** wire up its dormant reminder fields to actually schedule alerts.
- Small parked spin-off: the Yearly day picker offers 1–31 for every month (Feb 30 would throw at schedule time) — tighten it.
- **Parked, not planned:** per-appointment reminder time override. **Resolved/dropped:** "where do daily-repeating reminders live" (decided — My Day is the daily engine, To-Do dropped Daily).

## Files touched this session (#13 — 2026-06-23)

- `app/myweek.tsx` — Postpone popup Cancel wrapped in `modalBtns` row (renders as a proper labeled grey button, not the thin bar); `clearAllBtn`/`clearAllBtnText` greyed (`#999`/`#666`).
- `app/myday.tsx` — snooze popup Cancel wrapped in `modalBtns` row; `clearAllBtn`/`clearAllBtnText` greyed.
- `app/mollie.tsx` — snooze popup Cancel wrapped in `modalBtns` row; `clearAllBtn`/`clearAllBtnText` greyed.
- `app/_layout.tsx` — **banner fix:** category-registration `useEffect` now registers the four notification categories **sequentially** (async IIFE, `await` each `setNotificationCategoryAsync`) instead of firing them concurrently — fixes the cold-cache read-modify-write race that dropped `myweekactions` on device. No change to action handlers.
- **`tsc --noEmit` clean. DEVICE-VALIDATED 2026-06-23** — banner fix passed on Patrick's phone (postpone from banner + page, banner Done checks tile + logs). UI changes (Cancel buttons, Clear All) Simulator-validated and shipped in the same build. **Code committed + built to phone this session; docs commit can follow.**

## Files touched this session (#12 — 2026-06-23)

- `app/myweek.tsx` — **NEW.** The whole My Week feature: weekly-chore list mirroring My Day (`week_routine` / `week_history`); `Chore` model `{ id, label, day 0=Sun…6=Sat, hour, minute, completed, doneAt?, postponedTo? }`; Add/Edit modal with Sun–Sat day picker + time picker; **base WEEKLY reminder** per chore (`scheduleAllNotifications`, weekday `day+1`, `source:'myweek'`, category `myweekactions`); **weekly reset** (`lastOccurrence` + `applyWeeklyReset`); **tile Postpone** (`schedulePostpone`/`postponeTomorrow`/`postponeToDay`/`cancelPostpone`/`nextDateForWeekday`, one-off `DATE` reminder `source:'myweekpostpone'`, `postponedTo` → "▶ moved to <day>"). No Coffee/Water counters.
- `app/_layout.tsx` — registered `myweekactions` category (Done + +1 Day); added handlers: **postpone1** (push reminder to tomorrow at chore time, rewrite `postponedTo`), **done** for `myweek`/`myweekpostpone` (mark complete + log to `week_history` from fired time + clear pending postpone; deliberately does NOT cancel the WEEKLY identifier); tap-routing `myweek`/`myweekpostpone` → `/myweek`.
- `app/home.tsx` — "My Week" 🗓️ tile + `/myweek` route.
- `docs/handoff.md` + `docs/parked-items.md` — refreshed at session close (this version); parked one minor item (My Week in-app Done dates from tap-time, like My Day). **`tsc` clean throughout. Patrick commits the code (then builds/submits/loads); docs commit can follow the phone test.**

## Files touched in session #11 (#11 — 2026-06-23)

- `app/todo.tsx` — `getSortedTasks` reduced to one fixed sort by due date + time (soonest on top; undated/recurring at the bottom); removed the sort-button UI block, the `sortBy` state, and the `sortRow`/`sortLabel`/`sortBtn*` styles. Category filter row untouched. **`tsc` clean — DEVICE-VALIDATED session #12.**
- `docs/handoff.md` — recorded the sort change. **Patrick commits.**

## Files touched in session #10 (#10 — 2026-06-23)

- `app/_layout.tsx` — `action === 'done'` non-To-Do branch now writes a dated history entry (`my_history` for My Day, `pets_history` for Pets) stamped from `response.notification.date`×1000, in addition to marking the item complete + cancelling the notif. Fixes the after-midnight med bug; mirrors it to Pets per Patrick. **`tsc` clean. Awaiting commit + device test.**
- `docs/handoff.md` + `docs/parked-items.md` — refreshed at session close (this version). **Patrick commits.**

## Files touched in session #9 (#9 — 2026-06-22, docs only)

- `docs/handoff.md` + `docs/parked-items.md` — logged partial device-test results: validated the 7 reminder buttons + banner OK; recorded the To-Do "Done" wrong-date bug (verified in `app/_layout.tsx`) and the "sort To-Do by closest time" enhancement; left reminder timing + Monthly/Yearly recurring marked pending. **No code touched. Patrick commits the docs.**

## Files touched in session #8 ("Group 1: Monthly + Yearly" — 2026-06-19)

- `app/todo.tsx` — `scheduleReminders` gained a **monthly** branch (MONTHLY trigger, `day recurDay`) and a **yearly** branch (YEARLY trigger, `month recurMonth−1`, `day recurDay`), both at `dueTime`/default 9:00 with the `todosnooze` banner, each returning before the dated path. **`tsc` clean. Committed; in the current build, device test pending.**
- `docs/session-start.md` — added the **"Build-and-test commit rhythm"** section (code committed before the build, docs committed separately after the device test) and tweaked the matching standing rule. **Patrick commits.**
- `docs/handoff.md` + `docs/parked-items.md` — refreshed at session close (this version). **Patrick commits (docs commit comes after the phone test, per the rhythm).**

(Prior session's files — `app/settings.tsx`, `app/todo.tsx`, `app/_layout.tsx` for "Reminder Options" — are committed and in the same build; see that session's notes above.)

---

## ▶ PASTE THIS AT THE START OF THE NEXT SESSION

You're picking up the "Remember When" app (Expo / React Native, runs on my iPhone via TestFlight).

1. The `elderlyassistant` folder must be connected via Cowork's folder picker — if you can't see it, give me the folder-request button; don't ask me to upload files.
2. Open and read `docs/handoff.md` first (full state, standing rules, next step), then skim `docs/parked-items.md` (the eventual-work backlog) so you know what's deferred.
3. **The named goal is Audio input — Stage 2** (see "Active next step" + "THIS SESSION — #15"). The Siri App Intents feasibility spike PASSED in #15 (config plugin injects a compiling, Shortcuts-discoverable intent into the app). Stage 2 = one EAS **device** build to confirm "Hey Siri, open Remember When" by voice + that running it wakes the app; then scope/build the real "mark item done" intent. Scope with me + wait for my "go" before building. Device tests still in flight (only if relevant):
   - **Session #11 To-Do soonest-first sort — already DEVICE-VALIDATED #12** (soonest on top, with time). Done; don't re-test.
   - **Session #10 My Day after-midnight banner-Done fix — DEVICE-VALIDATED 2026-06-25 (session #15).** Medication fired 11:55 PM (06/24), Done tapped after midnight → Log shows **06/24 | 23:55 | Medication** (prior day, fire time). Pets feed half (same code path) still not separately device-tested.
   - **The 2026-06-19 build** (Reminder Options + Group 1): validated so far — 7 reminder buttons, banner OK, and Morning-of/1hr/2hr firing. Still untested: At-time offset, Day/Week/Month timing, Settings time changes, Monthly/Yearly firing (Yearly month especially). 3-month/6-month recurring stays parked. Everything before these is committed + device-validated; don't re-open finished work.
4. **The goal is Audio input — Stage 2** (Siri App Intents, spike already proven in #15; see "New features (to scope)" in `parked-items.md`). If I change my mind, other candidates: the To-Do "Done" wrong-date bug, Group 2 on-tile To-Do Snooze, the parked 3/6-month recurring, or housekeeping. Scope it with me before building, then wait for my "go" — one change at a time.
5. **Build economy:** I want to minimize EAS builds. Batch related edits across a session, I commit, then ONE build tests them together. Docs get their own commit AFTER the phone test (see "Build-and-test commit rhythm" in `session-start.md`).
