# Session hand-off — A Place To Remember (Memory, iPhone)

This file is for the next sitting. It says what was done and what
still needs to be done. It is not the whole history. History lives
in `handoff-history.md` and is opened when something needs tracing.
Design lives in `docs/designed-implementation.md`. Standing rulings
here are common work that still governs, not specific tasks that
are already done.

**A decision is written the moment it is made, in that turn — not
saved up for the end of a session.** Common work that still governs
goes here. Design goes to the designed implementation. The sitting
goes to history at close. That rule and the conditions around it are
`CLAUDE.md` rule 4, and `docs/check-docs.py` reports the three that
can be machine-checked. A failing condition is put in front of Patrick,
who decides. It is not a claim that the files were refreshed.

## Where things stand

The lists end above the bottom of the screen, so a swipe to delete does
not move the page. That is committed, on his phone, and verified working.

Build **98** fixed the bug still on build **97**. A reminder whose
set day is a holiday stayed on the holiday. Thanksgiving 2026 still
showed Thursday 26 November. It now shows Friday the 27th.

Build **97** showed, after 24 hours, that no reminder already
marked Done fired again. The one reminder that did arrive was for
something actually missing; the app otherwise acted normally.
Saved Done state removes every old queued and delivered alert copy for
that item, keeps the next legitimate cycle, and reports a removal the
phone cannot confirm.

#119-new is committed and verifies working on this load. Weekly Done
puts the next real speaking time on the phone, holiday move included, and
the mark comes off when that time arrives. A reminder that lands on a
holiday stays on the moved day, including on the calendar. The
same-week move is dropped: a holiday elsewhere in the week no longer
pushes the set day. Home badges change order while one is sliding.
428 Mac checks pass and TypeScript is clean.

Birthday and its attached backup, day-roll lock, #116-new Settings
backup and back-drag, and the Settings Guide tile names are all
verified on the phone. The designed-machine jobs from #108-new and
#109-new are verified too. All phone proof carried in this record is
complete.

#121-new is committed. It is packaging Memory for Android phones. The path is Google
Play, the same kind of road as the iPhone App Store (Patrick,
2026-10-01). The Play Console account was submitted on 2026-10-01.
Google said they would let him know. The Android name is
`com.molliedog.ElderlyAssistant`, the same id as the iPhone, and it
is in `app.json`.

#122-new is committed. It keeps the page body above that strip, and
Android stays upright.

