# Build sheet — the My Day translator

**Read this file and build. Do not read anything else. Do not ask Patrick
anything. Every decision below is already made and is not to be reopened.**

Written at Super-1-new, 2026-08-26. This sheet carries the answers themselves
rather than pointing at other documents, because a session given only pointers
asks for decisions that are already settled.

If something genuinely is not here, choose the plainest option that matches the
existing code and write a note at the foot of `docs/handoff.md` saying what you
chose and why. Do not stop to ask.

---

## What to build

One new file and its tests. **Nothing in the app calls it.** No existing file is
edited except `scheduler/tests/run-all.ts`, which gains its two new lines, and
`scheduler/inputshape.ts`, which gains three fields named below.

- `scheduler/translators/myday.ts` — turns a saved My Day item into the common
  shaped item.
- `scheduler/tests/translatormyday.test.ts`

**Do not touch `scheduler/readers/myday.ts`.** The old reader stays exactly where
it is and keeps working. It is retired only when its replacement is proved, which
is Patrick's own order from #19-new. Do not touch any screen, `scheduler.ts`,
`reconcile.ts`, or anything on the phone.

---

## House rules

- **Plain TypeScript only.** No React, no React Native, no Expo, no storage. It
  must run under Node exactly like the readers do.
- **`now` is handed in**, never read from the clock.
- **Tests** export one function named `runTranslatorMyDayTests()`, import
  `assert`, `assertSame`, `test` from `./runner.ts`, and are added to
  `run-all.ts` with a `console.log` heading above the call, in the same style as
  the others.
- **Comments are full sentences in plain English** explaining why, in the voice
  of the existing scheduler files.
- Run the suite when done:
  `node --experimental-strip-types scheduler/tests/run-all.ts`
  It was 248 of 248 passing before this work.

---

## First, three fields are added to the shape

Settled at Super-1-new. The banner's words are the translator's work — that was
already ruled at #21-new, when the background banner's count was settled as the
translator's job like every reader building its own sentence. They ride inside
the shaped item so the engine has everything it needs in one thing.

Add to `scheduler/inputshape.ts`, named in the same style as the rest:

- `bannerTitleText` — the heading the banner shows.
- `bannerBodyText` — the sentence under it.
- `bannerButtonsCode` — which registered button set it carries.

`bannerButtonsCode` is a named set of the button-set names the housing registers.
Read them out of `app/_layout.tsx` where the categories are declared, and include
only those. **This is the one read outside this sheet that is expected of you.**

**This placement is deliberately reversible.** The output side has not been
designed yet, so if that work later wants the words held differently, it is three
fields moving in five small files.

---

## What My Day saves

`MyDayItem`, under the storage key `my_routine`:

- `id` — the item's own id.
- `label` — its name as the page shows it.
- `hour`, `minute` — either a number, or null when no time was set. Older saved
  items may have neither at all, which counts as the same thing.
- `completed` — ticked off today. The daily reset clears it as the day turns.
- `snoozedUntil` — optional; the moment a snoozed item is to be reminded about
  again, as a plain count of milliseconds. One stamp per item, so snoozing twice
  moves the one reminder rather than leaving two behind.

---

## The translation, field by field

One function taking the saved items and `now`, returning one shaped item per
saved item.

**What the item is**

- `sourceScreenCode` — `'myday'`.
- `itemIdText` — `item.id`.
- `itemNameText` — `item.label`.

**When it comes due**

- `triggerKindCode` — `'daily'`. Every My Day item is a daily routine.
- `hasDueTimeBit` — set when `hour` and `minute` are both numbers. Null or
  missing means clear.
- `dueHour`, `dueMinute` — the item's own, when it has them.
- `dueWeekday`, `dueMoment` — absent. Neither belongs to a daily item.

**Capability bits**

- `canBeDoneBit` — set. My Day items are ticked off.
- `canBePushedBackBit` — set. My Day items can be snoozed, from the page and
  from the banner.
- `doneEndsItemBit` — **clear.** My Day's done covers today and only today; the
  item comes back tomorrow, which is the whole point of the screen.
- `standsForGroupBit` — clear. Every My Day reminder stands for one item.

**State**

- `isDoneBit` — `item.completed`.
- `pushedBackToStamp` — `item.snoozedUntil` when it is present, absent
  otherwise. Do not filter out a stamp already in the past; that judgment
  belongs to `stillwanted.ts` and it already makes it.

**How far ahead to speak**

- `leadTimeList` — empty. A daily item speaks at the moment itself, which is
  what an empty list means for the daily kind.

**The banner's words**

- `bannerTitleText` — `'Daily Routine'`.
- `bannerBodyText` — `` `Time for ${item.label}!` ``.
- `bannerButtonsCode` — the routine button set, which the existing reader names
  `routineactions`.

---

## The one thing that must survive the move

**My Day's snooze deliberately stands on its own.** In the existing reader the
snooze is armed *before* the guard on the item having a time, and the comment
says why: an item whose time was cleared after it was snoozed still owes the
reminder it promised.

So a shaped item can have `hasDueTimeBit` clear and a live `pushedBackToStamp`
at the same time, and that combination must still produce the snooze reminder.

**Check this against `scheduler/stillwanted.ts` before you finish.** Its first
step answers "no due time — not wanted". If that step throws the whole item away
and takes a live push-back with it, the behaviour is lost.

- If the block already handles it, write one test proving it and say so.
- **If it does not, do not quietly change the block.** Write it up at the foot of
  `docs/handoff.md` as a defect found, with what you saw, and leave the block
  alone. It is a decision for the supervising session.

---

## What to test

At least these:

- An item with an hour and minute becomes a daily shaped item with its time.
- An item with null hour or minute has `hasDueTimeBit` clear.
- A ticked item has `isDoneBit` set and `doneEndsItemBit` clear.
- A snoozed item carries its stamp through untouched, past moments included.
- The banner words come out exactly as the existing reader writes them.
- An item with no time but a live snooze keeps both — the case above.

---

## What comes after this, and is not part of it

The Pets translator, which is My Day's twin, then My Week, Look Ahead and To-Do.
Then swapping the screens over one at a time, retiring each old reader as its
replacement is proved. Then the phone.
