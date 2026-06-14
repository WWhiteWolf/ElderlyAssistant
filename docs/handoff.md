# Hand-off note — paste at the start of the next session

## Standing rules (always apply)

- **Patrick does all git commits.** Claude must never run `git commit` or any git write command on this project — possible lockout problems if Claude does it. Claude edits files and leaves them for Patrick to commit.
- **No "boxed" multiple-choice questions.** No button/option-card questions. Ask open questions in plain prose and let Patrick answer freely.
- **Verify before asserting.** Read the actual code before describing how anything behaves. When unsure, say so and offer to look.
- **One change at a time.** Discuss before building; make one edit, stop, let Patrick review/commit before the next.

## Project

Remember When (elderlyassistant) — Expo / React Native app in `Projects/elderlyassistant`. Runs on Patrick's iPhone via TestFlight. No over-the-air updates, so changes only reach the phone through a new TestFlight build. Private GitHub repo. iOS bundle id `com.molliedog.ElderlyAssistant`. New Architecture + React Compiler are enabled.

**Purpose / direction (from Patrick).** Patrick is 72, retired; built this app because nothing else did what he needed for memory support. The **heart of the app is the To-Do list with its flexible reminder scheme** — the reminders are what his memory leans on, so they have to be rock-solid. **My Day** handles the daily routine (meals, meds, etc.) — things that are nearly identical day to day and blur together ("did I do that today or yesterday?"); it resets each item at a new date and logs what's done with a timestamp/history. Screens Patrick wants to rely on day to day: **Shopping List, My Day, To-Do, Pets Day** (Pets Day = `mollie.tsx`). Note: Shopping List (`shopping.tsx`) and Pets Day (`mollie.tsx`) have NO notification code at all, so the notification bugs below can't affect them.

## Build / release workflow (lessons learned 2026-06-14)

- Path to phone: `eas build --platform ios --profile production` → wait for "Build finished" → `eas submit --platform ios --profile production` → pick the build → Apple processes (5–15 min, email when ready) → update **Remember When** in the TestFlight app.
- **Commit FIRST, then build.** EAS captures the git state when the build is *triggered*. If you build while a commit is still in flight, it grabs the OLD file. (This bit us once: a build showed the wrong commit because it started before the commit landed.)
- **At submit, verify the Commit line** matches the message you just committed before pressing Return.
- The "Set up Push Notifications?" prompt during build → always **No**. The app uses only LOCAL notifications (no remote push / APNs), so No is correct.
- **Local testing this session:** dev build into the iOS Simulator via `npm run ios` (iPhone 17, iOS 26.5). Metro picks up file edits, so the My Day fix below was in the running app.

## Last session — what we did (2026-06-14, continued)

Goal was to capture two open items so they don't get lost; grew into making the fix for one of them and trying (unsuccessfully) to validate it live.

1. **Made the My Day "cancel all" fix (code done, UNCOMMITTED, UNVALIDATED).** In `app/myday.tsx`, `scheduleAllNotifications` used to call `cancelAllScheduledNotificationsAsync()` first — which wiped To-Do AND Timer reminders every time My Day scheduled (and My Day schedules on every screen load). Changed it to fetch `getAllScheduledNotificationsAsync()` and cancel only notifications whose `data.source === 'myday'`, then reschedule My Day's meals/meds as before. This leaves To-Do (`source: 'todo'`) and Timer untouched, and mirrors the per-item pattern To-Do already uses in its `cancelReminders`. **Edit is saved in `myday.tsx`; Patrick still needs to review and commit it.**
   - **Deliberately NOT touched:** the three Snooze buttons in My Day (~lines 211/223/235) STILL call `cancelAllScheduledNotificationsAsync()`. So snoozing in My Day still wipes To-Do/Timer. Left as a separate next step (one change at a time).

