# Hand-off note — paste at the start of the next session

## THIS SESSION — #28 (2026-06-28): SECURITY TIDY-UP — all three items DONE + DEVICE-VALIDATED on Patrick's phone. The 6-digit PIN is now fully retired app-wide; security is entirely Face ID / passcode. Code in `app/settings.tsx` + `app/_layout.tsx` + three file deletions, UNCOMMITTED, `tsc` clean (EXIT 0); Patrick commits everything in one commit after the (now-passed) test.

**Start-of-session fact:** working tree was clean — all of #27 (To-Do two-timestamp work) plus docs already committed (`03786bc`). Nothing hanging from last session.

**Goal = the Security Tidy-up** (housekeeping; no data was ever exposed). Three leftovers from retiring the old PIN in favor of Face ID, done one at a time with Patrick's go each time:

1. **Reset All Data → Face ID.** `resetApp` (`app/settings.tsx`) previously read `user_pin` and made you type the 6-digit PIN in an `Alert.prompt`, then navigated to `/setup-pin` after clearing. Now it shows a confirm alert, then runs `LocalAuthentication.authenticateAsync({ promptMessage: 'Authenticate to reset all data', fallbackLabel: 'Use Passcode' })` — same shape as the Vault gate and the `toggleVaultPin` switch. On success: `AsyncStorage.clear()` then `router.replace('/home')` (no more `/setup-pin`). On fail/cancel: "Reset Cancelled — Your data was not deleted."

2. **Change PIN removed entirely** (`app/settings.tsx`). Deleted the Change PIN row, the whole keypad view, the four handlers (`startChangePIN`, `handlePinDigit`, `handlePinDelete`, `getCurrentPinDisplay`), the five PIN state vars, and the now-dead keypad styles. Those handlers were the only things reading/writing `user_pin`, so **nothing reads or writes a PIN anywhere now.** Also dropped the leftover top-border style on the Extra Vault Security row so it doesn't show a stray line as the first item in the Security card.

3. **Three orphaned screens deleted.** Verified nothing navigates to them (app opens via `index.tsx` → `Redirect href="/home"`; after the Reset change, the last pointer `/setup-pin` was gone). Deleted `app/setup-pin.tsx`, `app/login.tsx`, `app/vaultpin.tsx` and removed their three `Stack.Screen` registrations from `app/_layout.tsx`. (Deletion needed the Cowork file-delete permission — sandbox `rm` returned "Operation not permitted" first.)

**DEVICE TEST (Patrick's phone): "went as expected."** Reset → Face ID prompt → data wiped → lands on Home. **One thing observed + explained, NOT a bug:** after a reset, **My Day shows the default starter items again** (Breakfast, Lunch, Snack, Dinner, Morning Medication). Cause (verified by reading `getMigratedRoutine`, `app/myday.tsx` ~98–109): on an empty `my_routine` it re-seeds `INITIAL_MEALS` + `INITIAL_MEDS` — intended first-run behavior, and the old PIN-based reset did the same. The wipe genuinely worked; these are factory defaults, not survivors. **Patrick decided this is FINE — leave it** (a reset returns My Day to its fresh-start routine rather than a blank screen). No change made.

**Build/commit note:** Patrick builds via EAS with `requireCommit` UNSET in `eas.json` (defaults to false), so **EAS bundles the working tree including uncommitted changes** — confirmed by reading `eas.json` and by his last two builds. (Claude initially mis-stated that EAS needs a commit first; corrected.) So he tested these changes uncommitted, and will commit code + docs together now that the test passed.

**Files touched (#28):**
- `app/settings.tsx` — Reset→Face ID + full Change-PIN removal. UNCOMMITTED, `tsc` clean, device-validated.
- `app/_layout.tsx` — removed 3 `Stack.Screen` registrations. UNCOMMITTED, `tsc` clean.
- Deleted: `app/setup-pin.tsx`, `app/login.tsx`, `app/vaultpin.tsx`.
- `docs/handoff.md` + `docs/parked-items.md` + `docs/pending.txt` — this update. Pending Patrick's commit.

---

## THIS SESSION — #27 (2026-06-28): To-Do "Done" date — RESOLVED + DEVICE-VALIDATED on Patrick's phone. The To-Do log now records BOTH the task's **original set date/time** AND **when Done was tapped**; the reminder's fire time is no longer logged. To-Do ONLY. Code in `app/_layout.tsx` + `app/todo.tsx`, UNCOMMITTED, `tsc` clean (EXIT 0); Patrick commits.

**Start-of-session fact:** Patrick confirmed **all of #26 is committed.** (So the #26 timer-nag work shipped.)

**Goal = #27, the To-Do "Done" date.** Decided with Patrick one step at a time: he wanted the To-Do log to carry the **original set date/time** of the task **plus when it was marked Done** — and he does **not** care about the reminder's fire time. This **reverses the #25 approach** (which had stamped `completedDate` from the FIRE time in `_layout.tsx`): the completion stamp is now **tap time** again, and a new `scheduledFor` field carries the original set date/time. Keeping both means a Done tapped on a stale banner shows that later day under "Done" while the original day is preserved under "Set" — exactly what Patrick asked for. **Scope is To-Do only — My Day / My Week / Pets were NOT touched** (Patrick confirmed explicitly).

**Three edits, `tsc --noEmit` clean (EXIT 0), DEVICE-VALIDATED ("this session's changes work on my phone"):**
1. **`app/_layout.tsx`** — banner Done, `source === 'todo'` branch: `completedDate` now stamps **`new Date()` (tap time)** instead of `new Date(response.notification.date * 1000)` (fire time); added a **`scheduledFor`** field = `task.dueDate` (+ ` at <dueTime>`), falling back to the recurring pattern when there's no due date (weekly → `Sun..Sat`, monthly → `Day N`, yearly → `Mon DD`).
2. **`app/todo.tsx`** — added optional **`scheduledFor?: string`** to the `LogEntry` type; the on-screen ✓ Done (`completeTask`) now computes the same `scheduledFor` and stores it (it already used tap time); the log display now reads **`Set <scheduledFor> | Done <completedDate> | <title> | <notes>`**.
3. **Old log entries** have no `scheduledFor`, so they just display `Done <date> | …` (the `Set …` part is omitted when absent).

**Files touched (#27):**
- `app/_layout.tsx` + `app/todo.tsx` — the changes above. UNCOMMITTED, `tsc` clean, DEVICE-VALIDATED.
- `docs/handoff.md` + `docs/parked-items.md` — this update. Pending Patrick's commit.

---

*Older sessions (#26 and earlier) have been moved to [`handoff-archive.md`](handoff-archive.md) to keep this file short.*
