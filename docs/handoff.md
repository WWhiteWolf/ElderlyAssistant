# Hand-off note — paste at the start of the next session

## THIS SESSION — #24 (2026-06-27): BACKUP COMPLETE — the **Import** half is BUILT and Simulator-validated across all cases. Export (#23) + Import together = the whole local-backup feature works end to end. Code in the working tree; Patrick to commit. Docs pending his commit.

**Goal = finish Elyfont local data backup (Import).** Built Import one decision at a time (continuing the same backup session as #23); Patrick tested every combination on the iPhone 17 Simulator — **all work.**

**ONE app file changed — `app/backup.tsx`** (added `handleImport` + helpers; the only new import is `expo-document-picker`). Flow:
1. `DocumentPicker.getDocumentAsync({ type:'application/json', copyToCacheDirectory:true })` → pick a file; cancel does nothing.
2. Read the file with the SDK-54 `new File(uri).text()`, then `JSON.parse`. Unreadable → "Not a valid backup", changes nothing.
3. **Validate**: must have `type === 'elyfont-backup'` and a `data` object, and `version` must not be newer than this app's `BACKUP_VERSION` (1). Otherwise a plain message, changes nothing.
4. If `vault.encrypted`: **one-entry** password prompt → `CryptoJS.AES.decrypt(payload, password)` → `toString(enc.Utf8)` → `JSON.parse` as a sanity check. Empty/garbage (i.e. **wrong password**) is caught → "Wrong password", changes nothing. (One entry, not two — on a restore a wrong password just fails harmlessly.)
5. **"Replace Everything?"** confirm dialog (destructive). Nothing is overwritten until this is confirmed.
6. **True replace** via `AsyncStorage.multiSet` for keys present in the backup **and `multiRemove` for keys absent** (so nothing old lingers); Vault is set, or removed if the backup's Vault was empty.
7. `router.replace('/home')` + "Restore complete" — Home reloads on focus (verified `useFocusEffect` in `home.tsx`; list screens load on mount, e.g. `myday.tsx` `useEffect`→`loadData`), so restored data shows.

**⚠ Another first-time native module — `expo-document-picker` (already in package.json since #21).** First real use, so Import needs a **rebuild** (`npm run ios`); a Metro reload isn't enough. (Same situation as `react-native-get-random-values` in #23 — both must be in any future rebuild/EAS build.)

**HOW IT WAS TESTED (Simulator) — Patrick tried "all combinations," all pass:** correct password restores the Vault item; wrong password refuses and changes nothing; a non-backup file is rejected as not an Elyfont backup; the unencrypted/empty-Vault file imports too. `tsc --noEmit` clean (EXIT 0).

**STATUS: the local backup feature (Export + Import) is code-complete and Simulator-validated end to end.** Two app commits' worth of code sit in the working tree across #23–#24 (all in `app/backup.tsx`) plus the new dep `react-native-get-random-values`. Patrick to commit.

**Still open / next candidates (none urgent):**
- **NEW — add a "merge" Import option (Patrick requested, end of #24).** Today Import only **replaces**. Patrick wants the *choice* of merging a backup into existing data. **Deferred to its own session** — merge is NOT a small add: it needs a **per-list rule decided with Patrick**, because each data type combines differently. Sketch we discussed: ID-keyed arrays (`todo_tasks`, `vault_items`, `planner_projects`, routine lists) → add items whose IDs aren't already present, and decide what happens when the same ID exists in both; append-only logs (`my_history`, `week_history`, `pets_history`, `todo_log`, `planner_log`) → concatenate + de-dupe; counters (`my_coffee`, `my_water`, `pets_treats`) → pick higher / sum / keep current (Patrick's call); single-value settings (`user_name`, reminder times, flags) → backup-wins vs current-wins. Likely UI: after picking a file, ask "Replace or Merge?" Scope each rule with Patrick before building. Full per-list design lives in `parked-items.md`.
- **Real-device pass** — especially the real **iCloud** round-trip on Patrick's actual phone (Simulator isn't signed into his iCloud; "On My iPhone" proved the mechanism). Export a file to iCloud on the phone, reinstall or wipe, Import it back.
- **#22 security cleanup (non-exposure, still parked) — VERIFIED this session what the forgotten PIN actually blocks:** read `settings.tsx` + `index.tsx` — the ONLY thing the forgotten `user_pin` blocks is **Reset All Data** (`resetApp` ~line 217 checks `pin === savedPin`) and the dead **Change PIN** keypad (~line 153). App launch has NO PIN gate (`index.tsx` just redirects to `/home`) and the Vault is Face ID (#22), so Patrick is NOT locked out of anything day-to-day and no data is at risk. **Cleanup = switch Reset All Data to Face ID + remove the dead Change PIN row/keypad** (then also: orphaned `vaultpin.tsx`/`login.tsx`/`setup-pin.tsx` — note `resetApp` routes to `/setup-pin` on success, line 219; and reword the stale "Require PIN to open Vault" hint). Small, self-contained — good short next session. See parked-items.
- Optional backup polish (parked): date-only filename collides on same-day re-export (could append a time).

---

## THIS SESSION — #23 (2026-06-27): BACKUP RESUMED — the **Export** half is BUILT and Simulator-validated on BOTH paths (empty Vault + encrypted Vault). Code in the working tree; Patrick to commit. Docs pending his commit.

**Goal this session = Elyfont local data backup (Export first).** Backup resumed after the security detour (#21/#22). Built Export one decision at a time; Patrick tested on the iPhone 17 Simulator (iOS 26.5).

**ONE app file changed — `app/backup.tsx`** (the shell from #21 was just placeholders). `handleExport` now:
1. Reads all backup keys via `AsyncStorage.multiGet` — **EXCLUDES `user_pin` + `pin_set`** (the retired PIN; decided with Patrick) and handles `vault_items` separately.
2. Checks if the Vault has items. **Password is requested ONLY when the Vault is non-empty** (decided with Patrick — nothing to protect when empty).
3. If non-empty: **two-step password prompt** (type, then confirm — decided with Patrick; a mismatch or <4 chars aborts with no file). Encrypts **only** `vault_items` with `CryptoJS.AES.encrypt(vaultRaw, password)`.
4. Assembles one JSON: `{ app:'Elyfont', type:'elyfont-backup', version:1, exportedAt, vaultEncrypted, data:{…readable keys…}, vault:{ encrypted, payload } }`. (Import will read `type`/`version` to recognize the file and `vault.encrypted` to know whether to decrypt.)
5. Writes `Elyfont-Backup-YYYY-MM-DD.json` to `Paths.cache` (SDK-54 `File`/`Paths` API) and opens the iOS **share sheet** (`expo-sharing`) → user saves to Files / iCloud / Drive.
On any failure it shows a plain message and makes **no** file. Also reworded the on-screen note (was "protected with your PIN" → now explains the backup password).

**⚠ NEW REQUIRED DEPENDENCY — `react-native-get-random-values` (Patrick installed via `npx expo install`).** crypto-js needs a secure RNG to make the AES salt; Hermes doesn't provide one, so `CryptoJS.AES.encrypt` threw **"Native crypto module could not be used to get secure random number"** the first time a Vault item was exported. Fix: `import 'react-native-get-random-values';` as the **FIRST import in `backup.tsx`** (above the crypto-js import), which supplies the RNG. **This is a native module — any future rebuild / EAS build must include it, or Vault encryption breaks again.**

**HOW IT WAS TESTED (Simulator, iPhone 17 / iOS 26.5):**
- **Empty-Vault path:** Export → no password asked → file created → share sheet → saved via "Save to Files" (proved on "On My iPhone"). ✅
- **Encrypted-Vault path:** added a Vault item, rebuilt (`npm run ios`, needed for the new native module), Export → two password prompts → **ran with no error**, file created. ✅ (This is what surfaced + then confirmed the RNG fix.)
- `tsc --noEmit` clean (EXIT 0) after both edits.

**Notes / small parked items from this session:**
- **Real iCloud save** is best confirmed on Patrick's **actual phone** (the Simulator isn't signed into his real iCloud; "On My iPhone" proved the save mechanism, which is enough to trust it).
- **Filename is date-only**, so a second export on the **same day** triggers Files' "Replace / Keep Both" prompt. Fine for normal use (latest is usually wanted). Possible future tweak: append a time (e.g. `…-1356`) if he ever wants multiple same-day backups. (Parked.)

**➤ NEXT — build the IMPORT half.** The screen shell + the "Import Backup" button already exist (`handleImport` is still a placeholder Alert). Import should: pick a file (`expo-document-picker`, already installed) → parse + verify it's an Elyfont backup (`type==='elyfont-backup'`, check `version`) → if `vault.encrypted`, prompt for the backup password and `CryptoJS.AES.decrypt` the `vault` payload back to `vault_items` (handle a wrong password gracefully — decrypt yields empty/garbage) → **confirm dialog ("replace everything?")** → write all keys back via `AsyncStorage.multiSet` (and `vault_items`). Design was decided in #21: replace current data. Discuss the exact flow with Patrick before building.

---

## THIS SESSION — #22 (2026-06-27): Security — the two real Vault exposures CLOSED and verified on the Simulator with simulated Face ID. Code committed by Patrick (`a8511c3`, `3bd445e`); these docs pending his commit.

**Goal this session = PIN / Face ID / security** (the focused session #21 said to open). Verified the actual code FIRST (no assuming), fixed two things, Patrick tested both on the Simulator, both pass.

**FIX 1 — the toggle bypass is closed.** `app/settings.tsx`: uncommented the `expo-local-authentication` import (it was commented out at line 2) and added an auth gate to `toggleVaultPin` — turning **"Extra Vault Security" OFF now requires Face ID / passcode** (`authenticateAsync`; on failure/cancel it returns early so the Switch snaps back ON). Turning it ON stays free. Closes the "anyone holding the phone can disable Vault security and read the Vault" hole. **Committed `a8511c3` "expo-local-authentication".**

**FIX 2 — the Vault Face ID gate was looping; fixed.** `app/vault.tsx`: the gate's `useEffect` depended on `[params]`, whose object identity changes on every redraw, so it **re-fired Face ID in an endless loop** (auth → redraw → re-prompt → …) AND let the category list show through between prompts. Changed it to run **once on open** — added a `didCheck` `useRef` guard + `[]` deps (and added `useRef` to the React import). Now: one clean prompt; on success the Vault shows and stays; on failure it routes to `/home`; no peek-through. **Committed `3bd445e` — ⚠ its commit message reads "The settings.tsx toggle fix" but it actually contains `app/vault.tsx`, not settings.tsx. Don't be misled.**

**Both `tsc --noEmit` clean (EXIT 0). Working tree clean — both fixes committed.**

**HOW THEY WERE TESTED — and an important note: Face ID DOES work on the Simulator.** iPhone 17 Simulator, iOS 26.5. Unlike the Siri/App Group work (which genuinely needed a real device), the Simulator can **simulate Face ID**: menu bar **Features → Face ID → Enrolled**, then **Matching Face** / **Non-matching Face** to fake success/failure. Patrick rebuilt (`npm run ios`) for FIX 1 (first run of the native module); FIX 2 was pure JS so a Metro reload picked it up. He confirmed live: toggle-off prompts Face ID, and the Vault opens with a single prompt — no loop, no peek-through. **For real-world use, Face ID must be ENROLLED on Patrick's actual iPhone (iOS Settings) for the gate to protect the Vault on the phone — that's separate from the Simulator's simulated Face ID.**

**KEY FACT established with Patrick this session:** he does **NOT** remember the app's custom 6-digit PIN / passcode, and there is **NO stored data at risk**. So the custom PIN can be **fully retired with no recovery path to build** — nothing to rescue.

**REMAINING security cleanup — NOT exposures, non-urgent (fold into the backup session or its own small pass):**
- `app/settings.tsx`: **Reset All Data** still demands the old `user_pin` (which Patrick forgot) → switch it to Face ID. The dead **Change PIN** row + keypad (`startChangePIN` / `handlePinDigit`, all keyed off `user_pin`) → remove.
- **Orphaned screens — verified by grep that NOTHING navigates to them:** `app/vaultpin.tsx` (vault.tsx now calls Face ID directly) and `app/login.tsx`. `app/setup-pin.tsx` is reachable ONLY via Reset All Data (`settings.tsx` ~line 210). Decide delete vs keep. (All three still registered in `_layout.tsx`.)
- Cosmetic: the Vault toggle hint still reads "Require PIN to open Vault" (`settings.tsx` ~line 335) — it's Face ID now; reword.

**➤ NEXT SESSION — likely back to the ORIGINAL goal: BACKUP STORAGE.** This whole security detour began when session #21's backup goal surfaced these holes. The exposures are now closed, so backup can resume. The backup **design is already decided** and the **screen shell already exists** — see the #21 entry below: `app/backup.tsx` shell + the Settings "Backup" row + the `_layout.tsx` registration are committed in `90f8b5d`; **Export / Import logic is what remains to build.** Data keys to back up and the Vault-encryption decision are all spelled out in #21.

---

## THIS SESSION — #21 (2026-06-27): Goal was "Elyfont local data backup." Designed it, built the Backup screen shell + Settings entry, and STARTED reworking Vault security to Face ID. Session stopped early — Patrick will open a NEW session dedicated to PIN / Face ID / security. All code below is UNCOMMITTED and UNTESTED; docs pending his commit.

**Why we stopped:** the session got tangled — repeated bad assumptions on Claude's part (notably driving the Simulator directly, which the standing notes say NOT to do, and assuming the Simulator had been rebuilt). Patrick halted and chose to handle PIN / ID / security as its own focused session. **➤ Next session's named goal = PIN / Face ID / security.** The backup feature is paused mid-build behind it.

**THE BACKUP FEATURE — DESIGN DECIDED with Patrick (so we don't re-litigate):**
- Export ALL app data to ONE JSON file → iOS **share sheet** → user saves to Files / iCloud / Google Drive (their cloud sync carries it off-phone). Import = pick a file → **confirm dialog** → **replace** current data.
- Include **Vault data**, but encrypt **only the Vault section** (the rest stays readable, so a lost password never costs the non-sensitive lists).
- Encrypt the Vault section with a **separate backup password** the user types at export and re-types at import — NOT the device PIN/biometric (Face ID/passcode can't encrypt a *portable* file that must open after a reinstall or on a new phone).
- Reachable from **Settings** ("Backup" row). 
- **Data keys to back up** (verified by grep this session): `my_routine, my_history, my_last_date, my_coffee, my_water; week_routine, week_history; pets_feeds, pets_history, pets_last_date, pets_treats; todo_tasks, todo_categories, todo_log; shopping_items; planner_projects, planner_log; vault_items (encrypted); user_name; reminder_morning_time, reminder_evening_time`. (Security flags `user_pin/pin_set/biometric_enabled/vault_pin_enabled` — decide whether to include; PIN is being retired anyway.)

**SECURITY PROBLEMS SURFACED (the reason for the next session):**
1. **BUG — Vault protection can be turned OFF without the PIN.** `toggleVaultPin` (`app/settings.tsx` ~126) just writes `vault_pin_enabled`, no auth check. And the app now opens with **no PIN at all** (`app/index.tsx` redirects straight to `/home`). So anyone holding the phone can open Settings, flip "Extra Vault Security" off, and read the Vault. **Patrick found this.**
2. **Forgotten PIN = lockout, no recovery.** Change PIN and Reset All Data both demand the *current* PIN; the only PIN-creation screen (`app/setup-pin.tsx`) never runs anymore (index→home). Patrick forgot his PIN. Data was already wiped, so nothing to rescue — but the model is broken.
3. **DECISION with Patrick: move Vault auth to Face ID / Touch ID with device-passcode fallback (`expo-local-authentication`), retiring the custom 6-digit PIN.** Wins: nothing to forget, Apple handles recovery (never locked out), and the toggle bypass closes (turning security off would require Face ID).

**WHAT GOT BUILT THIS SESSION — ALL UNCOMMITTED, NOT device/Simulator-tested:**
- `app/backup.tsx` — **NEW.** Backup & Restore screen **SHELL only**: blue header, intro text, two big buttons (Export / Import). Buttons are placeholders (Alert "not built yet"). No real logic.
- `app/settings.tsx` — added a "Backup" section with a row → `router.push('/backup')`. (No security edits yet.)
- `app/_layout.tsx` — registered `<Stack.Screen name="backup" options={{ headerShown:false }} />`.
- `app/vault.tsx` — **Vault gate converted to Face ID.** Added `import * as LocalAuthentication from 'expo-local-authentication'`; when `vault_pin_enabled === 'true'` and not `params.verified`, calls `LocalAuthentication.authenticateAsync({ promptMessage:'Unlock your Vault', fallbackLabel:'Use Passcode' })` → success shows Vault, failure `router.replace('/home')`. (Old behavior routed to the `/vaultpin` keypad.)
- `docs/session-start.md` — NEW standing rule: say explicitly WHERE to act (Mac vs iPhone vs Simulator menu bar); don't assume Patrick infers it.
- `docs/handoff.md` — (earlier this session) corrected stale spots that called voice/Siri the "next session goal" → all now say voice is parked till further notice.

**Libraries Patrick installed on the Mac this session** (for backup): `expo-file-system`, `expo-sharing`, `expo-document-picker`, `crypto-js`, `@types/crypto-js`. (`expo-local-authentication` was already installed.)

**Tree state:** `tsc --noEmit` was clean (EXIT 0) after the vault.tsx edit. **Nothing committed.** Patrick decides whether to commit or revert the above before the new session.

**⚠ CRITICAL for next session:** the Face ID change uses a **native module** → the app must be **rebuilt** (`npm run ios` = pod install + recompile) before it can be tested; a Metro hot-reload is NOT enough. If the module isn't linked, tapping Vault would red-screen "Cannot find native module," not fail silently. (This session ended right before that rebuild.)

**REMAINING for the PIN/Face ID/security session:**
- `settings.tsx`: require Face ID to turn Vault security **off** (close the bypass); switch **Reset All Data** to Face ID instead of the PIN prompt; **remove the dead Change PIN row + keypad**.
- Decide the fate of orphaned screens once the PIN is retired: `login.tsx`, `setup-pin.tsx`, `vaultpin.tsx` — remove or keep.
- THEN resume the backup feature: Export logic + Import logic (the screen shell + Settings entry are already in place).

---

## THIS SESSION — #20 (2026-06-26): Siri voice — researched the real fix, tried the cheapest one (DisplayRepresentation), it did NOT fix voice. Patrick DECIDED TO PARK voice recognition. Code one-liner committed + built (`2118681`); these docs pending his commit.

**Correction to #19's note:** the "Swift Shopping List" native proof was **never built — it doesn't exist.** This session did the research that was meant to precede it (the Cursor-prompt research), now captured in `docs/siri-cursor-brief.md` "**UPDATE 3 — research findings**."

**Patrick's hard requirement (locked this session):** *without live, no-rebuild command recognition, voice isn't worth doing.* This **kills the fixed `AppEnum` option** (a compile-time set = no live recognition), and the native-rewrite-for-AppEnum idea with it.

**Diagnostic done — the Expo/CNG pipeline is NOT the problem (so a native rewrite would not differ on this axis):** confirmed `Metadata.appintents` **IS generated** in the built app (`find` in DerivedData on Patrick's Mac returned it), both intent `.swift` files are in the Xcode **Sources** build phase (pbxproj 345–346), Podfile `post_install` doesn't clobber settings, `EnableAppIntents` is at its default. Plus per-item tiles already register on device + tap works. So build-time metadata extraction works; #19's "native proof to isolate the pipeline" is effectively answered (pipeline fine).

**Tried the cheap fix — FAILED.** Changed `MyDayItemEntity.displayRepresentation` (line 30) from `DisplayRepresentation(title: "\(label)")` to `DisplayRepresentation(title: LocalizedStringResource(stringLiteral: label))` — matches a known-working live-list sample (Apple forum 759909) and the `%@`-interpolation fix (forum 713178). Patrick committed (`2118681`) + EAS-built + TestFlight-installed + **rebooted**, then spoke the full correct phrase "mark breakfast done in Elyfont." **Still App-Store fallback.** DisplayRepresentation theory disproven for his case. (The one-liner is left in — harmless / arguably more correct.)

**The blocker is unchanged from #19 and now well-characterized:** Siri won't VOICE-match the dynamic parameterized phrase — the whole phrase misses Siri's grammar ("I don't see an app… Search the App Store"), while the tile registers, tap works, and metadata generates.

**Research conclusions (full detail in `siri-cursor-brief.md` UPDATE 3):**
- A dynamic `AppEntity` CAN voice-match in principle (Apple's own "BooksShelf" sample) but it's fragile.
- Apple DTS (forum 759909): App Shortcut voice params must be **learned** from `suggestedEntities()` at `updateAppShortcutParameters()` time; there is **no freeform spoken-parameter capture** in an App Shortcut.
- `IndexedEntity` (iOS 18+) targets Spotlight/semantic **search + resolution**, NOT clearly the fix for this phrase-grammar-miss / App-Store-fallback symptom — a genuine **maybe**, not a confirmed fix.
- Documented **iOS 26.4 App Intents regression**; Patrick is on **26.5** — some of this may be Apple-side, outside our code's control.

**DECISION (Patrick): PARK voice recognition.** "Either there will be a way at a later date, or I will go without it." Tap-from-Shortcuts already works on device. All Siri scaffolding stays in place, inert (`plugins/ios/*.swift`, `plugins/withSiriIntent.js`, `modules/app-group/`, the `app.json` plugin entry, the App Group capability).

**➤ SINGLE RESUME DOC: `docs/siri-voice-resume.md`** — self-contained (goal, constraints, full architecture as built, everything tried + ruled out, exact next steps). Read it first to pick the feature back up; it supersedes the scattered #14–#20 entries.

**IF REVISITED LATER — the smartest next move (cheap, decisive):** run Apple's existing dynamic-entity sample (Create with Swift "BooksShelf" final project) on the device. If Apple's own sample ALSO can't voice-match a dynamic item on this iOS → it's the OS/device, so stop building on our side. If it works → something specific to our Expo app differs → dig there. (Needs Xcode on the Mac — new for Patrick; Claude can guide.) Alternatives: take the `IndexedEntity` swing (genuine maybe); or watch for an iOS update fixing the 26.x regression.

**Files touched this session (#20):**
- `plugins/ios/MarkItemDoneIntent.swift` — line 30 `DisplayRepresentation` → `LocalizedStringResource(stringLiteral: label)`. **Committed `2118681` + EAS-built + device-tested by Patrick — did NOT fix voice.**
- `docs/siri-cursor-brief.md` — NEW "UPDATE 3 — research findings." **Committed `2118681`.**
- `docs/handoff.md` + `docs/parked-items.md` — this update. **Pending Patrick's commit.**

---

## THIS SESSION — #19 (2026-06-26): Siri voice — REGISTRATION solved (a phone REBOOT did it), and the REAL blocker isolated: Siri won't VOICE-match the dynamic item parameter. Renamed the app to "Elyfont" (built + device-tested) — did NOT fix voice. NEXT: use Cursor to choose IndexedEntity vs fixed AppEnum vs a native-Swift rewrite. Code (rename) committed + built by Patrick; docs (this + the Cursor brief) pending his commit.

**Brought in Cursor as a second tool this session.** Created `docs/siri-cursor-brief.md` — a standalone brief that hands the whole Siri problem to Cursor's AI so it starts caught up. Keep it; it's the working hand-off to Cursor and was updated twice (see "UPDATE" and "UPDATE 2" inside it).

**BREAKTHROUGH 1 — a phone REBOOT fixed registration (the #18 blocker).** After a full power-cycle, the parameterized "Mark item done" shortcut NOW registers on device: the Shortcuts app shows the "Open" tile PLUS one tile per live My Day item (Breakfast, Lunch, Snack), and they survive a reboot and appear before opening the app. This **DISPROVES both #18 hypotheses**: (A) App-Group-read-fails — DISPROVEN (the tiles show the user's REAL items, so the shared box IS read on device); (B) structural rejection — DISPROVEN (it registers). The #18 "no tile" symptom was a stale Siri registration cache that only a reboot clears (delete+reinstall did NOT). **Lesson: after any App Shortcut change, reboot the phone before concluding anything.**

**BREAKTHROUGH 2 — tap works end-to-end.** Tapping a per-item tile (e.g. Snack) in the Shortcuts app foregrounds the app, marks the item done in My Day, and logs it. So the intent, the App Group note bridge, `openAppWhenRun`, and the RN done-logic ALL function on device. The whole machine works — except voice.

**THE REMAINING BLOCKER (now precisely isolated): Siri will not VOICE-match the parameterized command's DYNAMIC `AppEntity` item parameter.** "Hey Siri, mark snack done in <app>" → Siri transcribes the words PERFECTLY but answers "I don't see an app for that. You'll need to download one" + "Search the App Store" (it gives up matching the shortcut and treats the tail as an app to find). Isolation tests: "Hey Siri, open <app>" OPENS the app (name + transcription are fine — though iOS opens any app by name natively, so that alone isn't proof of our intent); tap works; tiles register. The ONLY failing piece is the spoken dynamic-item parameter. `suggestedEntities()` fills the Shortcuts UI tiles but the spoken-parameter path fails.

**Decided with Patrick: pursue a REAL permanent fix (NOT user-created canned Shortcuts phrases — those work by voice but aren't the goal), AND consolidate the app's many names at the same time.**

**RENAME to "Elyfont" — BUILT + DEVICE-TESTED — did NOT fix voice.** Theory (mine + Cursor's research): "Remember When" is an ordinary English phrase, so Siri mis-segments "…in Remember When" and falls back to App-Store search. One coordinated change set, committed + EAS-built + TestFlight-installed by Patrick:
- `app.json`: display name "Remember When" → **"Elyfont"** (drives `\(.applicationName)` + the home-screen label — the name Siri reads). **Bundle id + App Group deliberately UNCHANGED** (changing them = a new app to Apple).
- `plugins/ios/OpenRememberWhenIntent.swift`: intent title/description + Open `shortTitle` → Elyfont; expanded the "Mark item done" phrases 3 → 5, leading with "Mark \<item\> done **with** \(.applicationName)" plus "in" and "in the … app" variants. Kept the struct name `RememberWhenShortcuts` so the AppDelegate refresh call still matches.
- `plugins/ios/MarkItemDoneIntent.swift`: description string → Elyfont. No change to the entity/query/perform.
**RESULT (device):** tiles register under "Elyfont" (survive reboot). "Hey Siri, open Elyfont" opens the app. BUT "Hey Siri, mark snack done with/in Elyfont" STILL fails identically. So the **English-phrase-name theory is DISPROVEN** — a distinctive coined name fails the same way. The rename still served the naming goal (Patrick likes "Elyfont"), but did NOT fix Siri.

**THREE OPTIONS for the real fix (next session decides, via Cursor):**
1. **`IndexedEntity` + Spotlight donation** — keep the live/dynamic My Day list but put items in Siri's semantic index so spoken values are matchable (iOS 18+). More complex; another build; uncertain.
2. **Fixed `AppEnum`** — hardcode the routine items as a finite enumerated set. Apple's documented "fixed set of well-known values" pattern → most likely to actually voice-match. Cost: the spoken list updates only on a rebuild (tap stays live). Routine is small/stable, so maybe acceptable.
3. **Rebuild natively in Swift** — Patrick raised this; real option since the app is iOS-only (RN's cross-platform benefit is unused) and native makes App Intents first-class (no CNG/config-plugin friction, real Xcode debugging). **Honest caveat: native does NOT auto-fix this Apple-API limit** — it gives clean tools to apply it. **Agreed cheap proof before any rewrite:** a tiny native Swift "Shopping List" app (items + `need`/`stocked`, ONE "mark \<item\> stocked" App Intent over a DYNAMIC list) to test whether Siri voice-matches a dynamic list in a CLEAN native project — isolating whether our Expo/CNG/plugin scaffolding contributes. Workflow note: native = Xcode on the Mac (unfamiliar to Patrick), Claude authors Swift, Patrick builds/runs with guidance.

**NEXT SESSION — Cursor FIRST (Patrick's call), before any build or Xcode work.** Point Cursor at `docs/siri-cursor-brief.md` (esp. "UPDATE 2") to answer: (1) can a fully dynamic `AppEntity` parameter voice-match at all, or is `IndexedEntity`/Spotlight donation required (which iOS)? (2) could our CNG/config-plugin setup register the TILE but not the VOICE grammar — i.e., would clean native behave differently (decides if the Swift proof is worth it)? (3) rank the three options with confidence + the smallest validating step. Then bring Patrick a recommendation to approve. Don't build until confident — build economy (this effort has now cost several device builds).

**Cosmetic / parked (NOT Siri-relevant, left as-is on purpose):**
- The **in-app home-screen header still says "Remember When"** ("Good to see you…") — that's hardcoded greeting text in the home screen code, NOT the app name; zero Siri effect. Update when doing the tagline.
- **TestFlight / App Store Connect listing name still "Remember When"** — an App Store Connect setting, separate from the build; rename there manually if/when wanted.
- **Tagline "Elyfont – Memory Assist"** — Patrick wants this. It CANNOT go in the app name (it would truncate on the home screen AND re-introduce the English-words-in-the-name Siri risk). Park as: an in-app subtitle on the home screen (big "Elyfont", "Memory Assist" beneath) and/or the App Store subtitle field.

**Files touched this session (#19):**
- `app.json`, `plugins/ios/OpenRememberWhenIntent.swift`, `plugins/ios/MarkItemDoneIntent.swift` — Elyfont rename + phrase revisions. **Committed + EAS-built + TestFlight-installed by Patrick.**
- `docs/siri-cursor-brief.md` — NEW (brief for Cursor; two UPDATE sections). **Pending Patrick's commit.**
- `docs/handoff.md` + `docs/parked-items.md` — this update. **Pending Patrick's commit.**

---

## SESSION — #18 (2026-06-25): Audio Stage 2 device test — "Mark item done" Siri command STILL won't register on device after two fixes + two EAS builds. Root cause NOT yet found; next step is a diagnostic build. Code committed (`ffc2f27`, `f57def6`); docs pending Patrick's commit.

**Where we are: the parameterized "Mark item done" intent does not register on the phone; the no-parameter "Open" intent does.** On the device (TestFlight), the Shortcuts app shows ONLY the "Open Remember When" tile. "Mark item done" has **no tile**, and saying "Hey Siri, mark <item> done in Remember When" returns **"I don't see the app you asked for."** Two code fixes this session did not change that.

**IMPORTANT reasoning correction (Patrick's catch — don't repeat my error):** "Hey Siri, open Remember When" working by voice proves NOTHING about our code — iOS opens any app by name natively, zero code (this predates all the Siri work). The only *meaningful* evidence our intents register is the **tile in the Shortcuts app**: a plain "open app" capability does NOT create a tile in the app's Shortcuts section. So: "Open Remember When" **tile present** = our `OpenRememberWhenIntent` registered. "Mark item done" **tile absent** + Siri "I don't see the app" = our `MarkItemDoneIntent` did NOT register.

**What we tried this session (both committed, both built to device, neither fixed it):**
1. **`EntityStringQuery` fix (`ffc2f27`, `plugins/ios/MarkItemDoneIntent.swift`).** `MyDayItemQuery` now conforms to `EntityStringQuery` (added `entities(matching:)` that filters the live list by label, case-insensitive contains) — a parameterized App Shortcut phrase needs the query to resolve a spoken string. Necessary, but alone did NOT surface the command (verified the fix WAS in both the Simulator rebuild and the device build).
2. **`updateAppShortcutParameters()` at launch (`f57def6`, `plugins/withSiriIntent.js`).** Extended the plugin with a `withAppDelegate` mod (`withShortcutRefresh`) that injects `import AppIntents` + `if #available(iOS 16.0,*) { RememberWhenShortcuts.updateAppShortcutParameters() }` into `AppDelegate.didFinishLaunchingWithOptions`. Idempotent; verified the string-patch transforms the real `AppDelegate.swift` correctly. Theory: iOS registers shortcuts once (at install, shared box empty) and never re-reads, so force a re-read at launch (items persist in the App Group between launches). **Built + device-tested with a fresh My-Day-visit → full quit → relaunch → voice. Same "I don't see the app."** So this was not the (whole) fix.

**Free steps already ruled out:** clean delete + reinstall from TestFlight changed nothing. (A full phone REBOOT was suggested but NOT yet tried — Patrick stopped for the day. Try it first next session: App Shortcut registration / Siri vocabulary sometimes only refreshes after a reboot, which reinstall doesn't flush.)

**Simulator is a dead end for this — confirmed.** It can't run App Shortcuts ("Unable to run App Shortcut" on the no-op Open intent) and its App Group isn't provisioned, so it can't validate the Siri side. Only the device counts (matches #15's conclusion). Don't burn time re-testing Siri on the Simulator.

**TWO LIVE HYPOTHESES (next session must isolate, not guess again):**
- **(A) Siri can't read the item list on device** — the App Group shared box isn't readable by the system/Siri process that builds the command, so `suggestedEntities()` returns empty → the parameterized command is dropped. Would be a provisioning/entitlement problem, not the Swift. (Note from #17: a stray duplicate App Group `group.group.com.molliedog.ElderlyAssistant` exists in the portal, left unchecked — worth ruling out it's interfering.) Data path itself is verified correct in code: My Day publishes `{id,label}` to suite `group.com.molliedog.ElderlyAssistant`; the Swift query reads the same shape from the same suite. We have NEVER actually confirmed the App Group works end-to-end on device in either direction (Siri has never managed to write a note back either).
- **(B) The parameterized App Shortcut is rejected structurally** regardless of data (a metadata-extraction / App Intents registration issue specific to the entity+parameter shortcut).

**NEXT SESSION — the decisive diagnostic build (agreed plan):** in `plugins/ios/MarkItemDoneIntent.swift`, temporarily make `suggestedEntities()` (and `entities(matching:)`) return a **hardcoded** static pair of items that does NOT touch the App Group. Build to device.
- If "Mark item done" then **appears** → it's hypothesis **(A)**, the App Group read on device → fix provisioning/entitlement (check the profile actually carries `group.com.molliedog.ElderlyAssistant`; delete the stray duplicate group).
- If it **still doesn't appear** → hypothesis **(B)**, structural → rework the intent (e.g., reconsider the dynamic-entity-in-AppShortcut approach; App Shortcuts favor finite/enumerable parameter sets).
Also worth a (free-ish) look: the EAS build logs for App Intents metadata-extraction warnings on `MarkItemDoneIntent` / `MyDayItemEntity`.

**Build economy note:** this effort has now cost two device builds with no win. The diagnostic build above is justified (no Simulator path exists), but try the **phone reboot first** (free) before building.

**Files touched this session (#18):**
- `plugins/ios/MarkItemDoneIntent.swift` — `EntityStringQuery` + `entities(matching:)`. **Committed `ffc2f27`.**
- `plugins/withSiriIntent.js` — `withShortcutRefresh` (`withAppDelegate` patch calling `updateAppShortcutParameters()` at launch). **Committed `f57def6`.**
- `docs/handoff.md` + `docs/parked-items.md` — this update. **Pending Patrick's commit.**

---

## SESSION — #17 (2026-06-25): "Cannot find native module 'AppGroup'" ROOT-CAUSED + FIXED (podspec deployment target). Simulator launches clean. App Group capability created in Apple portal.

**The crash is fixed — verified end to end.** Root cause: the local module's podspec `modules/app-group/ios/AppGroup.podspec` declared `:ios => '16.4'` (plus a stray `:tvos => '16.4'`), but the app's iOS deployment target is **15.1** (`ios/Podfile`: `podfile_properties['ios.deploymentTarget'] || '15.1'`). During `pod install`, `use_expo_modules!` (`node_modules/expo-modules-autolinking/scripts/ios/autolinking_manager.rb`, the `unless pod.supports_platform?(@target_definition.platform)` guard, ~line 62) decides the pod "doesn't support" the 15.1 target and **silently skips it** — a yellow warning, NOT an error, so pod install still reports success. Result: the AppGroup pod is never installed → it's absent from `Pods-RememberWhen/ExpoModulesProvider.swift` and `Podfile.lock` → `requireNativeModule('AppGroup')` throws "Cannot find native module 'AppGroup'". This happened **identically on the Simulator AND on EAS** — so build #25's device crash (an uncaught abort at launch) was this SAME root cause in production form, not a separate bug.

**Why it hid for a whole session:** `expo-modules-autolinking resolve`/`search` find the module fine (they don't check deployment targets), so every diagnostic said "the module is there." Only the actual pod-install platform check dropped it. The `package.json` that #16 added was necessary but was NOT the fix; **this podspec line was.**

**THE FIX (one line, `modules/app-group/ios/AppGroup.podspec`):** changed `:ios => '16.4'` → `:ios => '15.1'` and removed the `:tvos` line, so the pod matches the app and CocoaPods includes it. Safe: `AppGroupModule.swift` uses only `UserDefaults` (available far below iOS 15); the iOS-16-only Siri App Intent Swift lives in the `plugins/ios/*.swift` files and is already `@available(iOS 16.0)`-guarded.

**VERIFIED:** after `rm -rf ios && npx expo prebuild -p ios`, the regenerated `ExpoModulesProvider.swift` now has `import AppGroup` + `AppGroupModule.self` (both configs), and `Podfile.lock` lists `AppGroup (1.0.0)` with a checksum. `npm run ios` → **the app opens to the home page, no red screen.** "Cannot find native module 'AppGroup'" is gone, Simulator-confirmed.

**App Group capability set up in Apple's Developer portal (device-build prerequisite — done this session):** created the App Group identifier **`group.com.molliedog.ElderlyAssistant`** and assigned it to App ID `com.molliedog.ElderlyAssistant`. (A stray duplicate `group.group.com.molliedog.ElderlyAssistant` was created by accident and left unchecked/inert — delete later.) During the EAS build this session, answered "reuse original profile? → **No**" so the provisioning profile regenerated with the new capability.

**DOC CORRECTION:** the #16 entry below says its work is "NOT committed" — that was STALE. Everything #16 built was already committed in `7c698d0 "Siri sim failures."` *before* this session (working tree was clean). Patrick commits the #17 podspec fix now.

**CLEANUP NOTED:** a stray junk file **`Pods-RememberWhen`** (an empty generated module-provider, ~795 bytes) sits committed at the **repo root** — leftover from autolinking debugging. Harmless but should be `git rm`'d.

**NEXT SESSION (resume here, one step at a time):**
1. **Shortcuts smoke test (Simulator, free):** open My Day once (that publishes items to the App Group), then open the **Shortcuts** app — confirm both "Open Remember When" and "Mark item done" appear, and "Mark item done" lists the real My Day items.
2. **One EAS device build** to confirm the actual goal — "Mark \<item\> done in Remember When" by voice wakes the app, marks it done in My Day, and logs it. The App Group capability is now enabled, so signing will carry the entitlement. (Build economy: this is the single build that tests the whole Siri feature.)
3. Optional cleanup: `git rm Pods-RememberWhen`; delete the duplicate App Group in the portal.

**Files touched this session (#17):**
- `modules/app-group/ios/AppGroup.podspec` — platform `:ios 16.4`→`15.1`, removed `:tvos`. **THE fix. Patrick commits.**
- `docs/handoff.md` + `docs/parked-items.md` — this update (corrects the stale "not committed" claim + records the real root cause).

---

## SESSION — #16 (2026-06-25): Audio input Stage 2 — the REAL "mark item done" Siri intent BUILT (Steps 1–3, code-complete, tsc clean). Committed in `7c698d0`; the AppGroup link issue is root-caused + FIXED in #17 above.

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

**⏸ VOICE RECOGNITION IS PARKED as of session #20 (Patrick's decision).** No high-confidence fix was found; the App-Store-fallback may be partly an iOS 26.x Apple-side regression. If revisited, the cheapest decisive test is running Apple's "BooksShelf" dynamic-entity sample on the device — see "THIS SESSION — #20" up top + `siri-cursor-brief.md` UPDATE 3. **THE NAMED GOAL FOR NEXT SESSION: PIN / Face ID / security** (Patrick's call, session #21 — see "THIS SESSION — #21" at the very top: close the Vault-toggle bypass, retire the custom PIN, finish moving Vault auth to Face ID/passcode). The backup feature is paused mid-build behind it. The Audio/Siri text below is retained for reference only; it is no longer the active goal.

**⏸ PARKED — reference only, NOT a goal for any next session (voice is parked till further notice, Patrick's decision in #20; also superseded by #19/#20 above — registration was later solved and the real blocker is voice-matching).** The earlier #17 plan below ("finish Audio input Stage 2 — Shortcuts smoke test, then the one EAS device build") is retained only for history. The "Cannot find native module 'AppGroup'" blocker is **FIXED + Simulator-confirmed launching clean** (session #17 — podspec deployment target was `:ios 16.4` vs the app's `15.1`, so CocoaPods silently skipped the pod; lowered to `15.1`). The App Group capability is now **created in Apple's portal** (`group.com.molliedog.ElderlyAssistant` assigned to the App ID). **Resume:** (1) **Shortcuts smoke test** on the Simulator — open My Day once (publishes items to the App Group) → open Shortcuts → confirm "Open Remember When" + "Mark item done" appear and "Mark item done" lists the real My Day items; (2) **one EAS device build** to confirm voice "Mark \<item\> done in Remember When" → wakes app, marks done in My Day, logs it (signing now carries the App Group entitlement); (3) optional cleanup — `git rm Pods-RememberWhen` (stray junk at repo root) + delete the duplicate App Group in the portal. One change at a time. Full detail in "THIS SESSION — #17" at top.

**▶ Audio input → Siri App Intents — SPIKE PROVEN (session #15, 2026-06-25). ⏸ PARKED as of #20 — reference only, NOT the next goal.** Hands-free is the priority; custom mic + wake word ruled out (#14). Data bridge decided: **Approach B — "Siri drops a note,"** the existing RN code applies it. **Feasibility spike PASSED** — a config plugin injects a compiling, Shortcuts-discoverable Swift App Intent into this gitignored-`ios/` (CNG) app. Spike scaffolding committed this session (`plugins/withSiriIntent.js`, `plugins/ios/OpenRememberWhenIntent.swift`, `app.json`). (Originally slated next: Stage 2 — one EAS device build to confirm voice invocation + app-wake, then the real `MarkItemDoneIntent` + App Group note + RN reader. All now parked till further notice.) Full detail in "THIS SESSION — #15 (B)" at the top and the Audio entry in `parked-items.md`.

**MY WEEK IS BUILT + banner actions DEVICE-VALIDATED (session #13).** Code-complete; the banner Done/Postpone path passed on the phone. Only low-priority, time-based pieces remain unconfirmed (long-run weekly cycle, "moved to <day>" persistence, a days-out postpone firing) — they'll just confirm in normal use; see in-flight item #0. No action needed next session unless Patrick raises it.

**In flight, awaiting a device test:**

0. **MY WEEK — banner actions now DEVICE-VALIDATED 2026-06-23 (session #13).** On the phone, Patrick postponed **from the banner** and **from the page**, and tapped **Done on the banner** → it checked the tile and logged the event. (This required the session #13 sequential-category-registration fix — see "THIS SESSION — #13" (A).) **Still not separately confirmed on device (low priority, time-based):** (a) the long-run weekly cycle — a chore fires on its day and auto-returns the *following* week, and the ✓ clears when its day comes around again; (c) the tile shows "moved to <day>" persists across reopen; (d) a tile Postpone scheduled days out actually fires on the chosen day. These are days/weeks out so they'll just confirm in normal use; the action plumbing itself is now proven on device.
1. **Session #11 sort (To-Do soonest-first) — DEVICE-VALIDATED 2026-06-23 (session #12).** List shows soonest on top, with time. Done — no longer pending.
2. **Session #10 fix (My Day after-midnight banner Done) — DEVICE-VALIDATED 2026-06-25 (session #15).** Patrick let the **Medication** reminder fire at 11:55 PM (06/24), tapped **Done on the banner after midnight** (06/25); the Log filed it as **06/24 | 23:55 | Medication** — dated from the FIRE time, under the prior day, exactly as the fix intended. He confirmed he's happy with the behavior (today's tile staying un-done is expected — the dose belongs to the day it fired). **Pets Day half (same mirrored code path, `pets_history`) not separately device-tested** — same handler, high confidence, but leave noted as un-confirmed for Pets.
3. **The 2026-06-19 build's PARTIAL test is still ongoing.** Confirmed: 7 reminder buttons toggle/light; banner OK clears without deleting; **Morning-of / 1hr / 2hr fire (session #12)**. Still untested: At-time offset, Day/Week/Month timing, Settings time changes, and Monthly + Yearly recurring firing (Yearly month especially). See "TEST RESULTS" up top.

**Still parked:** To-Do "Done" stamps today's date on stale banners (Bugs/correctness — separate from the now-fixed My Day bug). (The "sort To-Do by soonest" item is now BUILT — session #11 — so it's no longer parked.)

**Likely next goals (let Patrick name one):**

- _(Voice / Audio → Siri App Intents is **PARKED till further notice** as of #20 — deliberately NOT listed here as a candidate. See "THIS SESSION — #20" + `docs/siri-voice-resume.md` if ever revisited.)_
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
3. **The named goal is PIN / Face ID / security** (session #21 — see "THIS SESSION — #21" at top). Close the Vault-toggle bypass, retire the custom PIN, finish moving Vault auth to Face ID/passcode. NOTE: session #21 left UNCOMMITTED, UNTESTED edits (`app/vault.tsx` Face ID, plus the backup screen shell in `app/backup.tsx`/`app/settings.tsx`/`app/_layout.tsx`) — confirm with Patrick whether to keep or revert. Voice/Siri stays parked. The backup feature is paused mid-build behind this. **⚠ The Face ID change needs a full `npm run ios` rebuild (native module) before testing.** Wait for Patrick's "go" before building. Device tests still in flight (only if relevant):
   - **Session #11 To-Do soonest-first sort — already DEVICE-VALIDATED #12** (soonest on top, with time). Done; don't re-test.
   - **Session #10 My Day after-midnight banner-Done fix — DEVICE-VALIDATED 2026-06-25 (session #15).** Medication fired 11:55 PM (06/24), Done tapped after midnight → Log shows **06/24 | 23:55 | Medication** (prior day, fire time). Pets feed half (same code path) still not separately device-tested.
   - **The 2026-06-19 build** (Reminder Options + Group 1): validated so far — 7 reminder buttons, banner OK, and Morning-of/1hr/2hr firing. Still untested: At-time offset, Day/Week/Month timing, Settings time changes, Monthly/Yearly firing (Yearly month especially). 3-month/6-month recurring stays parked. Everything before these is committed + device-validated; don't re-open finished work.
4. **The goal is PIN / Face ID / security** (session #21). After that, resume the paused backup feature (Export + Import logic; the screen shell + Settings entry already exist). Voice / Audio stays parked. Scope it with me before building, then wait for my "go" — one change at a time.
5. **Build economy:** I want to minimize EAS builds. Batch related edits across a session, I commit, then ONE build tests them together. Docs get their own commit AFTER the phone test (see "Build-and-test commit rhythm" in `session-start.md`).
