# Build sheet — a To-Do task may have no date and no time

**Read this file and build. Read only the files on the read list below. Do not
ask Patrick anything about the design. Every decision here is already made and
is not to be reopened.**

Written at Super-4-new / #27-new, 2026-08-27. This sheet carries the answers
themselves rather than pointing at other documents, because a session given only
pointers asks for decisions that are already settled.

If something genuinely is not here, choose the plainest option that matches the
existing code, and put it in your build report to Patrick rather than writing it
into any document. Do not stop to ask.

---

## The fault, in Patrick's words

He adds a To-Do task and leaves the date and time boxes alone. A pop-up asks
whether he really means to save without a reminder, and he says yes. **The app
then writes today's date at twelve noon onto the task anyway** — whatever the
boxes happened to be showing.

His own summary is the whole of it: *a pop-up already asks it, it just ignores
it.* The app asks the question and then overrules the answer.

---

## Why it happens, read first-hand at #27-new

- **`app/todo.tsx` line 122** starts `newDueAt` at today, twelve noon.
- **`components/DateTimeControl.tsx` line 215** repaints an empty date box from
  that value the moment the box loses focus. There is no way to leave it blank.
- **Line 225 does the same for the time box** unless the page turns on
  `optionalTime`, and To-Do does not — line 656 passes only `value`, `onChange`
  and `onValidityChange`.
- **`finishAdd` (lines 261–265) and `finishUpdate` (lines 299–303)** then write
  `year`, `month`, `day`, `hour` and `minute` unconditionally.

So the boxes fill themselves in, and the save stores what they filled in.

---

## The decision

**A To-Do task may be saved with no date and no time, and that is a real and
lasting state — not a gap to be filled in with a default.**

Blank means blank. The pop-up already asks the question; the app must now honour
the answer.

**This is not the old background-task idea coming back.** Nothing about
`taskType` changes, no background task is created, and the background banner and
list are untouched.

---

## How much of this already works

**More than half, and none of it needs building.** Read and confirmed at
#27-new:

- **`taskDueDate` (line 209)** already returns `null` when `year`, `month` or
  `day` is not a number.
- **`scheduleLabel` (line 218)** already returns an empty string for such a
  task, so the tile's "Due:" line disappears on its own.
- **`getSortedTasks` (line 401)** already sends a task with no due date to the
  bottom of the list. Patrick confirmed that is what he wants.
- **The new engine already copes.** `todoRules.dueOf` in
  `scheduler/translators/translate.ts` checks that `year`, `month` and `day` are
  numbers and returns `hasDueTimeBit: false` when they are not. A task with no
  date therefore arms nothing, which is correct — Patrick's standing ruling is
  that a task with no reminders never speaks.

**So the work is letting the blank through, not teaching anything to handle it.**

---

## What to build

**Two files edited. No new files.**

- **Edit:** `components/DateTimeControl.tsx` — an optional-date mode, built to
  match the optional-time mode already there.
- **Edit:** `app/todo.tsx` — turn both optional modes on, and stop writing the
  date fields when there is no date. The `Task` type's five date fields become
  optional.

**Nothing else changes.** No other page, no reader, no scheduler file, no test
in `scheduler/tests`.

---

## The read list, which is separate from what you may edit

**Read and edit:** the two files named above.

**Read only, do not edit:**

- `scheduler/translators/translate.ts` — the `todoRules` block only, so you can
  see that a task with no date already produces no due time. **You are not
  changing it.**

**Do not open anything else**, and in particular not `docs/handoff.md`, not
`docs/reminder-shape.md`, not `docs/in-flight.md`, and no other build sheet.

---

## House rules

- **Comments are full sentences in plain English** explaining why, in the voice
  of the surrounding file.
- **Run `npx tsc`.** It was clean at the close of #27-new. Anything it reports
  is yours.
- **Run the scheduler suite** —
  `node --experimental-strip-types scheduler/tests/run-all.ts`. It was 391 of
  391 passing. Nothing here should move that number; if it does, the build is
  wrong.
- **Patrick checks everything on the simulator as it lands**, so leave the
  screen in a state he can look at.

---

## One: the optional-date mode

