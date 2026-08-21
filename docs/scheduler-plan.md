# Plan — one scheduler that owns every reminder

Written #5-new. Nothing here is built. Nothing here is agreed.

## Why this exists

The reminders are the heart of the app and they go quiet. The read
this session found three faults, and two of them are the same fault
wearing different clothes.

- **My Day and Pets destroy their own daily repeats.** When an item
  is checked off, the screen cancels every one of its reminders and
  re-creates them only for items not yet done. The repeat for the
  finished item is gone. It comes back only if that screen is opened
  on a later day.
- **Nothing ever puts a lost reminder back.** Only the screen that
  owns a reminder can re-arm it, and only while it is open. The
  housing arms nothing. The Home screen arms nothing. There is no
  background task.
- **Nothing knows the total.** Nine screens each add to the iOS queue
  without seeing the other eight. iOS holds sixty-four pending
  requests, keeps the soonest, and throws the rest away in silence.

The pattern behind all three is that no single piece of the app owns
the reminders. They live only as requests inside iOS, and the app's
saved lists and that queue can drift apart with nothing to notice.

## What is being built

One module that owns the whole queue. It reads every saved list, works
out the complete set of reminders those lists call for, and makes the
iOS queue match it. Screens stop scheduling anything. They save their
data and ask the module to run.

The module answers one question: **given everything saved on this
phone right now, which reminders should exist?** Then it makes that
true. Because it answers from the saved data every time, a reminder
that went missing for any reason comes back on the next run.

## How it works, in four parts

**One, the readers.** One small function per screen. Each is handed
that screen's saved list and returns a plain list of wanted reminders.

**A reader stays plain, and this is settled (Patrick).** It never
reaches for storage itself, never touches iOS, and imports nothing from
React Native or Expo. It takes a list and the current time, and returns
plain objects. Anything importing React Native cannot run outside a
phone or a simulator — Node stops before the test begins — so a reader
that reads storage itself could only ever be checked by building the
app and living with it, which is the loop this whole plan exists to
leave. The storage reading therefore happens once, at the top of the
module, and the parsed lists are handed down.

Deciding this before the readers exist costs nothing. Pulling the
storage reads back out afterwards means rewriting all seven.

- My Day reads `my_routine` — one daily repeat per item that has a time.
- Pets reads `pets_feeds` — the same.
- My Week reads `week_routine` — one weekly repeat per chore.
- Look Ahead reads `lookahead_items` — one dated reminder per item
  still in the future.
- Orders reads `orders_items` — up to four dated reminders per order.
- To-Do reads `todo_tasks` — one dated reminder per reminder set on a
  task, and one daily for background tasks if any exist.
- Memory Test is handled the same way once its held reminder is saved
  to storage.
- **Timer stays outside the module, and this is settled (Patrick).** It
  is a special case: its alerts are minutes long, it already tracks its
  own, and it does not derive from a saved list the way the others do.
  The module leaves Timer's requests alone and counts them against the
  budget without owning them.
