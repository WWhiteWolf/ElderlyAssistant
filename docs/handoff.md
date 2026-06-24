# Hand-off note — paste at the start of the next session

## THIS SESSION — #12 (2026-06-23): logged device-test results — #11 sort VALIDATED; Morning-of/1hr/2hr reminders VALIDATED; scoping "My Week"

**Device-test results logged this session (from Patrick's phone):**

- **Session #11 To-Do soonest-first sort — DEVICE-VALIDATED.** The list shows the soonest item at the top, with its time. Done.
- **2026-06-19 build — three more reminders confirmed firing:** **Morning of**, **1 hour**, and **2 hours** all fire. Still untested: **At time** offset, **Day/Week/Month** timing (~5 PM at 1/7/30 days before), Settings Morning/Evening time changes, and **Monthly + Yearly** recurring firing (Yearly month especially).
- **Session #10 after-midnight banner-Done fix — STILL PENDING.** Patrick can't test it quickly (needs a real late-night/after-midnight run). Leave marked device-test-pending; do not mark validated.

### ▶ MY WEEK — AGREED SPEC (locked with Patrick 2026-06-23, session #12; NOT yet built)

A new **My Week** screen (`app/myweek.tsx`), mirroring My Day's single-page structure and interactions, for **weekly** chores. Scoped in full with Patrick before any building.

**What it is.** One always-visible list of every weekly chore (trash, laundry, groceries, yard work, cleaning, etc.) — the chores never disappear from the page, the same way My Day shows the daily routine. Mirrors My Day's UI: tiles, an Add/Edit modal, reorder ▲▼ arrows, a history **Log**, swipe-to-delete. **No Coffee/Water counters** (those stay My Day–only).

**Each chore has** a label, a **day of the week**, and a **time** (so the Edit modal gets a Sun–Sat day picker added next to My Day's existing Hour/Minute/AM-PM time picker). Tiles show day + time + label.

**The reminder model (REVISED 2026-06-23, session #12 — replaces the earlier "nag daily automatically" idea).** A chore reminds **once** on its day at its set time, then automatically returns next week on its normal day. There is **NO automatic daily nagging.** The only thing that makes a chore keep reminding on following days is Patrick pressing **Postpone** — that pushes the reminder to the next day (or a day he picks), and from that pushed reminder he can Done it or Postpone again. **No postpone, no continuing nag.** Marking **Done** ends it for the week. (Patrick's words: "Have the nag follow the postpone push only. No postpone no continuing nag.")

**Why this is better (and kills the 64-slot worry).** The earlier auto-daily-nag idea needed the app to pre-schedule a week of reminders, because iOS won't run app code when a notification merely fires in the background — so it couldn't reschedule itself day to day. Postpone sidesteps that entirely: it's a deliberate button tap, so the app is awake at that moment and can reliably schedule the pushed reminder right then. Net effect: just ONE base weekly alert per chore (plus at most one live postpone), so the iOS 64-pending cap is no longer a concern.

**Postpone (per-occurrence, repeatable).** Each tile has a **Postpone** action separate from Done: either a one-tap **+1 day** (bump to tomorrow) or **pick a particular day**. Postpone keeps the chore nagging on the new day (never forgotten) and **stays available every day** so Patrick can keep pushing it. Postpone affects **only the current week** — a chore's *home* day/time never changes from postponing. Covers both "tired today, do it tomorrow" and "holiday week, trash is Wednesday this once."

**Weekly reset.** A chore's home day/time is permanent; postpone only moves the current week's reminders. Next week the chore is automatically back on its normal day. If a chore is never marked Done, when its normal day comes around again the new week simply **starts fresh** (the old, un-done cycle is dropped/"forgotten").

**Editing vs postponing.** **Edit** changes a chore's permanent day/time/label. **Postpone** is temporary (current week only). Two different actions.

**Honest note on weight / the hard part.** Nag-until-done + per-occurrence Postpone + weekly reset is genuinely new logic, NOT a straight copy of My Day's single DAILY trigger. iOS's plain "daily at 7 PM" repeating alarm has no built-in notion of "don't start until Tuesday," "stop when done," or "reset next week," so the scheduling needs custom logic on top. This is the careful part.

**AGREED BUILD ORDER (smallest-risk first, one stage per edit, Patrick commits + tests between):**

1. **The page itself — ✅ BUILT + SIMULATOR-VALIDATED 2026-06-23 (session #12).** `app/myweek.tsx` created mirroring My Day: always-visible "Weekly Chores" list (each tile shows day + time + name), Edit / Done / reorder ▲▼ / "My Log" history / swipe-delete; Add/Edit modal has a **Sun–Sat day-chip picker** above the Hour/Minute/AM-PM time picker; **no Coffee/Water counters**; seeds 3 starter chores (Trash Tue 7 PM, Laundry Sat 9 AM, Groceries Sat 10 AM). Home got a "My Week" 🗓️ tile + route; `_layout.tsx` registers the `myweek` screen. `tsc --noEmit` clean. Patrick tested reorder, add, edit, clear-all, delete-chore, delete-log in the Simulator — **all work as expected.** NOT yet committed/built to phone (no reminders yet — fine to keep testing locally).
2. **The base reminder — ✅ BUILT + SIMULATOR-VALIDATED 2026-06-23 (session #12).** Each chore fires **once** on its day/time via a native **WEEKLY repeating trigger** (1 per chore, weekday = `day + 1` — verified against the working To-Do weekly code: `(recurDay ?? 0) + 1`, 0=Sun; auto-returns next week, survives restarts), tagged `source:'myweek'`, tap routes to `/myweek`. Plus a per-chore **weekly reset** of the `completed`/✓ flag (helpers `lastOccurrence` + `applyWeeklyReset`, tracked via a `doneAt` epoch-ms on each chore; on load, clears ✓ once a new occurrence has passed since completion). `_layout.tsx` got `source:'myweek'` → `/myweek` tap routing. `tsc` clean. Patrick tested in the Simulator — permission prompt, add/edit/delete, Done ✓, no crash — **all working.** (Live once-a-week fire timing not separately stress-tested; code matches the proven To-Do/My Day pattern.)
3. **Postpone + Done banner** — split into 3a (tile) + 3b (banner).
   - **3a — tile Postpone — ✅ BUILT + SIMULATOR-VALIDATED 2026-06-23 (session #12).** Each tile got a **Postpone** button → popup with **"Tomorrow (+1 day)"** + a Sun–Sat pick-a-day row; schedules a one-off **DATE** reminder (`source:'myweekpostpone'`) at the chore's same time, stamps `postponedTo` (tile shows "▶ moved to <day>"). Re-postpone replaces the prior one (`cancelPostpone`); Done + delete clear it; the weekly reset drops a stale postpone. Helpers: `cancelPostpone`, `nextDateForWeekday`, `schedulePostpone`, `postponeTomorrow`, `postponeToDay`. `_layout.tsx` routes `myweekpostpone` taps → `/myweek`. `tsc` clean. Patrick tested the popup, both choices, the "moved to" label, and Done/re-postpone clearing — **all worked well.** (Live postpone *firing* is ≥1 day out → phone-test only.)
   - **3b — banner Done / +1 Day — ✅ BUILT + SIMULATOR-VALIDATED 2026-06-23 (session #12), `tsc` clean. Banner fired and its buttons worked in the Simulator; AWAITING PHONE BUILD for final confirmation.** New `myweekactions` notification category (Done + +1 Day) registered in `_layout.tsx`, attached to BOTH the base weekly and the postpone notifications (myweek.tsx). `_layout.tsx` handlers: **postpone1** ("+1 Day") pushes the chore's reminder to tomorrow at its time (cancels any prior postpone, writes `postponedTo` to `week_routine`); **done** marks the chore complete + logs to `week_history` (dated from the fired time, `response.notification.date`×1000) + clears any pending postpone. **Important:** the done/postpone1 handlers deliberately do NOT cancel the fired notification's identifier — for the base WEEKLY reminder that would kill the repeat; iOS auto-clears the shown banner on an action tap. Like My Day's banner buttons, tapping Done/+1 Day briefly brings the app to the foreground (that's what makes the reschedule run reliably — a fully-silent action wouldn't run JS until next app open). **Whole My Week feature is now code-complete; needs one phone build to test live firing + banner actions.**

**Stage 1 storage + model (for stage 2 to build on):** chores live under **`week_routine`** as `Chore[]` = `{ id, label, day (0=Sun…6=Sat), hour, minute, completed }`; the log under **`week_history`** (same `HistoryEntry` shape + 50-cap as My Day). Stage 1 does NOT schedule notifications and does NOT do any daily/weekly reset yet — both are stage 2's job. `DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']`. "Done" writes a history entry + sets `completed:true` (via the Log modal).

**TESTING NOTE (Patrick, session #12): test in the iOS Simulator FIRST, before the phone.** Local dev build via `npm run ios`; Metro picks up edits live. So each stage gets a Simulator check before any EAS/TestFlight build. (Reminder: the assistant must NOT type into Simulator fields — accent-popup bug; Patrick types directly. Assistant swipe/tap on the Simulator is unreliable — Patrick does direct manipulation.)

---

## PRIOR SESSION — #11 (2026-06-23): To-Do list now sorts soonest-first — one fixed sort, buttons removed (code done, tsc clean, COMMITTED — sort DEVICE-VALIDATED #12)

The long-parked "sort To-Do by soonest time on top" enhancement is built. **The To-Do list now has ONE fixed sort — by due date + time, soonest on top.** Patrick's decisions this session: no manual reorder in To-Do (unlike My Day — appointments have moving dates, so automatic self-maintains the "next thing on top"); recurring tasks don't need sorting (he positions them); and Due-Date sort should just be the permanent default, so the sort buttons are gone entirely.

What changed, all in **`app/todo.tsx`**:

- `getSortedTasks` collapsed from three branches (priority/dueDate/category) to **one fixed sort**: it builds a date+time stamp per task (`dueDate` `MM/DD/YYYY` + `dueTime` `HH:MM`, mirroring the scheduler's own parse) and sorts ascending. **Same-day tasks order by time, earliest first.** A dated task with **no time** sorts as `00:00` (start of its day). **Undated + recurring (weekly/monthly/yearly) tasks fall to the bottom**, where Patrick's manual positioning stands.
- Removed the `sortRow` UI block (the "Sort:" label + the 3 buttons), the `sortBy` state, and the orphaned `sortRow`/`sortLabel`/`sortBtn*` styles.
- The category **filter** row (All + category chips) is **untouched** — that's filtering, not sorting; Patrick said leave it as is.

`tsc --noEmit` clean. **Patrick is committing this and building it now in its OWN build** — deliberately segregated from other changes so this sort can be tested in isolation. **Device test once built:** add a few dated To-Dos with different dates/times → list shows the soonest at the top, and same-day items order by their time.

**▶ NEXT SESSION — the design change Patrick wants: a "My Week" page.** Add a new **"My Week"** screen that **mirrors the other "My" pages** (My Day = `myday.tsx`; Pets Day = `mollie.tsx` already mirrors it) **but for weekly recurrences** — a single always-visible list of weekly-recurring routine items with the same structure and interactions as My Day (tiles, edit modal, Done/Snooze, manual ▲▼ reorder, history/log), scoped to things that recur weekly rather than daily. **Not yet scoped in detail** — Patrick will name it as the goal and we scope it together before building (one change at a time). This connects to the long-parked design question "where do weekly/recurring reminders live": My Week would become the weekly engine, the way My Day is the daily engine.

---

## LAST SESSION — #10 (2026-06-23): fixed the My Day after-midnight med bug (code COMMITTED, AWAITING DEVICE TEST)

The raised-priority bug — a My Day item marked **Done from the notification banner** left no durable record and (when any record was written) was dated wrong after midnight — is now fixed in code. **One edit, `app/_layout.tsx`, the `action === 'done'` non-To-Do branch.** Patrick will commit.

What the fix does: banner Done now **writes a dated history entry** (it previously wrote none, so the next-day reset erased the dose). The entry's date + time come from when the reminder **FIRED** (`response.notification.date`), not the tap moment — so an item marked just after midnight files under the day the reminder was issued. **iOS reports `notification.date` in SECONDS** (verified in `EXNotificationSerializer.m`: `notification.date.timeIntervalSince1970`, NO ×1000 — unlike `getNextTriggerDateAsync` which does ×1000), so the code multiplies by 1000 before `new Date(...)`. Entry shape + 50-cap match each screen's on-screen Log.

**Patrick asked for Pets Day to mirror My Day, so it does:** the branch picks the history key by source — `pets_history` for pets, `my_history` for My Day — and writes for both. Pets' `HistoryEntry` shape is identical (verified in `mollie.tsx`).

**Deliberately left as-is (Patrick's call):** the on-screen **Log** buttons still stamp tap-time (no fired-notification date to borrow; fixing them would need a cutoff-hour rule — discussed, deferred). Known edge: a Snooze that crosses midnight files under the new day.

**`tsc --noEmit` clean.** Not yet built or device-tested. **Device test to run:** mark a My Day item (ideally the med, after midnight) Done from the banner → My Day log shows it under the prior day; repeat for a Pets feed → Pets log shows it.

---

## TEST RESULTS — partial (logged 2026-06-22, session #9)

The TestFlight build (committed 2026-06-19) bundling "Reminder Options" + Group 1 was device-tested. Patrick reported a **partial** set of findings — several pieces are still untested, so the docs commit (this update) records what's confirmed and leaves the rest pending. Code stays committed; this is a docs-only logging pass.

**Confirmed working (device-validated 2026-06-22):**

- **The seven "Reminders before" buttons toggle/light correctly** (Reminder Options, `app/todo.tsx`).
- **The banner OK button clears the alert without deleting the event** (`app/_layout.tsx` `action === 'ok'` no-op).
- (Implicit) a **"Day" reminder fired and produced a banner** with Done/OK actions — so that preset schedules + displays. Its *timing accuracy* (~5 PM, 1 day before) is NOT yet confirmed.
- **Morning of, 1 hour, and 2 hours reminders fire (device-validated 2026-06-23, session #12).** The two offset presets (1hr/2hr before the appointment time) and "Morning of" (morning clock time on the appointment day) all produced alerts.

**Bug found (device-observed 2026-06-22) — My Day medication logs on the wrong day after midnight. RAISED PRIORITY.** Patrick's medication is a **My Day daily routine item** (when he said "recurring Day tasks" he meant My Day daily, NOT the To-Do "Day" reminder preset). He takes it before bed, sometimes after midnight, and marks it done via the **banner Done on the notification popup**. **Verified in code:** banner Done (`_layout.tsx` ~122–137, `source !== 'todo'`) writes NO `my_history` entry and only sets `completed:true`, which the next-day reset (`myday.tsx` ~119) then clears → no durable record of the dose. (The on-screen Log does write history, but dates it from `new Date()` at tap-time — `myday.tsx` ~204 — still wrong after midnight.) **Open before fixing:** the desired late-night rule, and whether banner Done should write a dated history entry. A *separate* verified To-Do "Done" date bug also exists (not where meds live). Both parked under Bugs/correctness; see `parked-items.md`. **UPDATE (session #10, 2026-06-23): the My Day med bug is now FIXED in code — see "THIS SESSION" at the top. The To-Do "Done" date bug remains parked, unfixed.**

**Enhancement requested (2026-06-22) — sort the To-Do list by time, soonest/"closest" on top.** New behavior, not part of this build's scope. Parked under UI polish.

**Still UNTESTED (leave marked device-test-pending, do NOT mark validated):** "Day/Week/Month" firing ~5 PM at 1/7/30 days before (timing); the **"At time"** offset firing exactly at the appointment time; Settings Morning/Evening time changes taking effect; **Monthly** recurring firing each month; **Yearly** recurring firing on the right month+day (**Expo's 0-based month is the risky spot — still needs a real check**). (**Validated 2026-06-23, session #12:** "Morning of", "1 hour", "2 hours" all fire.)

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
- **Notification action handling lives in `app/_layout.tsx`.** Categories `mydaysnooze` + `petssnooze` + **`todosnooze`** each have **Done + Snooze 15/30/60**; `todosnooze` additionally has an **OK** action (`opensAppToForeground:false`) that the handler treats as a no-op (`if (action === 'ok') return;`, placed before the snooze/done branches) — it just clears that one fired alert. The response effect (on `useLastNotificationResponse`) handles `snooze15/30/60`, `done`, `ok`, and a plain tap (route by `source`). **Snooze** branches: `todo` → re-tagged `todo`/`todosnooze` one-off; pets → `petssnooze`; else `mydaysnooze`. **Done** branches: `todo` → log to `todo_log`, then if `recurring !== 'none'` leave schedule+task (repeats on its own) else remove from `todo_tasks` + cancel all alerts matching `taskId`; pets/myday → mark `completed:true` in `pets_feeds`/`my_routine` by `itemId`, **write a dated history entry** to `pets_history`/`my_history` (session #10 — date+time from `response.notification.date`×1000, since iOS reports it in SECONDS; same entry shape + 50-cap as each screen's Log), + cancel the fired notif. All run via the foreground effect, so action taps bring the app forward. On-page Snooze in `myday.tsx`/`mollie.tsx` reuses the same TIME_INTERVAL + tagging scheme.
- iOS caps an app at **64 pending scheduled local notifications** (a DAILY/repeating trigger counts as ONE). Keep this in mind if Pets Day notifications get added.

## Tooling notes

- **Don't type into Simulator text fields with the assistant's tools** — triggers iOS accent popups and mangles input. Have Patrick type directly.
- **Assistant swipe/tap gestures on the Simulator are unreliable.** Patrick does direct manipulation/typing on the device; Claude reasons/guides, reads code, does menu-level actions.

## Active next step (the named goal for next session)

**MY WEEK IS BUILT (session #12) — code-complete, `tsc` clean, Simulator-validated through the banner buttons.** Full per-stage detail is in the **"▶ MY WEEK — AGREED SPEC"** block near the top. **Patrick is committing + building + submitting + loading a TestFlight build at the end of session #12, and will report the phone results next session.** So the FIRST thing next session: **ask how the My Week phone test went** (checklist in in-flight item #0 below), mark each piece validated or log a bug. Then Patrick names the next goal (likely a parked item — see list below).

**In flight, awaiting a device test:**

0. **MY WEEK (session #12) — CODE-COMPLETE, `tsc` clean, SIMULATOR-validated through 3b (incl. the banner firing + its buttons in the sim); needs ONE phone build for final confirmation of live firing + banner Done/+1 Day on a real device.** Phone tests: (a) a chore fires on its day/time and returns next week; (b) banner **Done** logs it to My Week's Log and the ✓ clears when its day comes around again; (c) banner **+1 Day** pushes the reminder to tomorrow and the tile shows "moved to <day>" next open; (d) tile Postpone (Tomorrow / pick-a-day) fires on the chosen day. (Weekday mapping `day+1` matches the working To-Do weekly code.)
1. **Session #11 sort (To-Do soonest-first) — DEVICE-VALIDATED 2026-06-23 (session #12).** List shows soonest on top, with time. Done — no longer pending.
2. **Session #10 fix (My Day + Pets after-midnight banner Done) — code committed, STILL awaiting device test.** Patrick can't test it quickly (needs a real after-midnight run). See "LAST SESSION — #10" for the test steps. Mark validated (or log the bug) once he reports the phone result.
3. **The 2026-06-19 build's PARTIAL test is still ongoing.** Confirmed: 7 reminder buttons toggle/light; banner OK clears without deleting; **Morning-of / 1hr / 2hr fire (session #12)**. Still untested: At-time offset, Day/Week/Month timing, Settings time changes, and Monthly + Yearly recurring firing (Yearly month especially). See "TEST RESULTS" up top.

**Still parked:** To-Do "Done" stamps today's date on stale banners (Bugs/correctness — separate from the now-fixed My Day bug). (The "sort To-Do by soonest" item is now BUILT — session #11 — so it's no longer parked.)

**Likely next goals (let Patrick name one):**

- **Fix the separate To-Do "Done" wrong-date bug** — carry the reminder's intended date in the notification `data` (or stamp `completedDate` from it) instead of `new Date()` at tap-time. (`app/_layout.tsx`.)
- **Sort the To-Do list by closest due time on top** (`app/todo.tsx`).

- **Group 2 — To-Do convenience:** add an on-tile Snooze button to To-Do (My Day + Pets Day have one; To-Do only has the banner Snooze).
- **3-month / 6-month recurring** (the parked half of Group 1): needs a design decision (reschedule-on-fire vs pre-scheduling the next few one-shots, within the iOS 64-notification cap) AND a new anchor-date picker in the form. Heavier; its own session.
- **Group 3 — housekeeping:** confirm/fix the Timer-cancel bug (cancelled timer's alert may still fire — never device-confirmed); clear the orphaned `pets_data` storage key.
- **Group 4 — smarter reminder taps:** land on the exact item, not just the screen (touches the shared tap-routing in `_layout.tsx` — test taps from all screens together).
- **Group 5 — Project Planner reminders:** wire up its dormant reminder fields to actually schedule alerts.
- Small parked spin-off: the Yearly day picker offers 1–31 for every month (Feb 30 would throw at schedule time) — tighten it.
- **Parked, not planned:** per-appointment reminder time override. **Resolved/dropped:** "where do daily-repeating reminders live" (decided — My Day is the daily engine, To-Do dropped Daily).

## Files touched this session (#12 — 2026-06-23)

- `app/myweek.tsx` — **NEW.** The whole My Week feature: weekly-chore list mirroring My Day (`week_routine` / `week_history`); `Chore` model `{ id, label, day 0=Sun…6=Sat, hour, minute, completed, doneAt?, postponedTo? }`; Add/Edit modal with Sun–Sat day picker + time picker; **base WEEKLY reminder** per chore (`scheduleAllNotifications`, weekday `day+1`, `source:'myweek'`, category `myweekactions`); **weekly reset** (`lastOccurrence` + `applyWeeklyReset`); **tile Postpone** (`schedulePostpone`/`postponeTomorrow`/`postponeToDay`/`cancelPostpone`/`nextDateForWeekday`, one-off `DATE` reminder `source:'myweekpostpone'`, `postponedTo` → "▶ moved to <day>"). No Coffee/Water counters.
- `app/_layout.tsx` — registered `myweekactions` category (Done + +1 Day); added handlers: **postpone1** (push reminder to tomorrow at chore time, rewrite `postponedTo`), **done** for `myweek`/`myweekpostpone` (mark complete + log to `week_history` from fired time + clear pending postpone; deliberately does NOT cancel the WEEKLY identifier); tap-routing `myweek`/`myweekpostpone` → `/myweek`.
- `app/home.tsx` — "My Week" 🗓️ tile + `/myweek` route.
- `docs/handoff.md` + `docs/parked-items.md` — refreshed at session close (this version); parked one minor item (My Week in-app Done dates from tap-time, like My Day). **`tsc` clean throughout. Patrick commits the code (then builds/submits/loads); docs commit can follow the phone test.**

## Files touched in session #11 (#11 — 2026-06-23)

- `app/todo.tsx` — `getSortedTasks` reduced to one fixed sort by due date + time (soonest on top; undated/recurring at the bottom); removed the sort-button UI block, the `sortBy` state, and the `sortRow`/`sortLabel`/`sortBtn*` styles. Category filter row untouched. **`tsc` clean — DEVICE-VALIDATED session #12.**
- `docs/handoff.md` — recorded the sort change. **Patrick commits.**

## Files touched in session #10 (#10 — 2026-06-23)

- `app/_layout.tsx` — `action === 'done'` non-To-Do branch now writes a dated history entry (`my_history` for My Day, `pets_history` for Pets) stamped from `response.notification.date`×1000, in addition to marking the item complete + cancelling the notif. Fixes the after-midnight med bug; mirrors it to Pets per Patrick. **`tsc` clean. Awaiting commit + device test.**
- `docs/handoff.md` + `docs/parked-items.md` — refreshed at session close (this version). **Patrick commits.**

## Files touched in session #9 (#9 — 2026-06-22, docs only)

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
3. **ASK ME HOW THE MY WEEK PHONE TEST WENT FIRST**, then mark each piece validated (or log a bug). **My Week is the big thing from session #12** — fully built, `tsc` clean, Simulator-validated through the banner; I built/submitted/loaded a TestFlight build at the end of #12. Phone checklist: (a) a chore fires on its day/time and returns next week; (b) banner **Done** logs it to My Week's Log and the ✓ clears when its day comes around again; (c) banner **+1 Day** pushes to tomorrow and the tile shows "moved to <day>"; (d) tile **Postpone** (Tomorrow / pick-a-day) fires on the chosen day. Other still-pending device tests:
   - **Session #11 To-Do soonest-first sort — already DEVICE-VALIDATED #12** (soonest on top, with time). Done; don't re-test.
   - **Session #10 My Day + Pets after-midnight banner-Done fix** — code committed; STILL needs a real after-midnight run. Test: mark a My Day item Done from the banner after midnight → My Day log shows it under the prior day; same for a Pets feed.
   - **The 2026-06-19 build** (Reminder Options + Group 1): validated so far — 7 reminder buttons, banner OK, and Morning-of/1hr/2hr firing. Still untested: At-time offset, Day/Week/Month timing, Settings time changes, Monthly/Yearly firing (Yearly month especially). 3-month/6-month recurring stays parked. Everything before these is committed + device-validated; don't re-open finished work.
4. **After the My Week phone results, I'll name the next goal** — likely a parked item: the To-Do "Done" wrong-date bug, Group 2 on-tile To-Do Snooze, the parked 3/6-month recurring, or housekeeping. Scope it with me before building, then wait for my "go" — one change at a time.
5. **Build economy:** I want to minimize EAS builds. Batch related edits across a session, I commit, then ONE build tests them together. Docs get their own commit AFTER the phone test (see "Build-and-test commit rhythm" in `session-start.md`).
