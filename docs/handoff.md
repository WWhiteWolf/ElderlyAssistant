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

**#76-new is committed.** It took Timer Alerts, Vault, Shopping List, and Memory Test out of
Memory. Source copies remain in `Projects/stray apps`. Not a running app.
The shopping list is wanted later, with a backup of its own; the list on the
phone was dropped. Vault was empty and came off. Memory Test data was
dropped. Memory Test’s engine pieces were dropped, not moved. Backup no
longer carries shopping, vault, or Memory Test. Extra Vault Security is
gone. On the next load those saved keys come off the phone, and leftover
Timer and Memory Test alerts are cancelled.
**#75-new is committed.**

**#77-new is committed.** Restore with Merge is done. Checked on the simulator. Not
on the phone. The story is in `handoff-history.md`. The decisions live
in pending under Restore Merge.

He is living with the #67-new load on the phone. Landscape 90°
counter-clockwise, headers on the left. Calendar and landscape are on
the phone. He has not exhaustively tested it; what he has used is
working. **#67-new is committed.** **#68-new is committed.**
**#69-new is committed.**

**#72-new is committed.** Built the hangings lock and Grok Phase 1. Not on the phone.
The day-roll lock still needs a night of all-green Daily, then a morning
open on a new load, to confirm the pop-up stays quiet.
**#73-new is committed.** Built Grok Phase 2 — one apply-then-schedule door. Not on the
phone. Sheet: `docs-ref/build-sheets/build-sheet-one-door.md`. Saved kinds,
routes, page files, and banner sources
are `appointments` and `bucketlist`. Siri says Daily and Remember.
**#74-new built Grok Phase 3**, and Appointments at the set time.
Appointments do not offer Snooze. Skip writes the engine stamp.
Appointments fire at the set time as well as any before chips. Not on the
phone.
**#78-new built.** Daily's One Time for today is its own one-shot (`oneTime`).
Save stays on Daily. Appointments does not get those items. Help's "for
today? Yes" opens the same one-shot. Checked on the simulator. Not on the
phone.
Mac suite 300 of 300. TypeScript is clean.

A read-only Grok 4.6 High review of the live app is recorded in
`docs/grok-review-2026-09-05.md`. Phase 1 is done at #72-new. Phase 2 is
done at #73-new. Phase 3 is done at #74-new. Appointments fire at the
set time. Restore’s leftover health and miss lists come off on Replace
(#77-new). Morning of may float with the phone.

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
  (Patrick, #70-new). #41-new stopped that; he did not notice
  until then. Done should move the date on the item so the tile shows
  the next cycle armed — as it did before #41-new. Today Done only
  ticks and logs; the tile date does not move.
- **The Where? page is Help** (Patrick, #70-new). The visible name
  is **Help**, not Where? The Home badge is **?**, not 🧭. The route
  may stay `where.tsx`.
- **Skip drops this cycle and arms the next** (Patrick, #74-new). It is
  not Done, and it is not only clearing a snooze.
- **Appointments remind at the set time** (Patrick, #74-new). This
  reverses #52-new. They act like the rest of the app. The before chips
  still stand.
- **Morning of is not the set time** (Patrick, #74-new). A clock-style
  lead may float with the phone even when the appointment has a named
  zone.

## What is open in front of it

**#78-new built.** Daily One Time for today is fixed. Next bug: **Monthly
Done should advance the tile** (Patrick, #70-new; Pending 2).

**What's coming in was not settled this sitting.** Birthdays remain on
the list. The second new page is not yet named.

The #67-new load is on the phone. #69-new is committed but not on the
phone. The day-roll lock, quarterly month, Reset All Data banners,
banner-tap write-down (**#72-new is committed**), the one-door
(**#73-new is committed**), Phase 3 (**#74-new, built**), Restore with
Merge (**#77-new, done**), and Daily's One Time for today
(**#78-new, built**) are not on the phone. Paperwork is Pending 8–11.

**Grok review follow-up** (`docs/grok-review-2026-09-05.md`). Phase 1 is
done at #72-new. Phase 2 is committed at #73-new. **Phase 3 is built** at
#74-new, not on the phone. Appointments fire at the set time.

**Birthdays page** (Patrick, #70-new). A new page, own place on Home.
Each item is a **name and a date**, with a **yearly reminder**. Almost
like Appointments, but simpler: **Day Before** only as the before chip.
**On the day** and **Day Before** are both selectable chips. Build sheet
first per standing pattern. Second new page not yet named.

**Help helper — wording and Cancel** (Patrick, #70-new). In
`app/where.tsx`: only the **first choice** on step 1 should read
**Repeats every** (not bare “Repeats”); fix the question that wrongly
says “every” on a later step. On steps 2 and 3, **Cancel goes back one
step**, not Home — today every stage’s Cancel calls `router.back()`.

**Quarterly — interval chips on Add** (Patrick, #70-new). On + Add
for Quarterly, selectable **30, 60, and 90 days** (not a new page).
**The engine already knows how to take in this data** (Patrick) — the
work is the Add chips writing it, not new engine arithmetic.

**Monthly Done should advance the tile** (Patrick, #70-new; Pending 2).
`CadenceListPage` `markDone` only sets `completed`; it does not move the
saved date. Restore advance on Done for Monthly, Quarterly, and Yearly so
the tile shows the next cycle armed. Reverses #41-new. Today Done only
ticks and logs; the tile date does not move. `advanceDatedItem` is already
written; Done does not call it yet.

**Patrick on the phone** (#70-new):

5. **Options — 2nd Thursday chip does not update** (Patrick verified this
   session). The pattern **saves correctly** — the data is right. The UI
   fault is the **selected chip** does not change to show 2nd Thursday is
   active, so it still looks like the dated choice even after save.

**Phase 4.** Appointments fire at the set time (Patrick, #74-new) —
built; this reverses #52-new. Restore’s leftover health and miss lists
come off on Replace (#77-new). Morning of may
float with the phone; it is not the set time. Settings clock times
already run the scheduler (Phase 2).

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