- **Timer also has a fault of its own right now** (Patrick, #5-new),
  not looked at this session and not described here. It is written down
  so it is not lost, and it belongs to its own piece of work.

**Two, the wanted list.** The readers' results are gathered into one
list, and every entry carries a key built from what it is — the screen,
the item, and which of that item's reminders it is. Two entries can
never collide, so a duplicate is impossible by construction. The
To-Do daily that piles up today cannot pile up under a key.

**Three, the reconcile.** The module asks iOS what it currently holds,
compares it to the wanted list by key, and then:

- cancels anything iOS holds that is not wanted,
- creates anything wanted that iOS does not hold,
- and leaves anything that matches exactly alone.

Leaving matches alone is the important part. Today every save tears
the whole set down and rebuilds it, which is both slow and a chance
for something to be lost. After this, a save that changes one item
touches one request.

**Four, the budget.** Before creating anything, the wanted list is
sorted by when each reminder fires and trimmed to a ceiling below
sixty-four, leaving room for timers. What gets trimmed is the furthest
away, which is also the least urgent and the most likely to be re-armed
long before it matters. The module records that it trimmed, so the app
can say so instead of going quiet.

**Snoozes are saved, and the module owns them (Patrick).** A snooze,
a delay and a postpone are all written to storage when they are made
and cleared once they have fired, so the module derives them from the
saved data like everything else and can put one back if it goes
missing. Patrick's reason is the durable part: a snooze is the second
chance. It was asked for because the moment was wrong, which makes it
the reminder most likely to be the one that matters and the one whose
absence is least likely to be noticed, since it is already expected
later rather than now.

## When it runs

- On app launch, from the housing.
- Whenever the app returns to the front, from the housing.
- After any screen saves its data.

The first two are what the app does not have today, and they are what
makes it self-healing.

## A clean slate every day (Patrick)

The holdover after midnight goes, in both of its halves. A banner from
yesterday is no longer left sitting to be tapped today, and tapping an
old one no longer files a completion under the day it fired while
leaving today's item unchecked.

Patrick's reason settles what replaces it: a thing not done on time is
of no use as a reminder. The past-day behaviour existed to catch the
log entry, not to remind, and he would rather lose that road than keep
the confusion.

- **The module sweeps stale banners** whenever it runs — on launch and
  on every return to the front — clearing anything delivered before
  today.
- **A Done always means today.** It checks off today's item and logs it
  under today's date. There is no past-day branch left.
- **A missed item simply stays unchecked** and reaches the log only if
  it is checked off in the app.

One honest limit: the sweep can only happen while the app is running or
as it comes to the front. If the app is not opened for two days, those
banners sit in Notification Center until it is. Whether iOS can be told
to expire a banner on its own has not been checked.

## The daily reset moves into the module (Patrick)

Clearing yesterday's checkmarks is part of the same clean slate, and
today it happens only when My Day or Pets is opened — the same
screen-bound fault as the reminders. It moves into the module and runs
on the same two triggers, so the day rolls over whether or not those
screens are visited.

## The rule change that fixes My Day and Pets

A base daily repeat is always armed, whether or not the item is
checked off. Checking something off has nothing to do with it: the
next firing of a daily reminder is tomorrow, which is exactly what is
wanted. My Week already works this way, so this brings the two daily
screens into line with the weekly one rather than inventing anything.

Suppressing today's leftover nagging is a separate job, and it is the
snooze one-offs that do it — not the base repeat.

## Making it checkable (Patrick — rock solid)

Self-healing is not the same as proven. Two pieces make the reminders
something that can be checked rather than waited on.

**Tests for the readers.** Each reader is a plain function: hand it a
saved list, get back the reminders that list calls for. Nothing about
it needs a phone, iOS, or a screen. So each one can be given a list and
checked against the answer — an item with no time, an item checked off,
a chore on a Sunday, an order with a delivery window, a due date
already past. The reconcile and the budget can be tested the same way,
by handing them a pretended queue.

This project has no test setup at all today — no test runner in
`package.json` and no test files anywhere — so a small one gets added
with this work.

**It follows Mystery's shape, and this is settled (Patrick).** That
suite is `MysteryCluesTracker/engine-tests.html`: 179 tests and no
framework whatsoever. Three things carry across.

- **The runner is about ten lines.** A `test()` that runs one check and
  catches anything thrown, and an `assert()` that throws when a claim
  is false. Nothing to install and nothing to keep up to date.
- **It runs on the Mac in seconds, headless under Node**, printing a
  PASS or FAIL line per test and a count at the end. No build, no
  simulator, no phone.
- **Tests use their own storage keys**, so running them can never touch
  real saved data.

What does not carry is the single HTML page, that being a browser app's
shape. Here the tests are their own file beside the module.

**A screen that shows the queue.** A plain list of everything iOS is
holding right now: what it is, which item it belongs to, when it fires,
and the total against the ceiling. Sorted by fire time.

Its point is that a missing reminder is invisible until the moment it
fails to arrive, and by then it is too late to matter. This turns that
into something that can be looked at on any quiet afternoon.

Where it lives, and whether it is plain or hidden away in Settings, is
open.

## Order of work, each piece testable on the phone

1. Build the module with the readers and the reconcile, and have the
   housing call it on launch and on return to the front. Change no
   screen. At this stage the app arms reminders in two places, which is
   safe because the reconcile is by key and cannot duplicate. The test
   setup and the readers' tests come with this step, since the readers
   are what it builds.
2. Take the scheduling out of My Day and Pets, and apply the
   always-arm rule. This is the fix for the silence.
3. Take the scheduling out of My Week, Look Ahead, Orders and To-Do.
4. Bring the snoozes, delays and postpones under the module by saving
   them, so the module owns those too.
5. Bring Memory Test in. Timer is deliberately left out.
6. Turn on the budget and the near-the-ceiling warning.
7. Move the daily reset into the module, sweep stale banners, and take
   the past-day branch out of the Done handler.
8. Build the screen that shows the queue.

A one-time clearing runs the first time the new module starts: cancel
everything iOS holds, then build from the saved data. That sweeps out
the accumulated To-Do dailies and anything else stale.

## A separate fix that is not structural

The hour stepper in `components/DateTimeControl.tsx` is wrong across
the twelve o'clock crossing. Stepping down from 12:00 PM gives 11:00
PM instead of 11:00 AM, so setting a nine o'clock morning time by
spinning down from the default noon lands on 9:00 PM. Stepping up from
11:00 AM gives 12:00 AM, and up from 11:00 PM gives 12:00 PM. The
AM/PM button and the typed box are both correct; only the hour stepper
is at fault.

This is plain arithmetic and would be wrong in any structure. It is
listed here so it is not lost, and it is a small fix of its own.

Any item whose time was set by spinning through that boundary is
stored in the wrong half of the day and will need re-setting after the
fix.

## The warning comes as it goes in (Patrick)

Patrick's own words: he should know what is going to need trimming as
it is put in, way ahead of time. So the app speaks when the item is
entered rather than staying quiet until the reminder fails to arrive.
It is the same shape as Students-Assistant's squeeze warning, which
fires as she enters rather than at the end.

**The line between normal and worth saying, settled with him.** Rolling
leaves far-future reminders unarmed as ordinary business, and that
never warns about anything — it is the module working. The warning is
for the real case only: there are now more reminders than the phone can
hold, so something asked for will not arrive.

Exactly what it says, and where it appears, is still open.

## Open questions, for Patrick

- The wording of that warning, and where on the screen it shows.

## What the ceiling is, and why the number matters more later

Apple's limit is sixty-four **pending scheduled requests** for the
whole app — reminders asked for and not yet fired. Three things about
the count are worth having straight:

- **A repeating reminder is one slot, forever.** A daily eight o'clock
  reminder is not one a day; it is one, permanently. Same for a weekly
  chore.
- **A one-shot dated reminder is one slot until it fires**, and the
  slot frees itself afterwards.
- **A banner already delivered costs nothing.** It has fired.

Past sixty-four, iOS keeps the soonest and discards the rest without a
word. That is why the To-Do daily pile-up matters: each is another
permanent slot nothing removes.

**Memory will not come near it (Patrick).** Counting the app as it
stands — a handful of My Day items, a few feeds, the chores, the
future Look Ahead items, a couple of orders — the number sits well
under the ceiling.

**Students-Assistant might (Patrick).** Fifteen weekly class meetings
and twenty live assignment warnings is already thirty-five before
anything is broken into pieces. The leave-by alert would have added
fifteen more, and Patrick dropped it at #5-new for other reasons.

So the budget exists here as a guard and there as working machinery.
The answer for a crowded app is rolling: arm what is near, leave the
far ones unarmed, and re-arm as the module runs. That works precisely
because the module runs on every launch and every return to the front.

The catch, stated plainly: rolling depends on the app being opened. A
phone left untouched for a week arms nothing new.

## What this gives Students-Assistant

One module, with its readers replaced and everything else unchanged.
The reconcile, the keys and the budget are not specific to this app.
