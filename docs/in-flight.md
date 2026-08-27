# In flight — the working session's desk

**This file is replaced every time, never added to.** The moment it starts
growing it becomes the thing that thins the next session. Half a page is the
limit.

A session opens this and `docs/reminder-shape.md`, and nothing else.

Last written: 2026-08-27, at the close of #27-new / Super-4-new.

## Read this first

- **Ask Patrick whether the last session's commit went in** before anything
  else. He prefers being asked.
- **Nothing is out with anyone.** There is no worker session open and none is
  planned.
- **Do not reopen the translator, depth, or the eight o'clock banner.** All
  three are settled, with their evidence in `reminder-shape.md`.

## The way of working changed, and this is the live rule

**One session does the work, here, with Patrick watching it happen** (Patrick,
#27-new). The supervisor-and-worker split is retired.

- **The value was always in the build sheet, not the second session.** A sheet
  that carries every decision is what let a worker finish the engine in
  forty-five minutes, and it would have done the same in one conversation.
- **Big mechanical builds go to Cursor** (Patrick's own words), handed a sheet
  written here. Everything else is built in the session that discussed it.
- **So this session may edit code.** That is a change from the old role and it
  is deliberate.
- **Sheets are still written for big pieces.** They are the pattern, and
  `docs/build-sheet-optional-date.md` is the most recent example.

## What #27-new / Super-4-new did

Five fixes, **every one confirmed by Patrick on the simulator**.

- **The Scheduled Reminders page sat half an inch low.** `app/reminders.tsx`
  was the only route never registered in `app/_layout.tsx`, so it drew the
  navigator's default header above its own. One line added.
- **The reminder count moved under the header**, large, with the ceiling small
  beneath it. It used to sit at the foot of the scroll.
- **The hour stepper was off by twelve hours.** `adjustHour` read AM or PM
  first and held it fixed while spinning the 1-to-12 digit, but crossing
  between 11 and 12 is exactly when it must swap. It now steps on the 24-hour
  clock. **Any time set by spinning through noon or midnight before this is
  stored in the wrong half of the day and needs re-setting.**
- **The Vault's header button now says where it goes.** Inside a category it is
  Back and returns to the category list; on the list it is Home. The
  "← All Categories" row is gone.
- **A To-Do task may now have no date and no time.** The pop-up had always
  asked whether he meant to save without a reminder, and the page then wrote
  today's date on anyway. `DateTimeControl` gained an optional-date mode
  matching its optional-time one, the two halves sleep independently, and
  `onChange` now says which half was touched. `Task`'s five date fields are
  optional; absent means no date.

## Where the tests stand

**391 of 391 passing.** `npx tsc` is clean — the standing `app/settings.tsx`
error no longer appears.

## Next, in order

1. **The phone.** All five screens run through the one machine and it has been
   seen on the simulator, not on the phone.
2. Then retiring each old reader once its replacement is proved.
3. Miss-telling still covers My Day and Pets only. Extending it is building,
   not deciding.

## The loose threads, named on purpose

- **`BannerButtonsCode` lists `'mydaysnooze'`, `'petssnooze'` and
  `'myweekactions'`, and no reader uses any of the three.** For a session that
  opens `app/_layout.tsx`.
- **Each translator rule set still imports its item type from the old reader.**
  Fine while those files exist; the type moves with the deletion.
- **What would turn this into patchwork**: the moment a `sourceScreenCode`
  appears in `stillwanted.ts`, stop and redesign.
- **`docs/reminder-shape.md` still has leftover empty-list wording** in the
  field-names list, and section seven still presents `standsForGroupBit` as
  what brought To-Do into the shape. To-Do turned out not to need it.
- **Two `.fuse_hidden…` files are sitting in `app/`**, leftovers from deleted
  files. Not to be committed.

## Elsewhere, and parked

- **`App-Docs/master-handoff.md` has grown into a session-by-session history.**
  Patrick named a chain of its own for it, **Super-Projects**. Nothing here
  waits on it.
