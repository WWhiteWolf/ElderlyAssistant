# Build sheet — one apply-then-schedule door

**Read this file and build. Read only the files on the read list. Do not
ask Patrick anything about the design. Every decision here is already
made and is not to be reopened.**

Written at #73-new, 6 September 2026.

If something genuinely is not here, choose the plainest option that
matches the existing code, and put it in the build report to Patrick
rather than writing it into any document. Do not stop to ask.

**Where you build.** Memory, `elderlyassistant`. Open that folder as
the workspace that holds the files you edit. Run no git command.

**#73-new writes this sheet and does not build this piece. Build waits
for its own Go.**

---

## What this job is

Grok Phase 2. Banner taps, Siri, the pages, and Settings each change
what the phone should hold, but they do not share one door. The pages
are the live fault: Daily and the cadence list keep a copy of the whole
saved list in memory, then write that copy back. A banner Done that
landed in between is overwritten. Settings morning, midday, and evening
times are saved and the scheduler is not run, so “Morning of” stays on
the old time until the next open.

There is already a write that stores the list, refreshes Siri’s Daily
names, and runs the scheduler: `saveReminderItems` in
`modules/reminder-items.ts`. It is not the missing door. The missing
door is: **read the list as it is now, apply this change, then use that
write.** Every change of the saved list goes through that one function.
No caller hands in a list it was holding.

Nothing here changes what Done, Skip, Snooze, Delay, Then, Next Day,
or a page tick *means*. The same maps and stamps stay. Only the list
they are applied to becomes the list just read from storage.

---

## What this job is not

- **Do not start Phase 3.** Rows and banner buttons still show what they
  show today. Appointments may still offer Snooze. Skip stays two
  stories. Do not wire or drop the engine skip stamp.
- **Do not start Phase 4.** Do not change Restore’s health or miss lists.
  Do not change clock-style leads and named zones. Do not change
  Appointments in the morning miss list.
- **Do not advance Monthly, Quarterly, or Yearly on Done.** That is a
  separate open item. Dated Done still ticks and logs only.
- **Do not fix the 2nd Thursday chip.**
- **Do not change Reset All Data.** Phase 1 already runs the scheduler
  after the wipe. Leave that path.
- **Do not change Timer or Memory Test.**
- **Do not change how reminders are armed, named, or shown**, except that
  a Settings clock-time save now causes a scheduler run, so leads that
  use morning, midday, or evening move to the new time without waiting
  for the next open.
- **Do not edit `docs`, `docs-ref` (except you are not editing this
  sheet either), or `CLAUDE.md`.**
- **Do not add a compatibility layer.**
- **Do not export a new way to write a held list.** When this job is
  done, the only function other files import for a list write is the
  new door.

---

## The door

Add **`applyReminderChange`** to `modules/reminder-items.ts`.

```
applyReminderChange(
  patch: (items: ReminderItem[]) => ReminderItem[],
): Promise<ReminderItem[]>
```

It does exactly this, in this order:

1. Wait until any earlier `applyReminderChange` has finished. Two
   patches must not interleave. **Do not drop a patch.** The scheduler’s
   run gate may collapse reruns because each run reads the saved truth;
   these patches are different changes and each must run.
2. Load the current list with `loadReminderItems` (day-roll and week-roll
   stay as they are on that load).
3. Call `patch` with that list. If `patch` throws, do not save.
4. Call the existing `saveReminderItems` with the patched list (store,
   Siri Daily names, scheduler).
5. Return the patched list.

`saveReminderItems` stays in this file and **is no longer imported
anywhere else**. Callers that today load, map, and save, or that write
a held list, import `applyReminderChange` instead.

`loadReminderItems` stays public. Pages still use it to draw. Calendar
still uses it to draw. Drawing is not a write.

A patch that returns the list unchanged is allowed. That is how Settings
and Restore ask for a scheduler run against whatever is already stored.

Keep comments in this file in full sentences, in the same voice as the
ones already there. The comment on `saveReminderItems` still tells the
truth. Add a comment on `applyReminderChange` that says why it exists:
a page must not write a list it was holding, because a banner or Siri
Done that landed in between would be overwritten.

---

## How each caller uses it

The patch bodies stay. What changes is the list they see.

**Do not** write `applyReminderChange(() => heldList)` or
`applyReminderChange(() => heldList.map(...))`. That is the old fault
in a new name. The patch must take the list it is given and change
*that*.

After a page write, `setItems` from the door’s returned list. Do not
save the page’s own copy. A snappy local tick before the door returns
is not required; the plain path is wait for the door, then draw what
it returned.

### `app/_layout.tsx` — banner and Siri

Every `loadReminderItems` followed by `saveReminderItems(items.map(...))`
becomes one `applyReminderChange` whose patch is that same `map`.

Skip, the three snooze buttons, the three delay buttons, Next Day,
Weekly Done, dated Done, and Daily Done: same stamps, same history
writes, same early returns when there is no id or the source does not
match. History keys and history entries stay as they are. Then / OK /
body-tap routing stay as they are.

