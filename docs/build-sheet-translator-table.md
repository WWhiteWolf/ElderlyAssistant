# Build sheet — the one translator and its table

**Read this file and build. Read only the files on the read list below. Do not
ask Patrick anything about the design. Every decision here is already made and
is not to be reopened.**

Written at Super-2-new, 2026-08-26. This sheet carries the answers themselves
rather than pointing at other documents, because a session given only pointers
asks for decisions that are already settled.

If something genuinely is not here, choose the plainest option that matches the
existing code, and put it in your build report to Patrick rather than writing it
into any document. Do not stop to ask.

---

## What this replaces, and why

**Two per-screen translators were built, `translators/myday.ts` and
`translators/pets.ts`, and they differ from each other by two string literals.**
Everything else between those two files is comment text with "item" reworded to
"feed". A third was about to be built the same way.

**Nothing in the engine goes by page.** `stillwanted.ts` never mentions
`sourceScreenCode`; it branches on the capability bits, the state fields and
`hasDueTimeBit`. `armdepth.ts` branches on `triggerKindCode` alone.
`sourceScreenCode` is carried so a tapped banner can be routed home, and nothing
branches on it. That is what the codes and bits were designed to do — turn a
per-screen difference into data set once at the boundary.

**So the translator is one, with a table of rules per screen.** The full
reasoning is in `docs/reminder-shape.md` under "The translator is one, not
five". You do not need to read it to build this; it is named so you know the
decision has a home.

---

## What to build

**One new file, two deleted, two edited, two new test files.**

- **New:** `scheduler/translators/translate.ts` — the core translator, the rules
  type, and the four rule sets.
- **New:** `scheduler/tests/translatormyweek.test.ts`
- **New:** `scheduler/tests/translatorlookahead.test.ts`
- **Delete:** `scheduler/translators/myday.ts` and
  `scheduler/translators/pets.ts`. Everything in them moves into the table.
- **Edit:** `scheduler/tests/translatormyday.test.ts` and
  `scheduler/tests/translatorpets.test.ts` — **the import line and nothing
  else.** See "How you prove it" below; this matters.
- **Edit:** `scheduler/tests/run-all.ts` — two new imports, two new headed calls.
- **Edit:** `scheduler/inputshape.ts` — **one stale comment only**, described at
  the end. No field changes.

**Nothing else in `inputshape.ts` changes.** Every field this needs is already
there. **No screen is touched. No reader is touched. Nothing in the app calls
any of this yet.**

**To-Do is not in this build.** It has one thing that does not fit the table —
its background banner, which is built from the whole list rather than from one
item — and it gets its own sheet afterwards. Build the four and stop.

**Its lead times are not a special case**, in case that occurs to you. They are
another accessor in the table exactly like `dueOf`, empty for these four screens.

---

## The read list, which is separate from what you may edit

**Read and edit:** the files named above.

**Read only, do not edit:**

- `scheduler/translators/myday.ts` and `scheduler/translators/pets.ts` — the
  pattern, the voice, and the field-by-field comments. Most of their comment
  text should survive into the new file, moved to where it now belongs.
- `scheduler/inputshape.ts` — the shape and its field names.
- `scheduler/readers/myday.ts`, `readers/pets.ts`, `readers/myweek.ts`,
  `readers/lookahead.ts` — for the four saved item types, which you import, and
  for the banner words each one writes.
- `scheduler/stillwanted.ts` — for `isStillWanted`, which some tests call.

**Do not open anything else**, and in particular not `docs/handoff.md`, not
`docs/reminder-shape.md`, and no other build sheet.

---

## House rules

- **Plain TypeScript only.** No React, no React Native, no Expo, no storage. It
  must run under Node exactly like the readers do.
- **`now` is handed in**, never read from the clock.
- **Tests** export one function named for the part they cover, import `assert`,
  `assertSame`, `test` from `./runner.ts`, and are added to `run-all.ts` with a
  `console.log` heading above the call, in the same style as the others.
- **Comments are full sentences in plain English** explaining why, in the voice
  of the existing scheduler files.
- Run the suite when done:
  `node --experimental-strip-types scheduler/tests/run-all.ts`
  It was 286 of 286 passing before this work.
