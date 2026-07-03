# Hand-off note — paste at the start of the next session

## THIS SESSION — #52 (2026-07-02) "Theme 'myday.tsx' — #52": **myday.tsx on `Themes.ts` in both themes; `tsc` clean; Patrick Simulator-checked BOTH themes (page, tiles, all five popups) and approved. Mockup-first; page logic untouched. Title 26 → 24 (the #51 rule). This sets the pattern for the routine-tracker trio — My Week + Pets copy it next.**

**Five new theme keys, both palettes:** `counterMinus` `#ffcc00` in BOTH themes + `counterMinusText` (`#ffffff`/`#4a1f0c` — bright fill gets dark-brown text in dark, same rule as the gold buttons) for the Coffee/Water "−" circle; `timeStepper` / `timeStepperBorder` / `timeStepperText` for the New/Edit Entry time-spinner ▲▼ circles — light: solid blue via the #47 invisible-border trick; dark: outlined gold (a quiet adjust control, so Save stays the only solid-orange button in that popup).

**Patrick's ✓ call (#52):** the done-state ✓ button is **GREEN in BOTH themes** — it rides Timer's `buttonDone`/`buttonDoneText` keys ("green means done" now covers My Day too). Picked from a 4-option mockup; supersedes the first build's teal `statusActive`. The rest: Log stays SOLID `buttonPrimary` (mark-done action, the #51 rule); on-tile Snooze + the 15/30/60 picker ride the `delay` keys (Snooze = Delay, same `#FF9500` both themes); counter "+" rides `bridge`; reorder-arrows overlay solid `buttonPrimary`; Edit exactly like Look Ahead's (`pageBackground` fill + `pill` border/text); Cancel got the #47 border treatment; all 5 inputs got `mutedText` placeholders (#48 rule); greys (`#aaa/#666/#999/#eee`) unified onto `mutedText`/`progressTrack`; 14 dead styles removed.

**Three approved deviations from the mockup (dark only; Patrick OK'd them on screenshots):** Clear All is `mutedText` cream-outlined (matches Look Ahead's identical button, not the mockup's gold); the Coffee/Water divider rides `cardBorder`; the Hour/Minute/AM-PM captions ride `bodyText`.

**Process note (Patrick flagged it TWICE in #52):** the #48 no-boxed-questions rule got broken twice ("2 ? again") — questions with embedded options ("...or...?") count as boxed. ONE genuinely open question, nothing else.

**Commit note:** NOT yet committed — `app/myday.tsx` + `constants/Themes.ts` + these docs. Patrick commits.

**➤ NEXT SESSION — pick up here:**
1. **#53 — `myweek.tsx` + `mollie.tsx`** (rollout item 9): near-duplicates of myday's pattern, should go fastest. The last two unconverted pages.
2. After them: the **PRE-BUILD BATCH** (Patrick, #51 — see parked-items: titles to 24, matching button labels, the icon-label rename), THEN the ONE batched TestFlight build + phone checkpoints (fold in the #48 toggle test and the #49–#52 pages). **BUILD POLICY stands (#50): no per-session builds** — EAS builds past the $45 credit cost real money; Patrick handles Expo billing.
3. Still open and untouched: backup-keys bug (six keys), app-name revert, backup folder naming, Vault import discussion, Vault "Custom" label bug (unverified), structured reminder tests, phone checkpoints A + B, and the page-titles-to-24 parked item.

---

## SESSION — #51 (2026-07-02) "Theme 'lookahead.tsx' — #51": **lookahead.tsx on `Themes.ts` in both themes; `tsc` clean; Patrick Simulator-checked both themes (page, tiles, all three popups, new header) and approved. Mockup-first; page logic untouched. PLUS the title-24 decision and the deliberate two-line header.**

**Two new theme keys, both palettes (light / dark):** `delay` `#FF9500` in BOTH themes (the "delay color" stays identical so a delayed item always jumps out) + `delayText` `#ffffff`/`#4a1f0c` (bright fill gets dark-brown text in dark — same rule as the gold buttons). Everything else rode existing keys: the Edit button and the Monthly/3/6/Yearly group headers use `pill` (teal in light / gold in dark); greys unified onto `mutedText` / `progressTrack`; #47 invisible-border treatment on Cancel/Save; all 3 inputs got `mutedText` placeholders (#48 rule). Light pixel-true apart from those standing conventions. Per-tile **Log is SOLID `buttonPrimary`** (the mark-done action) — deliberately NOT Planner's outlined-gold Log. Delay button + Delay popup buttons + the "▶ Delayed …" tile line use the `delay` keys.

**TITLE-SIZE RULE (Patrick, #51 — supersedes #50's "22–26 all fine"):** ALL page titles eventually 24. Look Ahead is 24; the rest are PARKED. Home is 28 by a deliberate #45 choice — whether "all" includes Home is Patrick's call. The "Look Ahead 🔭" header is deliberately two lines (title Text + telescope Text in a `titleWrap` column) — don't merge them back into one string.

**Commit note:** committed as "Theme lookahead.tsx — #51." (code + docs together).

---

*Only the last two sessions are kept here. Older session detail isn't archived in the docs anymore — git history holds the full record.*
