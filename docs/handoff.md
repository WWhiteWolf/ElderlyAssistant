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

He is living with the **#81-new** load on the phone. Landscape 90°
counter-clockwise, headers on the left. What he has used is working.

**#81-new is on the phone.** Birthdays page. Forty-six birthdays merged
from a backup. Help’s Birthday choice opens Birthdays’ New. The iOS
back-to-previous-app control is correct on the phone (#80-new work,
confirmed this sitting). **#82-new chips are in on the Mac**, not on
the phone. Mac suite 310 of 310. TypeScript is clean.

    node --experimental-strip-types scheduler/tests/run-all.ts

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
- **Landscape is an optional view.** The allowed turns are 0°, 90°
  counter-clockwise, and 270° counter-clockwise; 180° upside-down is out
  (Patrick, #60-new).
- **Siri's voice list is Daily's own items only** (Patrick, #64-new).
  **Adding Siri commands is later.**
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
- **Appointments remind at the set time** (Patrick, #74-new). This
  reverses #52-new. They act like the rest of the app. The before chips
  still stand.
- **Morning of is not the set time** (Patrick, #74-new). A clock-style
  lead may float with the phone even when the appointment has a named
  zone.

## What is open in front of it

**This sitting: Quarterly 30 / 60 / 90 chips on Add** (Patrick, #70-new;
shape at #82-new). Selectable **30, 60, and 90 days** (not a new page).
No chip stays every three months. A chip counts from the date entered
when it is set. Prescriptions come due every 30 or 90 days.

The second new page is not yet named.

The phone is on the **#81-new** load. Spec, user guide, feedback
button, and testing file are Pending 2–5.

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
