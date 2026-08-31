# Build sheet — lead moments, and the one line each translator gains

**Read this file and build. Read only the files on the read list below. Do not
ask Patrick anything about the design. Every decision here is already made and
is not to be reopened.**

Written at Super-3-new, 2026-08-26. This sheet carries the answers themselves
rather than pointing at other documents, because a session given only pointers
asks for decisions that are already settled.

If something genuinely is not here, choose the plainest option that matches the
existing code, and put it in your build report to Patrick rather than writing it
into any document. Do not stop to ask.

---

## What this is for, in one paragraph

A shaped item says when it comes due. It does not say which moments to actually
arm. For the four screens built so far that was the same thing, so nothing had
to work it out. To-Do is different: a task carries its own reminders — thirty
minutes before, two days before at midday — and each of those is a moment of its
own, counted back from the appointment. This is the piece that does that
counting. **It must exist before To-Do can be built or tested at all.**

---

## The decision that shapes the whole file

**Settled with Patrick at Super-3-new, and it removes a rule rather than adding
one.**

The design used to say that an empty list of lead times meant different things
for different kinds of item: for a daily or weekly item, speak at its own
moment; for a one-off, never speak. That is a thing someone has to remember, and
remembering is what keeps failing.

**Instead, every screen says outright when it wants speaking.** My Day, Pets, My
Week and Look Ahead each put in one lead time of nothing-before, meaning the
moment itself. To-Do puts in the list the person actually chose.

**So an empty list now means one thing everywhere: nothing to say.** There is no
branch on the trigger kind anywhere in this file, and none is to be added.

**Patrick's ruling on To-Do, confirmed this session:** a task saved with no
reminders on it never speaks, not even at the appointment time. That is what the
app does today and it is correct.

---

## What to build

**One new file, one new test file, three edited.**

- **New:** `scheduler/leadmoments.ts`
- **New:** `scheduler/tests/leadmoments.test.ts`
- **Edit:** `scheduler/translators/translate.ts` — the lead-time list becomes an
  accessor, and each of the four rule sets gains one line. Described below.
- **Edit:** `scheduler/tests/translatormyday.test.ts`,
  `translatorpets.test.ts`, `translatormyweek.test.ts`,
  `translatorlookahead.test.ts` — **only where they assert the lead-time list.**
  See "What may change in the existing tests".
- **Edit:** `scheduler/tests/run-all.ts` — one import, one headed call.

**Nothing else changes.** No screen, no reader, no `inputshape.ts`, no
`stillwanted.ts`, no `armdepth.ts`. **To-Do is not in this build** — it gets its
own sheet afterwards.

---

## The read list, which is separate from what you may edit

**Read and edit:** the files named above.

**Read only, do not edit:**

- `scheduler/inputshape.ts` — for `ShapedItem`, `LeadTime`, `LeadFormCode`,
  `LeadUnitCode` and `LeadNamedTimeCode`. Every type you need is already there.
- `scheduler/readers/todo.ts` — **for the arithmetic only.** Its `readToDo`
  works out both forms of lead time today, and yours must produce the same
  numbers. Its `ClockTimes`, `TimeOfDay` and `DEFAULT_CLOCK_TIMES` are there too.
- `scheduler/readers/occurrences.ts` — for `nextOccurrences`, which is the daily
  day-stepping. **You are not calling it.** See the ruling below.
- `scheduler/stillwanted.ts` — so you can see what has already been decided
  before an item reaches you.

**Do not open anything else**, and in particular not `docs/handoff.md`, not
`docs/reminder-shape.md`, and no other build sheet.

---

## House rules

- **Plain TypeScript only.** No React, no React Native, no Expo, no storage. It
  must run under Node exactly as the readers do.
- **`now` is handed in**, never read from the clock.
- **Tests** export one function named for the part they cover, import `assert`,
  `assertSame`, `test` from `./runner.ts`, and are added to `run-all.ts` with a
  `console.log` heading above the call, in the same style as the others.
- **Comments are full sentences in plain English** explaining why, in the voice
  of the existing scheduler files.
- Run the suite when done:
  `node --experimental-strip-types scheduler/tests/run-all.ts`
  It was 319 of 319 passing before this work.
- **Run `npx tsc` as well.** It reports one standing Expo router error in
  `app/settings.tsx` which is nothing to do with this work. Anything else is
  yours.

---

## The file

### What it exports

```
export interface TimeOfDay {
    hour: number;
    minute: number;
}

export interface ClockTimes {
    morning: TimeOfDay;
    midday: TimeOfDay;
    evening: TimeOfDay;
}

export function momentsFor(
    item: ShapedItem,
    now: number,
    clockTimes: ClockTimes,
): number[]
```

**Why the two types are declared here and not imported.** They live in
`readers/todo.ts` today, and that reader is due to be retired once To-Do is
swapped over. A new file must not be tied to a file that is going away. Declare
them here; the shapes are identical, so the reader's own values still fit where
they are handed in. **Do not move or delete anything in `readers/todo.ts`.**

**`DEFAULT_CLOCK_TIMES` is not copied.** It belongs to whatever reads Settings,
and nothing here has a default — the three times are always handed in.

### Step one: the base moment

The moment the lead times are counted back from. It depends only on
`triggerKindCode`, and this is the one place that reads it.

