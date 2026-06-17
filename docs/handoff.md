# Hand-off note — paste at the start of the next session

## FIRST THING TO ASK PATRICK

Everything through session 4 is **COMMITTED and DEVICE-VALIDATED on build 18** (2026-06-17): Pets Day routine reminders (fire on the phone, Snooze works), My Day + Pets Day counter persistence (Coffee/Water/Treats hold through page turns and reset daily), AND the four session-2 edits (To-Do tiles show the due time, Pets heading reads "Routine", `deleteTask` cancels reminders, `settings.tsx:165` `pin?: string`). Nothing is left awaiting a device test. There is **no pre-scoped goal** — ask Patrick for the next one and pull candidates from `docs/parked-items.md` (shortlist in "Active next step" below).

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

## Latest session — 2026-06-17 (session 4: Pets Day reminders + counter persistence)

Two goals, both built one step at a time and **device-validated on build 18** (Patrick committed, built via EAS, loaded through TestFlight, tested on the phone — Pets reminders fire, Snooze works, counters hold). The four session-2 edits were also confirmed good on the same build.

- **Pets Day routine reminders (`app/mollie.tsx` + `app/_layout.tsx`).** Pets Day had NO notification code; now it mirrors My Day. `mollie.tsx`: `expo-notifications` imports, permission + handler on mount, `scheduleAllPetsNotifications` (cancels only `source: 'pets'`, reads `pets_feeds` from storage, schedules a repeating DAILY trigger per incomplete feed — title "Pets Routine", body `Time for ${label}!`, `petssnooze` category, `sound: 'default'`), called at the end of `loadData` and inside `saveData`. `_layout.tsx`: registered a second `petssnooze` category; the shared snooze handler now branches on `data.source` (pets → "Pets Routine" / `petssnooze`); tap-routing adds `pets`/`petssnooze` → `/mollie`.
- **Counter persistence (`app/myday.tsx` + `app/mollie.tsx`).** Coffee/Water (My Day) and Treats (Pets Day) were in-memory only and reset to 0 on every page return. Now each is stored in AsyncStorage (`my_coffee`, `my_water`, `pets_treats`), loaded in `loadData`, reset to 0 on the existing daily-rollover check, and saved on every + (log) and − (button). Mirrors how the routine/feeds lists already reset daily.
- `tsc --noEmit` ran clean after each step.

### Prior session — 2026-06-15 (session 3: finish settings.tsx:165, commit session-2 work)

Short session. The named goal was `deleteTask` + `settings.tsx:165` — both were already written in session 2 but uncommitted. Found that session 2's `settings.tsx:165` "fix" (`pin: string`) was itself a **type error** (TS2322): `Alert.prompt`'s `onPress` value is `string | undefined`, so `string` is too narrow, and the failing pre-commit type check was what blocked the commit. Corrected to **`onPress: async (pin?: string)`** (one-char change, agreed with Patrick), `tsc` clean. Also hit a `.git/index.lock` snag (caused by the assistant running `git status` in its sandbox — see the Git/sandbox note up top); Patrick cleared it by closing/reopening the folder, then committed all session-2 work as **`d7b4e81`**. Working tree clean. Still awaiting device test. Pets Day reminders remain the next goal, untouched.

### Prior session — 2026-06-15 (session 2: To-Do due-time, Pets rename, 2 bug fixes)

