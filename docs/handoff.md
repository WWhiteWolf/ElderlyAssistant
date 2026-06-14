# Hand-off note — paste at the start of the next session

## Standing rules (always apply)

- **Patrick does all git commits.** Claude must never run `git commit` or any git write command on this project — possible lockout problems if Claude does it. Claude edits files and leaves them for Patrick to commit.
- **No "boxed" multiple-choice questions.** No button/option-card questions. Ask open questions in plain prose and let Patrick answer freely.
- **Verify before asserting.** Read the actual code before describing how anything behaves. When unsure, say so and offer to look.

## Project

Remember When (elderlyassistant) — Expo / React Native app in `Projects/elderlyassistant`. Runs on Patrick's iPhone via TestFlight. No over-the-air updates, so changes only reach the phone through a new TestFlight build. Private GitHub repo. iOS bundle id `com.molliedog.ElderlyAssistant`. New Architecture + React Compiler are enabled.

## Build / release workflow (lessons learned 2026-06-14)

- Path to phone: `eas build --platform ios --profile production` → wait for "Build finished" → `eas submit --platform ios --profile production` → pick the build → Apple processes (5–15 min, email when ready) → update **Remember When** in the TestFlight app.
- **Commit FIRST, then build.** EAS captures the git state when the build is *triggered*. If you build while a commit is still in flight, it grabs the OLD file. (This bit us once: a build showed the wrong commit because it started before the commit landed.)
- **At submit, verify the Commit line** matches the message you just committed before pressing Return.
- The "Set up Push Notifications?" prompt during build → always **No**. The app uses only LOCAL notifications (no remote push / APNs), so No is correct.

## Last session — what we did (2026-06-14)

Goal grew over the session. All three items below are shipped to TestFlight and confirmed working on the phone.

1. **Notification banner only said "Remember When Notification."** Not a code bug — it was iOS hiding the preview. Fix was on the phone: Settings → Notifications → Remember When → **Show Previews → Always**. Real notification text now shows.

2. **App crashed on launch (new build).** Root cause: `app/index.tsx` used `router.replace('/home')` inside a `useEffect` — navigating before the Root Layout mounted. (Committed the prior session as the launch-password removal; only surfaced once actually built.) Diagnosed with a dev build (`npx expo run:ios`) which showed the real "Attempted to navigate before mounting the Root Layout" error. Fixed by replacing the file with `<Redirect href="/home" />`. Committed "Open W/O Password fix." (54d6b57), built (efa56960), shipped. Confirmed: opens straight to Home, no password, no crash.

3. **My Day reminders didn't fire.** Two bugs in `app/myday.tsx`:
   - `scheduleAllNotifications` read **stale React state** (`schedule`) instead of the saved list, so set/edited meal times were never scheduled (it only ever tried the default times, a step behind).
   - **Medications were never scheduled at all** (`saveMeds` only wrote storage).
   Fix: `scheduleAllNotifications` now reads `my_schedule` and `my_meds` from AsyncStorage (source of truth) and schedules **both** meals and meds; `saveMeds` now calls `scheduleAllNotifications`. Committed, built (9b695718), shipped. Confirmed on device: a meal reminder fired without leaving the screen.

Also already in the app (committed earlier this session as "Notifications fixed.", ad0978b): `source` tags (`'todo'` / `'myday'`) on notifications, and tap-routing in `app/_layout.tsx` (`useLastNotificationResponse` → opens `/todo` or `/myday`). Timer was deliberately left alone.

## Open items / next candidates

1. **Tap-routing is untested.** The `_layout.tsx` code that opens the right screen when you tap a To-Do or My Day notification is in the build but has NOT been verified with a real notification tap. Confirm it next.
2. **My Day's "cancel all" wipes other reminders.** `scheduleAllNotifications` calls `cancelAllScheduledNotificationsAsync()` before rescheduling, which clears To-Do and Timer scheduled notifications whenever My Day schedules. Recommended next fix (schedule/cancel per-item instead). 
3. **Possible Timer cancel bug (unconfirmed).** `cancelTimer` cancels using `timer.id` (a `Date.now()` string), but the real notification identifier is the value returned by `scheduleNotificationAsync` — so cancelling the main timer notification may silently fail.
4. **"Background Tasks" (To-Do) and "Snooze Over" (My Day)** notifications carry no item id — they open the screen but can't highlight a specific row.
5. **Pre-existing unrelated TS error:** `app/settings.tsx` line 165 — `pin` parameter implicitly `any`. Untouched.
6. **Project Planner** (`app/planner.tsx`) has reminder UI/fields (`hasReminder`, `reminderDate`, `reminderTime`) but schedules no notifications. Dormant feature, not a priority.

## Files touched this session

`app/index.tsx` (Redirect fix), `app/myday.tsx` (source tag + scheduling fix + med scheduling), `app/todo.tsx` (source tags), `app/_layout.tsx` (tap-routing), `docs/session-start.md` + `docs/handoff.md` (standing rules + this note). All committed by Patrick.