The app is an Expo project and the phone package is produced by EAS.
The generated ios and android folders are left out of the project.
This Mac has an ios folder and no android folder. The Siri plugin
only changes the iPhone project. The App Group module, which the app
loads at startup, already has an Android file that does nothing, so
the app can load. `docs/publishing.md` is not in the docs folder.
The build steps the project rules point at were not there. He said
to build the Play file now, while Google has not opened the account,
so the sitting is not spent waiting (Patrick, #123-new). The account
still cannot take the app, so the file is not sent to Play. The store
profile can move a build number, so the build is Android only and the
iPhone number stays put.

Google's own pages, read 2026-09-30. A Play Console account is US$25
once, with no yearly charge. The same US$25 opens a full account for
copies that never go through Play. A limited account is free, stops
at 20 phones, and asks for no government ID. That account stays a
20-phone account. A wider reach later means a new account and moving
the Android name. A personal Play account opened after November 13,
2023, has to run a closed test with 12 people opted in for 14 days
straight, then apply. Google usually reviews that in seven days or
less, and a new personal account also confirms an Android phone
through the Play Console app. Starting 2026-09-30, in Brazil,
Indonesia, Singapore, and Thailand, an install from the big stores
on a certified phone has to come from a verified developer. In 2027
that spreads to all apps on certified phones, including a file
downloaded from a website.

A website download was the first path considered. A preview build
finished on 2026-09-30 and the install file is on this Mac at
`dist/Memory-1.0.0-preview.apk`. It is 110 MB. Expo created the
Android signing key on its servers, and the Android version count
there started at 1. That file cannot go on elyfont.com the way the
site is published. A file added through the GitHub website can be no
larger than 25 MB. A file sent by git is blocked over 100 MB. Git
LFS does not work with GitHub Pages. He then chose Google Play.
The publishing strategy (App-Docs, 2026-07-10) puts Android after
the iPhone build. App Store build **100** is **Waiting for Review**.
Release is manual. He releases it himself when Apple approves.

## Standing rulings

These are common work that still governs. They are not the design of a
finished task.

- **Restore with Merge is done.** Do not treat Merge as dropped. The
  designed implementation holds how Replace and Merge work.
- **These Settings go in the backup** (Patrick, #116-new): the name,
  the app theme, the popup colors, Letters and Page for Light and for Dark, and the morning,
  midday, and evening reminder times. Export saves them. Replace
  writes them from the file. Merge does not take them. The name is
  not a special case.
- **Timer Alerts, Vault, Shopping List, and Memory Test have left
  Memory.** Copies remain in `Projects/stray apps`. Do not treat them
  as Memory engine work. The shopping list will have a backup of its
  own when it exists again. How those four become apps is a later
  decision; do not raise it.
- **The run record on Scheduled Reminders, Check My Reminders, and
  the background task that tops the queue are nice-to-have.** He is
  not doing them now. Do not raise them in reports.
- **The old-page scrub preserves nothing for backward compatibility.**
  An old-named identifier still used by the current build is changed
  through its whole live path. There is no old page data to clean up.
- **Reminders being rock solid is the top goal — but not the only one,
  and consistency is another high priority.**
- **"Rock solid is for when you use it."**
- **When something has to give, the old reminder is thrown away and the
  new one kept.**
- **The reminders should follow established practice** rather than a
  private arrangement that happens to work.
- **A rule that has to be remembered at every place that might need it
  is the wrong shape.** Build it into the machinery instead.
- **Engine facts belong in the one description of each kind.** What the
  add screen shows stays on the form. A special extra rule for one type
  of item is the other thing.
- **The separate Reminder Engine folder is history at Reminder Engine
  4.** Students-Assistant is going away, so Memory's own documents are
  the one live engine design. Do not maintain a second current copy in
  that folder.
- **The design description of the app is the designed implementation.**
  A specific task that is already done belongs there, or in history,
  not in this live handoff.
- **The build sheets are the pattern for a new page** — each
  self-contained, carrying the answers themselves rather than pointing
  at other documents.
- **Exclusive groups cannot both be true.** Turning one on turns the
  others off. There is no both-true case for the translator to handle.
- **Landscape is an optional view.** The allowed turns are 0°, 90°
  counter-clockwise, and 270° counter-clockwise. 180° upside-down is
  out.
- **Android stays upright** (Patrick, #122-new). The phone does not
  turn. The landscape ruling above is the iPhone.
- **Siri is out of sight.** Do not raise the later Siri.
- **Do not connect `floatDay`** unless Patrick says otherwise.
- **Each closed-app notice has its own thread name.** This Expo does
  not yet hand that name to the phone. Do not poke the notification
  library to make it work early.
- **There is no password to open the app.** The phone being open is
  enough. Do not add another.
- **There is no Reset All Data.** Do not add it.
- **The user's guide does not go on a website.** The app is
  self-contained. A person's data stays on the phone. The app does not
  reach out to read or write from the outside world. What is already
  in App Store Connect stays there.
- **The Android name is `com.molliedog.ElderlyAssistant`.** It is the
  same id as the iPhone (Patrick, #121-new).
- **The Android path is Google Play** (Patrick, 2026-10-01). The
  account was submitted on 2026-10-01. Google has not opened it.
  The Play file is built now anyway, Android only, and it is not
  sent to Play until the account can take an app (Patrick, #123-new).
- **Do not raise the closed-test count** (Patrick, #122-new).
- **The app is $9.99 once, the same on the iPhone and on Android, and
  there is no trial** (Patrick, #23-new).
- **Do not file a trademark on the name** (Patrick, #23-new). Use it.
  The copyright line is his name and the year. File later only if
  someone else starts using the same name on a similar app, or if he
  asks.
- **Do not take up Xcode Cloud** (Patrick, #23-new). Stay with the Expo
  build steps.
- **What testing has covered and will cover lives in `docs/testing.md`**
  (Patrick, #52-new; written #123-new). A during-build sitting is
  thrown away. A run is not kept.

## What is open in front of it

The guide remains `docs/designed-implementation.md`. The self-contained
designed-machine build sheet and its phone proof are complete.

Testers are on TestFlight External. His phone has that list change,
and it verifies.
App Store build **100** is **Waiting for Review**. Release is manual.
He releases it himself when Apple approves. The journey is
`docs/connect-submit.md`. What is already in App Store Connect stays
there. There is no public website for the user's guide.

The preview file on his Galaxy still stops short of the bottom. Android
uses that bottom half inch, and everything on that phone draws a bit
bigger. The sizes stay as the phone draws them. #122-new keeps the page
body above that strip, and Android stays upright. The Galaxy copy does
not change until a new install file is built. It is on every page, so
it is not the list-only stop from #120-new.

The Play Console account was submitted on 2026-10-01. Google has
not opened it. The Play file is building now, Android only, and it
is not sent to Play until the account can take an app (Patrick,
#123-new). The Android count on Expo went from 1 to 2. The iPhone number is
still 100. The build
is https://expo.dev/accounts/molliedog/projects/ElderlyAssistant/builds/7d816ec8-3548-4954-a847-bd241270433f.
The 110 MB file at `dist/Memory-1.0.0-preview.apk` is not that file.
Do not build another website download.

The iPhone listing is $9.99. The Paid Apps Agreement, the bank, and
the W-9 are Active. Android still waits until Google opens the Play
account.

## Facts worth carrying

**The hour fix leaves a tail.** Any time set by spinning through noon or
midnight before #27-new is stored in the wrong half of the day and needs
re-setting.

**A Bucket List item and a Daily Done tick are opposites and must never
be merged.** A Bucket List item says a thing is *not yet done* and must
survive the rollover, so those items must never be handed to
`runDailyReset`. A Daily Done tick says today's occurrence *was done*
and is cleared by the rollover on purpose. The full reasoning is in
`docs/reminder-shape.md`.

**`elyfont-home/index.html` in THIS project is the SOURCE of the live
elyfont.com home page.** If it is ever edited, the live copy must be
re-uploaded to the public `WWhiteWolf/mystery-tracker` repo — upload
replaces; never rename anything to or from `index.html` there (see
`MysteryTracker/docs/DEPLOY.md`).

**The drawing of the shape is not in this folder.** It lives at
`Projects/Reminder Engine/docs-ref/reminder-shape.drawio`.

**Working documents live in `docs`.** History lives in `docs-ref`,
including the build sheets. `docs/index.md` says which file is the home.
He calls them working documents; live desk means the same thing.
