# Cursor Memory review — Grok 4.6 High

Read-only review, 5 September 2026. Single-model pass (Grok 4.6 High), not a
cross-model verdict. Nothing was changed in the app.

---

## Summary

The reminder engine itself is coherent. Daily Done, Bucket List staying out of
the day-roll, and Appointments staying silent at the set time all match the live
design. The faults sit beside that engine: banner handling, quarterly dates, and
a couple of buttons that do not mean what they look like.

### Act on

- **Quarterly can land in the wrong month.** `nextByMonthDay` walks from this
  month, not the saved month. Yearly uses the saved month; quarterly does not.
  A January/April/July/October item opened in February can arm February, May,
  August instead. The quarterly test would not catch this: it uses a seed month
  that matches “now.”
- **Reset All Data does not take reminders off the phone.** It clears storage
  and goes Home. The scheduler is not run. Owned banners can still fire until
  the app is backgrounded or launched again.
- **A banner tap can run again on the next cold launch.** Dedupe is only an
  in-memory `useRef`. If this Expo build still hands back the last response
  after process death, Done, Skip, or Snooze can replay. That is documented hook
  behaviour; it was not watched on the phone.

### Consider

- **Skip.** The banner only clears a snooze. The comment in `_layout.tsx` says
  the Daily/Weekly base is left alone on purpose. The engine also has a skip
  stamp that production never writes. Two stories for one word.
- **Appointments show Snooze; the engine ignores it.** The row writes
  `snoozedUntil` and can say “Snoozed till…”. The translator never reads that
  stamp.
- **Monthly / Quarterly / Yearly Done** logs and ticks, but the engine treats
  those kinds as unable to be done, so a still-future occurrence still arms.
- **Appointments in the morning miss list.** Design says there is no reminder
  at the appointment time. The rollover still treats them as hanging. That may
  be how you learn you missed it, or it may be noise — not settled here.
- **Morning / midday / evening in Settings** are saved and the scheduler is not
  run, so “Morning of” stays on the old time until the next open.
- **Restore** puts the items back and leaves the previous health and miss lists
  standing.
- **Clock-style leads** (“Morning of”) use the phone’s zone even when the
  appointment has a named zone.
- **One write path** for banner, Siri, and page ticks would stop a Done being
  overwritten by a later save from a stale list.

### Noted, not a bug to “fix”

- Snooze adding a second reminder beside the base is the live shape.
- A Daily snooze does not survive the day-roll.
- Vault is a door (Face ID on the screen), not a lock on the stored notes.
- Display tiles 12-hour vs logs 24-hour is the known leftover.
- `floatDay` is still off.

### Dismissed

- Adding a reminder at the appointment set-time.
- Putting Bucket List through the daily reset.
- Merging the daily tick with a background task.
- Timer and Memory Test as a theme of this stream.

---

## Modularity

The reminder engine is modular. The rest of the app is only partly so.

The scheduler is built as named pieces that do one job: shape an item, decide if
it is still wanted, count the moments, reconcile with what is on the phone, then
apply. Daily reset, weekly reset, miss-telling, and health sit beside that path
rather than inside it. That is the live design, and the files match it.

Around the engine, the seams leak.

- Banner taps, Siri, and the pages each load, patch, and save the same list on
  their own. There is no single “apply this change, then schedule” door.
- The translator already knows who may snooze, who may be marked done, and what
  Skip means. The rows and banner buttons do not read those bits, so
  Appointments can show Snooze and Monthly can show Done while the engine ignores
  them.
- Skip exists in the engine as a cycle stamp and in the banner as “clear this
  snooze.” Two stories, one word.
- Settings Reset and the morning/midday/evening times change what the phone
  should hold without going through the save-and-schedule path the pages use.

Monthly, Quarterly, and Yearly sharing one list page is modular in the ordinary
sense. Daily, Appointments, and the housing in `_layout.tsx` are larger, more
mixed files.

So: the reminder machinery is modular on purpose. The buttons, banners, and
Settings that talk to it are not held to that same shape. That is why the
review’s faults sat beside the engine rather than inside its arithmetic.

### Would being more modular be better?

Yes, but only in the places where the housing already talks past the engine.
More files for their own sake would not.

The quarterly wrong-month fault is arithmetic. The banner replaying on a cold
launch is a missing “already handled” record. Splitting those into extra modules
would not fix them.

What would help is one door for the work that today is done three ways:

- Banner, Siri, and the pages all load, patch, and save the list themselves. One
  “apply this change, then schedule” path would stop a Done being overwritten by
  a later save from a stale copy.
- The translator already knows who may snooze and who may be marked done. If the
  rows and banner buttons used that, Appointments would not offer a Snooze the
  engine ignores, and Monthly Done would not look like it cancelled a reminder
  that is still going to fire.
- Reset All Data and the morning/midday/evening times would go through that
  same door, so the phone’s queue would match what was just changed.

That is not a rewrite. It is making the rest of the app use the modularity the
scheduler already has. The unused Skip stamp is the other side of the same
coin: two stories for one word. Wiring it or dropping it is clearer than adding
another module around it.
