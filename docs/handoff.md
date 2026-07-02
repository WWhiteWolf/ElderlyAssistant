# Hand-off note — paste at the start of the next session

## THIS SESSION — #48 (2026-07-02) "Themes timer.tsx + settings.tsx + THE TOGGLE": **Both pages on `Themes.ts` in both themes AND the Settings theme-toggle + popup choice built; `tsc` clean; Patrick Simulator-checked everything (both pages both themes, live switching, dark popups, one-screen Settings) and approved ("Perfect").** Mockup-first throughout; page logic untouched.

**Start-of-session facts:** git clean; #47 code + docs committed together (`DEFAULT_THEME` went in as `'light'`). The session was first named #47 by mistake — it's #48 (Patrick confirmed). Patrick's scope call: convert the two pages first; toggle only as a follow-on if appetite remained (it did).

**Ten new theme keys, both palettes (light / dark):** `pill` `#2d9e8f`/`#f0a83a` + `pillSelected` `#2d9e8f`/`#c9622e` (timer minute-presets; also rides Settings' section headers), `switchTrackOn` `#1a6e8a`/`#c9622e`, `switchTrackOff` `#cccccc`/`#5c5044`, `switchThumb` `#ffffff`/`#fff6de`, `buttonDone` + `buttonDoneText` `#27ae60`+`#ffffff` in BOTH (green means done, like red means delete), `countdown` `#2d9e8f`/`#fff6de`, `settingValue` `#2d9e8f`/`#fff6de`, `settingArrow` `#a8d4e0`/`#e9dcba`.

**One deliberate light-theme change (Patrick approved from mockup):** Settings' Vault-Security switch was teal-track/blue-thumb; ALL switches now share the switch keys (light: blue track, white thumb — same as timer's). Also both popup Cancel/Save buttons got the #47 border treatment (quiet `buttonNeutral` Cancel, invisible-border Save).

**THE TOGGLE (built #48):** `constants/Themes.ts` gained a `ThemeProvider` (no JSX — it's a .ts file, uses `createElement`) wrapped around the Stack in `app/_layout.tsx` (one wrap, nothing else touched there). Choices persist as `app_theme` (`'light'|'dark'`) and `popup_style` (`'match'|'phone'`); `useTheme()` reads context live (falls back to `DEFAULT_THEME`, now demoted to first-launch fallback, committed `'light'`); `useThemeControls()` is Settings' hook.

**Popup choice (Patrick's call — user-settable, not hard-wired):** "Popup Colors" = Match App / Follow iPhone. Match App drives `Appearance.setColorScheme(themeName)` so Apple-drawn pieces (Alerts, share sheet, file picker) follow the app theme — this settles #46's parked `userInterfaceStyle: "automatic"` question. Follow iPhone (`setColorScheme(null)`) is the old behavior. Verified working in the Simulator (dark alert over dark app).

**Appearance UI (iterated twice, both times Patrick's ask):** (1) switches replaced with side-by-side CHOICE BUTTONS — solid = active, outlined = other option — because an off "Dark Theme" switch didn't say what it does ("Even I can get that"). (2) whole Settings page tightened to fit ONE SCREEN, no scrolling: choice label + buttons share a row, section-header padding 20→10, row padding 16→10/12, version margin 30→10, page bottom padding 40→12, popup hint line dropped.

**Known small quirk (told Patrick):** dark-theme users may see a brief light flash at launch while the stored choice loads.

**Housekeeping in the two pages:** placeholders now `mutedText`; dead styles removed (timer: `backBtn`/`backText`/`settingsBtnText`; settings: `backText`). Selected chips carry invisible borders for size-match (#47 rule).

**Newly parked:** (1) backup-keys bug GREW — `app_theme`/`popup_style` join the four missing keys in `READABLE_KEYS`. (2) **Rename the app back to "Remember When"** (Patrick): "Elyfont" only existed for Siri, which is parked; lives in `app.json` `"name"` + backup.tsx file naming/`elyfont-backup` type marker (old backups must stay restorable). Replaces the old "finish the Elyfont renaming" item.

**Commit note:** NOT yet committed. `DEFAULT_THEME` is `'light'` (correct to commit — it's only the fallback now; the live theme is the stored Settings choice).

**➤ NEXT SESSION — pick up here:**
1. **#49 — `todo.tsx`** (rollout order item 5): standalone; colors come from a `PRIORITY_COLORS` JS object in the code, not just the stylesheet — first conversion needing LOGIC edits, take it carefully.
2. Still open and untouched: name the backup folder, app-name revert, Vault import discussion, backup-keys bug (now six keys), Vault "Custom" label bug (unverified), structured reminder tests, phone checkpoints A + B. The toggle work needs its real-phone check too — fold into the next TestFlight build test.

---

## SESSION — #47 (2026-07-02) "shopping.tsx + vault.tsx converted": **Both pages on `Themes.ts` in both themes; `tsc` clean; Patrick Simulator-checked BOTH themes on BOTH pages (including Vault's New/Edit popup) and approved.** Mockup-first throughout; logic untouched except one alert-wording change Patrick asked for.

**NEW STYLE CONVENTION (Patrick's call, mid-session):** in dark, **solid orange = action; outlined gold = quiet/settled** (`#f0a83a` border + text on a dark inset). Applied to Shopping's Stocked, Vault's Edit, and the popup Cancel.

**Dark text brightened (Patrick picked "Level 3"):** `bodyText`, `buttonPrimaryText`, `buttonNeutralText` → `#fff6de`; `mutedText` → `#e9dcba`. This deliberately brightened Backup + Watch List too (shared keys). **Home's `tileLabel` still has the old dimmer cream `#f0d9a8`** (separate key); Patrick was told and hasn't asked to lift it.

**Eleven new theme keys, both palettes:** `buttonNeutral`, `buttonNeutralBorder`, `buttonNeutralText`, `buttonDelete` + `buttonDeleteText` (red in BOTH), `stockedButton`, `stockedButtonBorder`, `stockedButtonText`, `rowSelected`, `rowSelectedBorder`, `chip`. Inputs needed NO new keys (bg `pageBackground`, border `cardBorder`, text `bodyText`, placeholder `mutedText`).

**Build details worth knowing:** where a solid button sits next to an outlined partner the solid one carries an INVISIBLE border of the same width so sizes match. Vault's category emoji get the `iconShadow` recipe.

**The one logic-adjacent change (Patrick's ask):** Vault's "Missing Info" alert — "Tap a Label above, then enter a Value." with chips; "Enter a Label and a Value." in Other.

**Parked in #47:** suspected Vault `'custom'`/`'Custom'` case bug (UNVERIFIED, repro steps in parked-items.md); future "Remove categories from Vault" discussion.

---

*Only the last two sessions are kept here. Older session detail isn't archived in the docs anymore — git history holds the full record.*
