# Hand-off note — paste at the start of the next session

## THIS SESSION — #53 (2026-07-02) "Theme — myweek.tsx + mollie.tsx #53": **BOTH pages on `Themes.ts` in both themes; `tsc` clean; Patrick Simulator-checked BOTH themes on BOTH pages (pages, tiles, all popups) and approved. THE TWO-THEME ROLLOUT IS COMPLETE — all 13 pages converted.** Mockup-first for My Week (page + New Chore + Postpone popups); Pets needed no mockup — no new elements, everything had a #52-approved treatment. Page logic untouched. Titles 26 → 24 on both (the #51 rule).

**ZERO new theme keys — `Themes.ts` untouched.** Everything rode existing keys:
- **My Week:** Postpone button, "Tomorrow (+1 day)", and the "▶ moved to <day>" tile line ride the `delay` keys (same #FF9500 both themes); the day/time tile line ("Tue 7:00 PM") rides `pill` (light unchanged teal / gold in dark); Done = solid `buttonPrimary`; Edit = outlined `pill`; **day chips (the one element My Day didn't have):** unselected = `pageBackground` fill + `cardBorder` border + `bodyText` text (light pixel-true), selected = solid `buttonPrimary` — Patrick OK'd the dark New Chore popup having TWO solid oranges (Save + the selected day; Timer's selected-pill precedent, bends #52's "Save stands alone").
- **Pets (`mollie.tsx`):** Snooze + the 15/30/60 popup ride `delay`; Treats "−" on `counterMinus` (new `minusBtnText` style — dark-brown text on the yellow in dark), "+" on `bridge`, count on `bodyText`; Log solid `buttonPrimary`; Edit outlined `pill`; time stepper on the `timeStepper` keys. New/Edit Entry popup deliberately kept borderless (faithful to the old light look; My Day/My Week's have a thin border).
- **Both:** ✓ done state now GREEN in BOTH themes via `buttonDone` (the #52 "green means done" rule — a visible light-theme change, was teal; Patrick approved on the mockup); #47 invisible border on Cancel; #48 `mutedText` placeholders (3 inputs My Week, 4 Pets); greys (#aaa/#666/#999/#eee/#ccc) unified onto `mutedText`/`progressTrack`/`buttonNeutral`; spinner captions on `bodyText`.

**Rollout consequence:** every page now reads `Themes.ts` — `constants/Colors.ts` is officially retirable (its own small parked item, now unblocked; check nothing else imports it first).

**Commit note:** NOT yet committed — `app/myweek.tsx` + `app/mollie.tsx` + these docs. Patrick commits.

**➤ NEXT SESSION — pick up here:**
1. **PRE-BUILD BATCH** (Patrick, #51 — see parked-items): remaining titles to 24 (To-Do explicitly; check the other converted pages; Home-at-28 is Patrick's call), matching button labels (To-Do "New Task" vs Vault "+ Add"), the icon-label rename to "Remember When".
2. THEN the ONE batched TestFlight build + phone checkpoints (fold in the #48 toggle test and the #49–#53 pages). **BUILD POLICY stands (#50): no per-session builds** — EAS builds past the $45 credit cost real money; Patrick handles Expo billing.
3. Still open and untouched: backup-keys bug (six keys), backup folder naming, Vault import discussion, Vault "Custom" label bug (unverified), structured reminder tests, phone checkpoints A + B, Colors.ts retirement.

---

## SESSION — #52 (2026-07-02) "Theme 'myday.tsx' — #52": **myday.tsx on `Themes.ts` in both themes; `tsc` clean; Patrick Simulator-checked BOTH themes (page, tiles, all five popups) and approved. Mockup-first; page logic untouched. Title 26 → 24 (the #51 rule). This set the pattern for the routine-tracker trio — My Week + Pets copied it in #53.**

**Five new theme keys, both palettes:** `counterMinus` `#ffcc00` in BOTH themes + `counterMinusText` (`#ffffff`/`#4a1f0c` — bright fill gets dark-brown text in dark, same rule as the gold buttons) for the Coffee/Water "−" circle; `timeStepper` / `timeStepperBorder` / `timeStepperText` for the New/Edit Entry time-spinner ▲▼ circles — light: solid blue via the #47 invisible-border trick; dark: outlined gold (a quiet adjust control, so Save stays the only solid-orange button in that popup).

**Patrick's ✓ call (#52):** the done-state ✓ button is **GREEN in BOTH themes** — it rides Timer's `buttonDone`/`buttonDoneText` keys ("green means done" now covers My Day too). Picked from a 4-option mockup; supersedes the first build's teal `statusActive`. The rest: Log stays SOLID `buttonPrimary` (mark-done action, the #51 rule); on-tile Snooze + the 15/30/60 picker ride the `delay` keys (Snooze = Delay, same `#FF9500` both themes); counter "+" rides `bridge`; reorder-arrows overlay solid `buttonPrimary`; Edit exactly like Look Ahead's (`pageBackground` fill + `pill` border/text); Cancel got the #47 border treatment; all 5 inputs got `mutedText` placeholders (#48 rule); greys (`#aaa/#666/#999/#eee`) unified onto `mutedText`/`progressTrack`; 14 dead styles removed.

**Three approved deviations from the mockup (dark only; Patrick OK'd them on screenshots):** Clear All is `mutedText` cream-outlined (matches Look Ahead's identical button, not the mockup's gold); the Coffee/Water divider rides `cardBorder`; the Hour/Minute/AM-PM captions ride `bodyText`.

**Process note (Patrick flagged it TWICE in #52):** the #48 no-boxed-questions rule got broken twice ("2 ? again") — questions with embedded options ("...or...?") count as boxed. ONE genuinely open question, nothing else.

**Commit note:** committed as "Theme  — myday.tsx #52." (code + docs together).

---

*Only the last two sessions are kept here. Older session detail isn't archived in the docs anymore — git history holds the full record.*
