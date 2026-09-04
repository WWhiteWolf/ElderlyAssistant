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
they save means touching all five pages and the data already sitting on
the phone.

**So neither.** Leave what the screens save exactly as it is, and put
the one shape *between* the screens and the scheduler — a translator at
the boundary, turning whatever a screen saved into the common item. Then
the two decision blocks and the engine are written once against one
shape, no screen is changed, and nothing already on the phone breaks. A
screen can be brought round to the common shape later, at leisure, or
never.

That is Patrick's own split doing the work: the screens are packaging,
and the translator is the boundary between the packaging and the
engine.

### The translator is one, not five — corrected at Super-2-new

**This section replaces what stood here before, which said one small
translator per screen and gave five as the count.** That was written at
#19-new. It is wrong, and the way it went wrong is worth keeping,
because it is the same fault twice in one project.

**Why the five arose.** At #19-new the shape did not exist yet. The only
thing to look at was the six readers, and those genuinely are one
function per screen — they have to be, because each is handed a
different saved shape and there is nothing common to write against. The
count of five was inherited from the readers' own division, at a moment
when no other division was available. The shape was then settled at
#21-new and #22-new, and it dissolved that division; nobody went back to
re-examine the road it had made unnecessary. **It is the same fault as
the two-occurrences number** — a thing decided under the old structure
and carried forward as though still settled.

**What the code shows, read first-hand at Super-2-new.** The five
readers, `types.ts`, `inputshape.ts`, `stillwanted.ts`, `armdepth.ts`,
and both built translators:

- **`stillwanted.ts` never mentions `sourceScreenCode`.** It branches on
  the capability bits, the state fields and `hasDueTimeBit`, and on
  nothing else.
- **`armdepth.ts` branches on `triggerKindCode` alone**, and all three
  arms return one.
- **`sourceScreenCode` is carried, not branched on.** It exists so a
  tapped banner can be routed back to its screen. That is one field
  travelling through, not a reason for a file.
- **The two built translators differ by two string literals** —
  `sourceScreenCode` and `bannerTitleText`. Every other difference
  between `translators/myday.ts` and `translators/pets.ts` is comment
  text, "item" reworded to "feed". Two sessions built the same file
  twice.

**So nothing in the engine goes by page**, and that is not an accident.
It is what the codes and bits were designed to do: turn a per-screen
difference into data, set once at the boundary, so a kind answers
differently as a rule rather than as an exception. The shape had already
removed the need for per-screen code before the first translator was
built.

**What the translator actually is.** One translator, driven by a table
with one entry per screen holding that screen's constants and the names
of the fields it saves — the source code, the trigger kind, which saved
field carries the name, which carries the push-back stamp, the four
capability bits, and the banner's words and button set.

**Three things are genuinely per-screen code and do not fit the table:**

- **Which saved fields make up the due time**, and therefore
  `hasDueTimeBit`. Hour and minute on My Day and Pets, the weekday as
  well on My Week, a full date on Look Ahead and To-Do.
- **To-Do's lead times.** No other screen has any.
- **To-Do's background banner**, the one thing carrying
  `standsForGroupBit`, and the only place a reminder is built from the
  list rather than from an item.

My Day, Pets, My Week and Look Ahead are pure table. To-Do carries the
only two real special cases, and they are small and named.

**What this does not change.** The shape itself is untouched — every
field in `inputshape.ts` stands exactly as settled at #21-new and
#22-new, and this correction is a vindication of it rather than a
revision. Nothing about the screens changes, nothing on the phone
changes, and the swap step is unaffected.

**One claim struck as unverified.** What stood here said that changing
the screens would mean touching five pages of around nine hundred lines
each, and it was given as the evidence for the whole road. The screens
were never opened — #19-new says so plainly in its own reading note. The
number is removed rather than repeated. The road does not rest on it: it
rests on the screens being packaging and the data already being on the
phone, both of which hold without a line count.

**One honest limit on that judgment.** At the time it was given,
`scheduler.ts` and `reconcile.ts` had not been read this session, so
the confidence in the engine's core rested on the readers and on the
record rather than on a direct reading.

## The input shape, settled at #21-new

Settled in conversation with Patrick on 2026-08-25, after reading all five
readers and the shared calendar arithmetic. What is settled here is the
*structure* of the shape. The names themselves were settled a session later
and are written below under "The field names, settled at #22-new".

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

#### This section is superseded — see below

