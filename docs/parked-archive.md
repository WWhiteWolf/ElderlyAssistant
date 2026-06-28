# Parked archive — finished work

> Items that were once on `parked-items.md` and are now **done** (built, fixed, or
> resolved-by-decision). Moved here in session #29 to keep the live backlog short.
> Reference only — nothing here is waiting on anyone. Grouped by theme; git history
> keeps the full blow-by-blow if it's ever needed.
>
> Last updated: 2026-06-28 (session #29 — created during the parked-items tidy-up).

---

## Security

- **Vault security toggle could be turned off without auth — FIXED (session #22).** Turning "Extra Vault Security" OFF now requires Face ID / passcode; turning it on stays free. Closed the hole where anyone holding the phone could disable Vault protection in Settings. Committed `a8511c3`, Simulator-tested.
- **Vault Face ID gate looped / peeked through — FIXED (session #22).** The gate's effect depended on a changing object, re-firing Face ID endlessly and letting the list flash through. Now runs once on open (`didCheck` ref); one clean prompt, no peek-through. Committed `3bd445e`.
- **Custom 6-digit PIN fully retired app-wide — DONE + DEVICE-VALIDATED (session #28).** Security is now entirely Face ID / passcode (Apple handles recovery — no lockout). Reset All Data now authenticates with Face ID and routes to Home after wiping; the Change PIN row, keypad, handlers, and state were all deleted. Nothing reads or writes a PIN anywhere now. Committed.
- **Three orphaned PIN/login screens deleted — DONE (session #28).** Verified nothing navigates to them, then removed `app/setup-pin.tsx`, `app/login.tsx`, `app/vaultpin.tsx` and their three `Stack.Screen` registrations in `_layout.tsx`.
- **Stale Vault toggle hint reworded — DONE (session #24).** "Require PIN to open Vault" → "Require Face ID to open Vault."
- **My Day re-seeds its starter items after a Reset — verified NOT a bug (session #28).** A wipe leaves `my_routine` empty, so My Day re-seeds the default meals + meds — intended first-run behavior, not surviving data. Patrick chose to leave it: a reset returns My Day to a fresh-start routine rather than a blank screen.

## Timer

- **Timer cancel silently failed — FIXED + DEVICE-VALIDATED + COMMITTED (session #25).** Cancel used a made-up clock id (`Date.now()`) instead of the real notification id, so the main "Timer Done" alert still fired. Fixed to store and cancel the real id. (Later superseded in the working tree by the nag-feature rewrite below.)
- **Timer "nag" styles + loud backup — BUILT (session #25), blocking bug FIXED + DEVICE-VALIDATED (session #26).** Gentle (every 60s ×3) or Urgent (every 30s, ~5 min), optional + deselectable (pick neither = a single Done alert). The #25 bug — tapping Done didn't stop the nags — was fixed by making `dismissTimer` query-based (`getAllScheduledNotificationsAsync` filtered by `timerId`), so Done works regardless of in-memory state. Added a green Done button per timer card; relabeled the banner "Dismiss" → "Done". (`app/timer.tsx`.)

## Backup (local data backup — complete end to end)

- **Export — BUILT + validated (session #23).** Exports all app data to one JSON via the iOS share sheet (Files / iCloud). Only the Vault section is encrypted, with a separate backup password. Added the now-required native dep `react-native-get-random-values` (crypto-js needs it). (`app/backup.tsx`.)
- **Import — BUILT + DEVICE-VERIFIED including a real iCloud round-trip (session #24).** Pick a file → validate it's an Elyfont backup → decrypt the Vault if needed (wrong password fails harmlessly) → "Replace Everything?" confirm → true replace. With Export, the whole feature works end to end. First use of `expo-document-picker`.
- **Backup filename now includes the time — DONE (session #24).** `YYYY-MM-DD-HHMM`, so same-day re-exports keep distinct names.

## Notifications & reminders

- **My Day after-midnight doses logged on the wrong day — FIXED + DEVICE-VALIDATED (session #15).** Banner Done now writes a dated history entry stamped from when the reminder *fired* (not tap time), so a dose marked just after midnight files under the reminder's day. Pets Day mirrors the same code path (not separately device-tested). On-screen Log still uses tap time (deferred). (`app/_layout.tsx`.)
- **To-Do "Done" date — RESOLVED + DEVICE-VALIDATED (session #27).** The To-Do log now records both the task's original set date/time (`scheduledFor`) and when Done was tapped (`completedDate`, tap time); the reminder's fire time is no longer logged. Log line reads `Set … | Done … | title | notes`. To-Do only — My Day / My Week / Pets unchanged. (`app/_layout.tsx` + `app/todo.tsx`.)
- **Appointment "Reminder Options" — DONE (2026-06-19), committed.** Editable global Morning (8 AM) / Evening (5 PM) times in Settings, plus seven toggle "Reminders before" buttons in To-Do (At time / 1 hour / 2 hours / Morning of / Day / Week / Month) and a silent OK dismiss on the banner. The original purpose of the app. (`settings.tsx` + `todo.tsx` + `_layout.tsx`.)
- **Monthly + Yearly recurring To-Do alerts — BUILT (session #8), committed.** Native repeating monthly (`day`) and yearly (`month`, `day`) triggers at the set time, mirroring weekly. (Live firing still wants a phone test — that pending check stays on `parked-items.md`.) 3-month / 6-month remain unbuilt (still parked). (`app/todo.tsx`.)
- **To-Do soonest-first sort — DONE + DEVICE-VALIDATED (session #11 / #12).** One fixed sort by due date + time; sort buttons removed. Undated/recurring fall to the bottom. (`app/todo.tsx`.)
- **Yearly day picker offered invalid dates — FIXED (session #24).** The Day list is now driven by the selected month's length and clamps when switching to a shorter month. (Feb 29 still selectable on purpose.) (`app/todo.tsx`.)
- **Orphaned `pets_data` storage key — FIXED (session #24).** A one-time `removeItem('pets_data')` on load tidies the dead key. (`app/mollie.tsx`.)
- **Pets Day routine reminders (with Snooze) — DONE + DEVICE-VALIDATED (session 4, build 18).** Pets Day now mirrors My Day's notifications (daily per feed, "Pets Routine", `petssnooze`).
- **My Day + Pets Day banner Done + on-page Snooze — DONE + DEVICE-VALIDATED (session 5).** A Done action on the `mydaysnooze`/`petssnooze` banners marks the item complete; every tile got an on-page Snooze 15/30/60.
- **To-Do: Daily removed, Weekly works with no date, Done + Snooze banner — DONE (session 6).** Added the `todosnooze` category (Done + Snooze 15/30/60). (`todo.tsx` + `_layout.tsx`.)
- **Counters persist + reset daily — DONE + DEVICE-VALIDATED (session 4).** Coffee / Water / Treats now stored (`my_coffee` / `my_water` / `pets_treats`), saved on every change, reset on the daily rollover.
- **My Day Meals + Meds merged into one Routine list — DONE (2026-06-15).** One `my_routine` list with a single Log and "+ Add Entry"; AM/PM tile formatting and an Hour/Minute/AM-PM picker.
- **To-Do due time on tiles + `deleteTask` cancels reminders + `settings.tsx:165` TS fix — DONE (session 2), committed `d7b4e81`.**

## My Week

- **My Week page + reminders + Postpone + banner actions — BUILT + DEVICE-VALIDATED (sessions #12 / #13).** A new weekly-chores screen mirroring My Day (`week_routine` / `week_history`): always-visible chore list, Add/Edit with a Sun–Sat day picker, base weekly reminder per chore, weekly reset, per-occurrence Postpone, and banner Done / +1 Day. The banner actions passed on the phone (after the #13 sequential-category-registration fix). (`app/myweek.tsx` + `app/_layout.tsx` + `app/home.tsx`.)
- **My Week / My Day banner buttons missing on device — FIXED + DEVICE-VALIDATED (session #13).** The four notification categories were registered concurrently, racing on a cold cache and dropping `myweekactions` on the phone. Now registered sequentially. (`app/_layout.tsx`.)
- **Lone Cancel buttons + "Clear All" pills — FIXED (session #13).** Wrapped each lone Cancel in a row so it renders as a proper labeled grey button; greyed the Clear All pills. (`myweek.tsx` / `myday.tsx` / `mollie.tsx`.)

## UI polish

- **Two "+Task" buttons in To-Do — FIXED (session #24).** Removed the floating button; kept the header one.
- **Vault "+ Add" moved to the header — FIXED (session #24).** Was a bottom floating button; now header top-right when inside a category.

## Design decisions (settled)

- **Where do daily-repeating reminders live? — RESOLVED.** Daily reminders became **My Day**, its own page and the most-used part of the app; To-Do dropped "Daily" entirely. (My Week later became the weekly engine in the same spirit.) The leftover Daily/Weekly references still sitting in `todo.tsx` are tracked as cleanup on `parked-items.md`.
- **Pets Day routine reminders — DONE (2026-06-17).** Built in session 4, device-validated on build 18.
