# Hand-off note — paste at the start of the next session

## TEST RESULTS — partial (logged 2026-06-22, session #9)

The TestFlight build (committed 2026-06-19) bundling "Reminder Options" + Group 1 was device-tested. Patrick reported a **partial** set of findings — several pieces are still untested, so the docs commit (this update) records what's confirmed and leaves the rest pending. Code stays committed; this is a docs-only logging pass.

**Confirmed working (device-validated 2026-06-22):**

- **The seven "Reminders before" buttons toggle/light correctly** (Reminder Options, `app/todo.tsx`).
- **The banner OK button clears the alert without deleting the event** (`app/_layout.tsx` `action === 'ok'` no-op).
- (Implicit) a **"Day" reminder fired and produced a banner** with Done/OK actions — so that preset schedules + displays. Its *timing accuracy* (~5 PM, 1 day before) is NOT yet confirmed.

**Bug found (device-observed 2026-06-22) — My Day medication logs on the wrong day after midnight. RAISED PRIORITY.** Patrick's medication is a **My Day daily routine item** (when he said "recurring Day tasks" he meant My Day daily, NOT the To-Do "Day" reminder preset). He takes it before bed, sometimes after midnight, and marks it done via the **banner Done on the notification popup**. **Verified in code:** banner Done (`_layout.tsx` ~122–137, `source !== 'todo'`) writes NO `my_history` entry and only sets `completed:true`, which the next-day reset (`myday.tsx` ~119) then clears → no durable record of the dose. (The on-screen Log does write history, but dates it from `new Date()` at tap-time — `myday.tsx` ~204 — still wrong after midnight.) **Open before fixing:** the desired late-night rule, and whether banner Done should write a dated history entry. A *separate* verified To-Do "Done" date bug also exists (not where meds live). Both parked under Bugs/correctness; see `parked-items.md`.

**Enhancement requested (2026-06-22) — sort the To-Do list by time, soonest/"closest" on top.** New behavior, not part of this build's scope. Parked under UI polish.

**Still UNTESTED (leave marked device-test-pending, do NOT mark validated):** "Morning of" firing ~8 AM that day; "Day/Week/Month" firing ~5 PM at 1/7/30 days before (timing); "1 hour/2 hours/At time" offsets off the appointment time; Settings Morning/Evening time changes taking effect; **Monthly** recurring firing each month; **Yearly** recurring firing on the right month+day (**Expo's 0-based month is the risky spot — still needs a real check**).

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
- **Notification action handling lives in `app/_layout.tsx`.** Categories `mydaysnooze` + `petssnooze` + **`todosnooze`** each have **Done + Snooze 15/30/60**; `todosnooze` additionally has an **OK** action (`opensAppToForeground:false`) that the handler treats as a no-op (`if (action === 'ok') return;`, placed before the snooze/done branches) — it just clears that one fired alert. The response effect (on `useLastNotificationResponse`) handles `snooze15/30/60`, `done`, `ok`, and a plain tap (route by `source`). **Snooze** branches: `todo` → re-tagged `todo`/`todosnooze` one-off; pets → `petssnooze`; else `mydaysnooze`. **Done** branches: `todo` → log to `todo_log`, then if `recurring !== 'none'` leave schedule+task (repeats on its own) else remove from `todo_tasks` + cancel all alerts matching `taskId`; pets/myday → mark `completed:true` in `pets_feeds`/`my_routine` by `itemId` + cancel the fired notif. All run via the foreground effect, so action taps bring the app forward. On-page Snooze in `myday.tsx`/`mollie.tsx` reuses the same TIME_INTERVAL + tagging scheme.
- iOS caps an app at **64 pending scheduled local notifications** (a DAILY/repeating trigger counts as ONE). Keep this in mind if Pets Day notifications get added.

## Tooling notes

- **Don't type into Simulator text fields with the assistant's tools** — triggers iOS accent popups and mangles input. Have Patrick type directly.
- **Assistant swipe/tap gestures on the Simulator are unreliable.** Patrick does direct manipulation/typing on the device; Claude reasons/guides, reads code, does menu-level actions.

## Active next step (the named goal for next session)

**Device test was PARTIAL (logged 2026-06-22) — finish testing before closing out this build.** Confirmed: 7 reminder buttons toggle/light; banner OK clears without deleting. Still untested: Morning-of/Day/Week/Month timing, 1hr/2hr/At-time offsets, Settings time changes, and Monthly + Yearly recurring firing (Yearly month especially). See "TEST RESULTS" up top. **New bug surfaced:** To-Do "Done" stamps today's date on stale banners (parked, Bugs/correctness). **New enhancement:** sort To-Do by soonest time on top (parked, UI polish).

**Likely next goals (let Patrick name one):**

- **Fix the My Day after-midnight medication date bug (raised priority).** Meds are a My Day daily item. Decide the late-night rule (does a dose marked just after midnight count for the prior day?), make banner Done write a history entry too, and date completion by the intended day rather than the tap moment. (`app/myday.tsx` + `app/_layout.tsx`.)
- **Fix the separate To-Do "Done" wrong-date bug** — carry the reminder's intended date in the notification `data` (or stamp `completedDate` from it) instead of `new Date()` at tap-time. (`app/_layout.tsx`.)
- **Sort the To-Do list by closest due time on top** (`app/todo.tsx`).

- **Group 2 — To-Do convenience:** add an on-tile Snooze button to To-Do (My Day + Pets Day have one; To-Do only has the banner Snooze).
- **3-month / 6-month recurring** (the parked half of Group 1): needs a design decision (reschedule-on-fire vs pre-scheduling the next few one-shots, within the iOS 64-notification cap) AND a new anchor-date picker in the form. Heavier; its own session.
- **Group 3 — housekeeping:** confirm/fix the Timer-cancel bug (cancelled timer's alert may still fire — never device-confirmed); clear the orphaned `pets_data` storage key.
- **Group 4 — smarter reminder taps:** land on the exact item, not just the screen (touches the shared tap-routing in `_layout.tsx` — test taps from all screens together).
- **Group 5 — Project Planner reminders:** wire up its dormant reminder fields to actually schedule alerts.
- Small parked spin-off: the Yearly day picker offers 1–31 for every month (Feb 30 would throw at schedule time) — tighten it.
- **Parked, not planned:** per-appointment reminder time override. **Resolved/dropped:** "where do daily-repeating reminders live" (decided — My Day is the daily engine, To-Do dropped Daily).

## Files touched this session (#9 — 2026-06-22, docs only)

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
3. **One build (committed 2026-06-19) bundles TWO sessions and was in device testing when we stopped — ASK ME HOW THE TEST WENT FIRST**, then mark each piece validated (or log the bug). It contains: (a) **"Reminder Options"** — editable global Morning (8 AM) / Evening (5 PM) times in Settings + seven toggle-highlight "Reminders before" buttons in To-Do (At time / 1 hour / 2 hours / Morning of / Day / Week / Month) + a silent OK dismiss on the To-Do banner; and (b) **Group 1** — Monthly + Yearly recurring To-Dos now fire (native repeating triggers). 3-month/6-month recurring stays parked. Everything before these is committed + device-validated; don't re-open finished work.
4. **No goal pre-scoped beyond the test.** After the test results, likely next: Group 2 (on-tile To-Do Snooze), the parked 3/6-month recurring, or another parked item. Wait for me to name one, tell me how heavy it looks, and wait for my "go" — one change at a time.
5. **Build economy:** I want to minimize EAS builds. Batch related edits across a session, I commit, then ONE build tests them together. Docs get their own commit AFTER the phone test (see "Build-and-test commit rhythm" in `session-start.md`).
