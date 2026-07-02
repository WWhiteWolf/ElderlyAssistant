# Hand-off note — paste at the start of the next session

## THIS SESSION — #45 (2026-07-02) "Two-theme foundation + light Home — BUILT": **Big scope clarification from Patrick: the light theme is NOT going away — the app keeps BOTH themes.** Built the shared two-theme foundation (`constants/Themes.ts`), rewired `home.tsx` onto it, and designed + built the light Home look with Patrick (mockup rounds, one color at a time). `tsc` clean throughout; Patrick Simulator-checked BOTH themes.

**Start-of-session facts:** git was clean; #44's code + docs were committed together ("Session 44 (now) — home.tsx.").

**The scope change (supersedes "dark theme rollout" framing):** Patrick keeps both themes, shared across pages for consistency, with the future Settings toggle switching them. Rules agreed:
- **Each theme has ONE uniform tile-circle color** (dark: `#c9622e` as built; light: chosen this session — see spec).
- **Typography differs per theme on purpose** (Patrick's call): light keeps the ORIGINAL sizes; dark keeps its #43 look — EXCEPT the header title/subtitle sizes, which Patrick wants the SAME in both themes (original 28/22) so nothing jumps when themes switch.

**What was built:**
1. **`constants/Themes.ts` (new).** Both themes, identical keys: colors + per-theme typography (title/subtitle/label sizes, label font) + `iconShadow` flag (on in dark, off in light). `DEFAULT_THEME` near the bottom is a one-word switch (`'light'`/`'dark'`) until the Settings toggle exists. Pages call `useTheme()`; the future toggle upgrades that function's insides only — converted pages won't need edits.
2. **`app/home.tsx` rewired.** Local `Theme` object removed; styles now built by `makeStyles(theme)` at render — **this is the pattern every converted page copies.** Gear color = theme `settingsGear`, cart = theme `cartIcon`. Dark looks as approved in #44 (except header sizes, below).
3. **Light Home spec (approved, Simulator-confirmed):** header `#1a6e8a`; title white 28px/500 Georgia italic; subtitle `#a8d4e0` 22px; bridge `#2d9e8f`; page `#e8f4f8`; tile circles **`#4caba1`** ("3a" soft teal, picked from blend mockups between light blue and bridge teal) with `1.5px #348f86` border, 44px; labels 18px/600 SYSTEM font (not Georgia) `#1a6e8a`; cart icon **`#eaeff2`** (iterated: silver too dim → white too bright → landed between); gear `#4caba1` (= tile circle, same rule as dark); **no emoji shadow** in light. Planner pad 📋 stays an emoji in both themes (Patrick declined a vector swap after seeing a mockup).
4. **Dark header sizes changed:** title 17→28, subtitle 13→22 (weight 600 kept). Patrick saw the title size jump between themes and wants the original sizes in both.

**Known quirk, accepted:** at 28px the title "Remember When" WRAPS to two lines on the Simulator's narrower device (both themes); on Patrick's real phone it fits one line. Offered the RN one-line auto-shrink fix (`numberOfLines={1}` + `adjustsFontSizeToFit`); **Patrick declined — "if it is just a simulator thing, let it be."** Revisit only if it wraps on the real phone.

**Commit note:** `DEFAULT_THEME` is committed as **`'light'`** (where Patrick left it after testing; he was told and did not ask to change it). Flip the one word in `Themes.ts` to change the shipped look.

**Files touched:** `constants/Themes.ts` (new), `app/home.tsx`. `constants/Colors.ts` untouched — the other 12 pages still read it until converted.

**➤ NEXT SESSION — pick up here:**
1. **#46 — `backup.tsx` + `watchlist.tsx`** (the pair bumped from this session, Patrick's call). Now includes a small design pass FIRST: their list rows/buttons need an approved treatment in BOTH themes (nothing exists yet for either), then wire both files to `Themes.ts` with the `makeStyles(theme)` pattern, adding the new keys to BOTH palettes.
2. The rest of the rollout order (see parked-items.md) shifts down one session accordingly.
3. Still open and untouched from #42/#43: item 1 (name the backup folder), item 3 (Vault import — needs a discussion session), item 4 (My Day past-day banner), the backup-keys bug, structured reminder tests, phone checkpoints A + B.

---

## SESSION — #44 (2026-07-02) "Home page dark theme — BUILT": **`home.tsx` got the approved dark theme; `tsc` clean; Patrick confirmed it in the Simulator.** Also confirmed the #43 open question (theme applies to ALL 13 pages, not Home-only) and agreed a 9-session build order. (**#45 note:** the "dark rollout" framing is superseded — both themes now ship, see above — but the page order still stands, shifted one session.)

**What was built — `home.tsx` (exact #43 values):** local `Theme` object (now replaced by `Themes.ts` in #45) — header `#f0a83a`, page `#3a3024`, bridge/tile-circle `#c9622e`, circle border `#a3481f`, labels `#f0d9a8` Georgia 13px, title 17px/600 `#4a1f0c`, subtitle 13px/500 `#6b3418` (title/subtitle sizes changed to 28/22 in #45). Tiles became 44px icon circles, no white card. Cart ⚙️→`Ionicons cart` `#d8dde3`; settings gear had the same VS16 emoji problem → `Ionicons settings` `#c9622e`.

**New parked item:** Theme toggle button in Settings (foundation for it now exists after #45 — the toggle just upgrades `useTheme()` + adds the Settings control).

---

*Only the last two sessions are kept here. Older session detail isn't archived in the docs anymore — git history holds the full record.*
