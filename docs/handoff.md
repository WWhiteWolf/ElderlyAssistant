# Hand-off note — paste at the start of the next session

## FIRST THING TO ASK PATRICK

The **My Day & Pets Day restructure is committed AND device-validated** (2026-06-15) — Patrick committed, built, submitted, loaded via TestFlight, and tested on the phone; it "works good." That work is settled — don't re-open it. The next goal is already named (see Active next step): **(1) add a "time set" display to each tile in My Day, and (2) rename the Pets Day list heading from "Feeding Schedule" to "Routine."** Confirm Patrick wants to start there, and clarify point 1 before building (see the note in Active next step).

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

## Latest session — 2026-06-15 (My Day & Pets Day restructure)

Goal: restructure My Day and Pets Day so each is one continuous, always-visible list on a single page. Read both files first, scoped WITH Patrick, then built. **Type-clean** (only the known `settings.tsx:165` remains). **COMMITTED + DEVICE-VALIDATED 2026-06-15** — Patrick committed, built, submitted, loaded, and tested on the phone; works good.

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

## Active next step (the named goal for next session)

Two items Patrick named at the close of 2026-06-15:

1. **My Day — add a "time set" display to each tile** (`app/myday.tsx`). Patrick's words: "add a time set display to each tile in My Day." NOTE before building: the tiles ALREADY prefix the scheduled time to the label (e.g. "8:00 AM Breakfast" via `format12Hour`). So clarify WITH Patrick what he wants — likely a separate, more prominent / styled time field or column (there's an unused `timeText` style at the bottom of the file that may be the intent), not just the inline prefix. Scope it before editing.
2. **Pets Day — rename the list heading** (`app/mollie.tsx`) from **"Feeding Schedule"** to **"Routine"** (the `sectionTitle` text in the feeding section). Small, one-line text change.

After these, no further goal is scoped. Pull the next from `docs/parked-items.md` (Pets Day feeding notifications, old `pets_data` cleanup, `deleteTask` cancel, To-Do due-time display, the To-Do recurring/daily design decision, the `settings.tsx:165` TS error).

## Files touched this session

- `app/myday.tsx` — full component rewrite: merged Routine list, `my_routine` migration, common Log, header Add Entry, AM/PM tiles + picker, KeyboardAvoidingView on edit modal. **COMMITTED + device-validated.**
- `app/mollie.tsx` — full rewrite: single-page Pets Day mirroring My Day, new `pets_*` keys, header Add Entry, AM/PM, KeyboardAvoidingView. **COMMITTED + device-validated.**
- `docs/parked-items.md` — added Pets Day notifications + old `pets_data` cleanup; cleared the now-done merge + AM/PM items. **COMMITTED.**
- `docs/handoff.md` — refreshed at session close; then updated again after Patrick's device test (this version) recording the restructure as validated and naming the next-session goal. **Patrick is committing this handoff update.**

---

## ▶ PASTE THIS AT THE START OF THE NEXT SESSION

You're picking up the "Remember When" app (Expo / React Native, runs on my iPhone via TestFlight).

1. The `elderlyassistant` folder must be connected via Cowork's folder picker — if you can't see it, give me the folder-request button; don't ask me to upload files.
2. Open and read `docs/handoff.md` first (full state, standing rules, next step), then skim `docs/parked-items.md` (the eventual-work backlog) so you know what's deferred.
3. Last session's My Day + Pets Day restructure is DONE — committed and device-tested, works good. Don't re-open it. The goal for THIS session is already named: (1) add a "time set" display to each My Day tile (clarify what's wanted first — tiles already show the time inline), and (2) rename the Pets Day list heading from "Feeding Schedule" to "Routine."

Tell me how heavy each looks and wait for my "go" before changing anything.
