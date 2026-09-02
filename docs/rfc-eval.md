# Memory against RFC 5545 and RFC 8984

Written at #52-new, 1 September 2026. An evaluation of the app as it
stands, not a build list. The file format of either spec is not
adopted, and talking to other calendars is not adopted. That was
already settled. This sitting asks how the app’s own recurrence and
calendar rules sit against those two texts.

Sources read for this sitting: RFC 5545 section 3.3.10 (the recurrence
rule) and the recurrence-set properties; RFC 8984 sections 4.3
(recurrence) and 5.2 (tasks); `Reminder Engine/docs/reminder-engine.md`
“The calendar thinking”; `docs-ref/chalendar.md`; `scheduler/inputshape.ts`,
`scheduler/leadmoments.ts`, and `scheduler/translators/translate.ts`.

## How both specs think

A repeating thing is stored once. The dates it actually falls on are
a set, made from a start plus a repeat rule, plus extra dates, minus
skipped dates. One date in that set can be named on its own, so you
can mean this Thursday rather than the whole series.

RFC 5545 is the older iCalendar format. RFC 8984 (JSCalendar) is a
later JSON model of the same kind of data. The recurrence parts in
8984 are the 5545 parts under other names, with two additions that
5545’s own recurrence rule does not have: a named behaviour when a
date does not exist, and a calendar-system name.

Neither spec describes a month page, a Home button, or tapping a day.
They describe calendar data.

## What Memory already follows

These are the spec parts the engine actually uses, in the app’s own
names.

- **One stored item, then dates.** Monthly, Quarterly, and Yearly are
  one saved item. The engine works out the next matching day. The
  calendar page expands that same arithmetic across the visible month.
- **A unit and an interval.** Day, week, month, or year, and every *n*
  of those. Daily is day and one. Weekly is week and the weekday.
  Monthly is month and one. Quarterly is month and three, or six when
  the item is every six months. Yearly is year, or month and twelve
  when a weekday pattern is on.
- **A weekday, with or without an ordinal.** The second Thursday is
  the spec’s own *2TH*: the second such weekday of the month. The last
  such weekday is allowed in the engine as −1, the spec’s last Friday.
  The pages offer a second Thursday; they do not offer “last Friday”
  as its own row.
- **A numbered day of the month as the seed.** A Monthly on the 15th
  uses the due date as that day, not a separate typed list of days.
- **A last date.** The engine will not arm a candidate after
  `repeatUntilMoment`. The pages do not offer a control for it.
- **Skip this occurrence, then the next event still stands.** That is
  the spec’s skipped-date idea (EXDATE in 5545; an excluded override
  in 8984), done as a this-cycle stamp rather than a list of dates.
  Skip does not apply to a One Time, which has no next event.
- **Lead times off the due moment.** The two forms — counted straight
  back, or a named time a number of calendar days before — are the
  spec’s alarms counted from due, not from a meeting’s start. Several
  can be on at once on One Time, which both specs allow.
- **A named zone, or floating with the phone.** Eight o’clock stays
  eight wherever the phone is, unless Options names a zone. That is
  the spec’s floating time versus a named zone.
- **A task with no date and no time must not repeat.** Extended has
  no banners and no due date. RFC 8984 says a task with neither start
  nor due must not have a repeat rule. The app matches that.
- **Opening the stored item from a day.** The calendar shows dated
  items and their recurrences. A tap opens the saved entry. The specs
  also allow opening one occurrence; the app opens the item.

## Where Memory chose a different rule

These are not faults. They are places the app decided, and the spec
either says something else or has no say.

- **A missing day uses the last day that exists.** February’s 31st
  becomes the 28th or 29th, and the banner can offer Then or Next Day
  for that firing only. RFC 5545 says an invalid date must be ignored
  and must not be counted. RFC 8984’s default (`skip: omit`) is the
  same ignore. RFC 8984 also allows `backward`, which lands on the
  last day of the current month — the engine’s rule — and `forward`,
  which goes to the first day of the next month. The app does not
  offer those three as a choice. Last existing day is always the
  rule. Then or Next Day is a tap at firing, not a saved recipe. A
  missing day and a holiday move cannot both apply.
- **Wednesday after the 6th is not a spec part.** Both specs can
  name weekdays and days of the month. They cannot name “the first
  full week” or “this weekday after this numbered day” as one part.
  The engine brought that in as `repeatAfterDayCount`. It is only the
  first such weekday after that day, not every Wednesday later in the
  month. The project already recorded that even the standard cannot
  say this, and that it was brought in on purpose.
- **Holidays are not a recurrence part.** Neither spec has a holiday
  calendar inside the repeat rule. Moving before or after a US federal
  holiday is the app’s own Options case. The engine applies it after
  the date is known, and not on a day that was already shifted for a
  missing date.
- **There is no start of the series apart from now.** Both specs
  start from a stored start (or, for a 8984 task, from start if it
  has one, otherwise from due). The engine takes the next matching
  day from now. That is enough for arming one occurrence. It is not
  the spec’s DTSTART.
- **Pages are kinds, not a free rule.** The specs combine parts on
  one item. Memory still pins a lot of the rule to the page: Daily is
  every day, Weekly is weekly, One Time does not repeat. Monthly,
  Quarterly, and Yearly add the extra patterns, but you do not type a
  unit and an interval on Daily. That was a later engine aim, not
  what the pages do today.
- **Done on Monthly, Quarterly, and Yearly does not advance a saved
  date.** The series is the rule, not a date that walks forward. That
  matches “one stored item, then dates.” It is not the spec’s
  this-and-future split of a series into two items.

## What the specs can say that Memory does not

Not a list of things to build. These are the recurrence and calendar
parts the texts have, which the app does not take.

From RFC 5545’s six-part recurrence rule, the engine already named
what it left out: hour, minute, and second units; pick-from-the-set
(the last working day of the month); week start; a count of times.
Day-of-year and week-of-year are yearly-only in the spec and are not
in the engine. Extra dates added by hand (RDATE) are not in the app.
Several weekdays on one Weekly item are not what the Weekly page
saves. A half-entered second Thursday is not a valid recipe, and a
second Thursday together with a Wednesday after the 6th is not a
combination — the last one entered stays. The specs would treat those
as one rule with several parts; the app will not stack them.

RFC 8984 adds, beyond 5545: a calendar system other than Gregorian;
the three-way `skip` on invalid dates; excluded *rules* as well as
excluded *dates*; and per-occurrence patches (change this Thursday’s
title, or exclude it). The app has none of those as saved fields.
Skip in the app is this cycle, not a list of excluded dates kept on
the item. Snooze, postpone, and delay are a push-back of this firing,
which is closer to a local override than to rewriting the series.

RFC 5545’s dateless to-do, tied to each successive calendar date until
it is done, is not Extended. Extended is “sometime,” with no banners.
Daily’s every-day items are the successive-date kind, and they do not
show on the calendar, which was settled: they have no single date.

The specs allow opening one occurrence as its own object. The app
opens the item. Depth of one, the phone’s sixty-four places, and
banners while Memory is on screen are housing, not calendar data.

## What this sitting does not settle

Whether any of the unused spec parts should be offered. Whether the
date picker should turn inactive when a Wednesday after the 6th is in
use (Pending 5, noted only). Whether pages should ever carry a free
repeat rule instead of a kind. Those stay Patrick’s.

The reminders follow established practice rather than a private
arrangement, and they follow the guidance of these two texts, not
everything those texts say. This sitting checked that claim against
the current engine and pages. It still holds.
