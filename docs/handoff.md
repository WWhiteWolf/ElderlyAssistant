# Hand-off note — paste at the start of the next session

## FIRST THING TO ASK PATRICK (verify the prior commit)

**Confirm the snooze-rework commit actually landed.** At the START of the snooze-rework session (2026-06-14) Patrick said "Committed and rebuilding," then built and ran on the phone (My Day notification fired). Ask Patrick to confirm that commit really went in (e.g. `git log` shows it / TestFlight build matches), since the per-source My Day fix + the notification snooze depend on it. If it did NOT land, those changes aren't in the repo even though they were tested. Recorded here at Patrick's request as a reminder.

## To the next session: what I need to be fresh and synced (read this first)

I start each session blank. I do NOT automatically open `session-start.md` or any file in this repo, and folder access does not carry over from the last session. So two separate things have to happen before I can actually help:

1. **Connect the folder in Cowork.** Patrick must select/connect the `elderlyassistant` (or its parent `Projects`) folder using Cowork's folder picker — this is a UI action, not something a pasted note can do. This is what lets me READ the code. **If I ever say the folders look empty or ask Patrick to "upload the file," that's the missing step — the folder isn't connected yet. Ask Patrick to connect it; don't ask him to upload files.**

2. **Paste this whole hand-off note.** It's the only way I get the context below — the new session won't read it on its own.

Once the folder is connected, I read the app's code straight from it, so Patrick does NOT need to paste any `app/*.tsx` files. After that, Patrick tells me **the one goal** for the session, I say roughly how heavy it looks, and I wait for his "go" before changing anything. At session end I write a fresh version of this note.

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

## Latest session — what we did (2026-06-14, To-Do reminder entry rework)

