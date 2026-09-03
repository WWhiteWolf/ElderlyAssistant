# Build sheet — calendar day list fire time

**Read this file and build. Read only the files on the read list. Do not
ask Patrick anything about the design. Every decision here is already
made and is not to be reopened.**

Written at #59-new, 3 September 2026.

If something genuinely is not here, choose the plainest option that
matches the existing code, and put it in the build report to Patrick
rather than writing it into any document. Do not stop to ask.

**Where you build.** Memory, `elderlyassistant`. Open that folder as
the workspace that holds the files you edit.

---

## What this job is

When a person taps a day on the calendar month and the day’s list
opens, each row shows the item’s **24-hour fire time** when the saved
item has both `hour` and `minute`. When it has no time, the row shows
the name only, as today.

**Fire time means the saved `hour` and `minute` on the item**, not a
moment the engine computes for that calendar day. Sort order is
unchanged: by saved time when present, then by label.

Format: **`HH:MM`** on the 24-hour clock, zero-padded hour and minute
(same style as `formatTime24` in `components/DateTimeControl.tsx`).
Show time and name on one line, time first, one space, then the label.

**#59-new builds this. This sheet’s author does not touch code.**

---

## What this sheet is not

No change to the month grid’s day boxes — names only there, as built.
No change to Scheduled Reminders, tiles, logs, or app-wide 12-hour
display. No engine work. No change to Pending 3 (date picker inactive
for Wednesday after the 6th). No new route.

---

## Read list

- `app/calendar.tsx`
- `modules/reminder-items.ts` — `hourMinuteOf` if useful
- `components/DateTimeControl.tsx` — `formatTime24` only if you reuse it

Do not open other files unless the build report says you had to.

---

## Build steps

1. In `app/calendar.tsx`, on the **day list** (after a day tap), each
   row shows `HH:MM` plus the label when `hour` and `minute` are both
   numbers on the item. Otherwise label only.
2. Leave month cells, navigation, edit open, and sort logic as they are.
3. Run `node --experimental-strip-types scheduler/tests/run-all.ts`.
   Report pass count.

---

## Done when

- Day list rows show 24-hour saved fire time when the item has a time.
- Mac suite still passes.
- No other screen changed.