**What stands above is kept for its reasoning, but the mechanism it describes is
replaced by the next section.** Keying the empty list on the trigger kind breaks
Look Ahead, which is a one-off item with no lead times that must speak at its own
moment. Look Ahead and a To-Do task with no reminders are the same kind and need
opposite answers, so the kind cannot tell them apart.

### Six, replaced: every screen says outright when it wants speaking

**Settled with Patrick at Super-3-new, and it removes a rule rather than adding
one.**

The rule above had to be remembered by whatever read the list, and remembering is
the thing this design keeps trying to stop needing. **Instead each screen's rules
state their own lead times.** My Day, Pets, My Week and Look Ahead each give one
lead time of nothing-before — an offset of zero, which is the moment itself.
To-Do gives the list the person actually chose.

**So an empty list means one thing everywhere: nothing to say.** Nothing branches
on the trigger kind to interpret it, and nothing is to be added that does.

**Patrick's ruling on To-Do stands unchanged and was confirmed this session:** a
task saved with no reminders never speaks, not even at the appointment time. With
the change above that falls out of an empty list rather than out of a rule about
kinds.

**What it costs:** `leadTimeList` becomes an accessor in the translator's table
and each of the four rule sets gains one line. Nothing a person sees moves.

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

### What a background task is for, settled at Super-2-new

**Patrick's own words, and they are written here because Claude got this
backwards inside one conversation and would have written the mistake into
the code.**

**A To-Do background task is a long-range reminder that something is not
done yet.** It has no appointment, so nothing says when — but it is still
outstanding, and the eight o'clock banner exists to say so. That is the
banner working correctly, not nagging.

**Two consequences, and the second is a trap.**

- **A background task persists until it is done.** Its `completed` is the
  real and lasting answer to "is this finished", not a mark about today.
- **It must never be added to `runDailyReset`.** That loop used to name
  `my_routine` and `pets_feeds` and deliberately not `todo_tasks`. After
  #39-new it rolls only every-day items on `reminder_items`. Extended
  items must never join that loop. `resetForNewDay` clears `completed`
  on everything it is handed. Sweeping a background task with it would
  un-finish work already done. **The absence is correct. Do not "fix" it.**

### The other thing, which only looks the same

**There is a second kind of record in the app and it is the opposite of the
first**, near enough in shape that the two invite being merged. They must
not be.

**It is a short-range record that something WAS done**, kept for recall
rather than for prompting. Patrick's own example: whether he has had a
second coffee today. Too routine to remember, and by six in the evening
genuinely unrecoverable without somewhere to have written it down. It wants
a box that goes green, a log beneath it, and nothing beyond that page — no
reminder, no banner, no report anywhere else.

**The two differ in every way that matters:**

- **Direction.** One says a thing is not yet done. The other says a thing
  was done.
- **Range.** One is long — it stands until finished. The other is one day
  and is meaningless the morning after.
- **Lifetime.** One must survive the rollover. The other must be wiped by
  it, or it answers today's question with yesterday's tick.
- **Reach.** One speaks to the phone. The other never leaves its page.

**Where the second one appears to live already**, though only its storage
keys were read at Super-2-new and not the screens: `runDailyReset` clears
`my_coffee` and `my_water` on My Day, and `pets_treats` on Pets, setting
each to zero on every new day. That is the right lifetime for this kind.

**The rule that falls out.** The two are told apart by what they are for,
never by their shape. Anything that would give the first a daily clear, or
the second a banner, has confused them.

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

## The field names, settled at #22-new

Settled in conversation with Patrick on 2026-08-26. He gave the rule himself
and it governs every name here: **the name says what the thing does, and it
carries its own kind in the name**, so a bit reads as a bit and a code reads as
a code. His own examples were `inputBitField`, `depthBit` and
`reminderTypeCode`. He read the list and said the names told him what they were
without his having to read the explanations beside them, which is the whole
test they were built to pass.

**What the item is:**

- `sourceScreenCode` — which of the five screens it came from.
- `itemIdText` — the item's own id on that screen.
- `itemNameText` — the name the banner shows.

**When it comes due:**

- `triggerKindCode` — daily, weekly, or once.
- `hasDueTimeBit` — the item actually has a time. This is the first question
  the *is this still wanted?* block asks, and it is the guard all five readers
  make today.
- `dueHour`, `dueMinute` — used by all three kinds.
- `dueWeekday` — weekly only.
- `dueMoment` — once only.

**What the kind is allowed to do, set once by the translator and never changed:**

- `canBeDoneBit` — the item can be marked done at all.
- `canBePushedBackBit` — it can be snoozed, postponed or delayed.
- `doneEndsItemBit` — done ends the item outright rather than only this
  occurrence.
