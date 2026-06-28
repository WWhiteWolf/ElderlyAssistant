# Roadmap — "Remember When" (app name: Elyfont)

Created: 2026-06-28 (session #31). This is the step-back, big-picture document:
where the app is headed, what's already built, and the order of what's left.
The session-to-session detail still lives in `handoff.md`, `parked-items.md`, and
`pending.txt`; this roadmap sits above them and sets the direction they serve.

> **A note on the two names.** The app is still called **"Remember When"** on the
> phone (the home-screen greeting) and on TestFlight. The project's `app.json`
> already carries the new name **"Elyfont"**, so the rename is partly underway but
> not finished — see the "Identity / renaming" milestone below.

---

## Vision

A calm, simple memory aid for everyday life. The app is built for Patrick first —
retired, and wanting a dependable way to recall and keep track of short- and
long-term tasks, appointments, one-time events, and daily routine — and, beyond
that, for anyone who wants gentle memory support without clutter or pressure.

The guiding idea is that the app should *carry the remembering for you*: you put
something in once, and the right reminder finds you at the right time, on the one
device you always have with you. It should never feel like one more thing to
manage.

---

## Where it stands today

The app is **stable and in daily use on the phone**, delivered through Apple
TestFlight. It is a single-person iOS app built with React Native and Expo, with
its working data stored privately on the device. (The one thing that can leave the
device is a **backup file** you export — you choose where it goes, and that can be a
cloud location like iCloud Drive.) The full feature set below is live; recent sessions have been steady, small refinements rather than
big new construction.

The one thing not yet confirmed on the phone is whether the **Monthly and Yearly
repeating To-Do reminders** actually fire on schedule — the code is in and
committed, but a real reminder hasn't been watched go off yet.

---

## What's already built

Each of these is a working screen in the app today.

- **Home** — the front door, with the greeting and the way into every other area.
- **My Day** — the daily routine, the most-used part of the app: the day's recurring
  items, with on-tile Snooze and a coffee/water count.
- **My Week** — weekly chores laid out across Sunday–Saturday, each marked done as it
  happens.
- **To-Do** — one-off and recurring tasks with real scheduled reminders (Monthly and
  Yearly included). Still also carries the older Daily/Weekly machinery that My Day and
  My Week have since taken over (see the cleanup milestone).
- **Pets Routine** — feeds and treats tracking, with its own on-tile Snooze.
- **Shopping List** — a simple running list to take to the store.
- **Project Planner** — longer multi-step projects (reminder fields exist on screen but
  aren't wired to notifications yet).
- **Vault** — private notes/items kept behind Face ID / device passcode, encrypted on
  the device.
- **Timer** — countdown timers with an alert when time's up.
- **Backup & Restore** — export all app data to a file and restore it (restore currently
  *replaces* existing data).
- **Settings** — global morning/evening reminder times and app preferences.

Two foundations under all of this: **reminders/notifications** (the scheduling engine
the whole app leans on) and **security** (the old 6-digit PIN has been fully retired in
favor of Face ID / passcode).

---

## The road ahead — in phases

Nothing here is urgent. The phases are an order of *readiness*, not a schedule. We take
one item per session, discuss before building, and go at Patrick's pace.

### Phase 1 — Tidy and confirm the foundation (near-term)

The smallest, safest steps that finish work already in motion.

- **Confirm Monthly & Yearly To-Do reminders fire on the phone** (a watch-it-go-off
  device test — Yearly's month especially, since Expo months are 0-based).
- **Retire To-Do's leftover Daily** — a couple of dead references to remove; Daily now
  lives in My Day.
- **Remove To-Do's Weekly feature** — still fully live there, so this is a real change,
  its own session; decide first what happens to any existing weekly To-Dos. Weekly now
  lives in My Week.

### Phase 2 — Round out the everyday experience (mid-term)

Improvements that make daily use smoother and more consistent.

- **To-Do on-tile Snooze** — match My Day and Pets, which already have it on every tile.
- **Make button labels consistent** — To-Do says "New Task" while Vault says "+ Add."
- **Fix the small date/tap quirks** — My Week's in-app "Done" stamping the tap-time
  instead of the chore's day; tapping a reminder landing on the right screen but not the
  exact item.

### Phase 3 — Bigger features and decisions (when ready)

Real new capability — each needs design discussion before any building.

- **Backup "Merge"** — let a restore *merge* into existing data instead of only
  replacing it. Its own session: each kind of data (tasks, logs, counters, settings)
  combines by its own rule, and those rules are Patrick's calls.
- **The "3 Months" / "6 Months" repeat options** — currently do nothing; iOS has no
  native 3-/6-month trigger, so this needs a starting-date anchor plus pre-scheduling a
  few one-shots and topping up on app open.
- **Wire up Project Planner reminders** — the fields exist on screen but aren't connected
  to notifications.
- **Per-appointment reminder time** — optionally let one appointment use different times
  than the global morning/evening settings. Parked, not planned.

### Phase 4 — Identity / renaming

Finish the move from "Remember When" to **Elyfont** and give the tagline a home.

- Update the in-app home greeting (still says "Remember When").
- Update the TestFlight / App Store listing name.
- Find a home for the **"Memory Assist"** tagline (an in-app subtitle and/or the App
  Store subtitle field — it can't go in the app name).

### Parked on purpose (longer-term / on hold)

Worth doing someday, set aside deliberately — not abandoned.

- **Siri voice control** — getting to the app and tapping works, but Siri won't
  voice-match spoken item names; set aside after real effort, possibly an iOS-side
  regression. Full resume guide kept in `docs/siri-voice-resume.md`. All scaffolding
  stays in place, inert.
- **A genuinely louder Timer "Loud alert"** — needs a custom bundled sound file (a full
  rebuild) and, to break through Silent / Do-Not-Disturb, Apple's Critical Alerts
  entitlement (meant for medical/safety apps). Heavy.
- **Keep a running Timer's tile alive across app restart** — active timers live in memory
  only today; surviving a restart means persisting them and reconciling on focus.
  Accepted as-is for now (Done still stops the alerts regardless).

---

## Deployment & distribution (long-range)

How the app reaches people. The near-term path is real and underway; the rest are
**ideas, not commitments** — Patrick is new to publishing and working through it one
obstacle at a time, so nothing here is a promise or a deadline.

**The path it's on now.** The mobile app is delivered through **EAS Build → Apple
TestFlight** (in daily use on the phone today). The eventual next step on this path is
the **Apple App Store**.

**Exploratory idea — a web version.** A possible web version of Elyfont, hosted free on
**GitHub Pages** with the custom domain **elyfont.com** (already owned), built the same
way the MysteryTracker web version was. This is *optional and unscheduled* — to be done
only **if and when it serves a purpose**, not assumed.

**The bigger picture & where the detail lives.** This app is one of **two app lines**
Patrick is building:

- **MysteryTracker** — a Clue/mystery deduction tracker. **Both versions are done:** a
  working mobile version, and a **web version published and live** on his website.
- **Remember When / Elyfont** — this app. Mobile is working (TestFlight today, App Store
  ahead); a web version is only a maybe.
  - *Possible modular offering:* let the app's individual pages (To-Do, My Day, My Week,
    Pets, Vault, and so on) be offered as **optional modules**, so a user can pick and
    tailor just the pieces they want rather than taking the whole app. An idea, not
    committed.

The cross-project **publishing strategy and learning notes** live in OneDrive
(`App-Pubs → Publishing-Strategy.docx`), and the **step-by-step GitHub Pages + Domain.com
deployment guide** (DNS records, custom domain, HTTPS) lives in Patrick's OneDrive
MysteryTracker deployment doc. This roadmap points to those rather than duplicating them,
so the detailed steps stay in one place under his own revision control.

---

## Guiding principles

These are the rules the roadmap serves — when a choice comes up, these decide it.

- **Simplicity over features.** A few things that always work beat many that sometimes do.
- **Designed for an aging memory.** Big, clear, forgiving; the app does the remembering.
- **One change at a time.** Discuss, build one piece, test, then the next. No rushing.
- **Patrick's pace, Patrick's calls.** Retired and in no hurry; design decisions are his.
- **Private by default.** The app's working data stays on the device (security is
  Face ID / passcode). Only a backup file you deliberately export leaves the device, to
  wherever you choose to save it — which may be a cloud location like iCloud Drive.
- **Tested on the real phone.** Reminders especially aren't "done" until one has been
  watched fire on the device.

---

## Appendix — Tools & stack that support this project

The tools and pieces it takes to build, run, and ship the app.

### Build & language

- **React Native 0.81** with **Expo SDK 54** — the app framework.
- **TypeScript ~5.9** — the language.
- **Expo Router** — file-based screen navigation (each screen is a file in `app/`).
- **ESLint** (`eslint-config-expo`) — code linting.

### Key Expo / React Native libraries (from `package.json`)

- **expo-notifications** — the reminder/notification engine the whole app relies on.
- **@react-native-async-storage/async-storage** — on-device data storage.
- **expo-local-authentication** — Face ID / passcode for the Vault and security.
- **crypto-js** — encrypting Vault contents on the device.
- **expo-file-system**, **expo-document-picker**, **expo-sharing** — Backup export/restore.
- **@react-native-community/datetimepicker** — date/time pickers in the forms.
- **expo-haptics**, **expo-image**, **expo-font**, **react-native-reanimated**,
  **react-native-gesture-handler**, **react-native-swipeable-item** — UI, animation, and
  gestures (e.g. swipe-to-act on tiles).

### Build & distribution service

- **EAS Build** (Expo Application Services) — builds the app in the cloud; profiles for
  development, preview, and production live in `eas.json`. EAS captures the git state when
  a build is triggered (why code is committed *before* a build).
- **Apple TestFlight** — how the built app gets onto the phone for use and testing.
- **Apple Developer Program** — the account behind signing and TestFlight
  (bundle identifier `com.molliedog.ElderlyAssistant`).

### Native tooling (on the Mac)

- **Xcode** — Apple's toolchain for the iOS native side (the `ios/` folder, CocoaPods).
- **CocoaPods** — native iOS dependency manager (the `Pods-RememberWhen` artifacts).

### Editor & assistant

- **Visual Studio Code** — the code editor. Recommended extension in
  `.vscode/extensions.json`: **Expo Tools** (`expo.vscode-expo-tools`).
  _(Patrick — add any other VS Code extensions you actually use here: e.g. ESLint,
  Prettier, GitLens, or others.)_
- **Git** — version control; Patrick does all commits.
- **Claude (Cowork)** — pair-programming and docs assistant for this project, working
  directly in the connected project folder.

### A note on Siri (parked)

The project still contains a Siri intent plugin (`plugins/withSiriIntent`) wired into
`app.json`. It stays in place but inert while Siri voice control is parked — see the
parked items above and `docs/siri-voice-resume.md`.

---

*This roadmap is a living document. Revisit it when a phase finishes or priorities shift,
and keep it in step with `handoff.md`, `parked-items.md`, and `pending.txt`.*
