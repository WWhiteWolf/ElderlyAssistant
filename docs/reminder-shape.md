# The shape of the reminder work

Written at #19-new, 2026-08-25, from Patrick's own description. It is a
design, not a report of what is built. Where something already exists it
is said so plainly, and where something is still undecided it is left
open rather than filled in.

## Why this file exists

Patrick's own framing opens it: the heart and the original purpose of
this app is the reminder pages. The scheduler is the brain, the engine,
the processing part. Everything else in the app is packaging and screens.

What the last several sessions have been doing is piecing and patching —
one screen cured at a time, each in its own way. What is wanted instead
is one shape, designed once. In his words, that is where the work is, but
it is logical work rather than juggling.

## The five pieces

The path runs in one direction, from where a person types something in to
where the phone speaks:

1. **The input screens.** The pages and pop-ups a person uses to say what
   they want reminding about.
2. **The input store.** One place holding what exists, in one shape.
3. **The scheduler.** The engine. It works out what should be armed.
4. **The output store.** One place holding what should be armed, in one
   shape.
5. **The reminder itself.** The banner on the phone, and the buttons on
   it.

The two stores are the part that matters most, because they are the
contracts. One defined shape going in means every screen writes the same
thing. One defined shape coming out means the reminder side reads the
same thing. That is what ends the present situation, where six screens
say the same things six different ways.

## It is a loop, not a line

The arrows do not stop at the banner. Done, snoozed and skipped all come
back from the far end — from a button on the banner, from a tick on a
page, or from Siri — and they have to land back at the front.

Patrick's own way of drawing it is the one to keep: the returning arrows
come back to a decision block, and the arrow from the input store arrives
at that same block. Both roads meet at one question.

That is stronger than making it a rule, because a rule has to be
remembered at every place that writes something down, and an arrow does
not. If the store feeds the block, then anything landing in the store
flows onward by construction. Nothing has to remember to set the loop
turning.

## The two decision blocks

**One: is this still wanted?** Done, snoozed, postponed, delayed,
skipped, already past — every returning arrow lands here, and the answer
decides whether the item goes round again. The kinds do not all answer it
the same way, and that has to be held as a rule rather than as an
exception. Patrick's own example is the standing one: an appointment
cannot be snoozed and has nothing to mark done, because the appointment
has not happened yet.

**Two: how far ahead do we arm?** An item says when it comes due. How
many of its next moments are actually armed is a separate question, and
it belongs to the scheduler rather than to the item, because only the
scheduler can see how full the phone is. The budget is shared, so no
single item can decide its own share of it.

The two run in that order: first what is still wanted, then how deep to
go with what is left.

## What each store holds

**The input store holds an item, a rule for when it comes due, and how
far ahead to speak.** Patrick's collapse of the last real difference is
what makes that one shape: a To-Do task has one end date, and the several
reminders on it are lead times off that one date. A daily routine item is
the same thing with the list of lead times empty.

**The output store already exists and is already common.** It is
`WantedReminder` in `scheduler/types.ts`, and all six readers produce it:
a key naming the reminder, the screen it came from, the item on that
screen, the item's name, the banner's heading and sentence, which buttons
it carries, and a trigger. The trigger has three kinds and no more —
every day at a time, every week on a weekday at a time, or once at a
single moment.

So the output half of what is wanted here is built. It is the input half
that has six shapes.

## What is there now, read at #19-new

Read this session: `scheduler/types.ts`, `scheduler/readers/occurrences.ts`
and all six readers, about seven hundred lines. The screens themselves
were not opened; what follows is what each reader declares about the
shape it is handed, which each states as being exactly what its screen
saves.

The six input shapes differ in five ways, and four of the five are only
different words for the same idea:

- **The name of the name.** Five of them call it `label`. To-Do calls it
  `title`.
- **How done is said.** `completed` on My Day, Pets and My Week; nothing
  at all on Look Ahead; `completed` plus removal from the list on To-Do;
  a `phase` on Memory Test.
- **How pushed back is said.** `snoozedUntil` on My Day, `snoozedUntil`
  on Pets, `postponedTo` on My Week, `delayedUntil` on Look Ahead, and
  nothing on the other two. Four names, one idea.
- **How due is said.** An hour and minute; a weekday with an hour and
  minute; a year, month, day, hour and minute; or a moment already
  worked out and saved.
- **How many reminders one item wants.** One, except a To-Do task, which
  carries a list of its own. This was the one real difference in kind,
  and Patrick's collapse above removes it.

