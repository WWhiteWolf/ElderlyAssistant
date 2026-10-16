# The shape of the reminder work

Brought current at #142-new, 2026-10-16. This is the live engine
detail. The designed implementation is the vocabulary for the whole
app, and each kind's buttons, form, and list behavior live there.

The heart of the app is the reminders. The scheduler is the engine.
What follows is the machinery that engine runs, written once against
one shape.

## The path

One saved list holds every item. Each item has one kind. A page is a
filter on that list.

The path runs in one direction, and then it loops:

1. The translator reads the saved list and says what each item is.
2. The still-wanted block says whether that item should speak.
3. The depth block says how many to arm. The answer is one.
4. The join writes the reminders the phone should hold.
5. The reconcile makes the phone match that set.

Done, Skip, and a push-back come back from a banner button or from a
tick on a page. They change the saved item. The next run reads that
item and goes around again. Nothing in the blocks goes by page.

## The translator

There is one translator. A table has one row per kind, and the row is
set once at the boundary. The nine kinds are Daily, One Time, Weekly,
Monthly, Quarterly, Yearly, Appointments, Birthdays, and Bucket List.

The row says the repeat, what Done does, whether a push-back is
allowed and from which source, whether the kind waits and for how many
days, what it puts on the lead list, and which button set the banner
carries. The rest of the engine reads those fields. It does not
remember the page.

**daily** — repeats every day. Done is this occurrence. It can be
pushed back, from dailysnooze. It does not wait. The lead list is the
moment itself. The banner set is routineactions. With no time, it is
not armed.

**oneTime** — does not repeat. Done is this occurrence. It can be
pushed back, from oneTimesnooze. It does not wait. The lead list is
the moment itself, then any before-chips the person set. The banner
set is onetimeactions. With no time, it is not armed.

**weekly** — repeats every week on its weekday. Done is this
occurrence. It can be pushed back, from weeklysnooze. It does not
wait. The lead list is the moment itself. The banner set is
weeklyactions.

**monthly** — repeats every month. Done moves the date. It can be
pushed back, from monthlydelay. It waits thirty days. The lead list
is the moment itself. The banner set is cadenceactions. A missing day
uses shifteddayactions.

**quarterly** — repeats every three months, or every 30, 60, or 90
days when that step is on. Done moves the date. It can be pushed
back, from quarterlydelay. It waits sixty days. The lead list is the
moment itself. The banner set is cadenceactions. A missing day uses
shifteddayactions.

**yearly** — repeats every year. Done moves the date. It can be
pushed back, from yearlydelay. It waits sixty days. The lead list is
the moment itself. The banner set is cadenceactions. A missing day
uses shifteddayactions.

**appointments** — does not repeat. Done finishes the item. It cannot
be pushed back. It does not wait. The lead list is the moment itself,
then any before-chips the person set. The banner set is
appointmentsok. If no time is entered, 12:00 pm is the default.

**birthdays** — repeats every year. The birthdate stays with the name.
Done moves the derived next fire, not the birthdate. It cannot be
pushed back. It waits sixty days. The lead list is the moment itself,
then any before-chips the person set. The banner set is
appointmentsok. A missing day uses shifteddayactions. If no time is
entered, 12:00 pm is the default.

**bucketlist** — does not repeat. Done finishes the item. It cannot
be pushed back. It has no time and an empty lead list, so it is never
armed. It has no banner set.

A code is one word from a named set, so an impossible word cannot be
written down. The repeat unit is day, week, month, or year, and a
one-off leaves it off. What Done does is this occurrence, move the
date, or finish the item. A holiday move is before or after, or left
off. A lead is an offset or a clock time, not half of each.

Option bits are separate named fields, not one packed number. Packing
buys nothing on a phone that saves plain text, and it costs both a
clear reading and the compiler's checking. The bits that remain are:
it can be marked done, and it can be pushed back.

Same Day Nth Week and Day of First Full Week cannot both be true.
That is one exclusive group, on the Monthly row. The translator
writes at most one. If both saved fields are complete, it writes
neither.

## The common shape

The translator turns each saved item into one shape. The fields fall
into four groups. The capability bits say what this kind is allowed
to do, and they are set once. The state fields say what has happened
to this occurrence, and they change.

**What the item is.** `sourceScreenCode` is the kind.
`itemIdText` is the item's id. `itemNameText` is the name the banner
shows.

**When it comes due.** `repeatUnitCode` and `repeatIntervalCount` say
the repeat. A one-off leaves them off. `repeatWeekdayList` is the
weekday, used by Weekly and by a Monthly weekday pattern.
`repeatAfterDayCount` is the numbered day a Wednesday-after pattern
uses. `quarterlyStepCode` is the Quarterly step, and every other kind
leaves it off. `hasDueTimeBit` says the item has a time.
`dueHour` and `dueMinute` are the clock time. `dueMonthDay` keeps a
31st as the 31st when a shorter month uses the last day that exists.
`dueMoment` is the one moment a one-off comes due, and the seed a
dated item steps from. `floatsWithPhoneBit` is true when the time
floats with the phone. When it is false, `dueTimeZoneText` is
required, and the engine will not guess a zone. `holidayMoveCode` is
before or after a US federal holiday, including the observed Friday
or Monday. A missing-day shift is left as it is, and is not also
moved for a holiday.