**Copy the shape of `optionalTime` exactly.** It is described in the file's own
header comment at lines 23–29 and is proven on the pages that use it. Do not
invent a second pattern.

- **`optionalDate`** — the page declares that a date may be absent.
- **`dateSet`** — whether one is set right now.
- **`onClearDate`** — fired when the box is emptied.

Behaviour, mirroring the time side:

- **While no date is set**, the date spinners sit dulled at today's date and the
  box sits empty with a **"No date set"** hint.
- **Tapping any date arrow, or typing a date, wakes it** and `onChange` fires as
  usual.
- **Emptying the box clears it** and `onClearDate` fires.
- **Blur must not repaint an empty box** while `optionalDate` is on. That is the
  whole fault, and it is the same exception `optionalTime` already makes at
  line 224.
- **The #59 empty-box rule — an empty box repaints from the spinners — applies
  only when `optionalDate` is off**, exactly as the header comment says of the
  time side.

**A date that does not parse still goes red**, unchanged. Empty is not the same
as wrong.

---

## Two: the To-Do page

### The type

The five date fields on `Task` become optional:

```
year?: number;
month?: number;
day?: number;
hour?: number;
minute?: number;
```

**Leave the comment above them in place** and add a sentence saying a task may
have no date at all, and that `taskDueDate` is the one place that decides.

**Fix whatever `tsc` then reports**, and fix it by asking `taskDueDate` rather
than by reaching for a default. If a place genuinely needs a moment and has
none, it has nothing to show — say nothing there.

### The control

Turn both optional modes on at line 656, and hold "is there a date" and "is
there a time" as page state beside `newDueAt`.

- **Opening the Add box starts with neither set.** No date, no time, boxes
  empty.
- **Opening an existing task for edit** sets each from the task itself. Line 387
  currently falls back to today at noon when there is no date — that fallback
  must no longer be treated as a date the user chose. Keep the `Date` object as
  the spinners' resting position if you like, but the "is there a date" flag
  must be false.
- **Clearing either box on an existing task clears it on the task**, so a date
  once set can be taken off again.

### The save

In **`finishAdd`** and **`finishUpdate`**, write `year`, `month`, `day`, `hour`
and `minute` **only when there is a date**. When there is not, leave all five
off the object entirely — do not write `null`, `0` or `undefined` values you
then have to test for. `taskDueDate` reads them by `typeof`, so absent is the
form it already understands.

**A date with no time is allowed.** Store the date and let the hour and minute
be absent; `taskDueDate` already falls back to twelve noon for display, which is
the existing behaviour and is not to be changed here.

### The pop-up

The "No Reminder Set" confirm at lines 246 and 284 stays exactly as it is,
wording and all. It is already the right question; the fault was never in the
asking.

---

## What the tile shows — Patrick's note

**A task with no date shows its title and nothing else.** The "Due:" line is
simply absent, which `scheduleLabel` already does by returning an empty string.

**Patrick settled this at #27-new, and he settled it on consistency.** Asked
whether the tile should instead say something like "No date set", he said to
make it consistent with the rest of the app — and the rest of the app shows
nothing. My Day and Mollie both hold an item that has no time, and the comment
in each says the item simply shows no time and gets no reminder. There is no
"no time set" wording on any tile anywhere.

**The words he remembered are the hint inside the entry box**, not a tile, which
is why the date box gets the matching hint above. The two are different places
doing different jobs: the box is where you are choosing, so it explains itself;
the tile is a record, so an absent line says it.

---

## What to test on the simulator, for the build report

There are no unit tests for this — it is screen behaviour. Say plainly in your
report which of these you saw work.

- Adding a task with a title only: both boxes stay empty, the save goes through,
  and the task appears at the bottom of the list showing its title and no "Due:"
  line.
- The same task arms no reminder.
- Adding a task with a date but no time.
- Adding a task with both, which must behave exactly as it does today.
- Opening a dateless task for edit and saving it unchanged: it must still have
  no date afterwards. **This is the one most likely to go wrong**, because the
  edit path fills the spinners in.
- Setting a date on a dateless task, and clearing the date off a dated one.
- Typing something that is not a real date: still a red border, still blocked on
  save.

---

## What comes after this, and is not part of it

Nothing. This is one self-contained piece.
