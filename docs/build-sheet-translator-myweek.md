# Build sheet — the My Week translator

> ## WITHDRAWN at Super-2-new, 2026-08-26. Do not build from this file.
>
> **It was never sent to a worker.** It asks for a fifth per-screen translator
> file, and there is no such thing to build: nothing in the engine goes by page.
> The reasoning is in `docs/reminder-shape.md` under "The translator is one, not
> five".
>
> **The sheet is kept because it is the evidence.** Its "translation, field by
> field" section below is a table row — about a dozen constants and field names
> — written out as two hundred lines of English and handed to a session to build
> a file around. Read that section and the case makes itself.
>
> **Both of its rulings still stand** and are carried forward unchanged into the
> replacement sheet: the weekday stays as the app saves it with Sunday as 0, and
> the chore's tick goes into the shape though the old reader ignores it.
>
> **Build from `docs/build-sheet-translator-table.md` instead.**

**Read this file and build. Read only the files on the read list below. Do not
ask Patrick anything about the design. Every decision here is already made and
is not to be reopened.**

Written at Super-1-new, 2026-08-26. This sheet carries the answers themselves
rather than pointing at other documents, because a session given only pointers
asks for decisions that are already settled.

If something genuinely is not here, choose the plainest option that matches the
existing code, and put it in your build report to Patrick rather than writing it
into any document. Do not stop to ask.

**My Week is the first translator that is not a twin.** It is weekly rather than
daily, its push-back is saved under a different name, and its old reader works a
different way from the two daily ones. Everything that follows from that is
settled below.

---

## What to build

One new file and its tests. **Nothing in the app calls it.** The only existing
file edited is `scheduler/tests/run-all.ts`, which gains its two new lines.

- `scheduler/translators/myweek.ts` — turns a saved chore into the common shaped
  item.
- `scheduler/tests/translatormyweek.test.ts`

**Nothing is added to `scheduler/inputshape.ts`.** Every field this needs,
`dueWeekday` included, is already there.

---

## The read list, which is separate from what you may edit

**Read and edit:** the two new files above, and `scheduler/tests/run-all.ts`.

**Read only, do not edit:**

- `scheduler/translators/pets.ts` — the pattern. Follow its shape, its ordering
  and its voice.
- `scheduler/inputshape.ts` — the shape and its field names.
- `scheduler/readers/myweek.ts` — for the `Chore` type, which you import.
- `scheduler/stillwanted.ts` — for `isStillWanted`, which one test calls.

**Do not open anything else**, and in particular not `docs/handoff.md` and no
other build sheet.

---

## House rules

- **Plain TypeScript only.** No React, no React Native, no Expo, no storage. It
  must run under Node exactly like the readers do.
- **`now` is handed in**, never read from the clock.
- **Tests** export one function named `runTranslatorMyWeekTests()`, import
  `assert`, `assertSame`, `test` from `./runner.ts`, and are added to
  `run-all.ts` with a `console.log` heading above the call, in the same style as
  the others.
- **Comments are full sentences in plain English** explaining why, in the voice
  of the existing scheduler files.
- Run the suite when done:
  `node --experimental-strip-types scheduler/tests/run-all.ts`
  It was 286 of 286 passing before this work.

---

## What My Week saves

`Chore`, under the storage key `week_routine`:

- `id` — the chore's own id.
- `label` — its name as the page shows it.
- `day` — the day of the week it belongs to, **counting Sunday as 0 through
  Saturday as 6.**
- `hour`, `minute` — its time of day.
- `completed` — ticked off for this cycle.
- `postponedTo` — optional; the moment a postponed chore is to be reminded about
  instead, as a plain count of milliseconds. The page's Postpone button and the
  banner's Delay both write this one field, settled at #20-new, because a delay
  and a postpone are the same act at different distances.

**A chore also carries `doneAt`**, which the weekly reset uses and the reader
does not declare. **The translator ignores it entirely** and nothing about it
goes into the shape. It belongs to the reset, not to the engine.

---

## The translation, field by field

One function taking the saved chores and `now`, returning one shaped item per
saved chore, in order, dropping none.

**What the item is**

- `sourceScreenCode` — `'myweek'`.
- `itemIdText` — `chore.id`.
- `itemNameText` — `chore.label`.

**When it comes due**

- `triggerKindCode` — `'weekly'`. This is the first translator that is not
  daily.
- `hasDueTimeBit` — set when `day`, `hour` and `minute` are all numbers. The old
  reader guards on all three and skips the chore if any is missing, so all three
  are what the bit means here.
