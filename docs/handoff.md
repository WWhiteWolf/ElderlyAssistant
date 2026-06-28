# Hand-off note — paste at the start of the next session

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

## THIS SESSION — #26 (2026-06-28): The #25 timer-nag BLOCKING BUG is FIXED + DEVICE-VALIDATED on Patrick's phone — tapping "Done" now reliably stops the nags. Also made Gentle/Urgent optional + deselectable. All code in `app/timer.tsx`, UNCOMMITTED, `tsc` clean; Patrick commits + ends the session.

**Goal = the #25 known-unresolved bug: tapping the banner / "Done" didn't stop the timer nags.** Root cause found by READING the code (not assumed): the cancel logic in `app/timer.tsx` looked the timer up in the **Timer screen's in-memory `activeTimers` list** to find which notification ids to cancel. When that list was wiped — a Metro reload, the screen remounting, or the app restarting — BOTH symptoms followed at once: the active-timer **tile disappeared** AND `dismissTimer` found no record, so it **cancelled nothing** and the nags kept firing. One cause behind both.

**THE FIX — device-validated on Patrick's phone ("everything working as expected"):** made `dismissTimer` **query-based** — `getAllScheduledNotificationsAsync()`, filter by `content.data.timerId`, cancel each — so Done cancels the timer's pending alerts straight from iOS, regardless of in-memory state. Same dependable pattern the To-Do / My Week paths already use.

**Five edits this session, ALL in `app/timer.tsx`, `tsc --noEmit` clean (EXIT 0):**
1. **Green "Done" button** added to each active-timer card (beside the red Cancel); calls `dismissTimer(timer.id)` immediately (no confirm). Cancel keeps its confirm dialog.
2. **Banner action relabeled "Dismiss" → "Done"** (`timer` category; identifier `done`, still accepts the old `dismiss` harmlessly). Listener handles `done`.
3. **Plain banner tap no longer acknowledges/removes the timer** — removed `DEFAULT_ACTION_IDENTIFIER` from the cancel branch, so only an explicit Done (or Snooze) acts; a tapped-but-not-Done timer stays nagging/visible.
4. **`dismissTimer` made query-based** (the actual fix, above).
5. **Gentle/Urgent no longer default-selected, and are optional + deselectable.** `selectedStyle` starts `null` (neither highlighted); the two buttons toggle on/off (tap a selected one to clear it); the user is NOT forced to pick. With **no style**, `scheduleTimerAlerts` schedules ONLY the single "Timer Done!" alert — no nags, and the loud backup is skipped (`loud && profile`). `count`/`interval` derive from `profile = style ? NAG_PROFILES[style] : null` (0 when none). `ActiveTimer.style` is now `NagStyle | null`. (Patrick: "if the user does not want nags then they do not want loud alerts.")

**DEVICE TEST (Patrick's phone): nag-cancel fix + popups working as expected; Urgent confirmed firing every 30s for ~5 min.**

**STILL OPEN / accepted limitations (parked, NOT blockers):**
- **Missing tile after a reload / app restart** — active timers are **in-memory only** (`useState`, no AsyncStorage). The tile won't reappear once the screen remounts. Patrick ACCEPTED this — Done now stops the nags reliably whether or not the tile shows. To make the tile survive later would need: persist `activeTimers` to AsyncStorage on change, and on Timer-page focus reload them + reconcile against `getAllScheduledNotificationsAsync` (keep only timers that still have pending alerts; drop acknowledged/finished). Parked.
- **"Loud alert" isn't actually louder** — it's one extra alert with the STANDARD tone, fired one interval after the last nag (~5½ min for Urgent). Patrick had it on and heard nothing distinct — expected, nothing broken. A genuinely louder/distinct alarm needs a **custom sound file bundled** → a REBUILD (deferred since #25); overriding Silent / Do-Not-Disturb at full volume needs Apple's **Critical Alerts** entitlement (heavy, deferred). Both stay parked.

**Tree state for Patrick's commit:** `app/timer.tsx` only (this session's five edits) — UNCOMMITTED, `tsc` clean, DEVICE-VALIDATED. It stacks on the still-uncommitted #25 nag-feature rewrite of the same file. **NOTE:** I did NOT touch `app/_layout.tsx` this session — the #25 **To-Do "Done" date fix** in `_layout.tsx` may still be uncommitted + untested; confirm when committing.

**Docs standing-rules added this session (in `docs/session-start.md`, pending commit), at Patrick's request:**
- **One question at a time.**
- **Ask if Patrick wants to say something first, before questioning him.**
- **No unnecessary urgency** — Patrick is retired and in no hurry; go at his pace, don't rush toward building.
(Process note: I built one small change — the Gentle/Urgent deselect — before asking; Patrick corrected me. The ask-first rule now stands explicitly in session-start.)

**Files touched (#26):**
- `app/timer.tsx` — the five edits above. UNCOMMITTED, `tsc` clean, device-validated.
- `docs/session-start.md` — three new standing rules. Pending commit.
- `docs/handoff.md` + `docs/parked-items.md` — this update. Pending commit.

---

*Older sessions (#25 and earlier) have been moved to [`handoff-archive.md`](handoff-archive.md) to keep this file short.*
