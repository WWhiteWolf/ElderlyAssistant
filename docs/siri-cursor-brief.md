# Brief for Cursor — Siri "Mark item done" intent won't register on device

You are helping debug a stuck problem in an Expo / React Native app. Please read this
whole brief, then read the files it points to before proposing anything. Ask before
making changes. The owner (Patrick) commits all git changes himself — do not run git
write commands.

## The goal

Let the user mark a My Day routine item done hands-free by voice, e.g.
"Hey Siri, mark medication done in Remember When." Siri should wake the app, and the
existing React Native code marks the item done and logs it.

## Project facts

- Expo / React Native, SDK 54, New Architecture + React Compiler enabled.
- iOS bundle id: `com.molliedog.ElderlyAssistant`. App display name: "Remember When".
- **`ios/` is gitignored — Continuous Native Generation.** EAS regenerates the native
  project on every build, so native Swift MUST be injected by a config plugin; hand
  edits to `ios/` are wiped. (See `.gitignore` lines 42–43.)
- Distribution is TestFlight only (no OTA). Code reaches the phone only via a new EAS build.
- The **Simulator cannot validate this feature** — it can't run App Shortcuts and its
  App Group isn't provisioned. Only a real device counts.

## The exact symptom (this is the crux)

On the device (TestFlight), in the **Shortcuts app**:

- The no-parameter **"Open Remember When"** intent **registers** — its tile appears.
- The parameterized **"Mark item done"** intent **does NOT** — **no tile at all**, and
  saying "Hey Siri, mark <item> done in Remember When" returns **"I don't see the app
  you asked for."**

**Important reasoning note (do not repeat a past mistake):** "Hey Siri, open Remember
When" working by voice proves nothing — iOS opens any app by name natively with zero
code. The ONLY meaningful evidence our intents registered is the **tile in the Shortcuts
app**. So: Open tile present = `OpenRememberWhenIntent` registered; Mark-item-done tile
absent = `MarkItemDoneIntent` did NOT register.

## What has already been tried (all built to device, none fixed it)

1. **Made `MyDayItemQuery` conform to `EntityStringQuery`** and added `entities(matching:)`
   (case-insensitive label contains). Verified present in the device build. Did not surface
   the command.
2. **Force a shortcut re-read at launch** — injected
   `RememberWhenShortcuts.updateAppShortcutParameters()` into the AppDelegate's
   `didFinishLaunchingWithOptions` via the config plugin. Built + device-tested with a
   fresh My-Day visit, full quit, relaunch, then voice. Same "I don't see the app."