- **`'date'`** — the base is `item.dueMoment`.
- **`'daily'`** — take the day `now` falls on, set `item.dueHour` and
  `item.dueMinute` on it, and if that moment has already gone by, step forward
  one day. **Step the day, do not add twenty-four hours**, so the time of day
  survives the clocks going forward or back.
- **`'weekly'`** — the same, then step forward a day at a time until the weekday
  matches `item.dueWeekday`, and if the moment found has already gone by, step
  forward seven more days. **`dueWeekday` is Sunday as 0**, exactly as the app
  saves it, which is what `new Date().getDay()` gives.

**You are not calling `nextOccurrences`.** Read it for the day-stepping, which
is right, and leave the rest: it arms two days at a time, which is wrong now that
depth is one, and it skips a day when the item is ticked off, which is a
judgment `stillwanted.ts` has already made. Making it twice in two places is how
two places come to disagree.

**When a field the kind needs is absent, return an empty list.** A date item
with no `dueMoment`, a daily one with no hour or minute. This is not a second
judgment about whether the item is wanted — `stillwanted.ts` has already made
that and the caller respects it. It is the only thing arithmetic can do with a
missing number, and guessing one would be worse.

### Step two: each lead time becomes a moment

Every lead time in `item.leadTimeList`, in the order given.

- **`leadFormCode: 'offset'`** — the base moment less the amount. Minutes, hours
  and days converted by multiplication, **exactly as `readToDo` does it today**:
  minutes times sixty thousand, hours times three million six hundred thousand,
  days times eighty-six million four hundred thousand. Do not change this to day
  stepping. It would be more correct across a clock change and it would move
  behaviour, and moving behaviour is the one thing this build must not do.
- **`leadFormCode: 'clock'`** — take the calendar day the base moment falls on,
  step back `leadDaysBefore` whole days, and set the named time from
  `clockTimes` on it. **Step the day here**, which is what `readToDo` does.

**A lead time of nothing-before** — the offset form with an amount of zero — is
not a special case. Zero taken from the base is the base, which is the moment
itself. Write no code for it.

### Step three: what comes back

- **Any moment at or before `now` is dropped.** `readToDo` does this today and
  it must keep happening. It belongs here rather than in `stillwanted.ts`
  because that block sees an item and this piece sees the individual moments;
  only this piece knows them.
- **The rest come back in the order their lead times were given**, not sorted.
  Sorting is the reconcile's affair and it already does it.
- **Nothing is deduplicated.** Two lead times landing on the same moment is the
  person having asked for it twice, and the reconcile names reminders by key,
  which is where a duplicate would be caught if it ever mattered.

---

## The one line each translator gains

In `scheduler/translators/translate.ts`:

- **`ScreenRules<TSaved>` gains `leadTimesOf: (saved: TSaved) => LeadTime[]`**,
  beside `dueOf`.
- **The core uses it** — `leadTimeList: rules.leadTimesOf(saved)` in place of the
  hard-coded empty list, and the comment above it is reworded to say that each
  screen states its own lead times and that an empty list means nothing to say.
- **All four rule sets return the same thing:** one offset lead time, amount
  zero, unit minutes. That is the moment itself.
- **The four are identical**, so write the value once as a small named constant
  at the top of the rule-set section — something like `atTheMomentItself` — with
  a comment saying what it means, and give the same constant to all four.

**Nothing a person sees moves**, because nothing in the app calls the translator
yet.

---

## What may change in the existing tests

**This build deliberately moves what the translator produces**, so the rule from
the last sheet — change nothing but the import line — does not apply here.

- **You may change only assertions about `leadTimeList`.** If any of the four
  test files asserts an empty list, it becomes the one-lead-time list.
- **Change nothing else in them.** Not a case, not another assertion, not a
  value.
- **If any test other than a lead-time assertion fails, the build is wrong.**
  Fix your code, never that test.
- **All 319 must still pass**, plus whatever your new file adds.

---

## What to test in the new file

At least these.

- A date item with one lead time of nothing-before comes back with its own
  moment, and nothing else.
- A daily item with one lead time of nothing-before, whose time is later today,
  comes back with today's moment.
- The same item, whose time has already gone by today, comes back with
  tomorrow's.
- A weekly item comes back with the next date whose weekday matches, at its own
  hour and minute — including the case where today is that weekday and the time
  has not yet come, which must give today rather than a week away.
- **A weekly item on today's weekday whose time has gone by comes back seven
  days on**, not tomorrow.
- An offset lead time of thirty minutes gives the base moment less thirty
  minutes; two hours and three days likewise.
- A clock lead time of two days before at midday gives midday two calendar days
  before the base moment, taking midday from the `clockTimes` handed in and not
  from any default.
- A clock lead time of zero days before at morning gives that morning on the
  base moment's own day.
- **An empty lead-time list gives an empty result, for every one of the three
  kinds.** Three cases. This is the decision at the top of the sheet and it wants
  pinning down.
- A lead time whose moment has already gone by is dropped, and the others on the
  same item still come back.
- A date item with no `dueMoment` gives an empty result, and a daily item with no
  hour gives an empty result.
- Two lead times give two moments, in the order the lead times were given.

---

## What comes after this, and is not part of it

To-Do's own sheet, which is what this piece exists for. Its tasks are date items
whose lead times are the reminders the person set, and its eight o'clock
background banner is one reminder built from the whole list rather than from any
single task — the one thing the table's shape does not yet cover. Then swapping
the screens over one at a time. Then the phone.