- `standsForGroupBit` — the reminder stands for a group rather than one item.

**What has actually happened, written by the returning arrows:**

- `isDoneBit` — done right now.
- `pushedBackToStamp` — the one moment it is pushed back to. *Stamp* is
  Claude's coinage for a saved moment, named as such when the list was put to
  Patrick, and he let it stand.

**How far ahead to speak:**

- `leadTimeList` — the list; an empty one is answered by `triggerKindCode`.
- `leadFormCode` — offset or clock, carried by each lead time.
- `leadAmount`, `leadUnitCode` — the offset form.
- `leadDaysBefore`, `leadNamedTimeCode` — the clock form.

### Separate named fields, not a packed field of bits

Patrick asked what established practice says rather than deciding it by
preference, and then took the answer. Packing bits together into one field is
right where space or a wire format demands it — embedded work, a hardware
register, a protocol. This app saves its data as plain text on the phone, so
packing saves nothing and costs the two things that matter here: a packed field
cannot be read at a glance when something has gone wrong, and the compiler
cannot check it.

The part of his idea that practice keeps whole is the code. In this language a
code is written as a named set of allowed words — daily, weekly, once — and the
compiler then refuses anything else, which gives exactly what he was after: an
impossible value cannot be written down at all.

### Where the three files go

Not built at #22-new, and named here so the next session does not have to
settle it again. Every file in `scheduler` is one lowercase word —
`weeklyreset.ts`, `queueview.ts` — with its test as `<name>.test.ts` inside
`scheduler/tests`, gathered by `run-all.ts`. So the three are
`scheduler/inputshape.ts`, `scheduler/stillwanted.ts` and
`scheduler/armdepth.ts`, with their tests beside the others.

## How far ahead do we arm — the number, reopened at #22-new

Patrick reopened it himself, and his reason is the durable part: **two
occurrences ahead was decided under the old structure, before any of this shape
existed, so it should not be carried across as though it were still settled.**
He was careful to say he did not know whether it should change — only that it
should be discussed. What follows was read first-hand this session:
`readers/occurrences.ts`, `reconcile.ts`, and the To-Do, My Week and Look Ahead
readers. My Day's and Pets' own readers were not opened, only the arithmetic
they call.

**The number touches two screens and no others.** `OCCURRENCES_AHEAD` is
imported by `readers/myday.ts` and `readers/pets.ts` alone. My Week, Look
Ahead, To-Do and Memory Test never see it.

**The reason written down for choosing two does not match what the code does.**
The comment on the constant says two occurrences rather than two days means a
weekly thing gets a fortnight. But `nextOccurrences` steps forward one calendar
day at a time, so it only ever produces daily occurrences, and My Week does not
call it at all — it arms one true weekly repeat per chore. The sentence
describes something nothing does.

**What each screen spends, out of the fifty-six places** — the ceiling of
sixty-four less the eight held back for the Timer and its like:

- My Day and Pets: two per item.
- My Week: one per chore, plus one more while a chore is postponed.
- Look Ahead: one per entry still ahead, plus one more while it is delayed.
- To-Do: one for every reminder set on every future task, with nothing capping
  how many reminders a task may carry, plus one for the background banner.
- Memory Test: one.

**Why the number matters now when it did not before.** My Week is cheap exactly
because it uses a real weekly repeat, and that is also exactly why it still
reminds about a chore already ticked off — a repeat cannot be told to skip one
week. Curing it under this shape means it stops being a repeat and becomes
single moments like the other two, so every chore's cost goes from one place to
however deep the block arms.

**When the module re-plans**, found by checking every call site: at launch, on
the app coming to the front, and after every save.

**So what the second occurrence bought is one unopened day.** The moment armed
for today is spent the instant it fires, and nothing puts the next one up until
the app is opened. With one only, a day on which the app is never opened is a
day the next reminder was never armed, and the morning after is silent. With
two, today's fires and tomorrow's is already standing there.

**It was worth more to a daily item than to a weekly one**, which is the reverse
of what the old comment assumed. A daily item has only until the next morning
for the app to be opened; a weekly chore has a whole week for the same thing to
happen.

**Patrick's question was whether it is still needed, and the answer then was
yes.** The second occurrence existed only because these are single moments;
single moments exist only because a repeating alarm cannot be told to skip the
day an item was ticked off, the only way to skip being to cancel the whole
repeat. Both of those were still true then, and My Week was about to move
across for the same reason. The one thing that would remove the need is going
back to repeats, which brings back the fault Patrick reported in the first
place. **Depth was later settled at one for every kind. The second copy's work
is recovery on opening.**