3. **Clean delete + reinstall from TestFlight** — no change.
4. **NOT yet tried:** a full phone **reboot** (App Shortcut registration / Siri vocabulary
   sometimes only refreshes after a reboot, which reinstall doesn't flush).

## Two live hypotheses (we need to isolate, not guess)

- **(A) Siri can't read the live item list on device.** The App Group shared box may not be
  readable by the system/Siri process that builds the parameterized command, so the query
  returns empty and the command is dropped. This would be a provisioning/entitlement issue,
  not the Swift. Note: a stray duplicate App Group `group.group.com.molliedog.ElderlyAssistant`
  exists in the Apple portal, left unchecked — worth ruling out. We have NEVER confirmed the
  App Group works end-to-end on device in either direction.
- **(B) The parameterized App Shortcut is rejected structurally** — an App Intents
  registration / metadata issue specific to the entity+parameter shortcut, regardless of data.
  (App Shortcuts are known to favor finite/enumerable parameter sets; a fully dynamic
  entity list may be the problem.)

## The decisive diagnostic (agreed plan)

In `plugins/ios/MarkItemDoneIntent.swift`, temporarily make `suggestedEntities()` AND
`entities(matching:)` return a **hardcoded static pair** of items that does NOT touch the
App Group. Build to device.

- If "Mark item done" then **appears** → hypothesis **(A)**: the App Group read on device.
  Fix provisioning/entitlement (confirm the profile actually carries
  `group.com.molliedog.ElderlyAssistant`; delete the stray duplicate group).
- If it **still doesn't appear** → hypothesis **(B)**: structural. Rework the intent —
  reconsider the dynamic-entity-in-AppShortcut approach (App Shortcuts favor finite sets).

Also worth a free look: EAS build logs for **App Intents metadata-extraction warnings** on
`MarkItemDoneIntent` / `MyDayItemEntity`.

## Files to read

- `plugins/ios/MarkItemDoneIntent.swift` — the intent, `MyDayItemEntity`, and
  `MyDayItemQuery` (the parameterized one that won't register).
- `plugins/ios/OpenRememberWhenIntent.swift` — the no-op Open intent that DOES register,
  plus the single `RememberWhenShortcuts: AppShortcutsProvider` listing both shortcuts.
- `plugins/withSiriIntent.js` — the config plugin: copies the Swift into `ios/`, adds it to
  the Xcode target, adds the App Group entitlement, and injects the launch-time refresh.
- `modules/app-group/` — the native module bridging the App Group UserDefaults to RN.
- `app/myday.tsx` — publishes the live item list to the App Group.
- `app/_layout.tsx` — reads the pending note on app-active and applies My Day's done-logic.

## What we want from you (Cursor)

Help isolate hypothesis (A) vs (B). Specifically: is there a known reason a parameterized
App Shortcut backed by a fully dynamic `AppEntity` query fails to register on device while a
no-parameter intent registers fine? Is the EntityStringQuery + AppShortcutsProvider setup in
these files correct/complete for iOS 16+? Review the config-plugin injection for anything
that would compile but not register. Propose the smallest next diagnostic. Discuss before
changing code.

---

## UPDATE — device findings after testing (READ THIS; it supersedes the hypotheses above)

We tested on the real device and learned a lot. The hypotheses above are now mostly resolved.

**1. A full phone REBOOT fixed registration.** After a reboot, the parameterized
"Mark item done" shortcut NOW appears in the Shortcuts app — as one tile per live My Day
item (Breakfast, Lunch, Snack), each with the checkmark icon. So:
- Registration works. Hypothesis **(B) structural rejection at registration is DISPROVEN.**
- The App Group read works on device — the tiles show the user's REAL items, so data is
  getting through. Hypothesis **(A) App-Group-read-fails is also DISPROVEN.**
- The old "no tile" symptom was a stale Siri registration cache that only a reboot cleared.

**2. Tapping a per-item tile works end to end.** Tapping "Snack" in the Shortcuts app
foregrounds the app, marks the item done in My Day, and logs it. So the intent, the App
Group note bridge, the app-wake (`openAppWhenRun`), and the RN done-logic ALL function.

**3. Voice still fails — and this is the only remaining problem.** Saying
"Hey Siri, mark snack done in Remember When" → Siri transcribes the words PERFECTLY
("Mark Snack done in Remember When app") but answers **"I don't see an app for that.
You'll need to download one,"** offering **"Search the App Store."** Adding "app" doesn't
help. So speech-to-text is fine; Siri is failing to MATCH the parameterized App Shortcut
phrase and is falling back to treating "Remember When" as an app name to go find/download.

**4. "Hey Siri, open Remember When" opens the app** — but iOS opens any app by name
natively, so this only proves Siri can map the words "Remember When" to the installed app;
it does NOT prove our no-parameter intent is what matched.

### The isolated problem
Siri will not **voice-match** the parameterized "Mark \<item\> done in \<app\>" App Shortcut,
even though it registers fine and runs correctly by tap.

### What the owner now wants
- A **real, permanent** fix for hands-free voice marking. (Not user-created canned
  Shortcuts phrases — those work but aren't the goal.)
- To **consolidate the app's many names** at the same time. Leading candidate for the
  display name is **"Ely"** (short, simple) or **"Elyfont"**.
- HARD CONSTRAINT: the bundle id `com.molliedog.ElderlyAssistant` and the App Group
  `group.com.molliedog.ElderlyAssistant` must **stay unchanged** — changing them means a new
  app to Apple (new TestFlight entry, re-provisioning, re-created App Group). Only the
  user-facing / Siri-facing NAME is in scope.

### Research questions (please web-search current Apple docs/WWDC + known issues)
1. Why does a parameterized App Shortcut with a **dynamic `AppEntity` + `EntityStringQuery`**
   register and run-by-tap but fail to **voice-match**, falling back to App Store search? Is
   this the known limitation that App Shortcut **spoken** phrases need a **finite, enumerable**
   parameter (an `AppEnum`) rather than a dynamic entity list? What is Apple's current guidance
   (iOS 16 / 17 / 18)?
2. Does a generic English **display name** ("Remember When") cause Siri to mis-segment the
   spoken phrase and fall back to App Store search? Would a distinctive name help — and is
   **"Ely"** actually good, given it's a homophone of "Eli" and a place name (Ely, England /
   Ely, NV), and given that very short names give Siri less to disambiguate? Is there a
   **`CFBundleSpokenName`** / alternative-app-name mechanism that improves Siri recognition
   WITHOUT changing the visible name?
3. Concretely: what is the **smallest permanent change set** that makes "mark \<item\> done"
   work hands-free by voice? Weigh: (a) switch the item parameter from dynamic `AppEntity` to
   a finite `AppEnum`; (b) rename the display name to something distinctive; (c) add a spoken
   name; (d) a combination. Recommend ONE approach with the exact code changes.

### Rules
- **Do NOT change any code yet.** Propose the plan; the owner (Patrick) approves first.
- `ios/` is gitignored (CNG) — native changes must go through `plugins/withSiriIntent.js`.
- Patrick runs all git commits himself. Don't run git write commands.
- **Build economy:** each EAS device build is costly. We want the plan to be high-confidence
  enough that ONE build fixes it — so favor the option Apple actually documents as correct
  over a guess.

---

## UPDATE 2 — the Elyfont rename was built + tested, and it did NOT fix voice

We applied the rename (display name → **Elyfont**, intent titles/descriptions/shortTitles →
Elyfont, expanded the "Mark item done" phrases to lead with "with \(.applicationName)" plus
"in" and "in the … app" variants). Kept the dynamic entity, App Group, bundle id, and App
Group id unchanged. Built on EAS, installed via TestFlight. Device results:

- **Tiles register under the new name.** The Shortcuts app shows "Open Elyfont" plus per-item
  tiles (Breakfast, Lunch, Snack) — and they appear even after a reboot, before opening the app.
- **Tap still works** end to end (marks the item done + logs).
- **"Hey Siri, open Elyfont" opens the app** → Siri recognizes/transcribes the name fine.
  (Caveat: iOS opens any app by name natively, so this only proves the name is recognized.)
- **"Hey Siri, mark snack done with Elyfont" (and "…in Elyfont") STILL FAILS** — identical to
  before: "I don't see an app for that. You'll need to download one," then "Search the App
  Store." No item disambiguation.

### What this proves
The "Remember When is an English phrase" theory is **DISPROVEN** — a distinctive coined name
fails identically. The failure is now isolated to ONE thing: **Siri will not VOICE-match the
parameterized command's DYNAMIC `AppEntity` item parameter.** Name, transcription,
registration, App Group read, tap, and app-wake all work. `suggestedEntities()` populates the
Shortcuts UI tiles, but the spoken-parameter path fails and Siri falls back to App-Store search.

### Three options now on the table
1. **`IndexedEntity` + Spotlight donation** — keep the live/dynamic list, but make the items
   part of Siri's semantic index so spoken values are matchable. (Cursor flagged this as
   round-two.)
2. **Switch the item parameter to a fixed `AppEnum`** — lose the live list (adding an item
   needs a rebuild), but it's Apple's documented "fixed set of well-known values" pattern and
   the most likely to actually voice-match. The owner's routine is small and stable.
3. **Rebuild natively in Swift** — the owner is considering this. Proposed cheap proof: a tiny
   native Swift "Shopping List" app (items with a name + a `need`/`stocked` status) with ONE
   App Intent, "mark \<item\> stocked," backed by a DYNAMIC list — to test whether Siri
   voice-matches a dynamic list in a CLEAN native project, removing the Expo / CNG /
   config-plugin scaffolding as a variable. (Shopping List is the simplest, most stable screen
   in the current app — model in `app/shopping.tsx`: `Item { id, name, status }`.)

### Questions for Cursor (research current Apple docs / WWDC + real-world reports)
1. Can a parameterized App Shortcut with a **fully dynamic `AppEntity`** parameter be matched
   by Siri **voice** at all? If `suggestedEntities()` fills the Shortcuts UI but voice fails
   with an App-Store fallback, is that a known limitation? What builds Siri's spoken-parameter
   grammar — and does reliable voice matching require **`IndexedEntity`** (iOS 18+) /
   `CSSearchableIndex` donation / `EntityPropertyQuery`? Cite sources and iOS versions.
2. Could our **Expo + Continuous-Native-Generation + config-plugin** setup (Swift injected via
   `withDangerousMod`, target added via `withXcodeProject`, AppDelegate string-patched) cause
   App Intents to register the **tile** but not the **voice grammar** — i.e., would a clean
   native Swift project plausibly behave differently? This decides whether option 3's native
   test is worth the effort.
3. Rank the three options for THIS app (live list is nice but the routine is small/stable;
   iOS-only; owner is learning Swift/Xcode): give the recommended path, a confidence level,
   and the smallest validating step for each.

### Constraints (unchanged)
- Bundle id `com.molliedog.ElderlyAssistant` and App Group `group.com.molliedog.ElderlyAssistant`
  stay fixed. `ios/` is CNG (gitignored). Patrick commits all git. Propose before coding.
  Favor certainty over another guess-and-build.
