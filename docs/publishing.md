# Publishing — where the documents live (pointer page)

The publishing/business documents for all apps live OUTSIDE this project,
in **Projects → App-Docs** (a git repo — moved there from OneDrive on
2026-07-09, #71). Connect that folder at the start of any publishing
session and start with **`master-handoff.md`** there — it anchors the one
session chain for all projects. (Older notes saying "App-Pubs" or
"OneDrive" are out of date.)

## The documents there that matter to this app

- **`master-handoff.md`** — the cross-project session anchor: where all
  four products stand, the next session's goal, and pointers into each
  project's own docs. Read it first.
- **`Publishing-Strategy.docx`** — the north star for the whole publishing
  effort: the two lanes (web rehearsal / App Store mission), the three
  phases, the standing rules, and the rolling "Next session — start here"
  note that Claude refreshes at the end of each publishing session.
  **Always read it at the start of a publishing session — it is the
  living copy; don't duplicate it here.**
- **`My-Tools-and-Extensions.docx`** — the cross-project master list of
  tools (VS Code extensions, Expo/EAS, TestFlight, Apple Developer
  Program, etc.).

Also in that folder, but NOT this project's: the two `mtr-master-test`
files are Mystery Tracker's 266-step test procedure.

## What stays IN this project

App-specific release material for this app — App Store listing text,
screenshots, privacy-policy text, and the like — belongs here in the
app's own repo (per the strategy doc). As that material gets made, keep
it under `docs/` and list it below so it's findable.

- *(nothing yet — Phase 2 is just beginning)*

## Build steps

Simulator: npm run ios

PHONE:
VS Code: Commit/build/submit
eas build --platform ios --profile production
Yes, yes
eas submit --platform ios --profile production
Yes, yes, check build name, yes
TestFlight update
