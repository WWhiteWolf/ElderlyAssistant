# Hand-off note — paste at the start of the next session

## FIRST THING TO ASK PATRICK

**The "Reminder Options" session (2026-06-19) is COMMITTED but NOT YET BUILT/TESTED on the phone.** First ask Patrick whether he has built + tested it on the device yet (he committed at session close but deliberately held off on the build — he is trying to limit EAS builds, having had to upgrade his plan once). Until it's device-tested, treat the appointment-reminder behavior as unverified on-device. The work (all `tsc --noEmit` clean):

- **Settings (`app/settings.tsx`) — two editable global reminder times.** New "Reminders" section with **Morning Reminder Time** (default 8:00 AM) and **Evening Reminder Time** (default 5:00 PM), edited via the app's Hour/Minute/AM-PM stepper picker, saved to `reminder_morning_time` / `reminder_evening_time` (24h "HH:MM").
- **To-Do (`app/todo.tsx`) — flexible appointment reminders + button UI.** Reminder type extended with optional `kind: 'offset' | 'clock'`, `daysBefore`, `timeOfDay`. Seven toggle-highlight preset buttons (no more chip list) under the heading **"Reminders before"**: **At time, 1 hour, 2 hours, Morning of, Day, Week, Month**. "Morning of" uses the morning time on the appointment day; "Day/Week/Month" use the evening time 1/7/30 days before the date; "1 hour/2 hours/At time" are plain offsets from the appointment time. Old saved reminders (no `kind`) still work as offsets.
- **To-Do banner (`app/_layout.tsx`) — silent OK dismiss.** `todosnooze` category gained an **OK** action (`opensAppToForeground:false`) that just clears the one alert — no Done, no Snooze, no app open, no effect on other reminders.

Everything before this session is **COMMITTED and DEVICE-VALIDATED**: the prior "Remove Daily & Date for weekly" session (removed Daily from the To-Do recurring picker; Weekly To-Dos fire a dateless repeating weekly alert; To-Do Done + Snooze 15/30/60 banner), plus the My Day + Pets Day Done/Snooze enhancements, Pets reminders, and counter persistence. Don't re-open finished work.

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

## Latest session — 2026-06-19 ("Reminder Options": flexible appointment reminders)

Goal: build the appointment-reminder scheme Patrick has always wanted (the original reason for the app) — fire alerts at 1 hour before, 2 hours before, morning of, day before, week before, month before. Scoped fully in conversation first, then built one step at a time, `tsc` clean after each. **Committed at session close; build deliberately deferred (Patrick limiting EAS builds).**

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
- **To-Do (`todo.tsx`) — UPDATED in "Reminder Options" (committed, awaiting device test).** `Reminder` now has optional `kind: 'offset' | 'clock'`, `daysBefore`, `timeOfDay`; legacy reminders with no `kind` are treated as offset. **Seven toggle-highlight preset buttons** (heading "Reminders before"): At time, 1 hour, 2 hours (offset) + Morning of, Day, Week, Month (clock, daysBefore 0/1/7/30). `isPresetSelected`/`togglePreset` drive the lit-button selection; there is **no chip list** anymore. `scheduleReminders`: `background` returns early; **weekly** tasks schedule a repeating WEEKLY trigger (`weekday: recurDay + 1`, `dueTime` parsed as HH:MM / default 9:00) with **NO date**; otherwise the dated path runs ONLY if `dueDate` set AND `reminders.length > 0`. In the dated loop it reads `reminder_morning_time` / `reminder_evening_time` (default 08:00/17:00) and per reminder: `kind:'clock'` → fire = (date − daysBefore days) at the morning/evening clock time; else offset = that many minutes/hours/days before the appointment time. Schedules only if fire time is future. All To-Do notifications carry `data: { taskId, itemId, label, source:'todo' }` + `categoryIdentifier: 'todosnooze'`, so banners show **Done + Snooze 15/30/60 + OK**. 'Daily' removed from the picker (still in the type + week-view handler for legacy tasks). `recurring` **monthly / every3months / every6months / yearly** still drive only the Week-view display, NOT notifications (only weekly schedules). `updateTask`/`deleteTask` cancel via `cancelReminders`. **To-Do `loadData` does NOT reschedule on load**. `scheduleBackgroundReminder` fires a DAILY 8am reminder for all `background` tasks, no per-item id.
- **Settings (`settings.tsx`) — global reminder times (new).** A "Reminders" section with Morning (default 08:00) + Evening (default 17:00) times, edited via the Hour/Minute/AM-PM stepper picker, stored under `reminder_morning_time` / `reminder_evening_time` as 24h "HH:MM". These are the clock anchors the To-Do scheduler reads. No per-appointment override (parked).
- **Notification action handling lives in `app/_layout.tsx`.** Categories `mydaysnooze` + `petssnooze` + **`todosnooze`** each have **Done + Snooze 15/30/60**; `todosnooze` additionally has an **OK** action (`opensAppToForeground:false`) that the handler treats as a no-op (`if (action === 'ok') return;`, placed before the snooze/done branches) — it just clears that one fired alert. The response effect (on `useLastNotificationResponse`) handles `snooze15/30/60`, `done`, `ok`, and a plain tap (route by `source`). **Snooze** branches: `todo` → re-tagged `todo`/`todosnooze` one-off; pets → `petssnooze`; else `mydaysnooze`. **Done** branches: `todo` → log to `todo_log`, then if `recurring !== 'none'` leave schedule+task (repeats on its own) else remove from `todo_tasks` + cancel all alerts matching `taskId`; pets/myday → mark `completed:true` in `pets_feeds`/`my_routine` by `itemId` + cancel the fired notif. All run via the foreground effect, so action taps bring the app forward. On-page Snooze in `myday.tsx`/`mollie.tsx` reuses the same TIME_INTERVAL + tagging scheme.
- iOS caps an app at **64 pending scheduled local notifications** (a DAILY/repeating trigger counts as ONE). Keep this in mind if Pets Day notifications get added.

