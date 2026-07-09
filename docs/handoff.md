# Hand-off note — paste at the start of the next session

## THIS SESSION — #67 (2026-07-08) "Vault: user-defined categories"

**THE WHOLE VAULT CATEGORY PACKAGE WAS BUILT, one step at a time, `tsc`
clean after each, and SIMULATOR-APPROVED by Patrick ("Everything looks
good"):**

1. **Categories are now USER DATA** (`app/vault.tsx`): the hard-coded
   seven are gone. A new `vault_categories` AsyncStorage key holds the
   editable list; on FIRST run it's seeded with the original seven (same
   ids — `identity`, `property`, `financial`, `medical`, `digital`,
   `legal`, `other` — so every existing item stays put). **No icons
   anywhere** (Patrick's call — the seeded seven lost theirs too; cards
   show name + item count only).
2. **"+ New" button** in the header (category list view) → Add Category
   popup: standard slide-up modal, one Name field, Cancel/Add.
3. **Edit button on every tile** → same popup as "Rename Category /
   Update", name pre-filled. Rename changes the display name only; the id
   stays, so items stay inside.
4. **Swipe-to-delete on tiles** with a TWO-STAGE warning (Patrick's
   spec): stage 1 names the category and counts its items; stage 2 is the
   "permanently deleted, cannot be undone" confirm. Deleting removes the
   category AND its items (his call — the Vault is a mobile reference
   copy; masters live elsewhere).
5. **Preset label chips REMOVED** from the New Item popup — plain typed
   Label/Value/Notes now. This also ERASED the #47 "Custom" bug, which
   was CONFIRMED REAL this session by reading the code: the chip row used
   `'Custom'` (capital) but the save line checked `'custom'` (lower), so
   typed labels were saved as the word "Custom".
6. **`backup.tsx`**: `vault_categories` joined READABLE_KEYS (names only,
   no secrets). Verified in the restore code: an OLD backup with no such
   key just clears it and the Vault re-seeds the seven on next open —
   old backups restore gracefully.
7. **Polish (Patrick's ask):** "← All Categories" is now a capsule-
   outlined button (themed `cardTitle` color, both themes).

**Also this session (part 1):** #66 Memory Test confirmed DONE on the
phone by Patrick — works just as he wants; he enters words by KEYBOARD
MIC now (closer to the real test). Docs cleaned throughout: Orders #63
verified working; all visuals approved; old Elyfont backups deleted (no
old-restore proof needed); backup Merge idea moved to the back-most
burner (90% dropped); pending.txt pruned of settled items.

**NOT done yet: the roadmap.md refresh** — it's still the #31 picture
(Elyfont naming, no Orders/Watch List/Look Ahead/Memory Test in the
built list, To-Do phases long overtaken). Patrick began evaluating the
road ahead this session and chose the Vault build first; the roadmap
rewrite is the natural next-session candidate.

**➤ NEXT: Patrick commits + EAS build. The phone test:** categories
arrive seeded with his items where they were; add/rename/delete (two
warnings, items go too); new items save their TYPED label (the Custom
bug's fix, proven for real on the phone); a backup export includes
`vault_categories`; the capsule outline on "← All Categories".

---

## SESSION — #66 (2026-07-07) "Memory Test page"

**WHY:** Patrick failed the 5-word cognitive memory test and was diagnosed with
mild (3%) sleep apnea; he's starting a PAP mask. This page runs that same test
daily so the scores show whether the mask helps. (Started as a separate
"Memory Tests" project — a Sonnet-built HTML file that had no notifications and
couldn't save outside Claude's preview. Patrick decided mid-session to build it
INTO this app instead and deleted that folder; native notifications were the
clincher.)

**THE WHOLE PACKAGE WAS BUILT, one step at a time, `tsc` clean after each:**

1. **`app/memorytest.tsx`** (new, self-contained): FIVE learning rounds — words
   shown as text → hidden → he types them into 5 big boxes → scored → next
   round, ALWAYS all five even on a perfect round (the RAVLT pattern; research
   confirmed it matches what his doctor did) — then "I Got It" schedules a
   5-minute notification (MoCA-style delayed recall, the headline score).
   One test per day; all round scores + recall score log with the date.
   Decisions: displayed text, NO audio (his call — past audio trouble; a
   recognized variant, consistency is what matters); forgiving scoring (case,
   stray characters, plural 's' free); word bank of 60, 5 drawn fresh daily;
   restart-recovery to the right screen; a stale unfinished session from a
   past day is silently discarded.
2. **Home tile**: 🧠 "Memory Test", last in the grid, + its route.
3. **`_layout.tsx`**: banner tap routes to the page; screen registered. NO
   banner buttons on purpose — a Delay button would invite postponing a test
   that must happen at the 5-minute mark.
4. **`backup.tsx`**: `memtest_session` + `memtest_history` joined READABLE_KEYS.
5. **LATE ADDITION, from Patrick's Simulator run: spelling forgiveness.** A
   one-letter mistake (wrong / missing / extra letter, or two neighbors
   swapped — "candel") no longer costs a point; two mistakes is still a miss.
   The daily draw keeps the 5 words ≥3 edits apart (the bank has 12 pairs
   only 2 apart, e.g. pepper/copper — they can't be drawn together), and each
   answer claims at most one word. Logic proven with a node test battery.

**SIMULATOR-APPROVED, BOTH THEMES (Patrick, live this session):** full flow
run — his rounds went 4→5 climbing to all five, recall 5/5 — plus the retake
trick (swipe today's My Scores row → Delete → the start button returns) and
the spelling forgiveness. "It all works good."

**➤ NEXT (COMPLETED — see #67 above): commit + build + phone test all done;
works as Patrick wants, mic entry adopted.**

---

*Only the last two sessions are kept here. Older session detail isn't archived in the docs anymore — git history holds the full record.*