## Five screens through the common shape, and two on their own

Patrick's ruling at #19-new. Five screens go through the one input
shape: My Day, Pets, My Week, Look Ahead and To-Do. Two are small and
specific enough to be handled their own way — the Memory Test and the
Timer.

The code bears the Memory Test out. Its reader is not handed a list at
all. It is handed one session carrying a `phase` and a moment already
worked out, so there is no item and no rule about when the thing comes
due — nothing for the common shape to hold. The Timer was already put
outside the module by an earlier decision.

**The two specials skip the input shape, not the engine.** They still
have to be counted against the phone's sixty-four places, so they still
produce a `WantedReminder` and still pass the depth block, which is
what the Memory Test does today. If they went round the engine as well
they would quietly spend places that nothing is watching.

## The road: a translator at the boundary

Patrick asked directly at #19-new whether this is a total bulldoze and
whether it would be worth it. The answer given, and the road it points
at:

**Not a bulldoze, because half of what is wanted is already built.**
`WantedReminder` with its three trigger kinds is the one flexible
output, all six readers already produce it, and the key-naming that
stops reminders piling up is sound. Starting over throws that away and
rebuilds the same thing.

**The mess is on the input side, and it is not really the scheduler's
mess.** It is five screens each saving in its own way. Changing what
they save means touching five pages of around nine hundred lines each,
and the data already sitting on the phone.

**So neither.** Leave what the screens save exactly as it is, and put
the one shape *between* the screens and the scheduler — a small
translator for each screen, turning whatever that screen saved into the
common item. Then the two decision blocks and the engine are written
once against one shape, no screen is changed, nothing already on the
phone breaks, and the readers shrink to five little translators plus
one engine. A screen can be brought round to the common shape later, at
leisure, or never.

That is Patrick's own split doing the work: the screens are packaging,
and the translator is the boundary between the packaging and the
engine.

**One honest limit on that judgment.** At the time it was given,
`scheduler.ts` and `reconcile.ts` had not been read this session, so
the confidence in the engine's core rested on the readers and on the
record rather than on a direct reading.

## The input shape, settled at #21-new

Settled in conversation with Patrick on 2026-08-25, after reading all five
readers and the shared calendar arithmetic. What is settled here is the
*structure* of the shape. The actual names of the fields are still open.

### The form the shape takes is Patrick's

He gave it in two parts, and each is used where it fits:

- **A value that can only ever be one thing is a code.** Several bits
  together standing for one choice out of a set, so an impossible
  combination cannot be written down at all.
- **A fact that is independent of the others is a single bit**, set or
  cleared.

Both are set by the translator at the boundary, which is exactly where the
screen's own way of saying things stops.

### One: the trigger kind is a code

Every day at a time, every week on a weekday at a time, or once at a single
moment. These are the three the output store already speaks in and nothing
else, and every one of the five screens lands cleanly in one of them. They
are mutually exclusive, so a code rather than bits.

The *how far ahead do we arm?* block reads this code.

### Two: capability bits and state are different things

This distinction is the load-bearing part of the whole shape.

- **A capability bit says what this kind of item is allowed to do.** It is
  set once by the translator and never changes afterwards.
- **State says what has actually happened to this occurrence.** It is
  written by the returning arrows and changes constantly.

The *is this still wanted?* block reads both. The capability bit is what
lets a kind answer differently as a rule instead of as an exception: a
To-Do appointment simply has its done and push-back bits clear, so nothing
anywhere has to special-case appointments.

### Three: done is one state plus a bit saying how far it reaches

There are two kinds of done in the app today and they cannot share one bit,
so the state is one thing and its reach is another.

- **Bit clear — done covers this occurrence only.** The occurrence is
  dropped and the ones after it stand. This is what the daily tick does on
  My Day and Pets today, and what My Week's ought to do.
- **Bit set — done ends the item.** It produces nothing further at all,
  which is a To-Do appointment.

It absorbs Look Ahead without an exception: that screen has no done field
at all, so its done state is simply always false and the bit never matters.

Nothing here knows about the day's rollover clearing the tick. That is the
daily reset's job and it already works, so the block only ever asks whether
the item is done right now.

### Four: push-back is one stamp, and it adds rather than replaces

This is the most uniform thing in the app already — four screens, four
names, one idea. `snoozedUntil`, `postponedTo` and `delayedUntil` collapse
into one field with one meaning, and the translators do the renaming.

