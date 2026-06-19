# Hand-off note — paste at the start of the next session

## FIRST THING TO ASK PATRICK

**Session 6 (2026-06-19) is DONE IN THE WORKING TREE — awaiting Patrick's commit + build + phone test.** First ask Patrick whether he committed, built, and tested session 6 on the phone. The session 6 work (all in `app/todo.tsx` + `app/_layout.tsx`, `tsc --noEmit` clean, NOT yet committed):

- **Removed 'Daily'** from the To-Do recurring picker (left in the type + week-view handler so any already-saved Daily task still displays).
- **Weekly To-Dos now work with NO date.** The tile shows the day + set time (e.g. "Tue at 20:00"), and `scheduleReminders` fires a true **repeating WEEKLY** alert on the chosen day at the set time (no "before" offsets — just the time, per Patrick's trash-night example).
- **To-Do reminders now have a Done + Snooze banner.** New `todosnooze` notification category (Done + Snooze 15/30/60) attached to all To-Do reminders (weekly + dated). **Done** logic: a *repeating* task (weekly/monthly/3mo/6mo/yearly) is logged to To-Do history and left running; a *one-time* task is logged, removed, and all its alerts cancelled. **Snooze** reschedules a one-off N-min-out alert, leaving the repeating weekly alert intact.

Everything through session 5 is **COMMITTED and DEVICE-VALIDATED** (2026-06-19): the My Day + Pets Day notification enhancements — a **Done** banner action and an on-page **Snooze** (15/30/60) on every My Day + Pets Day tile. Nothing there awaits a device test.

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

## Latest session — 2026-06-19 (session 6: To-Do recurring + Done/Snooze)

Goal: the To-Do recurring changes + bring Done/Snooze to To-Do. Patrick approved doing steps 2–4 together (after step 1 alone); built in sequence with `tsc` clean after each. **Awaiting Patrick's commit + build + phone test.**

- **Step 1 — removed 'Daily'** from the recurring picker array (`app/todo.tsx` ~line 679). Left `'daily'` in `RecurType` and the week-view filter so any already-saved Daily task still renders (Patrick: no saved data to migrate).
- **Step 2 — Weekly tile display (`app/todo.tsx`).** New `scheduleLabel(task)` helper + `DAY_NAMES`. A Weekly task shows day + time with no date (e.g. "Tue at 20:00"); dated tasks still show "Due: …". Replaced both tile render spots (main list + week-ahead).
- **Step 3 — Weekly scheduling (`app/todo.tsx`, `scheduleReminders`).** Split the old guard: `background` still returns early; a new **weekly** branch parses `dueTime` ("HH:MM", defaults 9:00) and schedules a repeating **WEEKLY** trigger (`weekday: recurDay + 1` — Expo is 1=Sun…7=Sat, recurDay is 0=Sun) at that time, then returns; the dated one-shot path is unchanged below the `if (!dueDate || reminders.length === 0) return`. All To-Do notifications now carry `data: { taskId, itemId, label, source:'todo' }` + `categoryIdentifier: 'todosnooze'`.
- **Step 4 — Done + Snooze for To-Do (`app/_layout.tsx`).** Registered the `todosnooze` category (Done + Snooze 15/30/60). Snooze handler branches on `source==='todo'` (title `📋 Reminder: {label}`, body `{label}`, re-tagged `todo`/`todosnooze`, one-off TIME_INTERVAL). Done handler branches on `source==='todo'`: logs to `todo_log`; if `recurring && !== 'none'` leaves the schedule + task in place (repeats on its own), else removes the task from `todo_tasks` and cancels all alerts matching `taskId` (mirrors on-screen `completeTask`).

### Prior session — 2026-06-19 (session 5: notification Done action + on-page Snooze)

Goal: notification enhancements on My Day + Pets Day. Built one step at a time, **no commit between steps** (Patrick's call), then committed once and **device-validated** (built via EAS, loaded through TestFlight, tested on the phone — all good). `tsc --noEmit` clean after each step. To-Do was explicitly **parked** for a separate session.

- **Step 1 — "Done" banner action (`app/_layout.tsx`).** Added a `done` action (first, before the three Snooze buttons) to both the `mydaysnooze` and `petssnooze` notification categories. New `done` branch in the response handler: maps `source` → storage key (`myday`/`mydaysnooze` → `my_routine`, `pets`/`petssnooze` → `pets_feeds`), finds the item by `data.itemId`, sets `completed: true`, writes back, and cancels the fired notification by its request identifier. It's the banner equivalent of the on-screen Log (✓); the screens' daily reset + reschedule-on-load brings the item back tomorrow. Added the `AsyncStorage` import to `_layout.tsx` (wasn't there before). Runs through the same foreground response effect as Snooze (so tapping Done brings the app forward — consistent with existing Snooze behavior).
- **Step 2 — on-page Snooze (`app/myday.tsx` + `app/mollie.tsx`).** Each screen got a `snoozeItemId` state, a `snoozeItem(minutes)` function (schedules a one-off `TIME_INTERVAL` reminder N min out, tagged `mydaysnooze`/`petssnooze` so the daily reschedule won't wipe it — same mechanism the banner Snooze uses), an orange **Snooze** button on every tile (between Edit and Log; trimmed `editBtn` marginRight 28→8 to fit), and a 15/30/60 popup `Modal` (reuses `modalOverlay`/`pickerModal`) with the item name, three options, and Cancel; an `Alert` confirms after picking.

### Prior session — 2026-06-17 (session 4: Pets Day reminders + counter persistence)

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
- **To-Do (`todo.tsx`) — UPDATED session 6 (awaiting commit/device test).** `scheduleReminders`: `background` returns early; **weekly** tasks schedule a repeating WEEKLY trigger (`weekday: recurDay + 1`, `dueTime` parsed as HH:MM / default 9:00) with **NO date** and no "before" offsets; otherwise the dated one-shot path runs ONLY if `dueDate` set AND `reminders.length > 0` AND fire time still future. All To-Do notifications now carry `data: { taskId, itemId, label, source:'todo' }` + `categoryIdentifier: 'todosnooze'`, so banners show **Done + Snooze 15/30/60**. 'Daily' removed from the picker (still in the type + week-view handler for legacy tasks). `recurring` **monthly / every3months / every6months / yearly** still drive only the Week-view display, NOT notifications (only weekly schedules) — but the Done/Snooze logic already keys off `recurring !== 'none'`, so it'll cover those automatically the day they get scheduling. `updateTask`/`deleteTask` cancel via `cancelReminders`. **To-Do `loadData` does NOT reschedule on load** (the weekly alert survives restarts via the OS repeating trigger). `scheduleBackgroundReminder` fires a DAILY 8am reminder for all `background` tasks, no per-item id.
- **Notification action handling lives in `app/_layout.tsx`.** Categories `mydaysnooze` + `petssnooze` + **`todosnooze`** (session 6) each have **Done + Snooze 15/30/60**. The response effect (on `useLastNotificationResponse`) handles `snooze15/30/60`, `done`, and a plain tap (route by `source`). **Snooze** branches: `todo` → re-tagged `todo`/`todosnooze` one-off; pets → `petssnooze`; else `mydaysnooze`. **Done** branches: `todo` → log to `todo_log`, then if `recurring !== 'none'` leave schedule+task (repeats on its own) else remove from `todo_tasks` + cancel all alerts matching `taskId`; pets/myday → mark `completed:true` in `pets_feeds`/`my_routine` by `itemId` + cancel the fired notif. All run via the foreground effect, so action taps bring the app forward. On-page Snooze in `myday.tsx`/`mollie.tsx` reuses the same TIME_INTERVAL + tagging scheme.
- iOS caps an app at **64 pending scheduled local notifications** (a DAILY/repeating trigger counts as ONE). Keep this in mind if Pets Day notifications get added.

## Tooling notes

- **Don't type into Simulator text fields with the assistant's tools** — triggers iOS accent popups and mangles input. Have Patrick type directly.
- **Assistant swipe/tap gestures on the Simulator are unreliable.** Patrick does direct manipulation/typing on the device; Claude reasons/guides, reads code, does menu-level actions.

## Active next step (the named goal for next session)

**Session 6's goal is COMPLETE in the working tree — first confirm Patrick committed, built, and tested it on the phone.** What to test: (a) make a Weekly To-Do with a day + evening time and NO date → tile shows "Day at HH:MM", and the weekly reminder fires on that day with **Done + Snooze** buttons; (b) tap **Snooze** → re-alerts in 15/30/60; (c) tap **Done** on the weekly → it logs to To-Do history and still fires again next week; (d) a one-time dated To-Do's **Done** removes it for good; (e) 'Daily' is gone from the recurring picker.

**No goal is pre-scoped for the next session.** Likely candidates (let Patrick name the one goal):

1. **Schedule the other recurring types** — monthly / **every3months / every6months** / yearly currently drive only the Week-view display, not notifications. Only weekly schedules. (The Done/Snooze logic already handles any `recurring !== 'none'`, so it'll work once scheduling is added. Note: monthly/yearly need a `recurDay`/`recurMonth` → trigger mapping like weekly's.)
2. Other parked items in `docs/parked-items.md`: Timer-cancel bug, `pets_data` cleanup, item-level tap-routing, Project Planner reminders.

Still do it one change at a time; discuss each before building.

## Files touched this session (session 6 — 2026-06-19)

- `app/todo.tsx` — removed 'Daily' from the recurring picker; added `DAY_NAMES` + `scheduleLabel(task)` helper; replaced both tile render spots to use it; rewrote `scheduleReminders` (early `background` return, new weekly WEEKLY-trigger branch, dated path unchanged below); added `itemId`/`label` + `categoryIdentifier: 'todosnooze'` to all To-Do notification data. **`tsc` clean. Awaiting Patrick commit + build + device test.**
- `app/_layout.tsx` — registered `todosnooze` category; added `todo` branch to the Snooze handler; added `todo` branch to the Done handler (log + recurring-vs-one-time logic). **`tsc` clean. Awaiting Patrick commit + build + device test.**
- `docs/handoff.md` + `docs/parked-items.md` — refreshed at session close (this version). **Patrick commits.**

---

## ▶ PASTE THIS AT THE START OF THE NEXT SESSION

You're picking up the "Remember When" app (Expo / React Native, runs on my iPhone via TestFlight).

1. The `elderlyassistant` folder must be connected via Cowork's folder picker — if you can't see it, give me the folder-request button; don't ask me to upload files.
2. Open and read `docs/handoff.md` first (full state, standing rules, next step), then skim `docs/parked-items.md` (the eventual-work backlog) so you know what's deferred.
3. **Session 6 (2026-06-19) is done in the working tree but awaiting my commit + build + phone test** — first ask whether I committed/built/tested it. It: removed **Daily** from the To-Do recurring picker; made **Weekly** To-Dos work with NO date (tile shows day+time, fires a repeating weekly alert); and gave To-Do reminders a **Done + Snooze 15/30/60** banner. Earlier work is committed + device-validated (My Day/Pets restructure, session-2 edits, Pets reminders+Snooze, counters, session-5 My Day/Pets Done+on-page Snooze). Don't re-open finished work.
4. **No goal is pre-scoped for next session.** Likely next: schedule the other recurring types (monthly / 3 months / 6 months / yearly — only Weekly schedules so far), or a parked item. Wait for me to name the one goal, tell me how heavy it looks, and wait for my "go" — one change at a time.
