# Hand-off note — paste at the start of the next session

## THIS SESSION — #31 (2026-06-28): CREATED THE PROJECT ROADMAP — docs only, no app code touched. New `docs/roadmap.md`: vision, current state, full feature inventory, road-ahead phases, a Deployment & distribution (long-range) section, guiding principles, and a tools/stack appendix. UNCOMMITTED, Patrick commits.

**Start-of-session fact:** working tree was clean — all of #30 (docs simplification) committed in `33d0db3`. Nothing hanging.

**Goal = create a roadmap.** Patrick realized the project had no big-picture roadmap and wanted one. He chose the broader form: vision + what's already built + milestones + what's ahead (not just a forward task list).

**What was done (docs only):**
1. **NEW `docs/roadmap.md`** — built from verified facts, not guesses: stack from `package.json`/`app.json`/`eas.json`/`.vscode/extensions.json`, the eleven screens from `app/`, and open work from the tracking docs. Sections: Vision; Where it stands today; What's already built; The road ahead (4 phases + parked); Deployment & distribution (long-range); Guiding principles; Tools & stack appendix.
2. **Patrick's corrections, applied:**
   - Not "nothing in the cloud" — an exported **backup file** can be saved to a cloud location (iCloud Drive). Reworded both spots.
   - Added the **Deployment & distribution (long-range)** section — current path is EAS Build → TestFlight → (eventually) App Store; an *optional, uncommitted* web version of Elyfont on GitHub Pages at **elyfont.com** (already owned), same approach as MysteryTracker's web build; the **two-app picture** (MysteryTracker: mobile + web **both done, web published live**; Elyfont: mobile working, web a maybe). Points to OneDrive `Publishing-Strategy.docx` + the MysteryTracker deployment doc rather than duplicating steps.
   - Added a sub-idea under Elyfont: offering the individual pages (To-Do, My Day, …) as **optional tailored modules**. Marked not committed.

**Verified detail worth keeping:** `app.json` already carries the new name **"Elyfont"**, but the in-app home greeting and the TestFlight listing still say **"Remember When"** — so the rename is partly underway (recorded in the roadmap's Identity/renaming milestone).

**Files touched (#31):** `docs/roadmap.md` (new); `docs/handoff.md` + `docs/pending.txt` (end-of-session refresh). No new backlog items to park. All UNCOMMITTED; Patrick commits.

**➤ NEXT SESSION — Patrick's pick from `pending.txt`.** No docs cleanup pending. Open code items include the Monthly/Yearly phone test, retiring To-Do's Daily/Weekly, and the To-Do on-tile Snooze button.

---

## SESSION — #30 (2026-06-28): HAND-OFF ARCHIVE TIDY-UP — grew into a docs-system simplification. Docs only, no app code touched. Moved #27 into the archive, then on Patrick's call REMOVED both archive files entirely (`handoff-archive.md` + `parked-archive.md`) — git history keeps the full record — and added a plain-text "Where things stand" snapshot to `pending.txt`. All UNCOMMITTED, Patrick commits.

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

*Only the last two sessions are kept here. Older session detail isn't archived in the docs anymore — git history holds the full record.*
