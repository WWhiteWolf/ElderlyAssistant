# Hand-off note — paste at the start of the next session

## FIRST THING TO ASK PATRICK

The snooze-rework commit (`_layout.tsx` + `myday.tsx`) was **CONFIRMED landed** by Patrick on 2026-06-14, so that's settled. Next thing to confirm at the start of the new session: whether the **`updateTask` Edit-path fix** (below, in `todo.tsx`) has been committed and built yet, since the device validation for it depends on a new build.

## To the next session: what I need to be fresh and synced (read this first)

I start each session blank. I do NOT automatically open any file in this repo, and folder access does not carry over. Two things must happen before I can help:

1. **Connect the folder in Cowork.** Patrick selects/connects the `elderlyassistant` (or parent `Projects`) folder in Cowork's folder picker — a UI action. **If I ever say the folders look empty or ask Patrick to "upload the file," that's the missing step — ask Patrick to connect it; don't ask him to upload files.**
2. **Paste this whole hand-off note.** It's the only way I get the context below.

Once connected, I read the app's code straight from the folder. Patrick tells me **the one goal**, I say how heavy it looks, and I wait for his "go" before changing anything. At session end I write a fresh version of this note.

## Standing rules (always apply)

- **Patrick does all git commits.** Claude must never run `git commit` or any git write command — possible lockout. Claude edits files and leaves them for Patrick to commit.
- **No "boxed" multiple-choice questions.** Ask open questions in plain prose; let Patrick answer freely.
- **Verify before asserting.** Read the actual code before describing behavior. When unsure, say so and offer to look.
- **One change at a time.** Discuss before building; make one edit, stop, let Patrick review/commit before the next.

## Project

Remember When (elderlyassistant) — Expo / React Native app in `Projects/elderlyassistant`. Runs on Patrick's iPhone via TestFlight. No OTA updates — changes reach the phone only through a new TestFlight build. Private GitHub repo. iOS bundle id `com.molliedog.ElderlyAssistant`. New Architecture + React Compiler enabled.

**Purpose / direction (from Patrick).** Patrick is 72, retired; built this app for memory support. The **heart of the app is the To-Do list with its flexible reminder scheme** — the reminders are what his memory leans on, so they must be rock-solid. **My Day** handles the daily routine (meals, meds, etc.) — things nearly identical day to day that blur together ("did I do that today or yesterday?"); it resets each item at a new date and logs what's done with a timestamp/history. Day-to-day screens: **Shopping List, My Day, To-Do, Pets Day** (Pets Day = `mollie.tsx`). Shopping List (`shopping.tsx`) and Pets Day (`mollie.tsx`) have NO notification code.

## Build / release workflow

- Path to phone: `eas build --platform ios --profile production` → "Build finished" → `eas submit --platform ios --profile production` → pick build → Apple processes (5–15 min, email when ready) → update **Remember When** in TestFlight.
- **Commit FIRST, then build.** EAS captures git state when the build is *triggered*; building mid-commit grabs the OLD file.
- **At submit, verify the Commit line** matches what you just committed before pressing Return.
- "Set up Push Notifications?" during build → always **No** (app uses only LOCAL notifications, no remote push/APNs).
- Local testing: dev build into iOS Simulator via `npm run ios`. Metro picks up edits live.

## Latest session — 2026-06-14 (diagnose the missed 9:15 reminder + Edit-path fix)

Patrick reported: three reminders set — 9:14 My Day, 9:15 To-Do, 9:16 To-Do. 9:14 and 9:16 fired; **9:15 did not**. We diagnosed on the real device.

**What we confirmed (on device):**
- **To-Do "At time" delivery is RELIABLE via the Add path.** Controlled test: three To-Do tasks ("Test 1/2/3"), one minute apart, each with an "At time" preset, created via **Add (New Task)**, left untouched, phone locked. **All three fired.** So the old "To-Do reminders don't fire" / "delivery unverified" worry is resolved for To-Do DATE triggers too (My Day DAILY was already confirmed).
- **The Edit path scheduled NOTHING.** Re-running the same test but creating the tasks via **Edit** (not Add): **none fired.** This matches the code — `updateTask` never called `scheduleReminders`/`cancelReminders`. **This is almost certainly what caused the original 9:15 miss:** that task was set or adjusted via Edit, so its reminder was never scheduled (silently), while 9:16 was a fresh Add and fired.
- **No notification sound.** All banners arrived silent. Verified cause: neither To-Do (`todo.tsx` ~361) nor My Day (`myday.tsx:147`) sets a `sound` field on the notification *content*. The handler's `shouldPlaySound: true` only governs *foreground* presentation; a locked/background delivery plays sound only if `content.sound` is set. **PENDING:** confirm Patrick's ringer/Focus state during the test. If the ringer was on, the fix is to add `sound: 'default'` to the content in both To-Do and My Day.

