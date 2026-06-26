# Siri voice — RESUME DOSSIER (read this one doc to pick the feature back up)

**Status: PARKED by Patrick on 2026-06-26 (session #20).** This document is self-contained: it has the goal, every constraint, the full architecture as actually built, everything tried and ruled out, and the exact next steps — so the feature can be resumed without re-reading old handoff entries. Companion docs: `siri-cursor-brief.md` (the original problem brief + UPDATE/UPDATE 2/UPDATE 3 research), `handoff.md` (sessions #14–#20 chronology). This file supersedes them as the single resume point.

---

## 1. The goal (unchanged)

Let Patrick mark a **My Day** routine item done **hands-free by voice**: "Hey Siri, mark breakfast done in Elyfont." Siri wakes the app, the existing React Native code marks the item done and logs it.

## 2. Hard requirements & constraints (these gate every option)

- **LIVE list is non-negotiable (Patrick, session #20):** items must become speakable as the My Day list changes, *without a rebuild*. "Without live command change recognition there is no point to voice." → **This rules out a fixed `AppEnum`** (compile-time set), even though `AppEnum` is the most reliably voice-matchable. Don't propose it again unless Patrick relaxes this.
- **Bundle id `com.molliedog.ElderlyAssistant` and App Group `group.com.molliedog.ElderlyAssistant` must stay fixed.** Changing either = a new app to Apple (new TestFlight entry, re-provisioning, re-created App Group). Only the user-facing / Siri-facing display name is in scope.
- **`ios/` is gitignored — Continuous Native Generation (CNG).** `.gitignore` lines 42–43 ignore `/ios` + `/android`. EAS regenerates the native project every build, so **all native Swift must be injected by the config plugin** (`plugins/withSiriIntent.js`); hand edits to `ios/` are wiped.
- **Patrick commits all git himself.** Claude never runs git write commands (lockout risk). Claude also must never run `git status` / index-refreshing git from the sandbox (creates `.git/index.lock` that blocks Patrick's commits) — read-only `git log` / `git show` / `git diff` only.
- **Only a real device validates Siri.** The Simulator can't run App Shortcuts and its App Group isn't provisioned. Distribution is **TestFlight only** (no OTA) — code reaches the phone only via a new EAS build.
- **Reboot the phone after any App Shortcut change before concluding anything.** Hard-won #19 lesson: Siri's shortcut registration/vocabulary cache only flushes on reboot — delete+reinstall does NOT clear it.
- **Build economy:** each EAS device build is costly/slow. Favor a high-confidence single build, or a free diagnostic, over guess-and-build.
- **Device/OS at park time:** Patrick's iPhone is on **iOS 26.5**. App display name is **"Elyfont"** (renamed in #19). SDK 54, New Architecture + React Compiler.

## 3. Data-bridge design — "Approach B" (decided #15, built #16, works by tap)

The app's data lives in AsyncStorage, which a Swift Siri intent can't read. The **App Group** is a shared `UserDefaults` box both sides can see. Approach B: the Swift intent only **drops a tiny note** into the App Group; the existing RN code reads it on next app-active and runs My Day's already-tested done-logic, then clears it. Swift stays a thin sliver; all real logic stays in JS.

Note shape written by the intent: `{ action: "markDone", itemId, label, firedAt }` where `firedAt` is epoch **milliseconds**. App Group key for the note: `"pendingNote"`. App Group key for the published item list: `"myDayItems"` (JSON array of `{ id, label }`).

## 4. Architecture as built (verified against the files, session #20)

**`plugins/ios/OpenRememberWhenIntent.swift`**
- `OpenRememberWhenIntent` — no-op `AppIntent`, `openAppWhenRun = true`, `@available(iOS 16.0,*)`.
- `RememberWhenShortcuts: AppShortcutsProvider` — the **single** provider (an app may have only one). Lists both shortcuts. Keep this struct name `RememberWhenShortcuts` — the AppDelegate refresh call (below) references it.
  - Open phrases: "Open \(.applicationName)", "Show \(.applicationName)".
  - Mark-done phrases (parameter `\(\.$item)`): "Mark \(\.$item) done with \(.applicationName)", "Mark \(\.$item) complete with \(.applicationName)", "Mark \(\.$item) done in \(.applicationName)", "Mark \(\.$item) done in the \(.applicationName) app", "Complete \(\.$item) with \(.applicationName)". Every phrase includes `\(.applicationName)` (Apple requires it; omitting it silently drops the shortcut).

**`plugins/ios/MarkItemDoneIntent.swift`**
- `MyDayItemEntity: AppEntity` — `{ id: String, label: String }`. `displayRepresentation` is now `DisplayRepresentation(title: LocalizedStringResource(stringLiteral: label))` (changed from `"\(label)"` in #20 — did not fix voice, left in as the more-correct form).
- `MyDayItemQuery: EntityStringQuery` — reads the live list from App Group key `"myDayItems"`. `entities(for:)` resolves ids; `entities(matching:)` filters labels case-insensitively (required so a spoken string can resolve); `suggestedEntities()` returns the whole live list (this is what fills the Shortcuts tiles).
- `MarkItemDoneIntent: AppIntent` — `@Parameter var item: MyDayItemEntity`, `openAppWhenRun = true`. `perform()` writes the `pendingNote` JSON into the App Group and returns. Does NOT touch app data directly.

**`plugins/withSiriIntent.js`** (the config plugin; registered in `app.json` `plugins` as `./plugins/withSiriIntent`)
- Injects **every** `.swift` in `plugins/ios/` (drop a new intent file in there, no plugin edit needed): (1) copies them into `ios/<ProjectName>/`; (2) adds each to the Xcode app target's **Sources** build phase (idempotent via `hasFile`); (3) adds the App Group entitlement `group.com.molliedog.ElderlyAssistant`; (4) `withShortcutRefresh` — injects `import AppIntents` + `if #available(iOS 16.0,*){ RememberWhenShortcuts.updateAppShortcutParameters() }` into `AppDelegate.didFinishLaunchingWithOptions` so iOS re-reads the live item values at every launch (it otherwise only reads them once, at install, when the box is empty).

**`modules/app-group/`** — local Expo module bridging App Group `UserDefaults` (suite `group.com.molliedog.ElderlyAssistant`) to RN. `index.ts` exposes typed `setMyDayItems(items)`, `getPendingNote(): PendingNote|null`, `clearPendingNote()`. iOS `AppGroupModule.swift` implements them; Android + web are no-ops (so the unconditional JS import never crashes those platforms). **Podspec gotcha (fixed #17):** `ios/AppGroup.podspec` must declare `:ios => '15.1'` (the app's deployment target) — at `16.4` CocoaPods silently skipped the pod (warning, not error) → "Cannot find native module 'AppGroup'". Also requires `modules/app-group/package.json` (added #16) or autolinking skips it.

**`app/myday.tsx`** — publishes the current items to the box via `AppGroup.setMyDayItems(...)` in `saveData` (the single write path: add/edit/delete/reorder) and in the same-day load branch, so the live list stays current.

**`app/_layout.tsx`** — on mount and on every `AppState` 'active': (a) republishes `my_routine` items to the box (so Siri stays fresh even if My Day wasn't opened), and (b) reads any `pendingNote`, finds the item (by `itemId`, else label match), marks it complete in `my_routine`, writes a dated `my_history` entry from `note.firedAt`, clears the note, routes to `/myday`. Guarded by an `applyingNote` ref. (Same done-logic + 50-cap + after-midnight dating as the banner-Done path.)

**Apple developer portal:** App Group identifier `group.com.molliedog.ElderlyAssistant` is created and assigned to App ID `com.molliedog.ElderlyAssistant`. A stray duplicate `group.group.com.molliedog.ElderlyAssistant` was created by accident, left unchecked/inert — **delete it** when convenient.

## 5. What WORKS on device today (don't re-investigate)

- The parameterized "Mark item done" shortcut **registers**: per-item tiles (Breakfast, Lunch, Snack, …) appear in the Shortcuts app and **survive a reboot**.
- **Tapping a per-item tile works end-to-end:** foregrounds the app, marks the item done in My Day, logs it. So the intent, App Group note bridge, `openAppWhenRun`, and RN done-logic ALL function on device.
- **Build-time metadata extraction works:** `Metadata.appintents` IS generated in the built app (confirmed via `find` in DerivedData), both intent `.swift` are in the Xcode Sources phase, no Podfile clobbering, `EnableAppIntents` at default.

## 6. THE isolated blocker (the only thing that fails)

**Siri will not VOICE-match the parameterized "Mark \<item\> done in \<app\>" phrase.** Saying it, Siri transcribes the words perfectly but responds **"I don't see an app for that. You'll need to download one"** + "Search the App Store" — i.e., the *whole phrase* misses Siri's grammar and Siri treats the tail as an app to find. (If only the item value were unresolved, Siri would instead ask "which item?" — it doesn't; it bounces to the App Store.) `suggestedEntities()` fills the visual tiles, but the spoken-parameter grammar isn't matching.

## 7. Everything tried, with outcomes (so nothing gets re-derived)

| # | Attempt | Result |
|---|---------|--------|
| 16 | Built the real intent: `EntityStringQuery` + live list + App Group note + RN applier | Code-complete; tap works |
| 17 | Fixed "Cannot find native module 'AppGroup'" (podspec `:ios 16.4`→`15.1`) | Module links; Simulator launches clean |
| 18 | `entities(matching:)` added; `updateAppShortcutParameters()` injected at launch; delete+reinstall | Did NOT surface/voice the command |
| 19 | **Phone reboot** | **Fixed registration** — tiles now appear + survive reboot; tap works. Disproved both #18 hypotheses |
| 19 | Rename app → "Elyfont" (theory: "Remember When" is an English phrase Siri mis-segments) | Built + device-tested — **did NOT fix voice**; theory disproven |
| 20 | `DisplayRepresentation(title: "\(label)")` → `LocalizedStringResource(stringLiteral: label)` (forum 759909/713178 fix) | Built + device-tested (full phrase, post-reboot) — **did NOT fix voice** |
| 20 | Free pipeline diagnostic (`Metadata.appintents`, Sources phase, Podfile, EnableAppIntents) | Pipeline is FINE → native rewrite wouldn't differ on this axis |

## 8. Ruled OUT (do not re-try these)

- **Structural rejection at registration** — disproven (#19, it registers).
- **App-Group-read-fails on device** — disproven (#19, tiles show the user's REAL items).
- **English-phrase-name theory** — disproven (#19, distinctive "Elyfont" fails identically).
- **`DisplayRepresentation` `%@`/interpolation bug** — disproven for this app (#20).
- **Expo/CNG pipeline not extracting metadata** — disproven (#20, metadata generates; tiles expand).
- **Fixed `AppEnum`** — not tried, and **excluded by the live-list requirement** (would be the most voice-matchable, but loses the live list).

## 9. Remaining options + EXACT next steps (when resuming)

**Option A — cheapest, most decisive: isolate phone/OS vs. our app using Apple's own sample (no build of ours).**
Apple's "Create with Swift" tutorial ships a finished sample that voice-matches a **dynamic** live list ("Open \<book\> in BooksShelf"): https://www.createwithswift.com/performing-your-app-actions-with-siri-through-app-shortcuts-provider/ → download `BooksShelfAskSiri-Final.zip`. Steps: open in Xcode on the Mac → set the signing Team + a unique bundle id → run on the **physical iPhone** (not Simulator) → add a couple of books → reboot → say "Open \<book\> in BooksShelf."
- If Apple's own sample **also fails** to voice-match on iOS 26.5 → it's an **OS/device** limitation (likely the iOS 26.x App Intents regression) → stop building on our side; wait for an iOS fix.
- If it **works** → something specific to our **Expo app** differs from a clean native project → dig there (next suspect: how/when the live values are learned by Siri, or a CNG-specific quirk not covered by metadata extraction).
- Caveat: this needs Xcode-on-Mac + on-device run, which is **new for Patrick** (he uses EAS/TestFlight cloud builds). Claude can guide step by step.

**Option B — `IndexedEntity` + Spotlight donation (iOS 18+). Keeps the live list. Confidence: genuine MAYBE, not confirmed.**
Conform `MyDayItemEntity` to `IndexedEntity` and index the live items into Spotlight's semantic index via `CSSearchableIndex.default().indexAppEntities(...)` at launch and whenever items change. Apple positions this as the way Siri/Apple Intelligence resolve dynamic spoken values by meaning. **Honest caveat (from #20 research):** the docs frame IndexedEntity as *search/resolution*, not specifically as the fix for the *phrase-grammar-miss/App-Store-fallback* symptom — so it could help and could not. One EAS device build to test. Don't build this blind if Option A shows the OS itself is broken.

**Option C — wait it out.** Documented iOS 26.4 App Intents regression; Patrick on 26.5. A later iOS may simply fix dynamic-parameter voice matching. Re-test periodically with the existing build (reboot first).

**Option D — accept what works.** Tap-from-Shortcuts already works on device; user-created canned Shortcuts phrases also work (Patrick explicitly didn't want those as the goal, but they exist as a fallback).

## 10. Key sources

- Apple working sample (dynamic live list, voice): https://www.createwithswift.com/performing-your-app-actions-with-siri-through-app-shortcuts-provider/
- Apple DTS on App Shortcut parameter voice (values must be learned from `suggestedEntities`; no freeform capture): https://developer.apple.com/forums/thread/759909
- "tile works / voice fails" + `DisplayRepresentation` `%@` fix: https://developer.apple.com/forums/thread/713178
- App Intents framework docs: https://developer.apple.com/documentation/appintents
- IndexedEntity / Spotlight (WWDC24 "What's new in App Intents"): https://developer.apple.com/videos/play/wwdc2024/10134/
- Expo config-plugin pitfalls for App Intents: https://rorklab.net/en/articles/rork-dev/rork-app-intents-siri-shortcuts-implementation-guide
- Full research write-up: `docs/siri-cursor-brief.md` → "UPDATE 3 — research findings".
