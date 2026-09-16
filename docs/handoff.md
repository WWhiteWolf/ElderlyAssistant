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

A new load is on the phone. **#115-new** is committed (Patrick,
#116-new). **#116-new** is committed (Patrick, #117-new). The Guide page names and the 30, 60, and 90 day chips
are working on that load. The page still slid left on 92. The whole
screen stack now keeps the iPhone back-drag off. Export saves the
name, the app look, and the reminder times. Replace writes them.
Merge leaves them. Those need a phone check. Home make-room is in
pending. The designed-machine jobs from #108-new and #109-new still
need phone proof. **#110-new** Birthday still needs a phone check.
**#117-new** Letters and Page are per theme, with even steps, in the
project. They still need a look on the phone. **#112-new** Home badges, Helper, and the person's
name on backup still need a look on the phone.

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
- **The design description of the app is the designed implementation.**
  A specific task that is already done belongs there, or in history,
  not in this live handoff.
- **Exclusive groups cannot both be true.** Turning one on turns the
  others off. There is no both-true case for the translator to handle.
- **Landscape is an optional view.** The allowed turns are 0°, 90°
  counter-clockwise, and 270° counter-clockwise. 180° upside-down is
  out.
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

## What is open in front of it

The guide remains `docs/designed-implementation.md`. The self-contained
designed-machine build sheet is complete in the project.

**Phone proof still open.** Job 1's banner and list-popup choices, Job
2's banner-first day-boundary path, and Job 3's Options, Weekly Done,
and export-after-change need a check on 90.

Testers are on TestFlight External. The phone has a new load after
**90**. The App
Store heading is Waiting for Review on **72**. He is not aiming to go
live. Manual release. The journey is `docs/connect-submit.md`. What is
already in App Store Connect stays there. There is no public website
for the user's guide.

**#110-new Birthday** still needs a phone check. The row shows the
name and the birthdate. The reminder says the age. The next fire is
derived from the birthdate.

**#112-new Home badges** are in the project, not on 86. They keep their
places and turn with the phone. The pictures take a comfortable size in
the space they have. Bucket List is a smiling face. Quarterly is a maple
leaf. The Help tile is named Helper. The person's name is in the backup.
Needs a look on the next load, upright and turned.

**#117-new Letters and Page** are per theme. Each tap is an even
step. Light's page Middle and Dark's cream writing Middle were
lowered so every tap still moves. Backup saves Letters and Page for
Light and for Dark. In the project, not checked on the phone.

**#116-new** Guide names and the 30, 60, and 90 day chips are working
on the new load. The page still slid left on 92. The whole screen
stack now keeps the back-drag off. Export saves the name, the app look,
and the reminder times. Replace writes them. Merge leaves them.
Those need a phone check.

**Day-roll lock** still needs a night of all-green Daily, then a morning
open on a new load, to confirm the pop-up stays quiet.

**Still open from before:**

**Display tiles** (Scheduled Reminders sentences, `formatClock`, and the rest)
are not part of the 12-hour spinner. What remains is `settings.tsx` and
`formatClock` in `scheduler/queueview.ts`.

**`docs-ref/build-sheets/build-sheet.md` has not been brought level with the
reorder** (#24-new).

**One claim still unchecked**: that a repeating alarm cannot be told to skip a
single instance.

**The build sheets are the pattern for a new page** — each self-contained,
carrying the answers themselves rather than pointing at other documents.

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