Context: this session opened with the snooze build already on the phone. **Delivery breakthrough: the My Day notification FIRED ON TIME on the real phone** — so notifications DO deliver on device (the open-item-#1 "delivery unverified" worry is resolved for My Day's DAILY triggers). But a To-Do reminder set for the same window did NOT fire. We diagnosed To-Do, then reworked its reminder entry.

Diagnosis (verified by reading `todo.tsx`):
- A To-Do notification is scheduled ONLY from entries in the task's `reminders` list (the loop in `scheduleReminders`, guarded by `reminders.length > 0`). **Due date + due time ALONE schedule nothing.** Patrick set date/time but no reminder entry → nothing scheduled, silently.
- The reminder-entry UI was effectively unusable: a narrow "Amount" box (placeholder clipped to "Am..."), minutes/hours/days toggles, and a "+" that only adds if you've typed a number first (else it just alerts). No "at the time" / "immediately" option (minimum was 1 unit BEFORE). Patrick's words: "there is no means to enter it."
- Patrick's typed values were fine (`06/14/26`, `19:58`) — NOT a date-parsing bug.

The rework (in `app/todo.tsx`, UNCOMMITTED, UNVALIDATED on device):
1. Added module-level `REMINDER_PRESETS` (At time=0 / 5 min / 15 min / 30 min / 1 hour / 1 day) and `addPresetReminder(amount, unit)` (with a duplicate guard). Removed the old `addReminder`.
2. Replaced the Amount box + unit toggles + "+" with a wrapping row of one-tap preset pill buttons reused from the existing `recurBtn` style (kept consistent with Category/Priority/Recurring pills, per Patrick's "stay consistent across pages"). Tapping a preset adds it to the existing removable list; the list now shows "At time of event" for amount 0, else "{n} {unit} before".
3. Removed now-dead `reminderAmount`/`reminderUnit` state and their resets in `resetForm` and `handleEditTask`.
- "At time" works with the existing scheduler unchanged: amount 0 → 0 offset → fires at the due time. Type-check clean except the known settings.tsx error.

**Next on device:** create a To-Do with a due time ~2 min out, tap a preset, lock the phone, confirm it fires. (We have NOT yet confirmed a To-Do/DATE-trigger reminder fires on device — only My Day's DAILY trigger is confirmed.)

## Earlier this day — what we did (2026-06-14, snooze rework)

Goal: make My Day Snooze behave like a normal off-the-shelf snooze — snooze ONLY the item that's notifying, leaving every other reminder alone. Researched how standard reminder apps snooze (action buttons live on the notification itself, each notification carries its item id, tapping Snooze reschedules just that item) and confirmed the current expo-notifications API against the docs (`setNotificationCategoryAsync` + `categoryIdentifier` + `actionIdentifier` on the response). Patrick chose to keep three durations (15/30/60). Built it as four edits across two files; type-check clean except the pre-existing settings.tsx error. **All edits UNCOMMITTED and UNVALIDATED (validation blocked on confirming notifications deliver at all — see open item #1).**

1. **`app/_layout.tsx` — registered snooze category + handle button taps.** Added a `useEffect` that registers category `mydaysnooze` with three actions (`snooze15`/`snooze30`/`snooze60`, titles "Snooze 15/30/60 min"). Extended the existing response handler: dedupe key is now `notifId:action` (was just notifId); on a snooze action it reschedules ONLY the firing item N minutes out via a TIME_INTERVAL trigger and returns; a plain body tap still routes by source. Body-tap routing now treats `source === 'mydaysnooze'` like `'myday'` (→ /myday).
2. **`app/myday.tsx` `scheduleAllNotifications` — tagged notifications.** Each My Day notification now sets `categoryIdentifier: 'mydaysnooze'` and carries `data: { source: 'myday', itemId: item.id, label: item.label }` (was `source` only). This is what lets the snooze handler know which item fired.
3. **`app/myday.tsx` — retired the global Snooze.** Removed the bottom-of-screen "Snooze Reminders" button (JSX) and the whole `snoozeReminder` function (which still used `cancelAllScheduledNotificationsAsync()`). Snooze now lives on the notification itself. (`styles.snoozeBtn`/`snoozeBtnText` left in the stylesheet, now unused — harmless.)
4. **Correctness detail:** the rescheduled snooze is tagged `source: 'mydaysnooze'`, NOT `'myday'`. `scheduleAllNotifications` cancels only `source === 'myday'` on every My Day load, so this keeps a pending snooze from being wiped when My Day re-opens.

**Design note:** real per-item snooze could NOT be done by touching only `snoozeReminder` — it necessarily touches `_layout.tsx` (category + handler) and My Day scheduling (item id on the notification). Snooze buttons only appear when a notification actually fires, so this can't be tested until notification delivery is confirmed (open item #1).

## Earlier session — what we did (2026-06-14, continued)

Goal was to capture two open items so they don't get lost; grew into making the fix for one of them and trying (unsuccessfully) to validate it live.

1. **Made the My Day "cancel all" fix (code done, UNCOMMITTED, UNVALIDATED).** In `app/myday.tsx`, `scheduleAllNotifications` used to call `cancelAllScheduledNotificationsAsync()` first — which wiped To-Do AND Timer reminders every time My Day scheduled (and My Day schedules on every screen load). Changed it to fetch `getAllScheduledNotificationsAsync()` and cancel only notifications whose `data.source === 'myday'`, then reschedule My Day's meals/meds as before. This leaves To-Do (`source: 'todo'`) and Timer untouched, and mirrors the per-item pattern To-Do already uses in its `cancelReminders`. **Edit is saved in `myday.tsx`; Patrick still needs to review and commit it.**
   - **Deliberately NOT touched:** the three Snooze buttons in My Day (~lines 211/223/235) STILL call `cancelAllScheduledNotificationsAsync()`. So snoozing in My Day still wipes To-Do/Timer. Left as a separate next step (one change at a time).

2. **Tried to validate in the Simulator — INCONCLUSIVE.** Set up To-Do task "Make coffee" with Due Date 06/14/26, a due time a few minutes out, and a "1 minute before" reminder. Two runs: scheduled the To-Do reminder → opened My Day (to trigger the reschedule) → waited. The To-Do reminder never visibly fired. Run 1 the app was in the foreground (foreground banners don't persist, so that run proves nothing). Run 2 the device was locked/backgrounded and still nothing appeared on the lock screen.
   - **Gap in the test:** in BOTH runs we opened My Day *before* fire time, so we never confirmed a To-Do reminder fires on its OWN. We therefore cannot yet tell "My Day cancels it" apart from "To-Do reminders aren't firing in this sim at all."
   - **We never saw ANY app notification fire all session** — only system ones (e.g. "Ready for Apple Intelligence"). When we went to check notification permission, Patrick reported he couldn't find a Notifications entry in Settings. So **notification permission / delivery for the app is unverified** and is the prime suspect.

### Verified code facts (don't re-derive)

- To-Do schedules a reminder ONLY if: `taskType !== 'background'` AND `dueDate` set AND `reminders.length > 0` AND fire time is still in the future (`scheduleReminders` in `todo.tsx`). **Due date + time alone schedule nothing — there must be a reminder entry.** **"Recurring: Daily" does NOT schedule a notification** — it only affects the Week view.
- **(As of the latest session)** To-Do reminder entry is now one-tap presets (`REMINDER_PRESETS`); "At time" is stored as amount 0 and fires at the due time. To-Do/DATE-trigger delivery on device is still UNCONFIRMED (only My Day's DAILY trigger is confirmed firing on the phone).
- **`updateTask` does NOT call `cancelReminders`/`scheduleReminders`, and `deleteTask` does NOT call `cancelReminders`.** So editing a task's due time/reminders does not take effect, and deleting a task leaves its reminder scheduled (it can still fire). Only add (`scheduleReminders`) and complete (`cancelReminders`) manage notifications. UNFIXED.
- My Day's `scheduleAllNotifications` runs on screen load (in `loadData`), and on every meal/med save — not just on edits.
- Tap-routing (`_layout.tsx`) reads `data.source` and `router.push('/todo' | '/myday')` — it routes to the SCREEN only, ignores any item id, and is still UNTESTED with a real tap. (As of the snooze rework it also handles `source === 'mydaysnooze'` → /myday, and snooze action buttons; both still UNTESTED with a real tap.)

### Tooling notes (save pain next time)

- **Don't type into Simulator text fields with the assistant's tools** — it triggers iOS press-and-hold accent popups and mangles input. Have Patrick type directly (native keyboard works fine).
- **Assistant swipe/tap gestures on the Simulator are unreliable** (Spotlight search, home-screen gestures didn't register). Patrick driving the device directly is more reliable. Good division of labor: Patrick does direct manipulation/typing, Claude reasons/guides and does menu-level actions.

### Apple notification limit (for future design — not the cause here)

`expo-notifications` wraps iOS `UNUserNotificationCenter`. iOS caps an app at **64 pending scheduled local notifications**; beyond that, it keeps the soonest-firing 64 and **silently drops the rest** (a repeating/DAILY trigger counts as ONE). We were nowhere near 64, so this did NOT cause the test failure — but when moving My Day (and later Snooze) off "cancel all" to per-item, keep pending counts from piling up, because over-limit drops fail silently.

## Open items / next candidates

0. **VERIFY THE SNOOZE-REWORK COMMIT LANDED** — see the box at the very top. Ask Patrick first thing.
1. **Notification delivery — CONFIRMED for My Day (DAILY) on device.** My Day fired on time on the phone. STILL UNCONFIRMED: a To-Do reminder (DATE trigger) firing on device. Next test: To-Do task, due time ~2 min out, tap a preset, lock the phone, confirm it fires. (The old simulator "nothing fires" worry is superseded — it does fire on a real device.)
2. **My Day Snooze — REWORKED to per-item (code done, committed per Patrick, validate on device).** Replaced the global "Snooze Reminders" button with notification action buttons (15/30/60 min) that snooze ONLY the firing item. Validate: trigger a My Day reminder, tap a Snooze button on the alert, confirm only that item re-fires N min later and To-Do/Timer/other My Day items are untouched.
3. **To-Do reminder entry — REWORKED to one-tap presets (code done, UNCOMMITTED, validate on device).** See "Latest session." Includes the "At time" (fire-at-due-time) option Patrick was missing.
4. **To-Do edit/delete don't manage notifications (UNFIXED).** `updateTask` never reschedules/cancels; `deleteTask` never cancels. Editing a due time won't take effect; a deleted task can still fire. Natural next change after the preset entry is validated.
5. **Tap-routing untested AND screen-only.** `_layout.tsx` opens the right screen on tap but never lands on the specific item; never confirmed with a real tap. To-Do reminders already carry `taskId`, so landing on the task is feasible; My Day reminders and To-Do's "Background Tasks" reminder carry no item id yet.
6. **Possible Timer cancel bug (unconfirmed).** `cancelTimer` cancels using `timer.id` (a `Date.now()` string), not the id returned by `scheduleNotificationAsync` — cancelling the main timer notification may silently fail.
7. **Pre-existing TS error:** `app/settings.tsx` line 165 — `pin` parameter implicitly `any`. Untouched.
8. **Project Planner** (`app/planner.tsx`) has reminder UI/fields but schedules no notifications. Dormant, low priority.

## Files touched

- `app/todo.tsx` — reminder entry reworked to one-tap presets (`REMINDER_PRESETS`, `addPresetReminder`, "At time"=0); old amount/unit entry + state removed. **UNCOMMITTED (latest session).**
- `app/_layout.tsx` — snooze category registration + snooze-button handling + `mydaysnooze` routing. **Reportedly COMMITTED by Patrick (verify — see top box).**
- `app/myday.tsx` — `scheduleAllNotifications` tags notifications with `categoryIdentifier` + `itemId`/`label`; earlier per-source cancel fix; global Snooze button + `snoozeReminder` removed. **Reportedly COMMITTED by Patrick (verify — see top box).**
- `docs/handoff.md` — this note.

`todo.tsx` is **uncommitted and unvalidated on device.** The `_layout.tsx` + `myday.tsx` snooze work was reportedly committed and built (My Day fired on the phone) — confirm the commit landed. Patrick does all git commits.

---

## ▶ PASTE THIS AT THE START OF THE NEXT SESSION

You're picking up the "Remember When" app (Expo / React Native, runs on my iPhone via TestFlight).

1. The `elderlyassistant` folder must be connected via Cowork's folder picker — if you can't see it, give me the folder-request button; don't ask me to upload files.
2. Open and read `docs/handoff.md` in that folder before proposing anything — it has the full state, standing rules, known bugs, and next steps.
3. First thing, ask me to confirm the snooze-rework commit actually landed (top box of the handoff).

Then tell me how heavy today's goal looks and wait for my "go." I'll give you the one goal.
