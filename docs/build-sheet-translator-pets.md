# Build sheet — the Pets translator

**Read this file and build. Do not read anything else except the two files named
below. Do not ask Patrick anything about the design. Every decision here is
already made and is not to be reopened.**

Written at Super-1-new, 2026-08-26. This sheet carries the answers themselves
rather than pointing at other documents, because a session given only pointers
asks for decisions that are already settled.

If something genuinely is not here, choose the plainest option that matches the
existing code, and put it in your build report to Patrick rather than writing it
into any document. Do not stop to ask.

---

## What to build

One new file and its tests. **Nothing in the app calls it.** The only existing
file edited is `scheduler/tests/run-all.ts`, which gains its two new lines.

- `scheduler/translators/pets.ts` — turns a saved Pets feed into the common
  shaped item.
- `scheduler/tests/translatorpets.test.ts`

**Nothing is added to `scheduler/inputshape.ts` this time.** The three banner
fields and the optional time fields are already there from #24-new.

**Do not touch `scheduler/readers/pets.ts`.** The old reader stays exactly where
it is and keeps working. It is retired only when its replacement is proved,
which is Patrick's order from #19-new. Do not touch any screen, `scheduler.ts`,
`reconcile.ts`, `stillwanted.ts`, `armdepth.ts`, or anything on the phone.

---

## The two files you may read outside this sheet

- **`scheduler/translators/myday.ts`** — Pets is its twin and this is the
  pattern. Follow its shape, its ordering and its voice closely; a reader who
  knows one should recognise the other at a glance.
- **`scheduler/inputshape.ts`** — the shape itself, for the field names and
  which are optional.

Nothing else. In particular, do not open `docs/handoff.md` or any other document
during the build.

---

## House rules

- **Plain TypeScript only.** No React, no React Native, no Expo, no storage. It
  must run under Node exactly like the readers do.
- **`now` is handed in**, never read from the clock.
- **Tests** export one function named `runTranslatorPetsTests()`, import
  `assert`, `assertSame`, `test` from `./runner.ts`, and are added to
  `run-all.ts` with a `console.log` heading above the call, in the same style as
  the others.
- **Comments are full sentences in plain English** explaining why, in the voice
  of the existing scheduler files.
- Run the suite when done:
  `node --experimental-strip-types scheduler/tests/run-all.ts`
  It was 267 of 267 passing before this work.

---

## What Pets saves

`PetsItem`, under the storage key `pets_feeds`. It is My Day's shape field for
field:

- `id` — the feed's own id.
- `label` — its name as the page shows it.
- `hour`, `minute` — either a number, or null when no time was set. Older saved
  items may have neither field at all, which counts as the same thing.
- `completed` — ticked off today. The daily reset clears it as the day turns.
- `snoozedUntil` — optional; the moment a snoozed feed is to be reminded about
  again, as a plain count of milliseconds. One stamp per feed, so snoozing twice
  moves the one reminder rather than leaving two behind.

---

## The translation, field by field

One function taking the saved feeds and `now`, returning one shaped item per
saved feed, in order, dropping none.

**What the item is**

- `sourceScreenCode` — `'pets'`.
- `itemIdText` — `item.id`.
- `itemNameText` — `item.label`.

**When it comes due**

- `triggerKindCode` — `'daily'`. Every Pets feed is a daily routine.
- `hasDueTimeBit` — set when `hour` and `minute` are both numbers. Null or
  missing means clear.
- `dueHour`, `dueMinute` — the feed's own when it has them, and **left out
  entirely when it does not.** They are optional on the shape and a zero would
  be a value a reader has to interpret.
- `dueWeekday`, `dueMoment` — absent. Neither belongs to a daily item.

**Capability bits**

- `canBeDoneBit` — set. Feeds are ticked off.
- `canBePushedBackBit` — set. Feeds can be snoozed, from the page and from the
  banner.
- `doneEndsItemBit` — **clear.** A feed done today comes back tomorrow, which is
  the whole point of the screen.
- `standsForGroupBit` — clear. Every Pets reminder stands for one feed.

**State**

- `isDoneBit` — `item.completed`.
- `pushedBackToStamp` — `item.snoozedUntil` when it is present, absent
  otherwise. Do not filter out a stamp already in the past; that judgment
  belongs to `stillwanted.ts` and it already makes it.

**How far ahead to speak**

- `leadTimeList` — empty. A daily item speaks at the moment itself, which is
  what an empty list means for the daily kind.

**The banner's words**

These are the only place Pets differs from My Day at all, and the difference is
one word:

- `bannerTitleText` — `'Pets Routine'`.
- `bannerBodyText` — `` `Time for ${item.label}!` ``.
- `bannerButtonsCode` — `'routineactions'`, the same shared routine button set
  My Day uses. The old reader gives it to both the occurrence and the snooze,
  so there is no second case.

**A trap worth naming.** `'petssnooze'` appears twice in this app meaning two
different things. It is a registered category name and so it is listed in
`BannerButtonsCode`, **and** it is the `source` name the old reader puts in a
snoozed feed's key. The old reader uses `'routineactions'` as the actual button
set in both places, so `'routineactions'` is what the translator sets. Do not
reach for `'petssnooze'` because the name looks apt.

---

## The snooze that stands on its own — already settled, do not re-decide

The old Pets reader arms a snooze **before** the guard on the feed having a
time, exactly as My Day's does, so a feed whose time was cleared after it was
snoozed still owes the reminder it promised.

**That behaviour is already protected and you have nothing to do about it.** It
was found at #24-new and cured there: `stillwanted.ts` now asks its questions in
the order done, push-back, no due time, so a shaped item with `hasDueTimeBit`
clear and a live `pushedBackToStamp` answers *wanted, this occurrence dropped,
the moment standing.*

Your part is only to make sure the translator carries both states through side
by side, and to prove it with a test. **Do not change `stillwanted.ts`.**

---

## What to test

At least these:

- A feed with an hour and minute becomes a daily shaped item with its time.
- A feed with a null hour or minute has `hasDueTimeBit` clear and leaves
  `dueHour` and `dueMinute` out entirely.
- A ticked feed has `isDoneBit` set and `doneEndsItemBit` clear.
- A snoozed feed carries its stamp through untouched, past moments included.
- The banner words come out exactly as the old reader writes them, `'Pets
  Routine'` included.
- A feed with no time but a live snooze keeps both, and `isStillWanted` answers
  wanted with the occurrence dropped and the moment standing.

---

## What comes after this, and is not part of it

My Week, then Look Ahead, then To-Do. Then swapping the screens over one at a
time, retiring each old reader as its replacement is proved. Then the phone.
