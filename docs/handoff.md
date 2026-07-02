# Hand-off note — paste at the start of the next session

## THIS SESSION — #44 (2026-07-02) "Home page dark theme — BUILT": **`home.tsx` now has the approved dark theme; `tsc` clean; Patrick confirmed it in the Simulator.** Also confirmed the #43 open question (theme applies to ALL 13 pages, not Home-only) and agreed a 9-session build order to get there.

**Start-of-session facts:** Confirmed git was clean at session start (last commit: "Home page #43 polish & dark theme add - plan" — that session's docs).

**Scope confirmed:** Patrick confirmed the theme is not Home-only — it goes on all 13 pages, one file per session.

**Build order agreed, in this sequence (files sharing a session are paired for a reason — see why below):**
1. ✅ **Home** — `home.tsx` (this session).
2. **#45 — `backup.tsx` + `watchlist.tsx`.** Both small, no modals, low risk — a good pair to work out the "list page" pattern (vs. Home's tile grid).
3. **#46 — `shopping.tsx` + `vault.tsx`.** Medium size, same list/card pattern as #45.
4. **#47 — `timer.tsx` + `settings.tsx`.** Paired because both use native `Switch` toggles that need explicit `trackColor`/`thumbColor` values — doesn't come free from a style change.
5. **#48 — `todo.tsx`.** Standalone — its colors are injected from a `PRIORITY_COLORS` JS object in the code, not just the stylesheet, so this needs logic edits.
6. **#49 — `planner.tsx`.** Standalone — same color-map situation as todo (`PRIORITY_COLORS` + `STATUS_COLORS`), plus the most structurally complex file (projects, tasks, progress bars).
7. **#50 — `lookahead.tsx`.** Grouped sections, swipe-to-delete, modals — a smaller preview of the pattern myday/myweek/mollie all share.
8. **#51 — `myday.tsx`.** The biggest file (5 modals, ~340 lines of styles) — sets the pattern for the routine-tracker trio.
9. **#52 — `myweek.tsx` + `mollie.tsx`.** Copy myday's pattern onto both — near-duplicate files, should go fast.

**What was built — `home.tsx` (exact #43 values, Simulator-confirmed by Patrick):**
1. Added a `Theme` object local to `home.tsx` — header `#f0a83a`, page background `#3a3024`, bridge `#c9622e`, tile-circle fill `#c9622e` / border `#a3481f`, tile label `#f0d9a8`, title `#4a1f0c`, subtitle `#6b3418`. Kept **local to this file on purpose** — `constants/Colors.ts` isn't touched yet, since the other 12 pages still read its light-theme values until their own sessions convert them.
2. Header: title 17px/600 `#4a1f0c`, subtitle 13px/500 `#6b3418`, both still Georgia italic (font unchanged). Bridge stripe `#c9622e`.
3. Tiles: removed the white card/shadow/border. Each module is now a 44px icon circle (`#c9622e` fill, 1.5px `#a3481f` border) with the label directly on the page background — Georgia 13px/600, `#f0d9a8`. Emoji icons got a subtle drop shadow for definition against the dark background.
4. **Two things found and fixed that weren't in the original #43 spec:**
   - **Shopping cart (🛒)** swapped for `Ionicons name="cart"`, `#d8dde3` — as planned.
   - **Settings gear (⚙️)** turned out to have the same problem as the cart: checking the raw file bytes showed the ⚙️ character carries the VS16 emoji-style marker, so RN's `color` style is silently ignored on iOS (it stayed grey no matter what color was set). Swapped to `Ionicons name="settings"`. Patrick first said white was fine, then asked for it to match "the divider/border" — turned out he meant the tile-circle/bridge color once we compared (`#c9622e` — the tile-circle fill and bridge stripe are already the same color; `#a3481f` is a separate, darker circle-*border* color he hadn't meant). Set to `#c9622e`.
5. `npx tsc --noEmit` clean throughout, exit 0 each time.

**New parked item:** Patrick wants a **Theme toggle button in Settings**, eventually — no scope or urgency yet. Added to `parked-items.md`.

**Nothing else touched this session** — only `app/home.tsx` changed. Not yet committed; Patrick commits at session end.

**➤ NEXT SESSION — pick up here:**
1. Build `backup.tsx` + `watchlist.tsx` (#45 in the order above) — same "colored icon circle / no white card" theme as Home, adapted to their list layouts (not a tile grid).
2. Confirm Patrick's still happy with the 9-session order above before starting, in case anything's changed.
3. Everything still queued from #42/#43 remains open and untouched: item 1 (name the backup folder), item 3 (Vault import — needs a discussion session), item 4 (My Day past-day banner), the backup-keys bug, structured reminder tests, phone checkpoints A + B.

---

## SESSION — #43 (2026-07-02) "Polish the Home page — dark theme mocked up, NOT built": **Design-only session, nothing committed.** Patrick's goal: the Home page tiles felt "blah" (plain white backgrounds). Worked through several rounds of chat mockups (no app files touched) and landed on an approved warm dark theme for Home. Session ended before building — Patrick switched to a different model (Fable 5) for the next session, and asked for the decisions written up here first so nothing gets lost or re-litigated.

**Start-of-session facts:** Confirmed #42 was already committed — `git status` showed a clean working tree at session start (last commit: "New list of 7 from #41 session"). Patrick also flagged he'd accidentally deleted the **#41 chat session** a while back and is renumbering going forward — this session is **#43** (the docs' own session numbers for #41/#42 content stay as originally recorded; only the live numbering going forward changes).

**What was done — mockup rounds, all in chat only, nothing built:**
1. Read `app/home.tsx` + `constants/Colors.ts` to describe the actual current look accurately before proposing anything (2-column grid, 10 white rounded tiles, blue header `#1a6e8a`, Georgia italic title).
2. Mocked 3 tile-background directions (color-by-category tint, one uniform warm tint, white tile + colored icon-circle badge). Patrick liked the icon-circle idea, specifically **without** the white card behind it — just the colored circle + label sitting directly on the page background.
3. Patrick asked for a dark theme "like Mystery Clues Tracker." Read that project's actual `mystery-clues-tracker.html` `:root` CSS variables (not guessed) and mocked a dark version using its real palette.
4. Iterated color by color, one change at a time, each confirmed before the next: lightened the near-black page background → matched tile-circle color to the header gold → brightened/warmed that gold → tuned the header lettering weight (too bold, then too plain, landed in between) → made tile labels use Georgia serif instead of sans-serif → swapped tile-circle color from gold to a reddish-orange (Patrick wanted it warmer, not the blue complementary color first tried) → matched the bridge stripe under the header to the new tile color → fixed the shopping-cart icon getting lost against the background → deepened/enriched the header gold because it felt dull next to the richer tile color.
5. Compared the final dark theme side-by-side against the original light theme — **approved**.

**Approved design (exact values, ready to build):**
- Layout: no white card behind tiles — colored icon circle + label directly on the page background.
- Header background `#f0a83a`; title text `#4a1f0c` weight 600, size 17; subtitle `#6b3418` weight 500, size 13; both Georgia italic (unchanged font).
- Page background `#3a3024`. Bridge stripe under header `#c9622e` (matches tile circles).
- Tile icon circles: background `#c9622e`, border `1.5px solid #a3481f`, 44px diameter.
- Tile labels: Georgia serif (not sans-serif), 13px, weight 600, color `#f0d9a8`.
- Icon shadow: emoji icons get a subtle `textShadow` (`0 1px 3px rgba(0,0,0,0.5)`) for definition against the warm background — this works in real React Native, confirmed, not just the chat mockup.
- **Shopping List icon exception:** the 🛒 emoji reads poorly against the warm tile color and can't be recolored (system emoji glyphs, no filter support on RN `Text`). Agreed fix: swap just this one icon for a vector icon from `@expo/vector-icons` (already a package.json dependency, confirmed **not currently used anywhere** in `app/`), colored light silver-gray `#d8dde3`. All other tiles keep their emoji.

**Open question — scope, NOT yet resolved:** `constants/Colors.ts` is shared by 13 files (`home.tsx`, `myday.tsx`, `myweek.tsx`, `mollie.tsx`, `todo.tsx`, `lookahead.tsx`, `planner.tsx`, `watchlist.tsx`, `vault.tsx`, `shopping.tsx`, `timer.tsx`, `settings.tsx`, `backup.tsx`). Patrick was asked: scope the new theme to just `home.tsx` (local colors, other 12 pages untouched), or apply it everywhere via the shared file. He said **"No"** to Home-only, but the session ended before confirming "apply to all pages" explicitly — **do not assume; confirm this first, next session.**

**Nothing to commit.** No app files were changed this session — everything above lived in chat-only visual mockups.

**➤ NEXT SESSION — pick up here:**
1. **Confirm the scope question above** before writing any code — Home-only was ruled out, but "all pages" hasn't been explicitly confirmed.
2. Build the approved dark theme (exact values above), one file at a time, `tsc` clean and Simulator-checked before moving to the next.
3. Everything queued from #42 is still open, untouched: item 1 (name the backup folder), item 3 (Vault import — needs a discussion session first), item 4 (My Day past-day banner Done — folded into structured tests), the backup-keys bug, structured reminder tests, phone checkpoints A + B.

---

*Only the last two sessions are kept here. Older session detail isn't archived in the docs anymore — git history holds the full record.*
