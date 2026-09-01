# Calendar

Written at #48-new, 1 September 2026. Two parts: what RFC 5545
and RFC 8984 say about calendars, and what this app’s calendar
page should be and do. This file is the ref for
`docs-ref/build-sheets/build-sheet-chalendar.md`.

Neither specification describes a month page, a Home button, or
tapping a day. They describe calendar data: what an item is, and
how repeats become dates.

## RFC 5545 (iCalendar)

This is the older iCalendar format, meant for exchanging events
and to-dos between apps.

A calendar is a collection of items: events, to-dos, journals,
and a few others.

An event is a stretch of time on the calendar. A to-do is a
piece of work, which may have a due date.

A repeating item is stored once. The recurrence set is every
date that item actually falls on, made from the start date plus
the repeat rule, plus extra dates, minus skipped dates.

One date in that set can be named on its own, so you can mean
this Thursday’s occurrence rather than the whole series.

A to-do with no start and no due date is, in this spec, tied to
each successive calendar date until it is done.

## RFC 8984 (JSCalendar)

This is a later JSON model of the same kind of data.

A calendar is a group of events and tasks.

An event must have a start. A task may have a start, a due date,
both, or neither.

Repeats work the same way: one stored item, then a recurrence
set of instances. A task repeats from its start if it has one,
otherwise from its due date. A task with neither must not have a
repeat rule.

## What that means for a calendar page

Showing dated items and their recurrences in a month is expanding
that recurrence set across the visible dates. Opening the item is
opening the stored entry. The specs also allow opening one
occurrence. They do not say how the screen should look.

## What the calendar page should be and do

Settled with Patrick at #48-new.

The calendar is a page of its own, reached by a Home button like
Daily and the rest. It is not reached through Options.

While you stay on the calendar, it shows the month and all the
events on it. The calendar fills the screen except the header.
The header stays at the top of the phone, which is the right
side when viewing in landscape.

Arrows change the month. A slide is not the control, because
each day’s box already needs to scroll. The current month is
shown when the calendar is opened.

An event is any item that holds a date, and each time that item
recurs in the month. Daily’s every-day items have no single date
and do not show.

Each day’s box shows the date and a tight list of each item,
one line only, with whatever number of characters will fit on
that line. Items drawn on the month would be too small to tap
accurately, so a tap on a day brings up that day’s events. That
tap does not open Daily or any other page. The list in the day’s
box should be able to scroll vertically, and horizontally if
practical.

A tap on an item in that day’s list opens the item the way any
page does. Done and Snooze are not on the calendar or on that
day’s view. They are marked through the item when it opens after
a tap. Header Back on the item returns you to that day’s list,
where you were. Header Back on the day’s list returns you to the
month.

There is no path from the calendar into Daily, Weekly, or the
other views. That was asked and dropped.

The calendar option can come out.

The hardest thing is going to be giving the calendar view a
landscape view.
