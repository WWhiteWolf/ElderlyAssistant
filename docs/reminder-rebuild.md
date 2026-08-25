# Making the reminders rock solid — the working file

Started at #14-new, 2026-08-25, as the account of a whole read of the
reminder machinery, the faults that read found, and the order they
would be fixed in. #15-new built the first of them; what is done is
marked as such below, and everything unmarked is still only an account.

## Patrick's verdict, recorded at his asking (#15-new)

He is disappointed, and said so plainly: eight sessions — #5-new
through #13-new — had improving the reminders as their sole focus, and
the read at #14-new still found eight faults, one of them the very
thing he had reported. With a feature as established as this one, in
his own shorthand, it should have been plug-and-play.

Recorded beside it, and not as a defence of it: every one of those
eight sessions was proved by tests and by his eye on a screen, and the
one test that would have caught the main fault — a day passing, an item
ticked off still reminding tomorrow — has never run, going back to
#6-new. The faults were not exotic. They were in the half nobody
looked at.

## Why this file exists

**Patrick's ruling, and it governs everything below.** Reminders being
rock solid is the only purpose of this app. Nothing else in it matters
if a reminder does not arrive, or arrives when it should not.

**His second ruling.** When something has to give, the old reminder is
the one thrown away and the new one is the one kept.

**His standard.** The reminders should follow established practice and
be solid and robust, rather than being a private arrangement that
happens to work.

## What was read, so no session reads it again

All of it was read on 2026-08-25 and nothing was changed.

- The whole of `scheduler/`, apart from `queueview.ts`: `types.ts`,
  `scheduler.ts`, `reconcile.ts`, `dailyreset.ts`, `warn.ts`.
- All six readers: `myday.ts`, `pets.ts`, `myweek.ts`, `lookahead.ts`,
  `todo.ts`, `memorytest.ts`.
- The housing, `app/_layout.tsx`, entire.
- `app/myday.tsx`, entire.
- The published guidance on Apple's limit and on the notification
  library, checked against the copy of the library actually installed
  in this project.

**Still owed as reading:** `app/mollie.tsx` (Pets) and
`app/myweek.tsx`. Both are needed before the second fix below is
built, because both draw a checkmark and My Week holds the one
reminder the module cannot see. `app/lookahead.tsx` and `app/todo.tsx`
are already the right shape and are not needed for this work.

## What is already right, and is not to be "fixed"

Recorded so that a later session does not undo good work by mistake.

**The shape of the module is the established one.** It works out the
whole set of reminders that ought to exist, compares that against what
the phone is holding, and changes only the difference. Every reminder
carries a name built from what it is — its screen, its item, and which
of that item's reminders it is — so the same reminder can never be
armed twice. Apple's own published advice is to work the set out again
each time the app opens, which is exactly what this does.

**The ceiling is handled correctly.** Apple keeps only the soonest
sixty-four reminders that have not yet fired and throws the rest away
without saying so. The reconcile keeps the soonest, trims the furthest
away, leaves room for the reminders the module does not own, and never
touches a reminder belonging to something else, such as the Timer.

**The repeating alarms are asked for correctly.** Some versions of the
notification library need an extra setting on a daily or weekly alarm.
The copy installed in this project, version 0.32, does not. This was
read in the installed package rather than taken from memory.

**The readers are plain and testable.** None of them touches storage or
the phone, each is handed the moment it should treat as "now", and 146
tests run against them under Node on the Mac in about a second.

## The findings

Eight, largest first. None has been ruled on and none has been acted
on.

### 1. A finished item still reminds

**Where it lives:** `scheduler/readers/myday.ts` and
`scheduler/readers/pets.ts`, which both declare `completed` on the item
and never read it; and `scheduler/readers/myweek.ts`, which does the
same with a chore.

**What was found:** all three arm the phone's own repeating alarm — a
daily one for My Day and Pets, a weekly one for My Week. Once that
alarm is set, the phone fires it on its own and never asks the app
anything. So ticking an item off does not and cannot take that day's
reminder away.

**It is deliberate, and the reasoning is written into the file.** The
note above `readMyDay` says that a daily reminder's next firing is
tomorrow, that tomorrow the item needs doing again, and that a
checkmark therefore has nothing to say about it. That was written to
cure the opposite fault — the two daily screens going silent — and it
did cure it.

**Why it is still wrong:** today's reminder and tomorrow's are the same
alarm. The reasoning is true of tomorrow and false of today, and there
is no way to separate the two while the phone is holding one repeating
alarm for both.

**This is both of the faults Patrick reported at #14-new.** The second
is it directly: an item ticked off an hour early still fires. The first
is the same thing seen from the other end: the banner arrives for an
item already done, and tapping it lands on a row correctly showing its
checkmark. `app/myday.tsx` was read to be sure of this — the page draws
the checkmark from the item's own saved state, and it clears
yesterday's before it draws, so it cannot be showing a stale one. No
second mechanism is needed to explain what he saw, and none was found.

**Decided:** nothing. But Patrick has said plainly what the rule should
be — a thing ticked off should not remind for that occurrence.

