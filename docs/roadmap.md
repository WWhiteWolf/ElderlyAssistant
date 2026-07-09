# Roadmap — "A Place To Remember"

Created 2026-06-28 (session #31); rewritten 2026-07-09 (session #68). This is the
step-back, big-picture document: the milestones ahead for the whole project — the
code, the Spec, testing, publishing/releasing, and maintaining — and what Patrick
needs to learn to complete each. The session-to-session detail still lives in
`handoff.md`, `parked-items.md`, and `pending.txt`; this roadmap sits above them
and sets the direction they serve. A fourth document is coming: **the Spec** — the
plain-English build description of the whole app (its own milestone track below).
Until the Spec is written, this roadmap keeps the tools appendix at the end; the
appendix moves into the Spec when it exists.

> **On names.** The rename is DONE (#65): the app is **"A Place To Remember"** on
> the phone's Home screen, on the Settings version line, and in the App Store
> Connect listing. The older working names still live inside the project — the
> folder `elderlyassistant`, `app.json`'s "Remember", the bundle identifier
> `com.molliedog.ElderlyAssistant` — harmless internal plumbing, left alone on
> purpose.

---

## Vision

A calm, simple memory aid for everyday life. The app is built for Patrick first —
retired, and wanting a dependable way to recall and keep track of short- and
long-term tasks, appointments, one-time events, and daily routine — and, beyond
that, for anyone who wants gentle memory support without clutter or pressure.

The guiding idea is that the app should *carry the remembering for you*: you put
something in once, and the right reminder finds you at the right time, on the one
device you always have with you. It should never feel like one more thing to
manage. The app has quietly grown around that idea — expected deliveries, movies
and shows to watch, private reference items, and now a daily memory test — but
every addition keeps to the same rule: simple, calm, no pressure.

---

## Where it stands today

The app is **stable, complete in its daily role, and in daily use on the phone**,
delivered through Apple TestFlight (App Store ahead). It is a single-person iOS
app built with React Native and Expo, with its working data stored privately on
the device. (The one thing that can leave the device is a **backup file** you
export — `Remember-Backup-<date>.json` — and you choose where it goes, which can
be a cloud location like iCloud Drive.)

Everything below is live and **phone-verified through session #67** — the most
recent build carried the Vault's user-defined categories, and Patrick confirmed
the whole package working on the phone. What remains open is small: a handful of
minor quirks tracked in `pending.txt`, and the milestone tracks below.

---

## What's already built

Fifteen working screens, in daily-use shape on the phone today. **The essentials
of this app are My Day, My Pets Day, My Week, Look Ahead, and To-Do** — the five
trackers that do the remembering. Home is the front door to them, and Settings
and Backup & Restore are app support. The rest are unique nice-to-have helpers,
and the last two might not stay.

- **Home** — the front door: the "A Place To Remember" greeting, the twelve
  tiles into every other area, and the Settings button.
- **My Day** — the daily routine, the most-used part of the app: the day's
  recurring items, with on-tile Snooze and a coffee/water count.
- **My Pets Day** — "My Day" for the pet(s): feeds and treats tracking, with its
  own on-tile Snooze.
- **My Week** — weekly chores laid out across Sunday–Saturday, each marked done
  as it happens.
- **Look Ahead** — the long-interval repeaters (Monthly / 3 Months / 6 Months /
  Yearly): each item is a single dated reminder the app re-arms, with Done/Delay
  on the banner and the tile.
- **To-Do** — one-time appointments with scheduled reminders (recurrence moved out
  to Look Ahead long ago; banners carry a single OK).
- **Orders** — expected deliveries, one entry per item, with reminders and a
  HERE button that logs the arrival.
- **Watch List** — movies to watch / watched, and shows with episode / season
  counters.
- **Shopping List** — a simple running list to take to the store.
- **Vault** — private items behind Face ID / passcode, encrypted on the device,
  organized under categories that are fully Patrick's own (add / rename /
  swipe-to-delete).
- **Timer** — countdown timers with an alert when time's up.
- **Backup & Restore** — export all app data to `Remember-Backup-<date>.json`
  and restore it (restore *replaces* existing data — Patrick's accepted choice
  for one-device use).
- **Settings** — global Morning / Midday / Evening reminder times, the light /
  dark theme choice, and app preferences.
- **Project Planner** — longer multi-step projects (reminder fields exist on
  screen but aren't wired to notifications yet). *Could go away someday.*
- **Memory Test** — the daily 5-word test (five learning rounds, then a 5-minute
  delayed recall by notification), scores logged by date to track whether the
  PAP mask helps. *Might go away once its job is done.*

Foundations under all of this: **reminders/notifications** (the scheduling engine
the whole app leans on), **the two-theme system** (`constants/Themes.ts` — every
page runs in both light and dark), **shared components** (`DateTimeControl` for
every date/time entry, `Bridge` for the page divider), and **security** (Face ID /
device passcode; the old 6-digit PIN is long retired).

---

## The road ahead — five milestone tracks

The milestones ahead for the whole project, in five tracks: **Code, The Spec,
Testing, Publishing/Releasing, and Maintaining**. Each track ends with **what to
learn** — the skills or knowledge that track asks of Patrick. Nothing here is
urgent and nothing is a schedule; we take one item per session, discuss before
building, and go at Patrick's pace.

### Track 1 — Code

The app is essentially built. This track is the remaining features, fixes, and
page decisions — the milestone view; the running detail lives in `pending.txt`.

- **Vault pages (#68) — PARKED (#69).** Paste text directly into a Vault item
  as a page; *replaces* the old "import files/documents" idea entirely — no
  file handling, just pasted text riding the Vault's existing encryption.
  Patrick opened the talk-through in #69 and wasn't ready to picture it yet —
  the Vault stays as it is until he runs into a real need. Don't re-raise.
- **Whole-file backup encryption (#68) — demoted to NICE-TO-HAVE (#69).** Today
  only the Vault's items are encrypted inside the backup; the rest exports
  readable. Patrick still wants the whole exported file encrypted eventually,
  but moved it to nice-to-have in #69. When taken up, talk-through first: how
  it locks/unlocks on restore, and what happens to existing readable backups.
- **Preset stores & addresses in Orders (#68) — DROPPED (#69).** The idea was a
  saved list to pick from instead of retyping. In #69 Patrick started the
  talk-through (a short saved list — Home plus 2–3 others — with typing kept),
  then looked at the form again and decided it needs no changes. Only revisit
  if he raises it.
- **Watch List overhaul** — its own session, talk-through first; the
  night-and-time-a-show-airs idea folds into it.
- **The small-fix sweep** — the known minor quirks, none urgent: Look Ahead's
  banner Delay not showing "▶ Delayed" on the tile (fix shape known: re-read on
  focus); My Week's in-app Done stamping the tap-day instead of the chore's day;
  reminder taps landing on the right page but not the exact item; the dark
  startup flash; banner Done logging both times (set + tapped); To-Do's on-tile
  Snooze.
- **Page fates** — the two "might go away" calls when their time comes: Project
  Planner (wire its reminder fields at last, or let the page go) and Memory Test
  (it may retire once the PAP-mask question is answered — or first gain the
  mask-start marker and trend view parked in `parked-items.md`).
- **Parked on purpose** — Siri voice control (resume guide:
  `docs/siri-voice-resume.md`), the genuinely-louder Timer alert, a running
  Timer's tile surviving restart, and Backup Merge (90% dropped). Revisit only
  if Patrick raises them.

**What to learn:** nothing new to study — this track lives in the stack already
in daily use here (React Native, Expo, TypeScript), and each item teaches its
own small lesson in the session that builds it, the way every session already
works.

### Track 2 — The Spec

The build document for this app (Patrick's ask, #67), done the way
MysteryTracker's spec was: **plain-English, function-anchored, and detailed
enough to rebuild the app from the document alone.** Written page by page, one
session-goal at a time. It is **one document, kept in two forms**: the master in
`.md` format (for Claude and others), and a copy in a Microsoft Word document
for Patrick to read — refreshed whenever the master changes, kept under
Patrick's own version control, and committed to GitHub with the project.

- **The style-rules file first** — a short file that governs how the Spec is
  written (its shape, voice, and what every page's entry must cover), so all
  fifteen pages come out consistent no matter when each is written.
- **The Spec itself, page by page** — one app page per session-goal, working
  through all fifteen screens plus the foundations (the notification engine,
  themes, shared components, storage keys, security).
- **A companion draw.io diagram** — possibly, as the Spec's map: the pages, how
  they connect, and what data each owns.
- **Take over the tools appendix** — once the Spec exists, this roadmap's tools
  appendix (with its bullet-step task reminders) moves into the Spec, and the
  roadmap keeps only the pointer.

**What to learn:** the writing method more than any code — how to keep a build
document function-anchored and rebuild-complete (the MysteryTracker spec is the
model, already in hand and read); draw.io basics if the map is wanted; and the
discipline of writing to a style-rules file so page one and page fifteen match.

### Track 3 — Testing

The standing rule: **nothing is "done" until it's been watched working on the
real phone** — reminders especially. The habits are already in place; this track
is about keeping them, plus one owed piece of work.

- **The structured reminder test checklist (still owed, from #34)** — one
  organized, reusable checklist covering every reminder kind: To-Do one-shots
  (the single-OK banner), My Day / Pets daily, My Week weekly + postpone, Look
  Ahead long-lead + Delay, the routine popup's six buttons, the past-day guards,
  sound, and tap-routing. Written once, run whenever reminders are touched.
- **The standing rhythm holds for everything new** — `tsc` clean after each
  step, Simulator-approved in both themes, then the two-commit build-and-test
  cycle (code commit → EAS build → phone test → docs commit).

**What to learn:** nothing new — the discipline exists and works. The one-time
effort is writing the checklist down so a future test run is a matter of
following it, not reconstructing it.

### Track 4 — Publishing / Releasing

How the app reaches beyond the phone it lives on. The near-term path is real and
underway; the rest are **ideas, not commitments** — Patrick is working through
publishing one obstacle at a time, and nothing here is a promise or a deadline.

- **The path it's on now: EAS Build → Apple TestFlight** (in daily use today).
  The next milestone on this path is the **Apple App Store release**.
- **Finish the store listing** — the name is already "A Place To Remember" in
  App Store Connect (#65). Still open: a home for the **"Memory Assist"**
  tagline (the subtitle field sits empty), the description, screenshots, and
  Apple's review questions.
- **Store art** — the Android icon set and the splash (startup) image still
  carry old placeholder art; derive them from the approved happy-face design.
- **Hard-won submission lessons, kept** — an expired developer agreement and the
  EU Digital Services Act question ("not a trader") both blocked a submit once;
  both are fixed in App Store Connect under **Business**. Look there first if a
  future submit fails.
- **Exploratory, unscheduled: a web version** — built the way MysteryTracker's
  web version was, hosted free on GitHub Pages (the elyfont.com domain is
  owned; whether it still fits the renamed app is Patrick's call). Only if and
  when it serves a purpose. The **modular idea** rides with it: offering the
  app's pages as optional pick-and-choose modules — an idea, not committed.
- **Where the detail lives:** the cross-project publishing strategy is in
  OneDrive (`App-Pubs → Publishing-Strategy.docx`); the step-by-step GitHub
  Pages + domain guide is in the MysteryTracker deployment doc there. This
  roadmap points; those documents hold the steps.

**What to learn:** the biggest learning track. The App Store submission process
end to end — App Store Connect, the review, screenshots, the privacy questions —
learned the way TestFlight was: one obstacle at a time. For the maybe-someday
web version, GitHub Pages + DNS, already learned once with MysteryTracker and
written down.

### Track 5 — Maintaining

What keeps the app healthy once building slows — the track that never finishes.

- **The doc rhythm, every session** — refresh `handoff.md` (last two sessions
  only), `parked-items.md`, and `pending.txt`; revisit this roadmap when a
  milestone lands or direction shifts; keep the Spec in step once it exists.
- **Backups on a habit** — export a fresh `Remember-Backup-<date>.json` after
  meaningful data changes, and re-prove restore after any change to backup code.
- **Apple's calendar** — the Developer Program membership renews yearly; watch
  for agreement expirations (seen once already); a new iOS arrives every fall
  and the app should be checked on it, reminders especially.
- **TestFlight builds expire** (after 90 days) — until the App Store release,
  a fresh build is needed now and then even with no new work.
- **The stack ages** — Expo SDK and Xcode move on; an occasional
  update-and-rebuild session keeps the app buildable, separate from any feature
  work.

**The accounts and subscriptions the project stands on** — each with what keeps
it alive. *(Patrick — renewal dates, plan levels, and costs are yours to fill in
or correct; this list is built from what the project's docs show.)*

- **Apple Developer Program** — signing, TestFlight, and the App Store (bundle
  id `com.molliedog.ElderlyAssistant`). Maintain: pay the yearly membership
  renewal, and accept updated license agreements when Apple posts them — an
  expired agreement blocked a submit once (fix lives in App Store Connect →
  **Business**).
- **Expo / EAS account** — runs the cloud builds (`eas.json` profiles).
  Maintain: keep the login healthy; if on the free plan, know the monthly build
  allowance in case a build is ever refused.
- **GitHub account** — holds the project and its full version history (and the
  MysteryTracker web version). Maintain: keep the login and two-factor recovery
  information safe and current.
- **Domain.com — elyfont.com** — the owned domain, only needed if the web
  version happens. Maintain: the yearly renewal; letting it lapse loses the
  name.
- **Microsoft account / OneDrive** — holds the cross-project publishing docs
  (`App-Pubs`) and the Word copy workflow. Maintain: the subscription behind
  it, and enough storage.
- **iCloud** — where exported backups can land via iCloud Drive. Maintain:
  enough storage for the backup files.
- **Claude (Anthropic)** — the pair-programming and docs assistant this project
  is built with. Maintain: the subscription.

**What to learn:** the maintenance calendar itself — Apple's yearly rhythm, the
Expo upgrade process, each account's renewal date once filled in above, and how
to do a "nothing new, just rebuild" release.

### The overall learning picture

Across all five tracks: **Code and Testing ask nothing new** — they run on what
every session already practices. **The Spec** asks a writing method, with the
MysteryTracker spec as the proven model. **Publishing** is the real learning
ground — the App Store process end to end. **Maintaining** asks the least but
never ends: a calendar and a rhythm. All of it learned the way everything here
has been — free courses, videos, and one obstacle at a time, at Patrick's pace.

---

## Guiding principles

These are the rules the roadmap serves — when a choice comes up, these decide it.

- **Simplicity over features.** A few things that always work beat many that sometimes do.
- **Designed for an aging memory.** Big, clear, forgiving; the app does the remembering.
- **The essentials come first.** My Day, My Pets Day, My Week, Look Ahead, and To-Do
  are the app. A helper page earns its place only if it never complicates them —
  and a helper that stops earning its keep can go (Project Planner and Memory Test
  are on watch).
- **One change at a time.** Discuss, build one piece, test, then the next. No rushing.
- **Patrick's pace, Patrick's calls, Patrick leads.** Retired and in no hurry; design
  decisions are his, and so is the order of the work — the roadmap offers, never pushes.
- **Private by default.** The app's working data stays on the device (security is
  Face ID / passcode). Only a backup file you deliberately export leaves the device, to
  wherever you choose to save it — which may be a cloud location like iCloud Drive.
- **Tested on the real phone.** Reminders especially aren't "done" until one has been
  watched fire on the device (Track 3 carries this).

---

## Appendix — Tools & stack that support this project

The tools and pieces it takes to build, run, and ship the app. *(This appendix
lives here until the Spec is written, then moves there — see the opening note.)*

### The recurring tasks — step reminders

The steps for the tasks that come around again and again. On the Mac, in
Terminal, from the project folder, unless said otherwise.

**Check the code is clean (after every change):**

- `npx tsc --noEmit` — the TypeScript check ("tsc clean").
- `npm run lint` — ESLint.

**Run the app in the Simulator (free — no EAS budget):**

- `npm run ios` — builds and opens the app in the iOS Simulator.
- Approve visuals in BOTH themes (Settings → Appearance → App Colors).

**Ship a build to the phone (the two-commit rhythm):**

1. Patrick commits the code first (EAS captures the git state at trigger time).
2. Trigger the cloud build: `eas build --platform ios --profile production`
   (the build number auto-increments). *(Patrick — correct this line if your
   actual command differs.)*
3. Submit to TestFlight: `eas submit --platform ios`. If the submit fails with
   "agreement missing or expired" or an EU trader question, the fix lives in
   App Store Connect → **Business**.
4. On the iPhone: install the new build from the TestFlight app and run that
   build's phone-test checklist (it lives in `handoff.md`).
5. Report results to Claude; the docs get refreshed; Patrick commits the docs
   separately — the second commit.

**Export a backup (after meaningful data changes):**

- On the iPhone, in the app: Settings → Backup & Restore → export.
- The file is `Remember-Backup-<date>.json`; save it where you'll find it
  (e.g. iCloud Drive).

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

- **Visual Studio Code** — the code editor. The extensions this project actually
  uses (confirmed #68):
  - **Expo Tools** (Expo) — the one the project itself asks for
    (`.vscode/extensions.json`): Expo debugging, IntelliSense.
  - **ESLint** (Microsoft) — shows the project's lint problems in the editor and
    powers the fix-on-save set in `.vscode/settings.json`.
  - **Draw.io Integration** (Henning Dieterichs) — edits draw.io diagrams in
    VS Code (`TestMap.drawio.svg` today; the Spec's map ahead).
- **Git** — version control; Patrick does all commits.
- **Claude (Cowork)** — pair-programming and docs assistant for this project, working
  directly in the connected project folder.

### A note on Siri (parked)

The project still contains a Siri intent plugin (`plugins/withSiriIntent`) wired into
`app.json`. It stays in place but inert while Siri voice control is parked — see the
parked items above and `docs/siri-voice-resume.md`.

---

*This roadmap is a living document. Revisit it when a milestone lands or the
direction shifts, and keep it in step with `handoff.md`, `parked-items.md`,
`pending.txt` — and the Spec, once it exists.*