**Fix made this session (UNCOMMITTED, needs device validation):**
- **`app/todo.tsx` `updateTask` now manages notifications.** It builds the updated task, then `await cancelReminders(editTask.id)` then `await scheduleReminders(updatedTask)` — mirroring the Add path so editing a due time/reminder actually takes effect (and replaces any stale scheduled reminder). Made the function `async`. Type-check clean except the known `settings.tsx:165` error.
- **Validate on device:** edit an existing task's due time (or add/change a reminder), save from **Edit**, lock the phone, confirm it fires at the new time.

**Correction to a stale fact:** the old note "Recurring: Daily does NOT schedule a notification" is **wrong** for the current code. `scheduleReminders` ignores the `recurring` field entirely — it ALWAYS builds a one-shot DATE trigger from `dueDate`+`dueTime`. Consequence: a To-Do "daily" task fires ONCE on its date and does not truly repeat (on completion it reschedules to the same now-past date → dropped by the future-guard). To-Do's `recurring` (daily/weekly/monthly/yearly) currently drives **only the Week-view display**, never notifications.

## Verified code facts (don't re-derive)

- **To-Do schedules a reminder ONLY if:** `taskType !== 'background'` AND `dueDate` set AND `reminders.length > 0` AND fire time is still in the future (`scheduleReminders`, `todo.tsx:346`). Due date + time alone schedule nothing — there must be a reminder entry.
- To-Do reminder entry is one-tap presets (`REMINDER_PRESETS`); "At time" is amount 0 → fires at the due time. **Add-path To-Do DATE delivery CONFIRMED on device this session.**
- **`updateTask` NOW cancels + reschedules** (this session's fix, uncommitted). Previously it did neither. **`deleteTask` still does NOT cancel** — a deleted task can still fire (UNFIXED).
- To-Do uses a one-shot **DATE** trigger; My Day and the To-Do "Background Tasks" reminder use a repeating **DAILY** trigger (`hour`/`minute`, no date).
- My Day's `scheduleAllNotifications` (`myday.tsx:127`) runs on screen load and on every meal/med save; it cancels only `data.source === 'myday'` (committed fix) and reschedules from storage, so To-Do/Timer are untouched.
- My Day Meals and Meds are the **same `ScheduleItem` type** (`id/label/hour/minute/completed`) and are already scheduled together (`myday.tsx:143`, `allItems = [...meals, ...medsList]`). They differ only by separate state, separate storage keys (`my_schedule` / `my_meds`), separate sections, and an `editingMeds` flag.
- My Day tiles **already show the time** prefixed to the label (`myday.tsx:493` & `:548`), in 24-hour format (helper `format12Hour`, `:165`, is misnamed — it outputs 24h). Sections are **collapsed by default**.
- To-Do tiles show `Due: {dueDate}` only (`todo.tsx:513` & `:552`) — **due TIME is not displayed** (it is stored in `dueTime`).
- Tap-routing (`_layout.tsx`) routes by `data.source` to the SCREEN only (ignores item id); handles `mydaysnooze` → /myday and snooze action buttons. Still UNTESTED with a real tap.

## Tooling notes

- **Don't type into Simulator text fields with the assistant's tools** — triggers iOS accent popups and mangles input. Have Patrick type directly.
- **Assistant swipe/tap gestures on the Simulator are unreliable.** Good division of labor: Patrick does direct manipulation/typing on the device; Claude reasons/guides, reads code, does menu-level actions.

## Apple notification limit (for future design)

iOS caps an app at **64 pending scheduled local notifications**; beyond that it keeps the soonest 64 and silently drops the rest (a repeating/DAILY trigger counts as ONE). We're nowhere near 64, but keep per-item scheduling from piling up.

## Open items / next candidates

1. **VALIDATE the `updateTask` Edit-path fix on device** (uncommitted). Edit a task's due time, save from Edit, lock phone, confirm it fires at the new time.
2. **No notification sound — leading cause is the missing `sound` field.** Ringer was confirmed ON, and the **two major tests were run with the phone UNLOCKED** — so the Apple Watch did NOT cause the test silence (the Watch only intercepts when the phone is locked). Neither To-Do nor My Day sets a `sound` field on notification content; without it iOS has nothing to play (foreground or unlocked). **Fix = add `sound: 'default'` to content in To-Do (`scheduleReminders`) and My Day (`scheduleAllNotifications`), one small edit each.** Separate, real-world caveat: Patrick wears an Apple Watch that "messes up" his audio notifications — in everyday use (phone locked in pocket) iOS routes alerts to the wrist and keeps the phone silent. Relevant to daily use, not to these tests. After the sound fix, to confirm phone audio, test with the phone unlocked first, then locked with the Watch removed.
3. **`deleteTask` doesn't cancel reminders (UNFIXED).** A deleted task's reminder can still fire. Natural companion to the `updateTask` fix.
4. **DESIGN — "daily reminders need different treatment" (Patrick's direction).** My Day is already the daily engine (DAILY trigger, time-only, daily reset + history). Decide: does To-Do drop "Daily" (and what becomes of weekly/monthly/yearly, which also don't schedule notifications, only drive the Week view)? Likely direction: daily-repeating reminders live in My Day; To-Do is for dated one-offs.
5. **DESIGN — merge Medication into one list, rename "Meals."** Technically easy: Meals/Meds are already the same type and scheduled together; merging mostly deletes the duplicate section/state/storage/`editingMeds` branching. **Patrick's UI direction: one single box on My Day with tiles styled like the To-Do task cards** (consistent card look across pages, per his "stay consistent" rule) — instead of the two collapsible Meal/Medication sections. Cautions: (a) avoid the name **"Tasks"** (collides with the To-Do screen) — prefer **"Items"** or **"Routine"**; (b) merging `my_schedule` + `my_meds` needs a one-time data migration or current items vanish; (c) the food-specific log wording ("What did you eat?") needs to become neutral.
6. **To-Do tiles need to show the due TIME.** Currently show `Due: {dueDate}` only at `todo.tsx:513` and `:552`. Add `dueTime` (e.g. "Due: 06/14/26 at 7:58 PM"). Two render spots (Week-ahead view + main list).
7. **My Day tile time display (optional).** Already shown but 24-hour and behind a collapsed section. Possible: AM/PM reformat and/or a separate styled time column (unused `timeText` style at `myday.tsx:860`).
8. **Tap-routing untested AND screen-only.** `_layout.tsx` opens the right screen but never lands on the specific item; never confirmed with a real tap. To-Do reminders carry `taskId` (landing on the task is feasible); My Day + To-Do "Background" reminders carry no item id.
9. **Possible Timer cancel bug (unconfirmed).** `cancelTimer` cancels using `timer.id` (a `Date.now()` string), not the id returned by `scheduleNotificationAsync` — may silently fail.
10. **Pre-existing TS error:** `app/settings.tsx:165` — `pin` parameter implicitly `any`. Untouched.
11. **Project Planner** (`app/planner.tsx`) has reminder UI/fields but schedules no notifications. Dormant, low priority.

## Files touched

- `app/todo.tsx` — `updateTask` now cancels + reschedules notifications (Edit-path fix). **UNCOMMITTED (this session).** Earlier this day: reminder entry reworked to one-tap presets (`REMINDER_PRESETS`, "At time"=0).
- `app/_layout.tsx` — snooze category + snooze-button handling + `mydaysnooze` routing. **COMMITTED (confirmed by Patrick).**
- `app/myday.tsx` — per-source cancel fix; notifications tagged with `categoryIdentifier`/`itemId`/`label`; global Snooze button + `snoozeReminder` removed. **COMMITTED (confirmed by Patrick).**
- `docs/handoff.md` — this note.

---

## ▶ PASTE THIS AT THE START OF THE NEXT SESSION

You're picking up the "Remember When" app (Expo / React Native, runs on my iPhone via TestFlight).

1. The `elderlyassistant` folder must be connected via Cowork's folder picker — if you can't see it, give me the folder-request button; don't ask me to upload files.
2. Open and read `docs/handoff.md` in that folder before proposing anything — it has the full state, standing rules, known bugs, and next steps.
3. First thing, ask me whether the `updateTask` Edit-path fix has been committed/built yet (top box of the handoff).

Then tell me how heavy today's goal looks and wait for my "go." I'll give you the one goal.
