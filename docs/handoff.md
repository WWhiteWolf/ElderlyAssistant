# Hand-off note — paste at the start of the next session

## FIRST THING TO ASK PATRICK

FOUR edits from the 2026-06-15 (session 2) work are **DONE in the files but NOT yet committed or device-tested** — Patrick will commit + build + load via TestFlight and test on the phone. Confirm that happened (the previous session's work should already be committed at the start of the next one). The four edits: **(1) To-Do tiles now show the due time; (2) Pets Day heading renamed "Feeding Schedule" → "Routine"; (3) `deleteTask` now cancels its reminders; (4) `settings.tsx:165` `pin` typed as `string`.** The named goal for next session is already scoped and ready to build: **Pets Day routine reminders (Snooze like My Day)** — full plan in "Active next step" below.

Note on process (Patrick, 2026-06-15): one-change-at-a-time is the default, but for very small, low-risk edits it's fine to group them and still stop for review. Keep strict one-at-a-time for anything bigger or with logic changes.

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

## Latest session — 2026-06-15 (session 2: To-Do due-time, Pets rename, 2 bug fixes)

Four edits, scoped with Patrick then made. **NOT yet committed or device-tested** (Patrick handles that). Pets Day reminders were scoped but deferred to next session (Patrick's call — clean break, edits the shared router).

- **To-Do (`app/todo.tsx`) — show the due time on tiles.** Both render spots (main list line 515, Week-ahead line 554) were identical `Due: {task.dueDate}`; changed via one replace-all to `Due: {task.dueDate}{task.dueTime ? ' at ' + task.dueTime : ''}`. Shows the time exactly as the user typed it (the field at line 758 is free text), matching the existing reminder-body pattern at line 365. No time set → still just `Due: {date}`.
- **Pets Day (`app/mollie.tsx`) — heading rename.** Line 267 `sectionTitle` text changed from "Feeding Schedule" to "Routine". Text only, no logic. (Patrick plans to use this list for walks + other routines, not just feeding — keep that in mind for the reminder wording, which is generic.)
- **To-Do (`app/todo.tsx`) — `deleteTask` cancels reminders.** Added `cancelReminders(id);` in the Delete handler (~line 239), mirroring `completeTask` (line 250). Clears the parked "deleteTask doesn't cancel reminders" bug.
- **Settings (`app/settings.tsx:165`) — TS fix.** `onPress: async (pin)` → `(pin: string)`. Clears the parked implicit-`any` item. (NOTE: the old `settings.tsx:165` "only known TS error" reference elsewhere in this doc is now resolved.)

### Prior session — 2026-06-15 (session 1: My Day & Pets Day restructure)

Restructured My Day and Pets Day so each is one continuous, always-visible list on a single page. **Type-clean** (only the known `settings.tsx:165` remains). **COMMITTED + DEVICE-VALIDATED 2026-06-15** — Patrick committed, built, submitted, loaded, and tested on the phone; works good.

**My Day (`app/myday.tsx`) — full rewrite of the component:**
- Merged the two collapsed sections (Meals + Medications) into ONE always-visible **"Routine"** list of Entries. Each Entry still shows time + name, an Edit button, and a Log button.
- New single storage key **`my_routine`** with a one-time migration: on first load it folds the old `my_schedule` + `my_meds` into `my_routine` (nothing lost). `saveData` and `scheduleAllNotifications` now read `my_routine`.
- One **common Log** modal with a neutral "Notes (optional)" field (the old meal-vs-med split and "What did you eat?" prompt are gone). Removed `editingMeds`, `meds` state, `saveMeds/loadMeds`, the med-specific log path, and the two `*Expanded` collapse flags.
- **"+ Add Entry"** button moved into the top header on the right (was an empty spacer).
- **AM/PM** everywhere: `format12Hour` now outputs real 12-hour AM/PM on tiles; the edit modal time picker is three columns — **Hour (1–12) / Minute / AM-PM toggle** — while still storing 24h internally (notifications/DAILY trigger unaffected).
- Coffee/Water counters, daily reset, and "My Log" history unchanged.

**Keyboard fix (both screens):** wrapped the New/Edit time-picker modal in a `KeyboardAvoidingView` (behavior `padding` on iOS) in BOTH `myday.tsx` (added `KeyboardAvoidingView` + `Platform` imports) and `mollie.tsx` (imports already present from the Add Pet modal), so the box lifts above the keyboard instead of being covered. (The Pets Day Add Pet modal already had this; its Edit modal did not.)

**Pets Day (`app/mollie.tsx`) — full rewrite, now mirrors My Day:**
- Dropped the entire multi-pet system: no "All Pets" list, no Add Pet modal, no pet types/icons, no `selectedPet`. One single page.
- One always-visible **"Feeding Schedule"** Entry list (time + name, Edit, Log), the same common Log ("Notes (optional)"), a **Treats** counter, and a **"Pets Log"** history.
- **"+ Add Entry"** in the header on the right; **AM/PM** tiles + the same Hour/Minute/AM-PM picker; `KeyboardAvoidingView` on the edit modal.
- New storage keys **`pets_feeds` / `pets_history` / `pets_last_date`** with a daily reset on load. Per Patrick, existing pet data does NOT matter — starts fresh with two default feeds (Morning Feed 7:00 AM, Evening Feed 5:00 PM). Old `pets_data` key is left orphaned (parked: one-time cleanup).
- Still **NO notifications** on Pets Day (parked: add feeding reminders).

## Verified code facts (don't re-derive)

- **My Day list is now `routine`** (single `ScheduleItem[]`), persisted under **`my_routine`**, reset `completed:false` daily. `scheduleAllNotifications` reads `my_routine`, cancels only `data.source === 'myday'`, and schedules a repeating **DAILY** trigger per incomplete item with `sound: 'default'`. (Sound fix from earlier 2026-06-15 is committed + device-validated.)
- **Pets Day is `feeds`** (single `FeedItem[]`), persisted under **`pets_feeds`**, reset daily. No notification code at all. Treats counter is state-only (like My Day's Coffee/Water — not persisted), but logging a Treat writes a history entry.
- **Both screens' time picker** stores 24h internally; the UI shows/edit in AM/PM. `format12Hour` (both files) outputs real 12-hour AM/PM.
- **To-Do (`todo.tsx`) is unchanged this session.** It schedules a one-shot DATE reminder ONLY if `taskType !== 'background'` AND `dueDate` set AND `reminders.length > 0` AND fire time is still future. `updateTask` cancels+reschedules (committed); `deleteTask` still does NOT cancel (parked). `recurring` drives only the Week-view display, never notifications (parked).
- iOS caps an app at **64 pending scheduled local notifications** (a DAILY/repeating trigger counts as ONE). Keep this in mind if Pets Day notifications get added.

## Tooling notes

- **Don't type into Simulator text fields with the assistant's tools** — triggers iOS accent popups and mangles input. Have Patrick type directly.
- **Assistant swipe/tap gestures on the Simulator are unreliable.** Patrick does direct manipulation/typing on the device; Claude reasons/guides, reads code, does menu-level actions.

## Active next step (the named goal for next session) — Pets Day routine reminders

Add daily notifications to Pets Day, mirroring My Day exactly, WITH Snooze. Scoped + agreed with Patrick on 2026-06-15; verified against the code. Decisions: title **"Pets Routine"**, body **`Time for ${label}!`** (item's own name — generic, since the list holds walks/routines not just feeding), Snooze buttons like My Day (15/30/60). Keep internal names as-is (`pets_feeds`, `FeedItem`) — Patrick declined a rename; storage-key rename would risk saved data.

**Build touches TWO files** (Snooze is handled centrally in `_layout.tsx`):

`app/mollie.tsx` (currently imports NO notification code — verified):
- Add `import * as Notifications from 'expo-notifications';` and `import { SchedulableTriggerInputTypes } from 'expo-notifications';`.
- Request permission on mount (mirror `myday.tsx` lines 77–80: `requestPermissionsAsync`, alert if not granted).
- Add `scheduleAllPetsNotifications` mirroring `myday.tsx` `scheduleAllNotifications` (lines 136–168): cancel only `data?.source === 'pets'`, read `pets_feeds` from storage (source of truth), and for each feed with `completed === false` schedule a **DAILY** trigger (`hour`/`minute`) with content `{ title: 'Pets Routine', body: \`Time for ${item.label}!\`, data: { source: 'pets', itemId: item.id, label: item.label }, categoryIdentifier: 'petssnooze', sound: 'default' }`.
- Call `scheduleAllPetsNotifications()` after every feeds mutation: end of `loadData`, `confirmLog`, add-entry, edit-time save, delete, and the daily reset. (My Day calls its version in the same spots.)

`app/_layout.tsx`:
- Register a SECOND category `petssnooze` in the existing `setNotificationCategoryAsync` effect (same snooze15/30/60 buttons as `mydaysnooze`).
- In the Snooze handler (lines 35–53): the action ids `snooze15/30/60` are shared, so disambiguate by the incoming `data?.source`. If source is `'pets'` or `'petssnooze'`, reschedule the TIME_INTERVAL snooze tagged `source: 'petssnooze'`, `categoryIdentifier: 'petssnooze'`, `title: 'Pets Routine'`; otherwise keep the existing `mydaysnooze`/'Daily Routine' path.
- Routing (lines 58–63): add `else if (source === 'pets' || source === 'petssnooze') router.push('/mollie');`.

Notes: ~2 feeds, so the 64-notification iOS cap is a non-issue. Tap-routing lands on the SCREEN only (the existing parked limitation), not the specific item. After this, pull the next from `docs/parked-items.md`.

## Files touched this session (session 2)

- `app/todo.tsx` — (a) tiles now append the due time when set (lines 515 + 554); (b) `deleteTask` now calls `cancelReminders(id)` (~line 239). **Edited, NOT yet committed/device-tested.**
- `app/mollie.tsx` — `sectionTitle` text "Feeding Schedule" → "Routine" (line 267). **Edited, NOT yet committed/device-tested.**
- `app/settings.tsx` — line 165 `pin` typed as `string`. **Edited, NOT yet committed/device-tested.**
- `docs/parked-items.md` — moved To-Do due-time, `deleteTask` cancel, and the `settings.tsx:165` TS item to Done.
- `docs/handoff.md` — refreshed at session close (this version). **Patrick commits.**

---

## ▶ PASTE THIS AT THE START OF THE NEXT SESSION

You're picking up the "Remember When" app (Expo / React Native, runs on my iPhone via TestFlight).

1. The `elderlyassistant` folder must be connected via Cowork's folder picker — if you can't see it, give me the folder-request button; don't ask me to upload files.
2. Open and read `docs/handoff.md` first (full state, standing rules, next step), then skim `docs/parked-items.md` (the eventual-work backlog) so you know what's deferred.
3. Recent work is DONE: the My Day + Pets Day restructure (committed + device-tested, works good), plus four session-2 edits (To-Do due-time, Pets "Routine" rename, `deleteTask` cancel, `settings.tsx:165` type) — edited, awaiting Patrick's commit + device test. Confirm those four are committed + device-tested. The named next goal is **Pets Day routine reminders (Snooze like My Day)** — full build plan is in "Active next step." Don't re-open finished work.

Tell me how heavy it looks (it's already scoped) and wait for my "go" before changing anything.
