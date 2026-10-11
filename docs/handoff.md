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

Build **116** is on the iPhone. Android number **5** (1.0.0) is the
internal test on the Galaxy, and it is working. Build 3 is no longer
that load. The Play account is open. The public Android listing still
waits.

Daily and One Time ask for 1, 5, 10, 15, 30, or 60 minutes, on two
rows of the same buttons as the other snooze modals. There is no wheel
(#134-new). Daily Snooze, Backup, and Birthday list reorder work on
the iPhone and on the Galaxy.

The saved-list read warning is on both phones. It stays out of the Guide.

App Store build **100** is **Waiting for Review**. Release is manual.
The $9.99 Android listing still waits.

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
- **The home arrangement is the home page's own order** (Patrick,
  2026-10-06). It is not a Setting. Export asks the home page for it
  and saves it. Replace writes it back when the file has it. Merge
  leaves the arrangement on the phone. A backup made before this
  does not contain it, and it still loads.
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
  turn. That is verified on the Galaxy. The landscape ruling above is
  the iPhone.
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
  account was submitted on 2026-10-01. It is open (#128-new). Android
  number **5** (1.0.0) is the internal test on the Galaxy, and it is
  working (#134-new). The iPhone number stayed at 100. The $9.99
  Android listing still waits.
- **Play Console and the phone use two different sign-ins** (Patrick,
  #134-new). Play Console on the Mac is the Comcast account. The
  Galaxy's Play Store is the iCloud account. The internal-test link
  is opened on the phone only after the Play Store is on the iCloud
  account.
- **An internal tester is added by the Google email in the Play Store
  on that Android phone** (Patrick, #134-new). A mailbox that receives
  mail is not enough, and Play Console says that address does not
  exist. The join-on-the-web link is emailed to them, or sent in a
  text (Patrick, #135-new). Up to 100 can
  join. Do not use the closed test.
- **He makes the iPhone builds.** Android builds are started from the
  sitting. He does not start them (Patrick, #130-new).
- **Do not raise the closed-test count** (Patrick, #122-new).
- **The app is $9.99 once, the same on the iPhone and on Android, and
  there is no trial** (Patrick, #123-new).
- **Do not file a trademark on the name** (Patrick, #123-new). Use it.
  The copyright line is his name and the year. File later only if
  someone else starts using the same name on a similar app, or if he
  asks.
- **Do not take up Xcode Cloud** (Patrick, #123-new). Stay with the Expo
  build steps.
- **What testing has covered and will cover lives in `docs/testing.md`**
  (Patrick, #52-new; written #124-new). A during-build sitting is
  thrown away. A run is not kept.

## What is open in front of it

The tester gets the copy already on Play. Send the join link. A text
is fine. They open it on the Android phone and install from the Play
Store. Do not build a separate file to email. It is Pending 1. The
Galaxy keeps the internal test already there.

The guide remains `docs/designed-implementation.md`.

App Store release is manual. The journey is `docs/connect-submit.md`.
What is already in App Store Connect stays there.

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
