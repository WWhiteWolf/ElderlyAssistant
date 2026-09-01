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
  note. Always read it at the start of a publishing session. Memory's
  own picture from #46-new is also recorded in this file, at Patrick's
  word, so it can be found in this repo.
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

**Picture at #46-new** (also in `Publishing-Strategy.docx`):

Mystery Clues Track Sheet is live on the App Store since 2026-08-06.
The rehearsal is done. Memory is the mission. He is living with the
#45-new build. Remaining app work and the first store submit run in
tandem: submit without auto-release, and keep working while Apple
reviews. The first trip is the slow one; later ready versions go
through easier. That was learned from Mystery.

The selling description is its own work, over as many sessions as it
takes: easy to read and follow, well worded, warm and interesting.
Apple's product-page craft and Ogilvy's English, pointed at the best
parts — not a spec sheet. Claude writes the sell. This file and the
Publishing Strategy are the home; Memory's docs index had no file for
it.

Daily is the foundation the rest was built around. Daily is ordinary
timed reminders (10:00, take your medication), and the standing list
with no clock (did I take my vitamins? have I texted my family?) where
you tell it you did it and when, and whatever from the other pages
lands today. The day you live in is the center. Everything else is how
often a thing comes back, or a one-time, or someday, shown on Daily
when it belongs today. TickTick is the comparable; he used it and was
left wanting a daily that did not need a clock.

Money is still being discovered. The first submit does not have to
declare the app as paid. Free is a real price. Price can change later.
People who already downloaded a free app keep it. To charge, the Paid
Apps Agreement and tax and banking must be active; signing that does
not make Memory paid. TickTick is free plus about $36 a year.

Screenshots and privacy-policy text are still not started.

## Build steps

Simulator: npm run ios

PHONE:
VS Code: Commit/build/submit
eas build --platform ios --profile production
Yes, yes
eas submit --platform ios --profile production
Yes, yes, check build name, yes
TestFlight update