### 2. A failure is swallowed and never recorded — CURED (#15-new)

**Where it lives:** throughout `scheduler/scheduler.ts`. The whole run
is wrapped so that any error returns nothing at all. Reading a saved
list swallows its own errors and answers with an empty list. Rolling
the day over swallows one screen's failure so the other still runs.
Sweeping yesterday's banners swallows its own. Arming a single reminder
swallows its own so the rest still go. Reading the memory test's saved
session swallows its own.

**Why it matters most after the first:** if any of it fails, the app
looks exactly as it does when everything is well. Nothing is written
down, so there is nothing to look at afterwards and no way to tell a
real fault from a mis-set time. Each of those guards is individually
sensible — one reminder failing should not stop the rest — but together
they mean the module can fail completely and silently.

**Built at #15-new.** Each of the six places still catches, so one failure
never stops the rest, but every one of them now says what happened. See
"What #15-new built" at the foot of this file.

### 3. A second run is thrown away rather than held

**Where it lives:** the `running` flag at the foot of
`scheduler/scheduler.ts`.

**What was found:** a run that begins while another is still going
answers with nothing and does no work. The guard is right in itself —
two runs at once would each read the phone's queue before the other had
changed it — but it discards the second run instead of holding it until
the first has finished.

**Why it matters:** the module is run after every save. A save made
while a launch run or a return-to-front run is still going may not
reach the phone until the next time the app comes to the front. With
finding 2 above, nothing says so.

**Decided:** nothing.

### 4. The instruction that lets a banner show is set on eight pages
and not in the housing

**Where it lives:** `app/myday.tsx`, `app/mollie.tsx`,
`app/myweek.tsx`, `app/lookahead.tsx`, `app/todo.tsx`,
`app/memorytest.tsx`, `app/orders.tsx` and `app/timer.tsx`, each with
its own copy of the same instruction. `app/_layout.tsx`, `app/home.tsx`
and `app/index.tsx` carry none.

**What was found:** the notification library will not show a banner for
a reminder that falls due while the app is open unless the app has told
it to, and its own default is to show nothing. This was confirmed in
the library's published documentation.

**Why it matters:** on a fresh start, a reminder falling due while the
app is still on the home page — before any of those eight pages has
been opened — shows no banner at all. Once any one of the eight has
been opened the setting holds for the rest of that run, so the window
is narrow rather than constant. It is real all the same, and it is the
same scattering as the rest: a thing that should be said once at the
top is said eight times below.

**Decided:** nothing.

### 5. My Week's snooze is armed outside the module

**Where it lives:** `app/_layout.tsx`, in the snooze branch, where My
Week and Orders still arm a reminder onto the phone by hand.

**What was found:** the reminder is created directly and carries no
name of the module's kind and no record of when it fires. The module
therefore cannot see it, cannot move it, and cannot take it off. It is
the one source the module does not own, and it shows on the Scheduled
Reminders screen with its name and its page and no time.

**This was already known** and stands in `docs/handoff.md`. It is
repeated here because it belongs to this piece of work.

**Decided:** nothing.

### 6. My Week's "+1 Day" button cannot fire

**Where it lives:** the `myweekactions` button set registered in
`app/_layout.tsx`, and the `postpone1` branch that answers it.

**What was found:** both of My Week's reminders — the base weekly one
and the postponed one — carry the shared routine button set instead, so
`myweekactions` is registered and never asked for and the branch
answering it can never run. Postponing still works from the page.

**This was already known** and stands in `docs/handoff.md`.

**Decided:** nothing.

### 7. The same question gets two different answers

**Where it lives:** across the six readers.

**What was found:** three screens use the phone's own repeating alarms
and three use single moments aimed at one time. Good practice picks one
and stays with it. Because this app uses both, whether a reminder can
answer to the state of its item depends on which screen it came from —
which is finding 1 stated as a rule rather than as a fault.

**The alternative is already proven in the other project.** In
Students-Assistant every reminder is a single moment aimed at the next
occurrence, worked out afresh on every run, and the reader steps past
an occurrence already marked done. Patrick settled that himself there
at SA-13. Its cost was named at the time and applies here too: a single
moment is spent once it fires, so a stretch in which the app is never
opened arms nothing further ahead.

**Decided:** nothing.

### 8. Nothing checks that the phone matches

**Where it lives:** nowhere, which is the point.

**What was found:** the Scheduled Reminders screen shows what the phone
is holding. Nothing compares that against what the saved lists say
ought to be there, so a reminder that should exist and does not is
invisible until it fails to arrive.

**Decided:** nothing.

## The fix list, in the order it would be done

Nothing here is agreed. The order is by what makes the next fix safer
rather than by size.

