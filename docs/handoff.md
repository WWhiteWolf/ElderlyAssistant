# Hand-off note — paste at the start of the next session

## Standing rules (always apply)

- **Patrick does all git commits.** Claude must never run `git commit` or any git write command on this project — possible lockout problems if Claude does it. Claude edits files and leaves them for Patrick to commit.
- **No "boxed" multiple-choice questions.** No button/option-card questions. Ask open questions in plain prose and let Patrick answer freely.

## Project

Remember When (elderlyassistant) — Expo / React Native app in `Projects/elderlyassistant`. Runs on Patrick's iPhone via TestFlight. No over-the-air updates, so changes only reach the phone through a new TestFlight build. Published to a private GitHub repo.

## Last session — what we did (2026-06-14)

Goal: when a reminder notification fired, Patrick couldn't tell what it was for or where it came from.

1. **Diagnosed the banner text problem first — it was a phone setting, not code.** The banner only said "Remember When Notification". The app's code sets real titles/bodies; iOS was hiding them. Fix was on the phone: Settings → Notifications → Remember When → Show Previews → Always. Confirmed working. No code change.

2. **Then fixed notification tap routing (code).** Before, tapping any notification always landed on Home (`index.tsx` redirects to Home; only Timer had a tap listener, and only for its Snooze/Dismiss buttons). Changes:
   - `app/todo.tsx` — added `source: 'todo'` to the task-reminder notification and the daily "Background Tasks" notification.
   - `app/myday.tsx` — added `source: 'myday'` to the "Daily Routine" notification and the three "Snooze Over" notifications.
   - `app/_layout.tsx` — added a tap handler (`Notifications.useLastNotificationResponse`) that reads `data.source` and opens `/todo` or `/myday`. Uses `router.push` so Home stays underneath and Back works. Handles both warm taps and cold launch.
   - **Timer was deliberately left unchanged** (it already has its own tap handler). Per Patrick's choice, only To-Do and My Day were wired.

Type check: the three changed files compile clean. (Pre-existing unrelated TS error remains in `settings.tsx` line 165 — a `pin` parameter typed `any`. Not touched.)

## Status / pending

- Notification routing change is **edited in the project folder, NOT yet committed** (Patrick commits). 
- Still **not built to TestFlight**, so not on the phone yet. Also still waiting to build: the launch-password removal from the prior session (`index.tsx` opens straight to Home, no PIN). Plan is to batch and build once.

## Known caveats / possible next pieces

- The "Background Tasks" and "Snooze Over" notifications carry no item id, so they open the To-Do / My Day screen but don't highlight a specific row. Per-task and per-routine reminders route correctly.
- Cross-screen conflict still present: `myday.tsx` calls `cancelAllScheduledNotificationsAsync()` in several places, which wipes To-Do reminders and running Timers. Not yet addressed.
- Possible Timer bug noted but not confirmed/fixed: `cancelTimer` cancels using `timer.id` (a `Date.now()` string), but the scheduled notification's real identifier is the value returned by `scheduleNotificationAsync` — so cancelling the main timer notification may silently fail.
- `planner.tsx` (the "Project Planner" tile) has full reminder UI/fields (`hasReminder`, `reminderDate`, `reminderTime`) but schedules no notifications at all. A future feature, not a current priority.