**One honest limit on that.** The claim that a repeating alarm cannot skip a
single instance is general knowledge of the phone, not a reading of the
notification package installed here. It was offered to Patrick for checking and
he did not take it up, so nothing should rest on it until it is checked.

### Patrick's real question, and the plain fact under it

He asked the same question three times before it was answered, and said so —
that it might be his own wording, and that he would try to be more precise. His
precise form was: **can we use the new structure to make an intelligent
decision about what to do, rather than patching it by doubling what is
necessary?**

The answer is yes, and it is what the shape was for. The old number was blunt
because there was nowhere to put a judgment — one constant, imported by two
readers, applied to everything alike. The block reads `triggerKindCode`, so it
can answer per kind:

- **Once**: no depth at all. There is one moment and no second to arm. Look
  Ahead and To-Do already work this way, by never importing the number.
- **Weekly**: one is enough. After a chore fires, the app has a whole week to
  be opened before the next is due.
- **Daily**: was then the only kind where a second earned its place, the gap
  being one night. **Settled at one for every kind; recovery on opening does
  that work.**

**And My Week then costs nothing to cure** — one place per chore, which is what
it costs today as a true weekly repeat.

**The plain fact under the whole conversation is Patrick's own, and he had to
find it himself.** He said he had been thinking the intelligence could tell
these things, and then saw it: *if the app isn't open, then the intelligence
isn't running.* That is correct, and it had never been stated plainly — only in
pieces. The decision blocks are code inside the app. When the app is not
running, nothing is deciding anything, and everything the phone will do while he
is away must already be sitting in the queue before he leaves. **So the blocks
do not react. They decide, at the moment they do run, how much to leave standing
for the stretch when nothing will be running at all. That is the whole of what
depth is.**

### The buffer question, and why the lists already are one

Patrick asked whether a trimmed reminder could be held in a backup buffer and
put back once it is no longer the furthest out. Read at #22-new in
`gatherWanted`: **the buffer already exists and is stronger than a buffer.**
Nothing trimmed is remembered because nothing is remembered at all — every run
rebuilds the whole wanted set from the five saved lists and the memory-test
session, and sorts it afresh by time. An item that did not fit today is worked
out again on the next run and fits then. A separate holding file would be a
second copy of the truth and could drift from the lists.

**It also means trimming the furthest away is self-healing by design**, since
the thing dropped always has the most time left for a run to happen. That
corrects a caution Claude had given minutes earlier — that extra depth would
push a year-out Look Ahead reminder off the phone and that the trade was the
wrong way round. The pushing out is real, but it is not a loss. The cost of
arming deep is waste, not silence.

### The two roads that do not need the app opened, both checked and both weak

Patrick pressed on whether the block could put a reminder back when it knows one
has been dropped and the app has not been opened. Two roads were checked.

**A banner button that does not open the app.** Four are registered that way —
`ok` on the To-Do and Orders banners, and `ok` and `skip` on the shared routine
banner. Every other button, Done and all the snoozes and delays, carries no such
setting and so brings the app to the front, which means answering a banner is
the same thing as opening the app. `skip` already calls the scheduler. `ok`
throws the chance away: its handler's first line returns immediately.

But the housing handles a press with `useLastNotificationResponse`, a React
hook, which only produces anything while the app's own code is alive. Nothing
background is registered anywhere, and the only other listener sits inside the
Timer screen. So a press re-plans the phone while the app is suspended, and does
nothing at all once the phone has shut the app down — the response simply waits
for the next launch, which is the thing we were trying not to depend on. **And
terminated is the likely state after a day unused and a night on top**, which is
exactly when the morning reminder needs the queue refilled.

**A background task.** None of the pieces are installed — no task-manager and no
background-fetch package, nothing registered in the code, and no background mode
declared in `app.json`. Patrick's answer to that was **"we can repackage"**, and
he is right that the rebuild is not the obstacle. The obstacle is that the phone
rations background runs by how much an app is used, gives fewest to the app that
has gone unused, and gives none at all after the app has been swiped away. So it
can add cover on the days it runs and can never let any insurance be taken away,
because the days it fails are the days the insurance is for. **His own first
rule decides the shape: rock solid being the top goal, a best-effort mechanism
sits on top of arming ahead and never underneath it.**

### Patrick's ruling on what rock solid covers

