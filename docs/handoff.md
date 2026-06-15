# Hand-off note — paste at the start of the next session

## FIRST THING TO ASK PATRICK

The **notification work is fully settled.** The `updateTask` Edit-path fix and the **notification-sound fix** (`sound: 'default'` in `todo.tsx` and `myday.tsx`) are both **committed AND device-validated** (2026-06-15 session). There is no open notification thread to confirm. The new goal Patrick named for next session: the **My Day & Pets Day restructure** (see Active next step) — confirm he wants to start there.

**Device validation done 2026-06-15 (don't re-test unless something changes):** sound fired on My Day, on To-Do via both the Add path and the Edit path, with the phone **locked** (Watch off) producing **sound + banner**, and tapping the banner routed to the correct screen and landed on the pending tile. Caveat: tap-routing is **screen-level** in code (routes by `data.source`, not item id) — it landed on the right tile here partly because it was the only pending tile, so item-level targeting is NOT proven from this single-tile case.

## To the next session: what I need to be fresh and synced (read this first)

I start each session blank. I do NOT automatically open any file in this repo, and folder access does not carry over. One thing must happen before I can help:

- **Connect the folder in Cowork.** Patrick selects/connects the `elderlyassistant` (or parent `Projects`) folder in Cowork's folder picker — a UI action. **If I ever say the folders look empty or ask Patrick to "upload the file," that's the missing step — ask Patrick to connect it; don't ask him to upload files.**

Once connected, I read the app's code and the tracking docs straight from the folder. Patrick tells me **the one goal**, I say how heavy it looks, and I wait for his "go" before changing anything. At session end I write a fresh version of this note.

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

**Fix (COMMITTED + DEVICE-VALIDATED):** added `sound: 'default'` to the notification *content* in three spots —
- `app/todo.tsx` `scheduleReminders` (To-Do dated reminders).
- `app/todo.tsx` `scheduleBackgroundReminder` (daily 8am "background tasks" reminder).
- `app/myday.tsx` `scheduleAllNotifications` (My Day routine alerts).

Type-check clean except the known pre-existing `settings.tsx:165` error.

**Device validation (done 2026-06-15):** three staggered reminders (My Day → To-Do → My Day, a minute apart) all fired with sound; a locked-phone test (Watch off) fired with **sound + banner** and tapping it routed to the correct screen/pending tile. Diagnostic learned along the way: a To-Do that won't fire is almost always a **stale due date** (e.g. set to yesterday) or **no reminder chip attached** — `scheduleReminders` bails on zero reminders and the future-guard drops past dates. Not a code bug. The Apple Watch remains a real-world factor for everyday locked-phone use (it pulls the alert to the wrist).

**Stale-fact note (still true, carried forward):** `scheduleReminders` ignores the `recurring` field — it ALWAYS builds a one-shot DATE trigger from `dueDate`+`dueTime`. A To-Do "daily" task fires ONCE on its date and does not truly repeat (on completion it reschedules to a now-past date → dropped by the future-guard). To-Do's `recurring` (daily/weekly/monthly/yearly) drives **only the Week-view display**, never notifications. (Tracked for a design decision in `parked-items.md`.)

## Verified code facts (don't re-derive)

- **To-Do schedules a reminder ONLY if:** `taskType !== 'background'` AND `dueDate` set AND `reminders.length > 0` AND fire time is still in the future (`scheduleReminders`, `todo.tsx:346`). Due date + time alone schedule nothing — there must be a reminder entry.
- To-Do reminder entry is one-tap presets (`REMINDER_PRESETS`); "At time" is amount 0 → fires at the due time. **Add-path To-Do DATE delivery CONFIRMED on device this session.**
- **`updateTask` cancels + reschedules** (cancel + reschedule, mirroring the Add path). **COMMITTED.** `deleteTask` still does NOT cancel — a deleted task can still fire (UNFIXED, parked).
- **Notification sound:** content needs an explicit `sound` field; the handler's `shouldPlaySound: true` alone is not enough. `sound: 'default'` set in `todo.tsx` (`scheduleReminders`, `scheduleBackgroundReminder`) and `myday.tsx` (`scheduleAllNotifications`); Timer already used `sound: true`. **COMMITTED and DEVICE-VALIDATED 2026-06-15** (My Day, To-Do Add + Edit, locked-phone sound + banner, screen-level tap-routing).
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

- **My Day & Pets Day restructure** — the next live goal (Patrick named it; not yet scoped). Related parked item: merge My Day's Meals + Meds into one card-styled list (tiles like the To-Do cards), with cautions on naming (avoid "Tasks"), the `my_schedule` + `my_meds` storage-key migration, and the food-specific log wording. Pets Day = `mollie.tsx` (no notification code today). Read the relevant code and scope it WITH Patrick before any edits — nothing decided yet.

Everything else — `deleteTask` not cancelling, the Timer cancel bug, the To-Do recurring/daily design decision, the merge-Medication redesign, To-Do due-time display, My Day time formatting, tap-routing, the `settings.tsx:165` TS error, the dormant Planner — now lives in **`docs/parked-items.md`** (the eventual-work backlog). Pull from there when one becomes the live goal.

## Files touched (sound fix — committed earlier 2026-06-15)

- `app/todo.tsx` — `sound: 'default'` in `scheduleReminders` and `scheduleBackgroundReminder`. **COMMITTED + device-validated.**
- `app/myday.tsx` — `sound: 'default'` in `scheduleAllNotifications`. **COMMITTED + device-validated.**

## This session (2026-06-15, later — device validation only)

- No app code changed. Verified the sound fix and edit path on device (see above) and refreshed `docs/handoff.md`. Nothing to commit except this doc.

---

## ▶ PASTE THIS AT THE START OF THE NEXT SESSION

You're picking up the "Remember When" app (Expo / React Native, runs on my iPhone via TestFlight).

1. The `elderlyassistant` folder must be connected via Cowork's folder picker — if you can't see it, give me the folder-request button; don't ask me to upload files.
2. Open and read `docs/handoff.md` first (full state, standing rules, next step), then skim `docs/parked-items.md` (the eventual-work backlog) so you know what's deferred.
3. The notification work is DONE and device-validated — don't re-open it. Today's goal is the **My Day & Pets Day restructure** (see Active next step). Read `app/myday.tsx` and `app/mollie.tsx` before proposing anything.

Then tell me how heavy the goal looks and wait for my "go." I'll give you the specifics — nothing is scoped yet.
