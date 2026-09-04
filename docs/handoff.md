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

The leftover cleanup is built (#69-new). Nothing about how reminders
are armed, named, or shown changed. Saved kinds, routes, page files,
and banner sources are `appointments` and `bucketlist`. Siri says
Daily and Remember. Mac suite 298 of 298. TypeScript is clean.

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

## What is open in front of it

The name scrub is finished. The leftover cleanup is built. The
#67-new load is on the phone. Paperwork is Pending 2–5.

**The build sheets are the pattern for this work** — each
self-contained, carrying the answers themselves rather than pointing at
other documents. **A sheet's read list should name what the pattern it
points at actually imports** (#25-new).

**Display tiles** (Scheduled Reminders sentences, `formatClock`, and
the rest) are not part of the 12-hour spinner ruling. What remains is
`settings.tsx` and `formatClock` in `scheduler/queueview.ts`. The logs
are already 24-hour; the tiles are not.

**`docs-ref/build-sheets/build-sheet.md` has not been brought level with
the reorder** (#24-new). It describes `stillwanted.ts` asking no due
time first. The code no longer does.

**One claim still unchecked**: that a repeating alarm cannot be told to
skip a single instance.

**One separate fix-list item** remains in `docs/reminder-rebuild.md`:
saying the banner instruction once in the housing instead of on eight
pages.

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