**"Rock solid is for when you use it."** The standard covers the app in use, not
a stretch when it is not. His reasoning, in his own words, was that an app that
is not being opened is not being used, and that what the doubling protects is
one day and no more.

That places the daily item's second occurrence outside the standard rather than
inside it.

### Recovery on opening — Patrick's principle, and the answer to the depth question

**This is the heart of it, in his own words, and it is what the whole session had
been circling.** The phone's queue is the phone's best effort and it may drop
things; that part is out of our hands. But the app never relied on the queue for
the truth. **The truth lives in the app's own saved lists, so when the app opens
it can look at them and know where things actually stand.** The missed-firing
notice built at #15-new is one small instance of the move, not the whole of it.

**What it must do, in his two parts:** *It should tell you what you missed and
put back what you need going forward.*

**And the consequence he drew himself settles the depth.** Rather than keeping a
spare copy of everything queued constantly against a day that mostly does not
come, **one reminder stands per item, and the app re-queues when it opens and
sees the gap.** The queue does not carry the insurance; recovery on opening does
the work the second copy was doing. That is the intelligent decision he asked
for at the start of the session in place of doubling.

**So depth is one, for every kind** — one for a daily item, one for a weekly
chore, and the single moment a one-off already has. Nothing is doubled anywhere,
and My Week comes across for the same one place a chore costs today.

**It is not a rule — it should be part of the decision machinery** (Patrick's
own words, and he came back to correct the wording so it read
*machinery* rather than anything softer). A rule has to be remembered at every
place that might need it, which
is the same objection that made the returning arrows land on a block rather than
on a written-down instruction. So recovery is not an extra step bolted to the
front of a run. **The block, reading the data it already has, sees an occurrence
whose moment has gone by and which was never marked done — and the telling and
the re-queueing both fall out of that.** Nothing anywhere has to remember to
recover.

### Both halves turned out to be built, read at #22-new

Read at the end of the session, at Patrick's choosing, after it had already been
written down that the telling half did not exist: `scheduler/health.ts`,
`scheduler/notice.ts` and the daily reset in `scheduler.ts`. **The record was
wrong — the telling is built, tested, and does very nearly what Patrick had just
specified from scratch.**

- **The re-queueing** is every run rebuilding the whole wanted set from the
  lists, so opening the app after a missed day arms the next occurrence there
  and then.
- **Misses are worked out at the rollover**, because that is the last moment the
  truth can be seen: the rollover wipes the checkmarks, and afterwards
  yesterday's undone item and today's not-yet-done one look exactly alike.
- **The gap case is handled by name.** `missesForRollover` takes a `hadGap`
  flag, set when the screen's saved date is older than yesterday, meaning the app
  went unopened for a whole day or more. Then every reminding item counts as
  missed whatever its checkmark shows, because those marks belong to the last day
  the app was open. That is exactly the case Patrick described.
- **One miss per item, the most recent**, his own rule, so a fortnight away
  gives one line per item rather than fourteen.
- **The sentence is his own wording**, carried across from Still To Do:
  *"<name> from yesterday is hanging!"*
- **One pop-up carries faults and misses together**, on launch and on returning
  to the front, deliberately not two, since two stacking is what teaches a
  person to tap without reading. A fault tapped away is silent until the next
  day because it is a state; a miss tapped away is gone for good because it is
  an event and he has now been told.

**The one real gap: it covers My Day and Pets only.** The rollover loop in
`runDailyReset` names `my_routine` and `pets_feeds` and no others, so My Week,
Look Ahead and To-Do record no misses at all. **So the work is extending the
telling to the other three screens, not building it.**

**The telling is deliberately small, and Patrick said so plainly when asked.**
It tells you what you missed, and that is it. Then the firings are reissued and
the queue rebuilt. **Two acts on opening and nothing more** — no screen to
design, no flow, no history to keep. His own words: *that's all there is that
needs to be done.*

## What is not decided

None of the following was settled at #19-new, and none of it should be
treated as settled by a later session:

- How the arrow from the store to the decision block is actually made,
  so that a write cannot fail to turn the loop.
- Nothing about recovery on opening. Both halves are settled and both are
  built; the only work left on it is extending the telling from My Day and Pets
  to the other three screens, which is building rather than deciding.
- Whether a repeating alarm can be told to skip one instance, which the whole
  case for arming ahead rests on. Not checked in the installed notification
  package.
- Whether any screen is ever brought round to save in the common shape,
  rather than being translated at the boundary for good.
- What the Timer's own handling turns out to be. It is outside the
  module today and has known faults of its own; nothing about it was
  looked at here.
