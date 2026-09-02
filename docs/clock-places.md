# Where the live app still asks the real clock

Written at #52-new, for Patrick to devise pre-dating and post-dating
reminders against. Not a build. The old test load is not this list
and is not brought back here.

Two different acts get mixed if they are not named:

- **Dating the item** — the saved year, month, day, or weekday.
- **Dating today** — what the app thinks “now” is.

The engine already accepts a pretend now. The pages, the morning
roll, Daily’s mix, the miss notice, and the banners still ask the
real clock. Changing only the item’s date is not enough to make
yesterday’s Monthly look like today’s miss.

## Already pretends

These take `now` in and never read the clock. Tests already use
that.

- Still wanted
- Next moment and calendar shading in the engine
- Reminders for one item
- Weekly cycle roll, once it is handed a now
- The translator, when it is handed a now

The Mac suite runs these with a pretend time. The phone run does
not, because the housing below still fills `now` from the clock.

## Must listen to a pretend today

These are the surface a pre/post date has to reach, or the app
will keep behaving as if it is really today.

**The morning roll**

- What day it is, and whether that is a new day
- Yesterday, for the miss note
- Clearing Daily ticks
- Sweeping yesterday’s banners (start of today)
- Weekly cycle roll is handed `Date.now()`

**Arming**

- The scheduler run fills `now` from the clock, then hands it to
  the engine. One fill. If that fill were a pretend moment, the
  engine would follow it.

**Daily as a view of the day**

- A Weekly item shows if its weekday is today’s weekday
- A dated item shows if its saved date is today, or if the
  engine’s next moment falls today — and that next moment is
  asked with the real now

**The miss pop-up**

- Today, for whether the notice was already said
- Yesterday, for the sentence “from yesterday”

**The calendar page**

- Opens on the real current month. Arrows then move from there.
  Shading of a month you have already opened uses the engine,
  but it is still handed the real now when the item is translated.

**New and Edit**

- A new item’s date and weekday default to today
- One Time for today on Daily uses today’s date

**Snooze, delay, and Next Day from a banner**

- Snooze is now plus fifteen, thirty, or sixty minutes
- Delay 1 Day / Week / Month and Next Day start from now, not
  from the item’s due day
- Weekly Done stamps `doneAt` as now, which the weekly roll
  later compares to the last occurrence

**The Log**

- The line’s date and time are written from the clock at the
  tap, on Daily and on the shared cadence page

**Scheduled Reminders**

- “When it comes due next” is judged from now

## Uses the clock, but is not “what day is it”

These will not block a pre/post date of the reminder itself.

- New ids, written as `Date.now()`
- Last day of a given month, from a year and month already in
  hand
- The date picker spinning a Date it was given
- Backup’s export filename
- Timer and Memory Test, which are not the offering

## The one fill that would do the most

If the scheduler’s `now`, the morning roll’s today and yesterday,
Daily’s “is it today,” the miss pop-up’s today and yesterday, and
New’s default date all read the same pretend moment, the engine
would already follow. Banner snooze and Log stamps would still
be real-clock unless those are included too.

This file does not choose how that pretend moment is set. That is
the devising.