**What the kind is allowed to do.** `canBeDoneBit`.
`canBePushedBackBit`. `pushBackSourceCode`, left off when a push-back
is not allowed. `doneActionCode`, the three words. `waitsUntilNearDays`,
left off when the kind does not wait. `standsForGroupBit` is still on
the shape, and every kind leaves it clear. There is no group banner.

**What has happened.** `isDoneBit` is done right now.
`pushedBackToStamp` is the one moment a push-back was set to.
Pushing back again moves that moment. `skippedCycleStamp` is the
cycle that was skipped. `doneAtStamp` is when a Weekly Done was
pressed.

**How far ahead to speak.** `leadTimeList`. An offset carries an
amount and a unit: minutes, hours, or days. A clock lead carries how
many days before, and morning, midday, or evening. An empty list
means nothing to say. The engine does not guess that from the kind.
Each row writes its own leads.

**The banner.** `bannerTitleText`, `bannerBodyText`, and
`bannerButtonsCode`. `shiftedBannerButtonsCode` is the Then / Next
Day set, left off when the kind has no missing-day banner.

## Is this still wanted

The block asks in this order. The order is the rule.

**Done, first.** The capability bit gates the state. An item that
cannot be marked done is never treated as done. Finish the item, and
nothing further is armed. Move the date, and the tick is only a mark,
because the date has already moved, so this occurrence still stands.
This occurrence, and later ones still stand. The push-back that
belonged to the dropped occurrence is not carried forward. The
morning roll is not this block's job.

**Skip, next.** This cycle is dropped and the next event is armed.
Skip is not Done. A stamp on an item with no repeat is ignored. The
stamp holds through the end of that calendar day.

**A push-back, next.** The stamp adds a reminder. It does not move
the base occurrence. A stamp already in the past is spent. A kind
that cannot be pushed back ignores the stamp. If the time was
cleared after a snooze was promised, the promised moment still
stands and there is no base beside it.

**A time, last.** An item with no time has nothing to arm. This is
asked last so a promised snooze is not thrown away.

## How far ahead

Depth is one, for every item. Opening the app rebuilds the whole set
from the saved list, and that is what the second copy used to do.
Rock solid is for when you use it.

A repeating kind puts a lead of nothing-before on its list, so it
speaks at the moment itself. An Appointment or a Birthday puts that
same moment on the list and then the before-chips the person chose,
so an empty chip list still speaks at the time. One Time does the
same when a time is set. Bucket List puts nothing on the list.

A lead is counted back from the next due moment. An offset subtracts
its minutes, hours, or days. A count of zero is the moment itself. A
clock lead steps back that many calendar days and then uses the named
time from Settings. A moment already past is dropped.

Several leads arm only the soonest still ahead. When that one has
fired, the next run arms the next. A Birthday does this, and it also
waits until the birthday itself is within sixty days. An Appointment
does the same soonest-one step, and it does not wait. Monthly waits
thirty days. Quarterly and Yearly wait sixty. Daily, Weekly, and One
Time do not wait. The wait is measured from the due date, so a
before-chip can be armed while the due date is inside the window.

While a Weekly week is spent, the next speaking time stays on the
phone. The visible check comes off in the morning. The spent week
ends when that next speaking time arrives.

Every reminder this engine arms is one moment on a date. The phone's
own daily repeat and weekly repeat are not what this engine writes.

The phone holds sixty-four reminders that have not yet fired. Eight
places are held back. Any reminder already on the phone that this
scheduler does not own takes a place as well. The soonest fill what
is left. The ones that do not fit are the furthest away. The next
run rebuilds from the saved list, so a trimmed reminder comes back
when it is near enough.

## The morning roll

The roll runs before the list is read, on launch, on every return to
the front, and as part of bringing the phone up to date. On a day
that has already been rolled, it does nothing.

A miss is written for an item that fell on a day since the last roll,
other than Bucket List, and only when that item has a saved hour and
minute. One miss per item, the most recent. If the app was closed
for a whole day or more, the old checkmarks are ignored and every
such item counts. The sentence is "<name> from yesterday is hanging!"

Daily's tick comes off, and Daily's snooze comes off. The visible
check also comes off Weekly, the dated kinds, and One Time.
Appointments and Bucket List stay finished. A Weekly snooze stays.
The Weekly spent-week stamp stays until the next speaking time.

On opening, one notice says what failed and what was missed. A fault
tapped away is quiet until the next day. A miss tapped away is gone.

## What Done does to the phone

Saved Done is part of the same reconcile that compares the saved list
with the phone. Every queued copy carrying that item's id is brought
into line, including an old copy whose source word is retired. The
next legitimate cycle is still kept.

A banner already showing for that item is taken down, and so is a
banner from before today. Each is tried again when it is still there.
A queued reminder that remains is spoken: it may still arrive. A
banner already showing that cannot be taken down stays quiet.

## Bucket List and a Daily tick

A Bucket List item says something is not done yet. It has no day. Its
finished mark lasts, and it must survive the night.

A Daily tick says today's occurrence was done. It keeps that
occurrence from speaking again, and the morning roll clears it.

The roll hands the Daily clear only to Daily items. Bucket List never
enters it, and Bucket List is never a miss. Anything that gives a
Bucket List item a daily clear, or lets a Daily tick carry into
another day, has confused them.
