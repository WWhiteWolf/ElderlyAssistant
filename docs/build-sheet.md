# Build sheet — the input shape and the two decision blocks

**Read this file and build. Do not read anything else. Do not ask Patrick
anything. Every decision below is already made and is not to be reopened.**

Written at the end of #22-new, 2026-08-26, because a session given only an
instruction sheet asked for decisions that were already settled — the settled
answers were in other documents it was not reading. So this sheet carries the
answers themselves, not pointers to them.

If something genuinely is not here, choose the plainest option that matches the
existing code and write a note at the foot of the hand-off saying what you chose.
Do not stop to ask.

---

## What to build

Three new files in `scheduler`, and their tests. **Nothing in the app calls
them.** No existing file is edited except `scheduler/tests/run-all.ts`, which
gains the new test lines.

- `scheduler/inputshape.ts` — the shape and its types.
- `scheduler/stillwanted.ts` — the block *is this still wanted?*
- `scheduler/armdepth.ts` — the block *how far ahead do we arm?*
- `scheduler/tests/inputshape.test.ts` — only if there is behaviour to test.
- `scheduler/tests/stillwanted.test.ts`
- `scheduler/tests/armdepth.test.ts`

**Do not** touch any reader, any screen, `scheduler.ts`, `reconcile.ts`, or
anything on the phone. This step deliberately builds something nothing uses yet.

---

## House rules these files must follow

- **Plain TypeScript only.** No React, no React Native, no Expo, no storage.
  These files must run under Node exactly like the readers do.
- **File names are one lowercase word**, matching `weeklyreset.ts`,
  `queueview.ts`, `occurrences.ts`.
- **Tests** export one function named `run<Thing>Tests()`, import
  `assert`, `assertSame`, `test` from `./runner.ts`, and are added to
  `run-all.ts` with a `console.log` heading above the call, in the same style as
  the others.
- **`now` is always handed in**, never read from the clock, so a test can say
  what time it is.
- **Comments are full sentences in plain English** explaining why, in the voice
  of the existing scheduler files.
- Run the suite when done:
  `node --experimental-strip-types scheduler/tests/run-all.ts`
  It was 230 of 230 passing before this work.

---

## The naming rule (Patrick's)

**The name says what the thing does, and it carries its own kind in the name**,
so a bit reads as a bit and a code reads as a code. His examples:
`inputBitField`, `depthBit`, `reminderTypeCode`.

**Bits are separate named fields, never packed into one field of bits.** This
app saves plain text on the phone, so packing buys nothing and costs both
readability and the compiler's checking.

**A code is a named set of allowed words** — a string union — so an impossible
value cannot be written down at all.

---

## `inputshape.ts` — the fields, exactly as settled

These names are settled. Use them as written.

**What the item is**

- `sourceScreenCode` — which of the five screens it came from.
- `itemIdText` — the item's own id on that screen.
- `itemNameText` — the name the banner shows.

**When it comes due**

- `triggerKindCode` — `'daily' | 'weekly' | 'date'`. These three and no others;
  they are what the output store already speaks in, `WantedTrigger` in
  `types.ts` naming its third kind `date`.
- `hasDueTimeBit` — the item actually has a time. Every one of the five readers
  guards on this today, and it is the first question the wanted-block asks.
- `dueHour`, `dueMinute` — used by all three kinds.
- `dueWeekday` — weekly only.
- `dueMoment` — date items only.

**Capability bits — what this kind of item is allowed to do. Set once by the
translator, never changed afterwards.**

- `canBeDoneBit` — the item can be marked done at all.
- `canBePushedBackBit` — it can be snoozed, postponed or delayed.
- `doneEndsItemBit` — done ends the item outright rather than only this
  occurrence.
- `standsForGroupBit` — the reminder stands for a group rather than one item.
  This is To-Do's 8 a.m. background banner, which today is recognised by its id
  happening to be the word `background`.

**State — what has actually happened to this occurrence. Written by the
returning arrows and changing constantly.**

- `isDoneBit` — done right now.
- `pushedBackToStamp` — the one moment it is pushed back to. One stamp per item;
  pushing back twice moves that moment rather than leaving a second behind.

