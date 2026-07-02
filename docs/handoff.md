# Hand-off note — paste at the start of the next session

## THIS SESSION — #47 (2026-07-02) "shopping.tsx + vault.tsx converted": **Both pages on `Themes.ts` in both themes; `tsc` clean; Patrick Simulator-checked BOTH themes on BOTH pages (including Vault's New/Edit popup) and approved.** Mockup-first throughout; logic untouched except one alert-wording change Patrick asked for.

**Start-of-session facts:** git clean; #46 code + docs committed together; `DEFAULT_THEME` went into that commit as `'dark'`. The session name said timer+settings again by mistake — corrected to shopping+vault per the rollout order (same mixup as #46; timer+settings is genuinely NEXT now).

**NEW STYLE CONVENTION (Patrick's call, mid-session):** in dark, **solid orange = action; outlined gold = quiet/settled** (`#f0a83a` border + text on a dark inset). Applied to Shopping's Stocked, Vault's Edit, and the popup Cancel. The Stocked button iterated to get there: quiet brown → sandy → solid header gold (built + seen in Sim) → **outlined gold final**. Light theme untouched by all of this (Stocked stays solid teal, Cancel stays grey).

**Dark text brightened (Patrick picked "Level 3"):** `bodyText`, `buttonPrimaryText`, `buttonNeutralText` → `#fff6de`; `mutedText` → `#e9dcba`. This deliberately brightens Backup + Watch List too (shared keys — Patrick chose knowing). **Home's `tileLabel` still has the old dimmer cream `#f0d9a8`** (separate key); Patrick was told and hasn't asked to lift it.

**Eleven new theme keys, both palettes (light / dark):** `buttonNeutral` `#cccccc`/`#4a3e30`, `buttonNeutralBorder` `#cccccc`/`#f0a83a`, `buttonNeutralText` `#333333`/`#f0a83a`, `buttonDelete` + `buttonDeleteText` `#e74c3c`+`#ffffff` in BOTH (red means delete), `stockedButton` `#2d9e8f`/`#3a3024`, `stockedButtonBorder` `#2d9e8f`/`#f0a83a`, `stockedButtonText` `#ffffff`/`#f0a83a`, `rowSelected` `#d6eef8`/`#5c5044`, `rowSelectedBorder` `#1a6e8a`/`#f0a83a`, `chip` `#ffffff`/`#3a3024` (Vault preset chips). Inputs needed NO new keys: bg = `pageBackground`, border = `cardBorder`, text = `bodyText`, placeholder = `mutedText` (`placeholderTextColor` added in both files — Vault's four inputs had none before).

**Build details worth knowing:** where a solid button sits next to an outlined partner (Need vs Stocked; Add/Update vs Cancel) the solid one carries an INVISIBLE border of the same width so sizes match. Vault's category emoji get the same `iconShadow` recipe as backup's arrows. Vault's Show button rides the `bridge` key; Edit is outlined `cardTitle`.

**The one logic-adjacent change (Patrick's ask):** the Vault "Missing Info" alert now says **"Tap a Label above, then enter a Value."** in categories with chips, and **"Enter a Label and a Value."** in Other (typed labels) — small `missingInfoMessage()` helper used by both Add and Update paths.

**Newly parked:** (1) suspected Vault bug — the save path compares `'custom'` lowercase but the chip sets `'Custom'`, so a typed custom label may save as the word "Custom"; **UNVERIFIED**, repro steps in parked-items.md. (2) Patrick wants a future "Remove categories from Vault" discussion (like #42 did for To-Do) — under Design decisions.

**Commit note:** NOT yet committed. `DEFAULT_THEME` currently `'light'` (where Patrick's testing left it) — confirm which theme to commit.

**➤ NEXT SESSION — pick up here:**
1. **#48 — `timer.tsx` + `settings.tsx`** (rollout order item 4): both use native `Switch` toggles needing explicit `trackColor`/`thumbColor` per theme. This pair is also the natural home for the parked **Settings theme-toggle** build and the `userInterfaceStyle: "automatic"` decision (iOS popups following the phone, not the app) — decide at session start whether the toggle is IN scope or a later session.
2. Still open and untouched: name the backup folder, Vault import discussion, backup-keys bug, structured reminder tests, phone checkpoints A + B.

---

## SESSION — #46 (2026-07-02) "backup.tsx + watchlist.tsx converted — BUILT": **Both pages now run on `Themes.ts` in both themes; `tsc` clean; Patrick Simulator-checked BOTH themes on BOTH pages and approved.** Design pass done mockup-first (both approved with no color changes requested).

**Start-of-session facts:** git was clean; #45 committed. Patrick had renamed the session pair to timer+settings by mistake — corrected to backup+watchlist per the rollout order.

**Fixed first — #45 loose end:** the committed `Themes.ts` still had the dark header at 17/13 despite #45's decision (28/22 in both themes). Now 28/22 in both. **Also, Patrick's call: light `cartIcon` is now `#d8dde3`** (same as dark; supersedes #45's `#eaeff2`).

**Eight new theme keys, added to BOTH palettes (light / dark):**
- `card` `#ffffff` / `#4a3e30` — card & list-row background
- `cardBorder` `#a8d4e0` / `#a3481f`
- `cardTitle` `#1a6e8a` / `#f0a83a` — card button titles, Watch List S/E progress text
- `bodyText` `#1a6e8a` / `#f0d9a8`
- `mutedText` `#888888` / `#c9b896` — replaced all hardcoded greys (#aaa/#888/#666)
- `headerButton` `#ffffff` / `#4a1f0c` — header pill border + text
- `buttonPrimary` `#1a6e8a` / `#c9622e` — solid action buttons + selected provider chip
- `buttonPrimaryText` `#ffffff` / `#f0d9a8`

**Page changes (styles only, logic untouched):** both files dropped `Colors.ts` and use `useTheme()` + `makeStyles(theme)`. backup.tsx: back pill label "← Settings" → **"← Back"** (the word wrapped to two lines in the fixed-width-90 pill; Patrick chose the shorter word over auto-sizing). Its ⬆️⬇️ emoji get the dark drop shadow (`iconShadow`). watchlist.tsx: "← Home" kept (fits).

**Process lesson (cost us one round):** Patrick's open VS Code buffer of `Themes.ts` saved over Claude's edits once — the new keys vanished while backup.tsx referenced them (black/transparent cards in the Sim until re-applied). Rule: files Claude is editing must not sit unsaved in VS Code tabs.

**Patrick's session preferences, respect these:** no button-style multiple-choice questions (ask in plain text), and ONE question at a time.

**New parked item:** `app.json` has `userInterfaceStyle: "automatic"` — iOS-drawn pieces (Alerts, share sheet, keyboard) follow the PHONE's light/dark setting, not the app theme. Decide at the Settings-toggle session: pin them, or make the app theme follow the phone.

**Commit note:** NOT yet committed. `DEFAULT_THEME` currently `'dark'` (where Patrick's testing left it) — confirm which theme to commit.

**➤ NEXT SESSION — pick up here:**
1. **#47 — `shopping.tsx` + `vault.tsx`** (rollout order item 3): same drill — mockup rounds for any elements the existing keys don't cover, then wire both to `Themes.ts`. Many needed keys now exist (cards, rows, inputs, chips, primary buttons).
2. Still open and untouched: name the backup folder, Vault import discussion, backup-keys bug, structured reminder tests, phone checkpoints A + B.

---

*Only the last two sessions are kept here. Older session detail isn't archived in the docs anymore — git history holds the full record.*
