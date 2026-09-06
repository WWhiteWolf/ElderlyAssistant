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

He is living with the #67-new load on the phone. Landscape 90°
counter-clockwise, headers on the left. Calendar and landscape are on
the phone. He has not exhaustively tested it; what he has used is
working. **#67-new is committed.** **#68-new is committed.**
**#69-new is committed.**

**#72-new built the hangings lock and Grok Phase 1.** Not on the phone.
**Next session (#73-new): Grok Phase 2** — one apply-then-schedule door,
build sheet first. Saved kinds, routes, page files, and banner sources
are `appointments` and `bucketlist`. Siri says Daily and Remember.
Mac suite 302 of 302. TypeScript is clean.

A read-only Grok 4.6 High review of the live app is recorded in
`docs/grok-review-2026-09-05.md`. Phase 1 is done at #72-new. Phase 2
is next. Phase 3 remains.

    node --experimental-strip-types scheduler/tests/run-all.ts

## Standing rulings

These are Patrick's and they govern the work rather than describing it.

- **Timer and Memory Test are not this stream** (Patrick, #66-new).
  They have their own place. Do not keep bringing them up here.

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
  (Patrick, #65-new). Do not treat those words as an old name to change.
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

## What is open in front of it

The #67-new load is on the phone. #69-new is committed but not on the
phone. The day-roll lock, quarterly month, Reset All Data banners, and
banner-tap write-down (#72-new) are built and not on the phone.
Paperwork is Pending 10–13.

**Hangings** (#72-new). Day-roll lock built. Needs a night of all-green
Daily, then a morning open, to confirm the pop-up stays quiet.

**Grok review follow-up** (`docs/grok-review-2026-09-05.md`). Phase 1 is
done at #72-new. **Phase 2 is next session's goal** (build sheet first).
Phase 3 remains.

**Birthdays page** (Patrick, #70-new). A new page, own place on Home.
Each item is a **name and a date**, with a **yearly reminder**. Almost
like Appointments, but simpler: **Day Before** only as the before chip.
Unlike Appointments, Birthdays **does remind on the day itself** —
Appointments deliberately has no reminder at the set time. **On the day**
and **Day Before** are both selectable chips. Build sheet first per
standing pattern. Second new page not yet named.

**Help helper — wording and Cancel** (Patrick, #70-new). In
`app/where.tsx`: only the **first choice** on step 1 should read
**Repeats every** (not bare “Repeats”); fix the question that wrongly
says “every” on a later step. On steps 2 and 3, **Cancel goes back one
step**, not Home — today every stage’s Cancel calls `router.back()`.

**Quarterly — interval chips on Add** (Patrick, #70-new). On + Add
for Quarterly, selectable **30, 60, and 90 days** (not a new page).
**The engine already knows how to take in this data** (Patrick) — the
work is the Add chips writing it, not new engine arithmetic.

**Patrick on the phone** (#70-new):

4. **Monthly Done should advance the tile** — `CadenceListPage` `markDone`
   only sets `completed`; it does not move the saved date. Restore advance
   on Done for Monthly, Quarterly, and Yearly so the tile shows the next
   cycle armed. Reverses #41-new.
5. **Options — 2nd Thursday chip does not update** (Patrick verified this
   session). The pattern **saves correctly** — the data is right. The UI
   fault is the **selected chip** does not change to show 2nd Thursday is
   active, so it still looks like the dated choice even after save.

**Phase 2 — One door** (build sheet first):

6. Single **apply change, then schedule** path for banner, Siri, pages, and
   Settings — so the phone's queue matches what was just changed and a stale
   save cannot overwrite a Done.

**Phase 3 — UI follows translator**:

7. Rows and banner buttons read what the translator already knows (Snooze,
   Done, Skip). Appointments must not offer Snooze the engine ignores; Skip
   needs one story (wire the engine stamp or drop it). Monthly Done advance
   is separate (item 4 above). Second-Thursday chip is separate (item 5).

**Phase 4 — Consider** (Patrick decides before build): Appointments in the
morning miss list; Settings times without scheduler run; Restore leaving old
health/miss lists; clock-style leads and named zones. Listed in pending
Decisions 2–5.

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

**The build sheets are the pattern for Phase 2 and beyond** — each
self-contained, carrying the answers themselves rather than pointing at other
documents.

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