- **Run `npx tsc` as well.** It reports one standing Expo router error in
  `app/settings.tsx` which is nothing to do with this work. Anything else is
  yours.

---

## The shape of the file

Three parts, in this order.

### One: what a screen's rules are

A type describing everything the translator needs to know about one screen. It
is generic over that screen's own saved item type, so the compiler checks each
rule set against the real saved shape. **That is the point of writing accessors
rather than field-name strings** — a table of strings cannot be checked, and the
ruling at #22-new against packing bits was made on exactly that ground:
readability and the compiler's checking are what this app trades for.

```
export interface DueFields {
    hasDueTimeBit: boolean;
    dueHour?: number;
    dueMinute?: number;
    dueWeekday?: number;
    dueMoment?: number;
}

export interface ScreenRules<TSaved> {
    // Constants, the same for every item on the screen.
    sourceScreenCode: SourceScreenCode;
    triggerKindCode: TriggerKindCode;
    canBeDoneBit: boolean;
    canBePushedBackBit: boolean;
    doneEndsItemBit: boolean;
    standsForGroupBit: boolean;
    bannerTitleText: string;
    bannerButtonsCode: BannerButtonsCode;

    // Read from the saved item.
    idOf: (saved: TSaved) => string;
    nameOf: (saved: TSaved) => string;
    isDoneOf: (saved: TSaved) => boolean;
    pushedBackStampOf: (saved: TSaved) => number | undefined;
    dueOf: (saved: TSaved) => DueFields;
    bannerBodyTextOf: (saved: TSaved) => string;
}
```

### Two: the core

```
export function translateWith<TSaved>(
    rules: ScreenRules<TSaved>,
    saved: TSaved[],
    now: number,
): ShapedItem[]
```

One shaped item per saved item, in the order they were given, **and none is
ever dropped.** Dropping is a judgment and judgments belong in `stillwanted.ts`.
An item with no time and an item already ticked off both come through here like
any other, carrying the facts that let the block decide.

**`now` is not read at present.** Take it all the same, and `void now;` as the
existing translators do, because every part of this scheduler that could ever
need the time takes it as an argument rather than reaching for the clock.

**Absent fields are left off, never filled with zeros.** `dueHour`,
`dueMinute`, `dueWeekday`, `dueMoment` and `pushedBackToStamp` are all spread in
conditionally, exactly as `translators/myday.ts` does it today. Midnight is a
real time, so a zero would have to be interpreted before it could be told apart
from an absence.

**The stamp is carried through exactly as saved**, a moment already in the past
included. Whether a stamp has been spent is a judgment and `stillwanted.ts`
already makes it. Making it twice in two places is how the two come to disagree.

### Three: the four rule sets and their named wrappers

One exported rule set per screen, and one exported thin function per screen that
calls `translateWith`. **Keep these four signatures exactly as they are:**

```
export function translateMyDay(items: MyDayItem[], now: number): ShapedItem[]
export function translatePets(items: PetsItem[], now: number): ShapedItem[]
export function translateMyWeek(chores: Chore[], now: number): ShapedItem[]
export function translateLookAhead(items: LookAheadItem[], now: number): ShapedItem[]
```

The first two must match the deleted files' exports **name for name and argument
for argument.** That is what lets the existing tests move across untouched.

---

## The four rule sets, field by field

### My Day — from `readers/myday.ts`, type `MyDayItem`

- `sourceScreenCode` — `'myday'`
- `triggerKindCode` — `'daily'`
- `idOf` — `item.id`
- `nameOf` — `item.label`
- `isDoneOf` — `item.completed`
- `pushedBackStampOf` — `item.snoozedUntil`
- `dueOf` — `hasDueTimeBit` set when `hour` and `minute` are **both actually
  numbers**; then `dueHour` and `dueMinute`. No weekday, no moment.
- `canBeDoneBit` — set. `canBePushedBackBit` — set.
- `doneEndsItemBit` — **clear.** A routine item done today comes back tomorrow.
- `standsForGroupBit` — clear.
- `bannerTitleText` — `'Daily Routine'`
- `bannerBodyTextOf` — `` `Time for ${item.label}!` ``
- `bannerButtonsCode` — `'routineactions'`

### Pets — from `readers/pets.ts`, type `PetsItem`

Identical to My Day in every respect **except two**:

- `sourceScreenCode` — `'pets'`
- `bannerTitleText` — `'Pets Routine'`

**That is the whole difference, and it is the reason for this build.**

**The trap the earlier sheets named is still live.** `'petssnooze'` and
`'mydaysnooze'` are key source names in the old readers, and they are also
registered category names. They are **not** the button set either banner
carries. Both screens use `'routineactions'`.

### My Week — from `readers/myweek.ts`, type `Chore`

- `sourceScreenCode` — `'myweek'`
- `triggerKindCode` — `'weekly'`
- `idOf` — `chore.id`
- `nameOf` — `chore.label`
- `isDoneOf` — `chore.completed` — **read ruling two below first**
- `pushedBackStampOf` — `chore.postponedTo`
- `dueOf` — `hasDueTimeBit` set when `day`, `hour` and `minute` are **all three**
  numbers; then `dueWeekday`, `dueHour`, `dueMinute`. **The weekday is
  `chore.day` exactly as saved — see ruling one. Do not add one.**
- `canBeDoneBit` — set. `canBePushedBackBit` — set.
- `doneEndsItemBit` — **clear.** A chore done this week comes round next week.
- `standsForGroupBit` — clear.
- `bannerTitleText` — `'Weekly Chore'`
- `bannerBodyTextOf` — `` `Time for ${chore.label}!` ``
- `bannerButtonsCode` — `'routineactions'`

**A chore also carries `doneAt`**, which the weekly reset uses and the reader
does not declare. **Ignore it entirely.** It belongs to the reset, not to the
engine.

**`'myweekpostpone'` is a key's source name in the old reader, not a button
set**, the same trap as Pets.

### Look Ahead — from `readers/lookahead.ts`, type `LookAheadItem`

- `sourceScreenCode` — `'lookahead'`
- `triggerKindCode` — `'date'`
- `idOf` — `item.id`
- `nameOf` — `item.label`
- `isDoneOf` — **always `false`.** The screen has no done field at all. With
  `canBeDoneBit` clear as well, `stillwanted.ts` never reaches the state, so
  Look Ahead falls out as a rule rather than as an exception.
- `pushedBackStampOf` — `item.delayedUntil`
- `dueOf` — **see ruling three.** `hasDueTimeBit` set when `year`, `month` and
  `day` are all numbers, matching the old reader's guard; then `dueMoment` only.
- `canBeDoneBit` — **clear.**
- `canBePushedBackBit` — set. The page delays and the banner delays, both
  writing `delayedUntil`.
- `doneEndsItemBit` — clear. It never matters, `canBeDoneBit` being clear.
- `standsForGroupBit` — clear.
- `bannerTitleText` — `'🔭 Look Ahead'` — **the emoji is part of it**, word for
  word as the old reader writes it.
- `bannerBodyTextOf` — `` `Time for ${item.label}!` ``
- `bannerButtonsCode` — `'lookaheadactions'`

**Do not carry across the old reader's `due.getTime() > now` guard.** That is a
judgment about whether a past entry still wants arming, and judgments belong in
`stillwanted.ts`. The translator says what the item IS. A Look Ahead entry whose
moment has gone comes through here with its moment intact.

---

## Ruling one: the weekday stays as the app saves it

**The shape holds `chore.day` unchanged, Sunday as 0 through Saturday as 6.**
The old reader adds one when it builds the trigger, because the phone counts
weekdays from one. That addition belongs at the phone boundary and nowhere else.

The shape is the app's own truth about an item, and a phone's counting
convention living inside it would be a second thing every reader of the shape
has to remember. `scheduler/weeklyreset.ts` already works in the saved counting,
so the shape agrees with the app's own arithmetic and disagrees with nothing.

**Write a test that pins this down**, because it is exactly the kind of thing a
later session would "fix" by adding one.

## Ruling two: the chore's tick goes into the shape, though the old reader ignores it

**This is a deliberate difference between what the old reader does and what the
translator says, and it is not a mistake.**

The old My Week reader never looks at `completed`. It arms one true weekly repeat
per chore whatever the tick says, because a repeating alarm cannot be told to
skip a single week — so a chore already ticked off still calls out. That is My
Week's own long-standing fault.

