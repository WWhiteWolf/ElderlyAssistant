# Hand-off note — paste at the start of the next session

## FIRST THING TO ASK PATRICK

The **`updateTask` Edit-path fix** is **CONFIRMED committed** by Patrick (2026-06-14 work, committed since), so that's settled. The new thing to confirm at the start of the next session: whether the **notification-sound fix** (this session, 2026-06-15 — `sound: 'default'` added in `todo.tsx` and `myday.tsx`, see below) has been committed and built yet, since hearing the sound on the phone depends on a new TestFlight build.

## To the next session: what I need to be fresh and synced (read this first)

I start each session blank. I do NOT automatically open any file in this repo, and folder access does not carry over. Two things must happen before I can help:

1. **Connect the folder in Cowork.** Patrick selects/connects the `elderlyassistant` (or parent `Projects`) folder in Cowork's folder picker — a UI action. **If I ever say the folders look empty or ask Patrick to "upload the file," that's the missing step — ask Patrick to connect it; don't ask him to upload files.**
2. **Paste this whole hand-off note.** It's the only way I get the context below.

Once connected, I read the app's code straight from the folder. Patrick tells me **the one goal**, I say how heavy it looks, and I wait for his "go" before changing anything. At session end I write a fresh version of this note.

**Two tracking docs, different jobs.** This `handoff.md` keeps us on course session to session — current state, the active goal, decisions, and what just changed. `docs/parked-items.md` is the backlog: things to do *eventually* (bugs, design decisions, UI polish), not the current goal. When a parked item becomes the live goal, move it here; when something is done but more spin-offs remain, park them there. Keep the eventual-work list out of this note so it stays focused.

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

## Latest session — 2026-06-15 (notification-sound fix)

Goal: get reminders to actually play a sound. Verified in code first, then made the fix.

**What we confirmed (in code):** the handler's `shouldPlaySound: true` only *permits* sound — the notification *content* must also name a sound, and neither To-Do nor My Day did. Timer (`timer.tsx`) already sets `sound: true` on its content, which is why that path could make noise and the others couldn't.

**Fix made this session (UNCOMMITTED, needs a new build to hear on the phone):** added `sound: 'default'` to the notification *content* in three spots —
- `app/todo.tsx` `scheduleReminders` (To-Do dated reminders).
- `app/todo.tsx` `scheduleBackgroundReminder` (daily 8am "background tasks" reminder).
- `app/myday.tsx` `scheduleAllNotifications` (My Day routine alerts).

Type-check clean except the known pre-existing `settings.tsx:165` error.

**Validate on device (after commit + build):** test with the phone **UNLOCKED first** so the Apple Watch doesn't pull the alert to the wrist; then, if you want to confirm locked-phone audio, test locked with the Watch removed. The Watch remains a real-world factor for everyday locked-phone use.

**Stale-fact note (still true, carried forward):** `scheduleReminders` ignores the `recurring` field — it ALWAYS builds a one-shot DATE trigger from `dueDate`+`dueTime`. A To-Do "daily" task fires ONCE on its date and does not truly repeat (on completion it reschedules to a now-past date → dropped by the future-guard). To-Do's `recurring` (daily/weekly/monthly/yearly) drives **only the Week-view display**, never notifications. (Tracked for a design decision in `parked-items.md`.)

## Verified code facts (don't re-derive)

- **To-Do schedules a reminder ONLY if:** `taskType !== 'background'` AND `dueDate` set AND `reminders.length > 0` AND fire time is still in the future (`scheduleReminders`, `todo.tsx:346`). Due date + time alone schedule nothing — there must be a reminder entry.
- To-Do reminder entry is one-tap presets (`REMINDER_PRESETS`); "At time" is amount 0 → fires at the due time. **Add-path To-Do DATE delivery CONFIRMED on device this session.**
- **`updateTask` cancels + reschedules** (cancel + reschedule, mirroring the Add path). **COMMITTED.** `deleteTask` still does NOT cancel — a deleted task can still fire (UNFIXED, parked).
- **Notification sound:** content needs an explicit `sound` field; the handler's `shouldPlaySound: true` alone is not enough. `sound: 'default'` now set in `todo.tsx` (`scheduleReminders`, `scheduleBackgroundReminder`) and `myday.tsx` (`scheduleAllNotifications`); Timer already used `sound: true`. **UNCOMMITTED (this session).**
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

## Active next step

- **Commit + build the sound fix, then validate on device** (phone unlocked first). That's the only open thread from this session.

Everything else — `deleteTask` not cancelling, the Timer cancel bug, the To-Do recurring/daily design decision, the merge-Medication redesign, To-Do due-time display, My Day time formatting, tap-routing, the `settings.tsx:165` TS error, the dormant Planner — now lives in **`docs/parked-items.md`** (the eventual-work backlog). Pull from there when one becomes the live goal.

## Files touched (this session — 2026-06-15)

- `app/todo.tsx` — added `sound: 'default'` to content in `scheduleReminders` and `scheduleBackgroundReminder`. **UNCOMMITTED.** (`updateTask` cancel+reschedule from the prior session is COMMITTED.)
- `app/myday.tsx` — added `sound: 'default'` to content in `scheduleAllNotifications`. **UNCOMMITTED.**
- `docs/parked-items.md` — NEW. Eventual-work backlog (bugs / design / UI polish), moved out of this note.
- `docs/handoff.md` — this note, refreshed for the sound-fix session.

---

## ▶ PASTE THIS AT THE START OF THE NEXT SESSION

You're picking up the "Remember When" app (Expo / React Native, runs on my iPhone via TestFlight).

1. The `elderlyassistant` folder must be connected via Cowork's folder picker — if you can't see it, give me the folder-request button; don't ask me to upload files.
2. Open and read `docs/handoff.md` first (full state, standing rules, next step), then skim `docs/parked-items.md` (the eventual-work backlog) so you know what's deferred.
3. First thing, ask me whether the notification-sound fix has been committed/built yet (top box of the handoff).

Then tell me how heavy today's goal looks and wait for my "go." I'll give you the one goal.
