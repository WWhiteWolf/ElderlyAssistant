# Hand-off note — paste at the start of the next session

## THIS SESSION — #30 (2026-06-28): HAND-OFF ARCHIVE TIDY-UP — grew into a docs-system simplification. Docs only, no app code touched. Moved #27 into the archive, then on Patrick's call REMOVED both archive files entirely (`handoff-archive.md` + `parked-archive.md`) — git history keeps the full record — and added a plain-text "Where things stand" snapshot to `pending.txt`. All UNCOMMITTED, Patrick commits.

**Start-of-session fact:** working tree was clean — all of #29 (parked-items tidy-up) committed in `ff33cf9`. Nothing hanging.

**Goal = tidy up `handoff-archive.md`** (its bottom third was a stale pasted-in old hand-off). It evolved as we talked it through, one step at a time:

1. **Moved #27** out of `handoff.md` into the archive (the last-2-sessions rule), updating its status line from "UNCOMMITTED" to "committed."
2. **Patrick reconsidered the whole archive** — 728 lines / ~19k words, never read at session start, and fully preserved in git regardless. He decided the doc archives aren't needed.
3. **Deleted both `handoff-archive.md` and `parked-archive.md`** (needed the Cowork file-delete permission; sandbox `rm` returned "Operation not permitted" first). Git retains every word.
4. **Cleaned every dead pointer** to the removed files: the `handoff.md` footer, `parked-items.md` (intro + the obsolete "Docs" item), `pending.txt` (intro + the housekeeping item), and `session-start.md` (the "move older sessions to archive" standing rule + the tracking-docs list).

**New plain-text reading doc (Patrick's request):**
- `pending.txt` now opens with a **"Where things stand right now"** snapshot, making it the single plain-text doc Patrick reads to step back and decide what's next (where we stand + the menu of open options). Keeping that snapshot fresh is now part of the end-of-session routine, recorded in `session-start.md`.

**Verification:** grepped every doc for `handoff-archive` / `parked-archive` — the only remaining mentions are inside #29's history entry below, which is an accurate record of what #29 did; this #30 entry explains the later removal.

**Files touched (#30):** deleted `docs/handoff-archive.md` + `docs/parked-archive.md`; edited `docs/handoff.md` (this entry), `docs/parked-items.md`, `docs/pending.txt`, `docs/session-start.md`. All UNCOMMITTED; Patrick commits.

**➤ NEXT SESSION — Patrick's pick from `pending.txt`.** No docs cleanup is pending. Open code items on the menu include retiring To-Do's old Daily/Weekly, adding the To-Do on-tile Snooze button, and the Monthly/Yearly recurring-reminder phone test.

---

## SESSION — #29 (2026-06-28): PARKED-ITEMS TIDY-UP — docs only, no code touched. Split the bloated `parked-items.md` into a lean open-work list plus a new themed `docs/parked-archive.md` for finished work; updated `pending.txt` to match. (NOTE: `parked-archive.md` was later removed in #30.) Committed by Patrick in `ff33cf9`.

**Start-of-session fact:** working tree was clean — all of #28 (Security Tidy-up, code + docs) committed in `0d5de31`. Nothing hanging.

**Goal = tidy up `parked-items.md`,** which had grown into a wall of finished items, a dense run-on "Last updated" blob, and a "Done (recently cleared)" section. Decided with Patrick: move finished work into a NEW archive, grouped intelligently by theme (not dumped), and shrink `parked-items.md` to only still-open work.

**What was done (docs only — no app code changed):**
1. **NEW `docs/parked-archive.md`** — all completed/resolved items, grouped by theme. (Removed in #30 — git keeps it.)
2. **`parked-items.md` rewritten** to hold only open work; retired the run-on "Last updated" blob; kept a short plain-English overview.
3. **`pending.txt`** brought back in step — dropped the now-done Security Tidy-up section; added the new cleanup items in plain words.

**New backlog items added (Patrick's call):**
- **Retire To-Do's old Daily & Weekly** now that My Day owns daily and My Week owns weekly. Verified in `app/todo.tsx`: **Daily** is nearly gone already (not in the picker, no schedule branch) — only two dead traces remain (`'daily'` in the `RecurType` union ~line 23; a `t.recurring === 'daily'` line in the Week-Ahead filter ~line 1003). **Weekly is still FULLY LIVE** (in the picker, own Sun–Sat day picker, tile display, real repeating weekly notification ~lines 400–419) — so removing it is a real functional change, its own session, and we must decide what happens to any existing weekly To-Dos.
- **To-Do on-tile Snooze button.** My Day/Pets have on-page Snooze; To-Do only has banner Snooze.

**Files touched (#29):** `docs/parked-archive.md` (new, later removed in #30), `docs/parked-items.md`, `docs/pending.txt`, `docs/handoff.md`. Committed in `ff33cf9`.

---

*Only the last two sessions are kept here. Older session detail isn't archived in the docs anymore — git history holds the full record.*