- **One stamp per item, holding a moment.** Pushing back twice moves that
  one moment rather than leaving a second reminder behind. All four readers
  say this explicitly.
- **A stamp already in the past is ignored.** Every one of them checks that
  the moment is still ahead of now.
- **It adds a reminder and does not replace one.** The base occurrence
  stands. This is deliberate and commented in all four.
- **One capability bit: can this be pushed back at all.** Clear on a To-Do
  appointment, which is Patrick's standing ruling, and set on the other
  four.

### Five: how far ahead to speak is a list of lead times

Patrick's collapse holds and was checked in `readers/todo.ts`: a To-Do task
has one due moment and its several reminders are lead times off it, and a
daily routine item is the same thing with an empty list.

The one wrinkle is that To-Do's lead times come in two forms, which cannot
be reduced to each other because the second deliberately ignores the
appointment's own time:

- **Offset** — counted straight back from the appointment. Thirty minutes
  before, two hours before. It carries an amount and a unit.
- **Clock** — counted back a whole number of days, then set to a named time
  of day taken from Settings. Two days before, at midday. It carries
  days-before and which of the three named times.

Each lead time therefore carries a small code saying which of the two forms
it is, which is the same pattern as everything above rather than a new
idea.

### Six: an empty lead-time list is answered by the kind

**Patrick's ruling, and it corrected the question as it was put to him.** He
was asked which single reading should hold, and his answer was that the
decision block already knows what kind of reminder it is and should decide
which way to go. That is a rule keyed on the code rather than an exception,
which is what this shape asks for.

- **Daily and weekly**: an empty list means speak at the moment itself.
- **Once**: an empty list means speak never.

Both keep exactly what the app does today, so no screen changes. The second
also matches a decision already made: `app/todo.tsx` lets a task be saved
with no reminders but asks first — *"Are you sure you don't want to set a
Reminder?"*, a confirm rather than a block, recorded as #58 folding in #55.

### Seven: one bit says a reminder stands for a group

**Patrick's, and it brought the last odd one in.** To-Do's background
reminder was found while writing this section and recorded as not fitting
the shape. He answered that if it needs identifying, it can be given a code
or a bit — and following that through, it fits the shape entirely.

The background reminder is one banner for all the background tasks at once.
It fires every day at eight in the morning, its words are the count rather
than any task's name, it carries no buttons, and it exists only while at
least one unfinished background task does.

Everything about it lands in the shape as it stands:

- **Its trigger kind is daily**, already one of the three.
- **Its lead-time list is empty**, which for a daily kind means speak at
  the moment itself.
- **Its done and push-back bits are both clear**, so nothing tries to tick
  it or push it back.
- **The count in its words is the translator's work**, the same as every
  other reader building its own sentence.

The one real difference is what the bit names: **this reminder stands for a
group rather than for one item.** Today that is worked out by checking
whether the item's id happens to be the word `background`, which is a name
being used as a signal. The bit says it outright.

The one place downstream that reads it is the tap. A tapped reminder
normally lights its own row; this one opens the To-Do page with the
background list showing instead. That behaviour is from the project record
at #13-new rather than from a reading of the housing.

With this bit, all five screens go through the one shape and none is left
outside it.

### What the reading corrected

Three things were put to Patrick from the record before the readers
themselves were opened, and the reading changed all three. They are kept
here because a later session would otherwise make the same mistakes.

- **Skip is not a state any reader reads**, and needs no bit. No reader
  mentions skip anywhere. On My Week, Skip clears the push-back stamp and
  asks the module to run — it is an action that changes state, not a state
  to be read.
- **Every reader guards on whether the item has a time at all**, and this
  was missing from the list entirely. My Day and Pets skip an item with no
  hour or minute, My Week a chore missing day, hour or minute, Look Ahead
  an entry with no date, and To-Do a task with no due date. Five out of
  five. It is the first question the block asks.
- **To-Do asks a second guard: does this item want reminders at all.** A
  task with an empty reminder list gets nothing, and a background task is
  excluded from the per-task path altogether.

## What is not decided

None of the following was settled at #19-new, and none of it should be
treated as settled by a later session:

- The names of the fields in the one input shape.
- Where in the code the two decision blocks live.
- How the arrow from the store to the decision block is actually made,
  so that a write cannot fail to turn the loop.
- Whether any screen is ever brought round to save in the common shape,
  rather than being translated at the boundary for good.
- What the Timer's own handling turns out to be. It is outside the
  module today and has known faults of its own; nothing about it was
  looked at here.
