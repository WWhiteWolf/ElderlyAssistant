# Session hand-off — A Place To Remember (Memory, iPhone)

This file carries the continuity and nothing else: where the work stands
and what is open in front of it. Finished work and build decisions go to
`handoff-history.md`, opened only when something needs tracing.

**A decision is written in here the moment it is made, in that turn — not
saved up for the end of a session.** That rule and the conditions around
it are `CLAUDE.md` rule 4, and `docs/check-docs.py` reports the three that
can be machine-checked. A failing condition is put in front of Patrick,
who decides. It is not a claim that the files were refreshed.

## Where things stand

He is living with the **#82-new** load on the phone. Landscape 90°
counter-clockwise, headers on the left. What he has used is working.
#83-new built the dated Done-tick morning clear; that load is not on
the phone. #84-new put Daily onto the shared list; that load is not
on the phone.

**Next sitting:** banner housing onto the bits. After this file, open
`docs/designed-implementation.md`. That is the guide. Do not change
the engine. Do not ask Patrick a design question the guide already
answers. This is a fresh-session piece: `app/_layout.tsx` and
`scheduler/translators/translate.ts` are about 540 lines each, unread
at the close of the Daily sitting, and Done, Skip, Snooze, and the
tap still branch on which page the banner came from (Patrick, #84-new).
Home, Option, and a Settings password are a separate issue.

## Standing rulings

These are Patrick's and they govern the work rather than describing it.

- **Restore with Merge is done** (Patrick, #77-new). This reverses
  the parked drop from #67-new and #75-new. The collected store is
  pending's Restore Merge. Merge keeps what is already in the app, and
  adds from the backup only what is not already there. A backup reminder
  is already in the app when it has the same identity the app wrote into
  the backup file. People choose Merge or Replace before they pick a
  file. After they pick the file, the app still asks them to confirm
  before it changes anything. Replace takes off the old health, miss,
  and already-told notes. Merge leaves them. Settings and page logs do
  not need to be saved or restored. The backup does not carry them.
  There are no existing backup files. We are not keeping an older backup
  shape.
- **Timer Alerts, Vault, Shopping List, and Memory Test have left
  Memory** (Patrick, #75-new; taken out at #76-new). Copies remain in
  `Projects/stray apps`. Timer Alerts and Memory Test are simple one-time
  alerts — a reminder within the hour — and do not take the reminder
  engine with them. Do not treat them as Memory engine work. The
  shopping list will have a backup of its own when it exists again.
  How those four become apps is a later decision; do not raise it.

- **The run record on Scheduled Reminders, Check My Reminders, and
  the background task that tops the queue are nice-to-have**
  (Patrick, #67-new). They live in pending's Nice-to-have. He is
  not doing them now. Do not raise them in reports.

- **The old-page scrub preserves nothing for backward compatibility**
  (Patrick, #61-new). An old-named identifier still used by the current
  build is changed through its whole live path rather than kept for old
  state. Backup’s retired strip-keys `onetime_history` and
  `extended_history` stay, so a restore can still clear the old logs.
- **Reminders being rock solid is the top goal — but not the only one,
  and consistency is another high priority** (#16-new, corrected at
  #17-new).
- **"Rock solid is for when you use it"** (#22-new).
- **When something has to give, the old reminder is thrown away and the
  new one kept.**
- **The reminders should follow established practice** rather than a
  private arrangement that happens to work.
- **A rule that has to be remembered at every place that might need it is
  the wrong shape.** Build it into the machinery instead.
- **The design description of the app is the designed implementation**
  (Patrick, #84-new). It is the guide for the whole app, not only the
  leftover page work. You look at how the thing is built — code words,
  the options bit field as it is now, and groups of bits that work
  together where only one of them can be true at once — instead of
  keeping a separate layer of decisions and rules to remember and
  apply. That is the same move as putting behaviour into the machinery,
  now for the description of the app itself.
- **Landscape is an optional view.** The allowed turns are 0°, 90°
  counter-clockwise, and 270° counter-clockwise; 180° upside-down is out
  (Patrick, #60-new).
- **Siri comes out of what a person can see** (Patrick, #83-new). This
  replaces #64-new's Daily-only list and "adding commands is later."
  What is there now only opens the app. A person who sees it thinks it
  should do more, and that the app is broken. Take it out of sight.
  Keep in the back of the design a later Siri that can go into the app
  and do the work. The page pieces and the bit field are that structure;
  we do not yet know Apple's shape. Low priority. Do not raise it.
  Research where Apple is headed is later, not this sitting.
- **Daily's "One Time for today" is not the Appointments page**
  (Patrick, #65-new; own kind at #78-new). Those words are not an old
  name to change. It is saved as `oneTime`, a one-shot that belongs to
  today. Daily shows it. Appointments does not. A banner tap opens Daily.
- **The 12-hour spinners with AM/PM stay** (Patrick, #59-new). Quiet
  popup on Save when the time was last set with the 12-hour row; no
  popup when it was last set with the 24-hour box or digit spinner.
- **The 24-hour digit spinner stays** (#36-new) — tap the type-in box.
- **Do not connect `floatDay`.** An incomplete zone currently floats
  with the phone; leave that unless Patrick says otherwise (#41-new).
- **Monthly, Quarterly, and Yearly Done advances the saved date**
  (Patrick, #70-new; built at #79-new). #41-new stopped that; he did
  not notice until then. Done moves the date on the item so the tile
  shows the next cycle armed — as it did before #41-new.
- **The Done tick on Monthly, Quarterly, Yearly, and Birthdays is the
  mark that this cycle was done** (Patrick, #83-new). It is not
  leftover. The date has already moved; the tick is how you see it.
  It stays until the morning of the next due date, then comes off in
  the same morning roll as Daily. A second tap while it is showing
  means un-check, not Done for the new cycle. Appointments and Bucket
  List stay as they are. Built at #83-new.
- **The Where? page is Help** (Patrick, #70-new; wording at #80-new).
  The visible name is **Help**, not Where? The Home badge is **?**, not
  🧭. The route may stay `where.tsx`. Step 1 choices are **Repeats** and
  **Does not**. Step 2 asks how often, with no stray “every”, and includes
  **Birthday**, which opens Birthdays’ New, not Yearly. Cancel on
  steps 2 and 3 goes back one step; step 1 Cancel closes.
- **Birthdays is a copy of Appointments on the screen, and a yearly
  reminder on the one list** (Patrick, #81-new). Own saved kind
  `birthdays`. Date required. Same reminder chips as Appointments,
  any and all on at once. Done advances the year. An item on Birthdays
  is not also on Appointments or Yearly.
- **Quarterly 30, 60, and 90 day chips** (Patrick, #82-new). On Add,
  selectable chips. No chip stays every three months. A chip counts
  that many days from the date entered when it is set. One chip at a
  time; a second tap clears it. The list tile still shows the date.
  Done and the engine follow the same step.
- **Skip drops this cycle and arms the next** (Patrick, #74-new). It is
  not Done, and it is not only clearing a snooze.
- **Banner buttons belong on the bit field** (Patrick, #83-new). Which
  buttons an item gets — Done, Skip, Snooze, OK — is a bit of the
  kind, the same as whether it can be done or pushed back. The row and
  the banner both read those bits. They do not remember the page.
- **Appointments remind at the set time** (Patrick, #74-new). This
  reverses #52-new. They act like the rest of the app. The before chips
  still stand.
- **Morning of is not the set time** (Patrick, #74-new). A clock-style
  lead may float with the phone even when the appointment has a named
  zone.

## What is open in front of it

**#84-new:** the sheets, and the spec, are designed implementation of the
whole app. They do not collect new decisions. The ruling is in Standing
rulings. The guide is `docs/designed-implementation.md`. Exclusive groups
are not in the engine yet. Done is a code with three words: thisCycle,
advanceDate, endItem. That code is not in the engine yet. The two-way
bit is not enough. "Not in the engine yet" means not on the translator's
table. The scheduler stays.

Treat the pages the way the engine was treated. A page has a few jobs.
Every reminder page fits those pieces. Rebuild what does not fit.
Keep what already fits. Highest purpose: reminders smooth and consistent.
Do not rebuild Home, Help, Calendar, Settings, Backup, or Scheduled
Reminders.

What already fits: the engine, the one list, the one save door, the
shared list page (`components/CadenceListPage.tsx` — Daily through
Bucket List, each route only names its kind), the one edit form
(`app/item-edit.tsx`), the one row (`components/ReminderItemRow.tsx`),
the date-and-time control, and the page chrome. Daily's extras — visitors,
One Time for today, Daily's own add, the time-and-from row label, the
Daily log, reorder of the visible list, and Done following the item — live
on that shared page. `app/daily.tsx` is the same thin route as Weekly.

What does not fit, remaining sheets, one at a time:

1. **Banner housing onto the bits.** `app/_layout.tsx` still writes
   Done, Skip, Snooze, and the log by source. The engine already names
   the button set (`bannerButtonsCode` in
   `scheduler/translators/translate.ts`). The row and the banner both
   read the bits. They do not remember the page. The log is not one
   piece yet: the shared list, the banner, and Siri each write it.
   Fresh session (Patrick, #84-new). Files already read:
   `app/_layout.tsx`, `scheduler/translators/translate.ts`.
2. **Siri out of sight**, a short sheet. Take it out of what a person
   can see. Do not tear out the structure kept for a later in-app
   Siri. Do not raise Siri. Research is later. Files already read:
   `plugins/withSiriIntent.js`, `plugins/ios/MarkItemDoneIntent.swift`,
   `modules/app-group`.

Rulings for those sheets are already in Standing rulings: Done tick,
banner buttons on the bit field, Siri out of sight. Do not reopen
them. The morning clear for the dated Done tick was built at #83-new
in `scheduler/miss-candidates.ts`.

The second new page is not yet named.

**#84-new ideas**, a separate issue from the page-shape sheets:

1. Home badges movable on Home.
2. Option is no longer reachable as a Home badge.
3. Settings needs password protection.

The #83-new line that says do not rebuild Home, Help, Calendar,
Settings, Backup, or Scheduled Reminders still governs that rebuild.
These three are not that rebuild.

The phone is on the **#82-new** load. Spec, user guide, feedback
button, and testing file are Pending 1–4.

Testers are on TestFlight External. The App Store heading is Waiting
for Review on **72**. He is not aiming to go live. Manual release.
**74** is iPhone-only. Testers may use 72 or 74. The journey is
`docs/connect-submit.md`. A public privacy page and a support page
are still not written.

**Day-roll lock** still needs a night of all-green Daily, then a morning
open on a new load, to confirm the pop-up stays quiet.

**Still open from before:**

**Display tiles** (Scheduled Reminders sentences, `formatClock`, and the rest)
are not part of the 12-hour spinner ruling. What remains is `settings.tsx` and
`formatClock` in `scheduler/queueview.ts`.

**`docs-ref/build-sheets/build-sheet.md` has not been brought level with the
reorder** (#24-new).

**One claim still unchecked**: that a repeating alarm cannot be told to skip a
single instance.

**One separate fix-list item** in `docs/reminder-rebuild.md`: banner instruction
once in the housing instead of on eight pages.

**The build sheets are the pattern for a new page** — each self-contained,
carrying the answers themselves rather than pointing at other documents.

## Facts worth carrying

**The hour fix leaves a tail.** Any time set by spinning through noon or
midnight before #27-new is stored in the wrong half of the day and needs
re-setting.

**A background task and a daily tick are opposites and must never be
merged.** A Bucket List item says a thing is *not yet done* and must
survive the rollover, so those items must never be handed to
`runDailyReset`. The coffee-and-water kind says a thing *was done*, is
meaningless the morning after, and is cleared by the rollover on purpose.
The full reasoning is in `docs/reminder-shape.md`.

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