Siri’s foreground path still loads once to publish Daily names into the
App Group when there is no mark-done note. That publish is not a list
write. When there is a mark-done note, the list write is
`applyReminderChange` with the same done-map used today. Finding the
item (id, then spoken label) happens inside the patch, on the list the
door just loaded. If no item matches, return that list unchanged, clear
the note as today, and do not write history. If it matches, patch it,
then write history from the item you found, as today.

Do not turn every foreground into a save.

### `app/daily.tsx` and `components/CadenceListPage.tsx`

Replace `writeItems`. It currently sets state and saves the held list.
It becomes a helper that hands a patch to `applyReminderChange` and
`setItems` from the return.

These writes go through it, with the same field changes they have now,
applied to the list the door loaded:

- Daily Done, undo, snooze, delete.
- Cadence Done (Weekly still sets `doneAt`; other kinds still only
  `completed`), undo, snooze, delete.

Reorder: today’s drag snapshot must not be written as the whole list.
On drop, `applyReminderChange` with `dragVisibleTo` (Daily) or
`dragKindTo` (cadence) against the loaded list, using the id and the
index the gesture already computed. Then `setItems` from the return.

History writes stay on their own keys. They are not the reminder list.

Weekly, Monthly, Quarterly, Yearly, Appointments, and Bucket List
screens stay as one-line wrappers of `CadenceListPage`. Do not edit
those page files.

### `app/item-edit.tsx`

`persist` already loads, then writes. Change only the write: the load
and the assemble stay; the `updated` list is produced inside
`applyReminderChange` from the list the door loaded (replace by id, or
append when new), not from a list `persist` loaded on its own. Do not
load twice. One door call is the load.

The setup `useEffect` that fills the form still uses `loadReminderItems`.
That is a draw, not a write.

### `app/backup.tsx`

After the restored keys are written, today’s
`saveReminderItems(await loadReminderItems())` becomes
`applyReminderChange((items) => items)` so Siri and the scheduler see
the restored list. Do not clear health or miss lists. Do not change
the restore keys.

### `app/settings.tsx`

After a successful save of morning, midday, or evening time,
`await applyReminderChange((items) => items)` so the scheduler reads
the new clock times on this save, not on the next open.

User name and Vault PIN do not go through the door. Reset All Data
does not change.

---

## Read and edit

- `modules/reminder-items.ts`
- `app/_layout.tsx`
- `app/daily.tsx`
- `components/CadenceListPage.tsx`
- `app/item-edit.tsx`
- `app/backup.tsx`
- `app/settings.tsx`

No other production or test file is edited. Weekly through Bucket List
page files are not edited. `scheduler/` is not edited. `saveReminderItems`
is not deleted; it is only called from `applyReminderChange`.

---

## Read only

- `modules/reminder-types.ts` — the saved shape. Do not change it.
- `scheduler/scheduler.ts` — `runScheduler` already reads
  `reminder_morning_time`, `reminder_midday_time`, and
  `reminder_evening_time` on each run. That is why a Settings time save
  only needs to go through the door. Do not edit this file.
- `scheduler/rungate.ts` — the model for “one at a time.” List writes
  must not copy its pending-collapse. Each patch runs.
- `scheduler/tests/run-all.ts` — proof command only.

Do not open another build sheet, `docs/reminder-shape.md`, the Reminder
Engine folder, Timer, Memory Test, native folders, or Siri plugins.
This sheet already holds the boundary.

---

## Build steps

1. Add `applyReminderChange` and its write queue in
   `modules/reminder-items.ts`.
2. Switch `_layout.tsx` banner and Siri list writes.
3. Switch Daily and `CadenceListPage`.
4. Switch `item-edit.tsx` `persist`.
5. Switch backup restore’s republish.
6. Switch Settings clock-time save.
7. Search, then proof.

---

## Proof

Search the project, excluding `node_modules`, `.git`, `ios`, `docs`,
and `docs-ref`, for `saveReminderItems`. The only remaining hits are
the function itself and the call inside `applyReminderChange`.

Search the same way for `writeItems`. It must be gone, or it must only
be a local helper that calls `applyReminderChange` and never saves a
held list.

Run:

    node --experimental-strip-types scheduler/tests/run-all.ts

**302 of 302 still passing.** This job does not change scheduler
arithmetic. A failing test means the change is wrong.

Then `npx tsc`. Clean. Any new TypeScript error means the change is
wrong.

No simulator or phone load belongs to this job unless Patrick asks
for it separately.

---

## Done when

- Banner, Siri, Daily, cadence pages, item-edit, Restore, and Settings
  clock times all go through `applyReminderChange`.
- No other file imports `saveReminderItems`.
- A page tick cannot write a list it loaded earlier.
- Two patches in a row both run, in order.
- Settings morning, midday, and evening saves run the scheduler.
- Reset All Data, Skip’s meaning, Snooze on Appointments, Monthly Done
  advance, Restore health/miss, Timer, and Memory Test are untouched.
- 302 of 302, and TypeScript clean.
- Nothing in `docs` or `docs-ref` changed by the build sitting.

---

## House rules

- Add no dependency.
- Add no new production file. The door lives in `reminder-items.ts`.
- Run no git command.
- Do not edit documentation.
- Report only what differed from this sheet, what turned up, and what
  remains.