1. **Make a failure visible.** — **DONE (#15-new).** Until this was in,
   every other fix would have been built without being able to tell
   whether it worked. What it became is below.

2. **One rule for a finished item, applied the same way everywhere.**
   This is the fix for both of the reported faults. It means moving the
   three repeating screens onto single moments aimed at the next
   occurrence, so that the reader can step past an occurrence already
   marked done. It reaches the three readers, the three pages that draw
   the checkmarks, and the daily clearing. It wants Pets and My Week
   read first.

3. **Hold a dropped run instead of discarding it**, so a save always
   reaches the phone.

4. **Say the banner instruction once, in the housing**, and take the
   eight copies out.

5. **Bring My Week's snooze under the module**, written down on the
   chore the way My Day's and Look Ahead's already are.

6. **The dead "+1 Day" button** — either wake it or take it out.

## What is not decided

- Whether all three repeating screens move to single moments together
  or one is proven first. **That the move is made at all is now
  settled** — see the rulings below.
- Whether the Timer comes under the module. It is outside it today, its
  alerts are counted but not owned, and Patrick has said twice that it
  is not working right.

Two questions that stood here at #14-new are now answered and are
recorded with the rulings below: what a failure looks like when it is
made visible, and what happens to the cost of single moments.

## Patrick's rulings at #15-new

**The move to single moments is agreed, on one condition** — that a
missed firing is noted when he opens the app. His words: "Yes as long
as a missed firing is noted on opening."

**A failure speaks in a pop-up when the app is opened.** Four of the
six faults speak, because each one means a reminder he is expecting
will not arrive: a reminder that failed to go onto the phone, a saved
list that could not be read, a run that stopped part-way, and
permission being off. Two are written down and never interrupt him —
the day failing to roll over, and yesterday's banners not coming
down — because neither stops a reminder arriving. The run skipped
because another was already going is not a failure at all and says
nothing; fix 3 cures it properly.

**The pop-up comes back once a day, not on every open.** Tapping a
fault away silences that same fault until the next day; a fault he has
not tapped away shows at once. His agreement to the reasoning is the
durable part: a notice that appears every time the app comes to the
front is one you learn to tap away without reading, which costs the
very thing it was for.

**A miss is cleared by having been shown, never by the item being done
again.** This was his correction of a rule proposed the other way
round, and his reason is that the pop-up always comes first — the app
cannot be used without being opened, and opening it is what raises the
pop-up. So a miss is written down as the day rolls over, shown the next
time he opens the app, and gone for good once he taps it away.

**One pop-up carries both kinds**, faults first and then misses,
because two pop-ups stacking on opening is what teaches a person to tap
without reading. The heading widened to cover both.

**His Still To Do wording is carried across whole** for a miss —
"[This] from [when] is hanging!" — with his rule from there that a
repeating item lists its most recent miss only, so a fortnight away
gives one line per item rather than fourteen.

**And an instruction about how the work is done:** give a suggestion
without being asked for it, especially where the good answer is already
known. He said this after being asked three times in a row what he
wanted when there was a plain recommendation to make.

## What #15-new built

Nothing of fix 2 itself. Two pieces, both plain-and-tested in the shape
the six readers already use, and 192 of 192 tests pass where 146 did
before.

**The record and the pop-up.**

- `scheduler/health.ts` is the new plain file: what a run's outcome
  looks like, which faults speak and which stay quiet, the once-a-day
  rule, the misses, and every sentence either kind puts on screen.
  Node tests all of it.
- `scheduler/notice.ts` is its thin impure half — the alert box and the
  storage reading — which is exactly the split `warn.ts` already has.
- `scheduler/scheduler.ts` stops swallowing silently. Every one of the
  six places still catches, so one failure never stops the rest, and
  each now says what happened. The last ten runs are kept, so a failure
  at breakfast is not wiped out by a good run at noon.
- The pop-up is raised from `app/_layout.tsx` after the run finishes,
  not from the home page. On a cold launch the first page draws long
  before the run is done, so a pop-up hung on a page would miss the
  very moment it is for; from the housing it also finds him wherever
  he is.
- It is the phone's own alert box, the same one the near-the-ceiling
  warning uses, so the closing line is not in smaller type.
- One thing is now a fault that was not before: a saved list holding
  something that is not a list at all. It used to be read silently as
  empty, which is the path where a screen's reminders vanish and the
  ones on the phone are then taken off as leftovers.

**The missed-firing safety net**, which is the condition his ruling
put on fix 2 and is built ahead of it.

- The day's rollover is the only moment the truth can still be seen,
  because it wipes the checkmarks and afterwards yesterday's undone
  item and today's not-yet-done item look exactly alike. So each
  undone item leaves one line behind as it rolls over.
- A gap needs nothing written down. The app already saves the last day
  it rolled over, so every day between that and today is a day nothing
  was done — which is arithmetic, and it closes the hole where a
  fortnight away would otherwise have caught the last day only.
- Yesterday is counted back from the clock rather than parsed out of
  the saved date, because that date is written in the phone's own
  wording — 8/25/2026 here, 25/08/2026 elsewhere — and cannot be
  safely read back.
- A week-old drop rule was proposed and deliberately not built: one
  miss per item, plus a miss cleared for good on the tap, already
  bounds the list, and a rule that can never fire is worse than none.
- My Day and Pets only. My Week clears on its own cycle and that page
  is still unread.

**Still owed as reading before fix 2:** `app/mollie.tsx` and
`app/myweek.tsx`, unchanged from #14-new.
