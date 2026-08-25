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
