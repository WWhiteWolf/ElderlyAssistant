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

Build **79** is on the phone. Scheduled Reminders is down to 14.
How far ahead a waiting kind looks is a number on the table. Monthly
is thirty days. Quarterly, Yearly, and Birthdays are sixty days, so a
Month-before reminder can be armed. Several lead times on one item arm
only the soonest still ahead. **#100-new** split the Home badges:
Yearly keeps the telescope, Quarterly a fallen leaf, Monthly a
first-quarter moon. A weekday monthly looks from the saved date, so
Done takes it off Daily. Last session was committed. The **#99-new**
review is done (Patrick, #101-new). The designed implementation is the
guide. Calendar month arrows sit by the month name. Daily every-day New
has room between Name, time, and Note. **#102-new** is in the project,
not on 79: time spinner Cancel and Done, muted offset chips, Birthday
on Calendar and Daily, and Birthdate on the form.

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
- **Dated items wait about a month** (Patrick, 2026-09-09). That wait is
  a bit on the table. Monthly, Quarterly, Yearly, and Birthdays have it
  on. Daily, Weekly, Appointments, and the rest have it off. The join
  reads the bit. Depth stays one. Opening the app arms a waiting item
  when it has come close enough. Several lead times on one item also
  use that depth: only the soonest still ahead is armed. When it has
  fired, the next run arms the next.
- **Engine facts belong in the one description of each kind. What the
  add screen shows stays on the form** (Patrick, #95-new). That is
  ordinary software, not a hole. A special extra rule for one type of
  item is the other thing.
- **The design description of the app is the designed implementation**
  (Patrick, #84-new). It is the guide for the whole app, not only the
  leftover page work. You look at how the thing is built — code words,
  the options bit field as it is now, and groups of bits that work
  together where only one of them can be true at once — instead of
  keeping a separate layer of decisions and rules to remember and
  apply. That is the same move as putting behaviour into the machinery,
  now for the description of the app itself.
- **Exclusive groups cannot both be true** (Patrick, #90-new). An
  exclusive group is bits that work together. Only one can be true.
  Turning one on turns the others off. There is no both-true case for
  the translator to handle. It does not need a branch that finds both
  and then refuses them.
- **Landscape is an optional view.** The allowed turns are 0°, 90°
  counter-clockwise, and 270° counter-clockwise; 180° upside-down is out
  (Patrick, #60-new).
- **Siri is out of sight** (Patrick, #83-new; built at #87-new). The
  Shortcuts and Siri phrases are offered no more. Keep in the back of
  the design a later Siri that can go into the app and do the work.
  The page pieces and the bit field are that structure; we do not yet
  know Apple's shape. Research where Apple is headed is later. Do not
  raise the later Siri.
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
  the same morning roll as Daily. Yearly and Birthdays write year on
  the table; the date-advance reads that word. A second tap while it is
  showing means un-check, not Done for the new cycle. Appointments and
  Bucket List stay as they are. Built at #83-new. The year word is
  #100-new.
- **The Where? page is Help** (Patrick, #70-new; wording at #80-new).
  The visible name is **Help**, not Where? The Home badge is **?**, not
  🧭. The route may stay `where.tsx`. Step 1 choices are **Repeats** and
  **Does not**. Step 2 asks how often, with no stray “every”, and includes
  **Birthday**, which opens Birthdays’ New, not Yearly. Cancel on
  steps 2 and 3 goes back one step; step 1 Cancel closes.
- **Yearly, Quarterly, and Monthly Home badges** (Patrick, #100-new).
  Yearly keeps the telescope. Quarterly is a fallen leaf. Monthly is a
  first-quarter moon. They had all three used the telescope. Checked on
  the simulator.
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
- **A 31st stays the 31st** (Patrick, #94-new). A month with no such
  day still uses the last day that exists for that month. Then and
  Next Day are the missing-day banner, not an Options choice. Done
  and Save do not turn the reminder into a 28th.
- **The user's guide is brief, in the app, and a tile on Settings**
  (Patrick, #97-new). The same four paragraphs show as a first-load
  popup on Home (Patrick, #98-new). Got it remembers. Reset All Data
  brings it back. It does not go on a website. The app is
  self-contained. A person's data stays on the phone. The app does
  not reach out to read or write from the outside world. What is
  already in App Store Connect stays there.
- **Feedback is its own tile on Settings** (Patrick, #97-new). It is
  the same popup Mystery Clues Tracker uses. Send opens the phone's
  Mail. The person reaches out; the app does not send the mail.
- **Reset All Data sits in the Settings header** (Patrick, #97-new). It
  is not a tile, not its own section, and not on Backup & Restore. It
  is not a round button. A red warning mark, then Reset, then All, all
  in red. After Face ID or the passcode is accepted, it asks Are you
  sure? Cancel backs out. Then it wipes.

- **There is no password to open the app** (Patrick, #101-new). The
  phone being open is enough. Reset All Data already asks Face ID or
  the passcode. Do not add another.

- **A Birthday keeps a year of birth that Done does not move**
  (Patrick, #102-new).

## What is open in front of it

The guide is `docs/designed-implementation.md`. A sitting builds from
it. The scheduler stays.

Treat the pages the way the engine was treated. A page has a few jobs.
Every reminder page fits those pieces. Rebuild what does not fit.
Keep what already fits. Highest purpose: reminders smooth and consistent.
Do not rebuild Home, Help, Calendar, Settings, Backup, or Scheduled
Reminders. Do not change the scheduler's decisions.

What already fits: the engine, the one list, the one save door, the
shared list page (`components/CadenceListPage.tsx` — Daily through
Bucket List, each route only names its kind), the one edit form
(`app/item-edit.tsx`), the one row (`components/ReminderItemRow.tsx`),
the date-and-time control, the page chrome, banner housing on the
bits, and the log page (`app/log.tsx`). Daily's extras — visitors,
One Time for today, Daily's own add, the time-and-from row label,
reorder of the visible list, and Done following the item — live
on that shared page. The log is not on the list. `app/daily.tsx` is
the same thin route as Weekly.

The spec is `docs/designed-implementation.md`. The testing file is
Pending 1. The user's guide is a tile on Settings. The words are in.
First load on Home shows the same words.

Testers are on TestFlight External. The phone load is **79**. The App
Store heading is Waiting for Review on **72**. He is not aiming to go
live. Manual release. The journey is `docs/connect-submit.md`. What is
already in App Store Connect stays there. There is no public website
for the user's guide.

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