Four edits, scoped with Patrick then made. **Committed in session 3 (`d7b4e81`); awaiting device test.** Pets Day reminders were scoped but deferred to next session (Patrick's call — clean break, edits the shared router).

- **To-Do (`app/todo.tsx`) — show the due time on tiles.** Both render spots (main list line 515, Week-ahead line 554) were identical `Due: {task.dueDate}`; changed via one replace-all to `Due: {task.dueDate}{task.dueTime ? ' at ' + task.dueTime : ''}`. Shows the time exactly as the user typed it (the field at line 758 is free text), matching the existing reminder-body pattern at line 365. No time set → still just `Due: {date}`.
- **Pets Day (`app/mollie.tsx`) — heading rename.** Line 267 `sectionTitle` text changed from "Feeding Schedule" to "Routine". Text only, no logic. (Patrick plans to use this list for walks + other routines, not just feeding — keep that in mind for the reminder wording, which is generic.)
- **To-Do (`app/todo.tsx`) — `deleteTask` cancels reminders.** Added `cancelReminders(id);` in the Delete handler (~line 239), mirroring `completeTask` (line 250). Clears the parked "deleteTask doesn't cancel reminders" bug.
- **Settings (`app/settings.tsx:165`) — TS fix.** `onPress: async (pin)` → `(pin?: string)`. (Session 2 first tried `pin: string`, which itself caused TS2322 since `Alert.prompt`'s callback value is `string | undefined`; session 3 corrected it to the optional `pin?: string`.) Clears the parked implicit-`any` item. (NOTE: the old `settings.tsx:165` "only known TS error" reference elsewhere in this doc is now resolved.)

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

- **My Day list is now `routine`** (single `ScheduleItem[]`), persisted under **`my_routine`**, reset `completed:false` daily. `scheduleAllNotifications` reads `my_routine`, cancels only `data.source === 'myday'`, and schedules a repeating **DAILY** trigger per incomplete item with `sound: 'default'`. (Sound fix from earlier 2026-06-15 is committed + device-validated.) Coffee/Water counters are **now persisted** under `my_coffee` / `my_water`, reset daily (session 4).
- **Pets Day is `feeds`** (single `FeedItem[]`), persisted under **`pets_feeds`**, reset daily. **Now HAS notifications** (session 4): `scheduleAllPetsNotifications` cancels only `source: 'pets'`, reads `pets_feeds` from storage, schedules a repeating DAILY trigger per incomplete feed (title "Pets Routine", body `Time for ${label}!`, `petssnooze` category, `sound: 'default'`); permission + handler requested on mount. Treats counter is **now persisted** under `pets_treats`, reset daily; logging a Treat still writes a history entry.
- **Both screens' time picker** stores 24h internally; the UI shows/edit in AM/PM. `format12Hour` (both files) outputs real 12-hour AM/PM.
- **To-Do (`todo.tsx`) is unchanged this session.** It schedules a one-shot DATE reminder ONLY if `taskType !== 'background'` AND `dueDate` set AND `reminders.length > 0` AND fire time is still future. `updateTask` cancels+reschedules (committed); `deleteTask` still does NOT cancel (parked). `recurring` drives only the Week-view display, never notifications (parked).
- iOS caps an app at **64 pending scheduled local notifications** (a DAILY/repeating trigger counts as ONE). Keep this in mind if Pets Day notifications get added.

## Tooling notes

- **Don't type into Simulator text fields with the assistant's tools** — triggers iOS accent popups and mangles input. Have Patrick type directly.
- **Assistant swipe/tap gestures on the Simulator are unreliable.** Patrick does direct manipulation/typing on the device; Claude reasons/guides, reads code, does menu-level actions.

## Active next step (the named goal for next session)

**Nothing is pre-scoped** — the Pets Day reminders goal is done and device-validated (session 4). At the next session Patrick names the goal; pull candidates from `docs/parked-items.md`. Open ones there: the possible **Timer-cancel bug** (unconfirmed — `cancelTimer` may use the wrong identifier; needs a device check), **To-Do "recurring" never schedules repeating notifications** (a "Daily" To-Do fires once then drops — tied to the daily-reminders design decision), the orphaned **`pets_data` cleanup**, **item-level tap-routing** (notifications open the screen but not the specific item), and **Project Planner reminders** (UI present, wires up nothing — dormant).

## Files touched this session (session 4 — 2026-06-17)

- `app/mollie.tsx` — added Pets Day notifications (imports, permission + handler on mount, `scheduleAllPetsNotifications`, wired into `loadData` + `saveData`) AND Treats counter persistence under `pets_treats` (load in `loadData`, reset daily, save on every +/−). **Committed + device-validated on build 18.**
- `app/_layout.tsx` — `petssnooze` category; snooze handler branches by `data.source`; tap-routing `pets`/`petssnooze` → `/mollie`. **Committed + device-validated.**
- `app/myday.tsx` — Coffee/Water counter persistence under `my_coffee` / `my_water` (load in `loadData`, reset daily, save on every +/−). **Committed + device-validated.**
- `docs/handoff.md` + `docs/parked-items.md` — refreshed at session close (this version). **Patrick commits.**

---

## ▶ PASTE THIS AT THE START OF THE NEXT SESSION

You're picking up the "Remember When" app (Expo / React Native, runs on my iPhone via TestFlight).

1. The `elderlyassistant` folder must be connected via Cowork's folder picker — if you can't see it, give me the folder-request button; don't ask me to upload files.
2. Open and read `docs/handoff.md` first (full state, standing rules, next step), then skim `docs/parked-items.md` (the eventual-work backlog) so you know what's deferred.
3. Recent work is DONE and device-validated on build 18 (2026-06-17): the My Day + Pets Day restructure, the four session-2 edits (To-Do due-time, Pets "Routine" rename, `deleteTask` cancel, `settings.tsx:165` type), **Pets Day routine reminders with Snooze**, and **counter persistence** (Coffee/Water/Treats). Nothing is awaiting a device test. There is no pre-scoped goal — ask me for one and pull candidates from `docs/parked-items.md`. Don't re-open finished work.

Tell me how heavy the goal I pick looks, and wait for my "go" before changing anything.