- `dueWeekday` — **`chore.day` exactly as saved, Sunday 0 through Saturday 6.**
  See the ruling below; do not add one.
- `dueHour`, `dueMinute` — the chore's own when it has them, and **left out
  entirely when it does not.**
- `dueMoment` — absent. It belongs to date items only.

**Capability bits**

- `canBeDoneBit` — set. Chores are ticked off.
- `canBePushedBackBit` — set. Chores are postponed from the page and delayed
  from the banner, and both write the one field.
- `doneEndsItemBit` — **clear.** A chore done this week comes round again next
  week.
- `standsForGroupBit` — clear. Every My Week reminder stands for one chore.

**State**

- `isDoneBit` — `chore.completed`. **Read the ruling below before you write
  this**; it is the one place the shape deliberately says something the old
  reader does not.
- `pushedBackToStamp` — `chore.postponedTo` when it is present, absent
  otherwise. Do not filter out a stamp already in the past; that judgment
  belongs to `stillwanted.ts` and it already makes it.

**How far ahead to speak**

- `leadTimeList` — empty. A weekly item speaks at the moment itself, which is
  what an empty list means for the weekly kind.

**The banner's words**

- `bannerTitleText` — `'Weekly Chore'`.
- `bannerBodyText` — `` `Time for ${chore.label}!` ``.
- `bannerButtonsCode` — `'routineactions'`, the shared routine button set. The
  old reader uses it for the weekly repeat and for the postpone alike, so there
  is no second case.

**The same trap the Pets sheet named appears here.** The old reader uses
`'myweekpostpone'` as the `source` name in a postponed chore's key. That is a
key's source name, not a button set. The button set is `'routineactions'` in
both places.

---

## Ruling one: the weekday stays as the app saves it

**The shape holds `chore.day` unchanged, Sunday as 0.** The old reader adds one
when it builds the trigger, because the phone counts weekdays from one. That
addition belongs at the phone boundary and nowhere else.

The reason is that the shape is the app's own truth about an item, and a phone's
counting convention living inside it would be a second thing every reader of the
shape has to remember. The weekly reset in `scheduler/weeklyreset.ts` already
works in the saved counting, so keeping the shape there means the shape agrees
with the app's own arithmetic and disagrees with nothing.

**Write a test that pins this down**, because it is exactly the kind of thing a
later session would "fix" by adding one.

---

## Ruling two: the chore's tick goes into the shape, though the old reader ignores it

**This is the one deliberate difference between what the old reader does and
what the translator says, and it is not a mistake.**

The old My Week reader never looks at `completed`. It arms one true weekly
repeat per chore whatever the tick says, because a repeating alarm cannot be
told to skip a single week — so a chore already ticked off still calls out. That
is My Week's own long-standing fault, and it is written up in
`docs/reminder-shape.md`.

The translator therefore tells the truth: `isDoneBit` is `chore.completed`,
`canBeDoneBit` is set, and `doneEndsItemBit` is clear.

**Nothing changes on the phone because of this.** Nothing calls the translator,
and the behaviour only moves when the screen is swapped over — at which point My
Week stops being a repeat and becomes single moments like the other two, which
is the cure. **That swap is the supervising session's problem and not yours.**

**And the tick is safe to read**, which was checked before this was settled.
`resetForNewCycle` in `scheduler/weeklyreset.ts` clears `completed` once the
chore's own cycle comes round again, each chore on its own day, so a ticked
chore does not stay done for ever. It clears a stale `postponedTo` the same way.

---

## What to test

At least these:

- A whole chore becomes a weekly shaped item with its day, hour and minute.
- **The weekday is not shifted**: a chore saved with `day` 0 comes out with
  `dueWeekday` 0.
- A chore missing its day, or its hour, or its minute has `hasDueTimeBit` clear
  and leaves `dueHour` and `dueMinute` out entirely. Three cases, not one.
- A ticked chore has `isDoneBit` set, `canBeDoneBit` set and `doneEndsItemBit`
  clear.
- A postponed chore carries its stamp through untouched, past moments included.
- The banner words come out exactly as the old reader writes them, `'Weekly
  Chore'` included.
- A chore with no time but a live postpone keeps both, and `isStillWanted`
  answers wanted with the occurrence dropped and the moment standing.

---

## What comes after this, and is not part of it

Look Ahead, then To-Do. Then swapping the screens over one at a time, retiring
each old reader as its replacement is proved. Then the phone.