**How far ahead to speak**

- `leadTimeList` — the list of lead times. An empty list is answered by
  `triggerKindCode`, not globally.
- `leadFormCode` — `'offset' | 'clock'`, carried by each lead time.
- `leadAmount`, `leadUnitCode` — the offset form; counted straight back from the
  due moment. `leadUnitCode` is `'minutes' | 'hours' | 'days'`.
- `leadDaysBefore`, `leadNamedTimeCode` — the clock form; counted back a whole
  number of days, then set to a named time from Settings.
  `leadNamedTimeCode` is `'morning' | 'midday' | 'evening'`.

**Why capability and state are kept apart**: it lets a kind answer differently
as a rule instead of as an exception. A To-Do appointment simply has its done
and push-back bits clear, so nothing anywhere special-cases appointments.

---

## `stillwanted.ts` — *is this still wanted?*

One function taking a shaped item and `now`, answering whether the item should
produce reminders at all. In order:

1. **No due time — not wanted.** If `hasDueTimeBit` is clear, nothing is wanted.
   Five of five readers guard on this today.
2. **Done — how far it reaches.** If `isDoneBit` is set: when `doneEndsItemBit`
   is set the item produces nothing further at all; when it is clear, only this
   occurrence is dropped and the ones after it stand. Nothing here knows about
   the day's rollover clearing the tick — that is the daily reset's job and it
   already works, so this block only ever asks whether the item is done now.
3. **Push-back.** If `pushedBackToStamp` holds a moment still ahead of `now`, it
   adds a reminder at that moment; the base occurrence still stands. A stamp
   already in the past is ignored. A stamp on an item whose `canBePushedBackBit`
   is clear is ignored.
4. **Capability bits gate the questions.** An item with `canBeDoneBit` clear is
   never treated as done whatever its state says.

**Look Ahead falls out of this without an exception**: it has no done field, so
its done state is simply always false and `doneEndsItemBit` never matters.

---

## `armdepth.ts` — *how far ahead do we arm?*

**Depth is one, for every kind.** One reminder stands per item. Nothing is
doubled anywhere.

Write it as a function of `triggerKindCode` even though all three answer one
today, because that is where the judgment belongs and it makes a later change a
one-line change.

- `'daily'` — one.
- `'weekly'` — one.
- `'date'` — one; there is no second occurrence to arm.

**Why one, and do not reopen it.** Arming two was decided under the old
structure. The second occurrence only ever bought one day on which the app was
never opened. Patrick ruled that **rock solid is for when you use it** — an app
that is not being opened is not being used — and that recovery on opening
carries what the second copy was carrying. Every run rebuilds the whole set from
the saved lists, so opening the app after a missed day arms the next occurrence
there and then.

**Not this block's job**: trimming to fit the phone's sixty-four places. That
lives in `reconcile.ts` and stays there. It trims the furthest away first, which
is self-healing, because the thing dropped always has the most time left for a
run to happen before it matters.

---

## Things settled that the code should not contradict

- **The engine is written once against one shape.** Screens are packaging. The
  five readers become five small translators that set the codes and bits at the
  boundary; no screen is changed and nothing already on the phone breaks.
- **Five screens go through the shape** — My Day, Pets, My Week, Look Ahead,
  To-Do. Memory Test and Timer are handled their own way but still produce a
  `WantedReminder` and still pass the depth block, or they spend places nothing
  is watching.
- **An empty `leadTimeList`** means: daily and weekly speak at the moment
  itself; a date item speaks never.
- **Skip is not a state.** No reader reads it and it needs no bit. It is an
  action that clears the push-back stamp.
- **Recovery on opening is part of the decision machinery, not a rule.** The
  block, from data it already holds, sees an occurrence whose moment has gone by
  unmarked, and the telling and the re-queueing both fall out of that.

---

## What comes after this piece, and is not part of it

1. The five translators, one at a time.
2. Swapping the screens over one at a time, retiring each old reader as its
   replacement is proved.
3. Extending the missed-reminder telling from My Day and Pets to My Week, Look
   Ahead and To-Do — the machinery is already built and tested, and the rollover
   loop in `runDailyReset` simply names only those two lists.
4. The phone.