## Tooling notes

- **Don't type into Simulator text fields with the assistant's tools** — triggers iOS accent popups and mangles input. Have Patrick type directly.
- **Assistant swipe/tap gestures on the Simulator are unreliable.** Patrick does direct manipulation/typing on the device; Claude reasons/guides, reads code, does menu-level actions.

## Active next step (the named goal for next session)

**The "Reminder Options" work is COMMITTED but NOT YET BUILT — first confirm whether Patrick has built + device-tested it.** What to test once built: (a) New Task shows the seven buttons under "Reminders before"; tapping toggles each one lit; (b) "Morning of" fires ~the morning time (default 8 AM) on the appointment day; (c) "Day/Week/Month" fire ~the evening time (default 5 PM) 1/7/30 days before the date; (d) "1 hour/2 hours/At time" fire off the appointment's own time; (e) changing the times in Settings moves them; (f) the banner shows an **OK** that just clears the alert (no Done/Snooze, doesn't open the app); (g) editing a saved task re-lights the right buttons.

**NEXT SESSION'S NAMED GOAL: Group 1 — finish the repeating reminders.** Make **monthly / every3months / every6months / yearly** recurring To-Dos actually fire notifications (today only **weekly** schedules; the others drive only the Week-view display). Monthly/yearly need a `recurDay`/`recurMonth` → repeating-trigger mapping like weekly's; **every3months / every6months have no native repeating trigger**, so they need a reschedule-on-fire approach (or a documented approximation). Done/Snooze already key off `recurring !== 'none'`, so they'll cover these once scheduled. First reload + test the "Reminder Options" build (if not already done), then start Group 1. One change at a time; discuss each before building.

**The rest of the backlog, grouped so each group = one build (Patrick's grouping, 2026-06-19):**

- **Group 1 — finish repeating reminders** (the named next goal above).
- **Group 2 — To-Do convenience:** add an on-tile Snooze button to To-Do (My Day + Pets Day have one; To-Do only has the banner Snooze). Same screen as Group 1, so it could share a build.
- **Group 3 — housekeeping:** confirm/fix the Timer-cancel bug (cancelled timer's alert may still fire — never device-confirmed); clear the orphaned `pets_data` storage key.
- **Group 4 — smarter reminder taps:** land on the exact item, not just the screen (touches the shared tap-routing in `_layout.tsx` — test taps from all screens together).
- **Group 5 — Project Planner reminders:** wire up its dormant reminder fields to actually schedule alerts.
- **Parked, not planned:** per-appointment reminder time override. **Resolved/dropped:** "where do daily-repeating reminders live" (decided — My Day is the daily engine, To-Do dropped Daily).

## Files touched this session ("Reminder Options" — 2026-06-19)

- `app/settings.tsx` — added the "Reminders" section (Morning/Evening global times) + a stepper time-picker modal (state, helpers `format12Hour`/`openTimeEditor`/`saveTime`, storage keys `reminder_morning_time`/`reminder_evening_time`); imports `KeyboardAvoidingView`/`Modal`/`Platform`; copied the modal/picker styles in. **`tsc` clean. Committed; awaiting build + device test.**
- `app/todo.tsx` — extended `Reminder` (`kind`/`daysBefore`/`timeOfDay`); new `ReminderPreset` + seven presets; `isPresetSelected`/`togglePreset` (toggle-highlight buttons, no chip list); heading "Reminders before"; `scheduleReminders` reads the global times and fires clock vs offset reminders; removed `reminderLabel`/`removeReminder` + `reminderRow`/`reminderText` styles. **`tsc` clean. Committed; awaiting build + device test.**
- `app/_layout.tsx` — added the `ok` action to `todosnooze` + an `action === 'ok'` no-op early return. **`tsc` clean. Committed; awaiting build + device test.**
- `docs/handoff.md` + `docs/parked-items.md` — refreshed at session close (this version). **Patrick commits.**

---

## ▶ PASTE THIS AT THE START OF THE NEXT SESSION

You're picking up the "Remember When" app (Expo / React Native, runs on my iPhone via TestFlight).

1. The `elderlyassistant` folder must be connected via Cowork's folder picker — if you can't see it, give me the folder-request button; don't ask me to upload files.
2. Open and read `docs/handoff.md` first (full state, standing rules, next step), then skim `docs/parked-items.md` (the eventual-work backlog) so you know what's deferred.
3. **The "Reminder Options" work (2026-06-19) is COMMITTED but NOT YET BUILT/TESTED** — first ask whether I've built + tested it on the phone (I'm trying to limit EAS builds, so I may hold off). It added: editable global **Morning (8 AM) / Evening (5 PM)** reminder times in Settings; seven toggle-highlight **"Reminders before"** buttons in To-Do (At time / 1 hour / 2 hours / Morning of / Day / Week / Month) where "Morning of" fires the morning time on the day, "Day/Week/Month" fire the evening time 1/7/30 days before, and the rest are offsets; and a silent **OK** dismiss on the To-Do banner. Everything before this is committed + device-validated. Don't re-open finished work.
4. **Next goal = Group 1: finish the repeating reminders** — make monthly / every 3 months / every 6 months / yearly recurring To-Dos actually fire (only Weekly schedules today). First reload + test the "Reminder Options" build, then start Group 1. See "Active next step" for the full grouped backlog (Groups 1–5). One change at a time; tell me how heavy it looks and wait for my "go".
5. **Build economy:** I want to minimize EAS builds. Batch related edits across a session, I commit, then ONE build tests them together.
