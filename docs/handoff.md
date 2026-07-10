# Hand-off note — paste at the start of the next session

## THIS SESSION — #71 (2026-07-09) "Publishing Memory" (became: Mystery Tracker mobile decided)

**A publishing/deciding session — NO app code changed in any project.
The session was named for Memory but the road chosen runs through the
Mystery app first. Everything below is recorded in the strategy doc
(Projects → App-Docs → `Publishing-Strategy.docx`) and in
`MysteryCluesTracker/docs/upgrade-scope.md`:**

1. **THE FOUR-PRODUCT GOAL is now written down** (it was only "options to
   keep open" before): both apps — Mystery Tracker AND Memory — on web
   AND mobile, all fully done and published. Recorded in the strategy doc
   as "The four products — decided."
2. **The fork is CHOSEN: Mobile first.** Clean up the Mystery mobile PWA
   (RENAMED "Mystery Tracker", same name as the web version) and take it
   to the App Store FREE. The Memory web version waits its turn.
3. **Full upgrade scope recorded** in `MysteryCluesTracker/docs/upgrade-scope.md`
   — the one file to read before touching that app. Highlights: player-
   configurable structure (1–4 categories, 1–30 cards — legally motivated,
   away from the famous game's fixed 6/6/9 shape); ✓/✗ cell tinting,
   Σ + House columns from the web app; NO tiering (free = everything on),
   no voice, no export, no Deductions; scrolling OK (landscape idea parked
   to mockup time).
4. **Route to the store DECIDED (research done, web-verified): bare
   Xcode + WKWebView wrapper.** Near-zero maintenance; Claude is built
   into Xcode 26 to help. A localStorage→native data-safety bridge is
   required work. Capacitor / Expo+WebView / PWABuilder passed over.
5. **New in THIS project:** `docs/publishing.md` — pointer to the
   publishing docs (the "App-Pubs" name is dead; fixed everywhere this
   session). LATE IN #71 the cross-project home MOVED: everything now
   lives in **Projects → App-Docs** — a git repo with a new
   `master-handoff.md` anchoring ONE session chain for all projects
   (Patrick's call: one folder, version-controlled; OneDrive copy is
   stale, marked with MOVED.txt).

**➤ NEXT SESSION (Patrick, end of #71): begin the Mystery Tracker mobile
upgrade "when we are ready." Connect Projects → MysteryCluesTracker and
read its `docs/upgrade-scope.md` first.** Open first steps there: the
quick "Clue" grep of in-app text, the mechanical pre-store fixes, or
mockups for the configurable setup + new columns — Patrick names the goal.

*Memory-app note: nothing changed here in #70–#71. The #69 badge-order
commit + build + phone check may still be pending — confirm with Patrick,
don't assume.*

---

## SESSION — #70 (2026-07-09, earlier) "Publishing: elyfont.com root fix + home page"

**A publishing-side session — NO app code changed in this project.** Full
detail lives in the strategy doc: **Projects → App-Docs →
`Publishing-Strategy.docx`** (moved from OneDrive late in #71).

1. **New folder in THIS project: `elyfont-home/`, holding one file,
   `index.html`.** This is the SOURCE of the live home page at
   **elyfont.com**. The site no longer opens straight into Mystery Tracker —
   the root is now a welcome page (Patrick wants the domain to host multiple
   apps) linking to the app and to the 266-step test procedure. If this file
   is ever edited, the live copy must be re-uploaded to the public repo
   `WWhiteWolf/mystery-tracker` (upload replaces; never rename anything to
   or from `index.html` there — see `MysteryTracker/docs/DEPLOY.md`).
2. **The stale-root problem is FIXED and verified live** (Patrick made all
   commits via the GitHub website). Mix-up cleaned: a copy accidentally
   committed to the private `MysteryTracker` repo was deleted.
3. **Repos archived by Patrick himself:** `WatchList` (its features live on
   in A Place To Remember) and `Health-Data`.

---

*Only the last two sessions are kept here. Older session detail isn't archived in the docs anymore — git history holds the full record.*