The translator tells the truth instead: `isDoneBit` is `chore.completed`,
`canBeDoneBit` set, `doneEndsItemBit` clear.

**Nothing changes on the phone because of this.** Nothing calls the translator,
and the behaviour only moves when the screen is swapped over — at which point My
Week stops being a repeat and becomes single moments like the other two, which is
the cure. **That swap is the supervising session's problem and not yours.**

**The tick is safe to read**, which was checked before this was settled.
`resetForNewCycle` in `scheduler/weeklyreset.ts` clears `completed` once the
chore's own cycle comes round again, each chore on its own day. It clears a stale
`postponedTo` the same way.

## Ruling three: a date item carries its moment alone

**Settled at Super-2-new, and it is new — nothing before this sheet said it.**

`inputshape.ts` describes `dueHour` and `dueMinute` as used by all three trigger
kinds. For a `'date'` item that would mean the hour existing twice — once inside
`dueMoment` and once beside it — and two copies of one fact are two things that
can come to disagree.

**So a date item sets `dueMoment` and leaves `dueHour` and `dueMinute` off.**
Daily items set hour and minute; weekly items set weekday, hour and minute; date
items set the moment. Each kind sets exactly the fields its own kind needs and
nothing else.

**Write a test pinning it**: a Look Ahead entry comes out with `dueMoment` set
and both `dueHour` and `dueMinute` absent.

---

## How you prove it — read this before you start

**The two existing test files are the proof that this build changed no
behaviour.** `translatormyday.test.ts` and `translatorpets.test.ts` were written
against the two files you are deleting. If the new table produces the same
shaped items, those tests pass **with only their import line changed.**

- **Change the import line and nothing else in either file.** Not a case, not an
  assertion, not a value.
- **If a test fails, the table is wrong.** Fix the table, never the test.
- **If you find yourself wanting to change a test**, stop and put it in your
  build report to Patrick. It means the consolidation moved behaviour, and that
  is the one thing this build must not do.

**The count must come out at 286 plus whatever your two new files add**, with
none of the old 286 lost or altered.

---

## What to test in the two new files

`translatormyweek.test.ts`, at least:

- A whole chore becomes a weekly shaped item with its day, hour and minute.
- **The weekday is not shifted**: a chore saved with `day` 0 comes out with
  `dueWeekday` 0.
- A chore missing its day, or its hour, or its minute has `hasDueTimeBit` clear
  and leaves `dueHour`, `dueMinute` and `dueWeekday` out entirely. Three cases,
  not one.
- A ticked chore has `isDoneBit` set, `canBeDoneBit` set, `doneEndsItemBit`
  clear.
- A postponed chore carries its stamp through untouched, past moments included.
- The banner words come out exactly as the old reader writes them.
- A chore with no time but a live postpone keeps both, and `isStillWanted`
  answers wanted with the occurrence dropped and the moment standing.

`translatorlookahead.test.ts`, at least:

- An entry becomes a date shaped item whose `dueMoment` is its own date and time.
- **`dueHour` and `dueMinute` are absent**, per ruling three.
- An entry missing its year, month or day has `hasDueTimeBit` clear and no
  `dueMoment`. Three cases.
- `canBeDoneBit` is clear and `isDoneBit` is false, and `isStillWanted` answers
  wanted for an entry that has neither.
- **An entry whose moment has already gone still comes through**, with its
  moment intact — the translator drops nothing.
- A delayed entry carries `delayedUntil` through as `pushedBackToStamp`.
- The banner title is `'🔭 Look Ahead'` with its emoji, and the buttons are
  `'lookaheadactions'`.

---

## The one comment to fix

`scheduler/inputshape.ts` opens with a paragraph saying **"A small translator per
screen sets the fields below at the boundary."** That is now false. Reword that
one sentence to say that one translator, driven by a table of rules per screen,
sets the fields at the boundary. **Change nothing else in that file** — no
fields, no types, no other comment.

---

## What comes after this, and is not part of it

To-Do, in its own sheet. Its lead times fold in as one more accessor. The one
thing that genuinely does not fit is its eight o'clock background banner with
`standsForGroupBit`, which is built from the whole list rather than from a single
saved item — a reduction where everything else is a mapping. Then swapping the
screens over one at a time, retiring each old reader as its replacement is
proved. Then the phone.