2. **Tried to validate in the Simulator — INCONCLUSIVE.** Set up To-Do task "Make coffee" with Due Date 06/14/26, a due time a few minutes out, and a "1 minute before" reminder. Two runs: scheduled the To-Do reminder → opened My Day (to trigger the reschedule) → waited. The To-Do reminder never visibly fired. Run 1 the app was in the foreground (foreground banners don't persist, so that run proves nothing). Run 2 the device was locked/backgrounded and still nothing appeared on the lock screen.
   - **Gap in the test:** in BOTH runs we opened My Day *before* fire time, so we never confirmed a To-Do reminder fires on its OWN. We therefore cannot yet tell "My Day cancels it" apart from "To-Do reminders aren't firing in this sim at all."
   - **We never saw ANY app notification fire all session** — only system ones (e.g. "Ready for Apple Intelligence"). When we went to check notification permission, Patrick reported he couldn't find a Notifications entry in Settings. So **notification permission / delivery for the app is unverified** and is the prime suspect.

### Verified code facts (don't re-derive)

- To-Do schedules a reminder ONLY if: `taskType !== 'background'` AND `dueDate` set AND `reminders.length > 0` AND fire time is still in the future (`todo.tsx` ~line 344). **"Recurring: Daily" does NOT schedule a notification** — it only affects the Week view.
- My Day's `scheduleAllNotifications` runs on screen load (in `loadData`), and on every meal/med save — not just on edits.
- Tap-routing (`_layout.tsx`) reads `data.source` and `router.push('/todo' | '/myday')` — it routes to the SCREEN only, ignores any item id, and is still UNTESTED with a real tap.

### Tooling notes (save pain next time)

- **Don't type into Simulator text fields with the assistant's tools** — it triggers iOS press-and-hold accent popups and mangles input. Have Patrick type directly (native keyboard works fine).
- **Assistant swipe/tap gestures on the Simulator are unreliable** (Spotlight search, home-screen gestures didn't register). Patrick driving the device directly is more reliable. Good division of labor: Patrick does direct manipulation/typing, Claude reasons/guides and does menu-level actions.

### Apple notification limit (for future design — not the cause here)

`expo-notifications` wraps iOS `UNUserNotificationCenter`. iOS caps an app at **64 pending scheduled local notifications**; beyond that, it keeps the soonest-firing 64 and **silently drops the rest** (a repeating/DAILY trigger counts as ONE). We were nowhere near 64, so this did NOT cause the test failure — but when moving My Day (and later Snooze) off "cancel all" to per-item, keep pending counts from piling up, because over-limit drops fail silently.

## Open items / next candidates

1. **My Day "cancel all" fix — DONE in code (uncommitted), UNVALIDATED.** Validate next session in this order: (a) **confirm notifications work at all** — check notification permission for the app, and read how/where `requestPermissionsAsync` is called; (b) **control test** — schedule a To-Do reminder a couple minutes out, do NOT open My Day, lock/background the app, confirm it fires on the lock screen (proves scheduling + delivery); (c) **then re-test the fix** — schedule a To-Do reminder, open My Day, lock, confirm the To-Do reminder still fires.
2. **My Day Snooze buttons still call `cancelAllScheduledNotificationsAsync()`** (~lines 211/223/235) — apply the same per-source cancel as its own change.
3. **Tap-routing untested AND screen-only.** `_layout.tsx` opens the right screen on tap but never lands on the specific item; never confirmed with a real tap. To-Do reminders already carry `taskId`, so landing on the task is feasible; My Day reminders and To-Do's "Background Tasks" reminder carry no item id yet.
4. **Possible Timer cancel bug (unconfirmed).** `cancelTimer` cancels using `timer.id` (a `Date.now()` string), not the id returned by `scheduleNotificationAsync` — cancelling the main timer notification may silently fail.
5. **Pre-existing TS error:** `app/settings.tsx` line 165 — `pin` parameter implicitly `any`. Untouched.
6. **Project Planner** (`app/planner.tsx`) has reminder UI/fields but schedules no notifications. Dormant, low priority.

## Files touched this session

`app/myday.tsx` (`scheduleAllNotifications` → cancel only `source: 'myday'`, was uncommitted at session end), `docs/handoff.md` (this note). The myday.tsx change is **not yet committed** — Patrick to review and commit.
