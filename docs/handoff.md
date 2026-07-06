# Hand-off note — paste at the start of the next session

## THIS SESSION — #65 (2026-07-06) "Name change to 'A Place To Remember'"

**The WHOLE RENAME PACKAGE was BUILT — every piece Simulator-approved one at a time — AND Patrick's own App Store Connect step was completed live the same session.** All decisions were #64's; #65 executed them.

1. **`app.json`**: `"name"` → `"Remember"` (the icon label; one line).
2. **Home header rebuilt** (`app/home.tsx`): title "A Place To Remember" moved to its OWN full-width line (fits one line — verified both themes); the gear moved down beside the subtitle with its #63 hitSlop intact; **NEW: a small 32px face icon at the left of the subtitle row**, mirroring the gear. Patrick asked for no gold square behind it, so it uses **`assets/images/icon-face.png` — a NEW transparent-background file** (face/sparkle/dot only, cropped square). Approved in both themes.
3. **Settings version line** (`app/settings.tsx`): → "A Place To Remember v1.0". Simulator-verified.
4. **`backup.tsx` naming**: filename → `Remember-Backup-<date>.json`; internals → `app: 'A Place To Remember'`, `type: 'remember-backup'`; **restore accepts the new marker AND the old `'elyfont-backup'`** (a code comment guards it — old backups must stay restorable forever); share-sheet title + both failure alerts reworded. Share sheet verified live in the Simulator with the new filename. Old-backup restore proof rides the phone (iCloud).
5. **The ICON ART was BUILT**: the #64-approved design (line-drawn happy face, brick-red `#b04a1a` on gold `#eec55a`, 4-point sparkle + dot at the upper-right temple) drawn at 1024×1024 RGB no-alpha and placed as **`assets/images/icon.png`** (Expo placeholder gone). Android variants + splash deliberately later. The phone only shows it after the EAS build.
6. **Patrick's App Store Connect step — DONE live** (walked through step-by-step in Firefox): Distribution → App Information → Name → **"A Place To Remember"**, saved. The field was editable because the app is unreleased with version 1.0 in "Prepare for Submission" — no review gate hit.

`tsc` clean after every edit. Docs refreshed end of session.

**7. LATE ADDITION — AFTER build 48 shipped (rides the NEXT build):** Patrick's phone test caught the header face clashing with the light theme's teal header (brick-red art; he'd only checked dark in the Sim). Fix: `tintColor: t.settingsGear` on the header icon (`home.tsx`, one line) — the face now matches the gear's themed color pair (light soft-teal `#4caba1`, dark `#c9622e` — near-identical to the raw brick-red). Simulator-approved BOTH themes. **Until the next build, the phone shows the old brick-red face on the light header — known, fixed in code.**

**8. THE SUBMISSION SAGA (for the record — build 48 DID reach TestFlight + the phone the same day):** `eas submit` failed twice with Apple 403 `FORBIDDEN.REQUIRED_AGREEMENTS_MISSING_OR_EXPIRED`. Two separate blockers, both cleared live in App Store Connect → **Business**: (1) the updated Apple Developer Program License Agreement needed accepting; (2) the EU **Digital Services Act** popup needed answering — Patrick chose "I'm not a trader under the DSA" (free personal app). Third `eas submit` of the same build succeeded immediately. **If a future submit 403s with "agreement missing or expired" → App Store Connect → Business, look for banners/popups.** (The "Sign the Paid Apps Agreement" note there is ignorable — only for paid apps/IAP.)

**Commit note:** the main #65 code was committed and BUILT as **build 48** (on the phone). Still uncommitted at session end: the item-7 tint fix (`home.tsx`) + these docs — Patrick commits.

**➤ NEXT: the phone test of build 48** (the item-7 tint fix rides the NEXT build):
- ✅ Seen already: the new icon + header face (which is what caught the light-theme clash).
- Backup: export shows `Remember-Backup-…`; **prove an old `Elyfont-Backup-…` file still restores** (pairs with the "name the backup folder" findability check in iCloud — the filename half is now done).
- Plus the still-running #63 Orders multi-day checks (see pending.txt): day-before @ Midday / morning-of @ Morning, no window-close nag after HERE, watch-button listing.

---

## SESSION — #64 (2026-07-06) "Polish 6 — App name & Home screen buttons"

**1. The "Elyfont" reminder-popup mystery — SOLVED, zero code.** The code and `app.json` have said "Remember When" since #54 (grep-verified; the only real "Elyfont" strings left are backup.tsx's file naming/wording and the inert Siri intent files). Patrick's lock-screen banners still said "Elyfont" while his icon label said "Remember When" → stale iOS name cache from a pre-#54 build. **A phone restart fixed it** — banners now say "Remember When". Nothing rides a build.

**2. NAME DECIDED: App Store listing → "A Place To Remember"; icon label → "Remember".** The full name came to Patrick mid-test ("it hit me") and checked out free: App Store search on his phone shows nothing using it (web checks agreed). It won't fit under the icon (~13-14 char truncation, which Patrick rejected), so the icon label is the short "Remember" — noted and accepted that it sits visually near Apple's "Reminders". **(BUILT in #65.)**

**3. ICON DECIDED: first custom icon** (replaces the Expo placeholder). Approved via mockup rounds: a line-drawn smiling face — "the happy face when you remember something good" — brick-red lines (`#b04a1a`) on gold (`#eec55a`), 4-point sparkle + small dot at the upper-right temple. Final art must be an edge-to-edge 1024×1024 square (iOS rounds the corners itself — no baked-in rounding). Same icon everywhere: Patrick declined notification-specific art (iOS can't swap the banner icon; the attachment-thumbnail workaround was offered and declined). **(BUILT in #65.)**

**4. BUILT + Simulator-approved (the session's one code change): crisp Home-tile outlines, halo dropped.** Patrick: the tiles "seem a little blurry" (both themes). Cause read from the code: 1.5px borders in near-fill colors plus the #56 halo glow. Fix: `Themes.ts` got a new `tileCircleBorderWidth` key (light **2** / dark **3**, Patrick's picks); light border `#43a297` → `#1a6e8a` (header teal), dark `#a3481f` → `#f0a83a` (the outlined-gold convention); `home.tsx`'s iconCircle reads the width key instead of the hard-coded 1.5. The halo was softened, nudged up twice, then turned **OFF** (Patrick: "That is the best") — `tileHaloOpacity: 0` in both themes, radius left in place; pre-#64 restore values if ever missed: light 0.75/10, dark 0.55/8. `tsc` clean.

**Phone-test status (#63 build): still mid-test, multi-day** — the remaining Orders checks ride along with the #65 build (see pending.txt). The #63 docs commit stays pending accordingly.

**Commit note:** #64 code (`Themes.ts` + `home.tsx`) was committed by Patrick (confirmed at #65 start); the #64 docs ride the #65 docs commit.

---

*Only the last two sessions are kept here. Older session detail isn't archived in the docs anymore — git history holds the full record.*
