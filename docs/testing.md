# What testing has covered and will cover

Written at #123-new. This is the record Pending 1 asked for
(Patrick, #52-new).

A during-build sitting is thrown away. A run is not kept. The
checks below are what those two do not leave behind. This file
does not copy the checks, and it does not keep a run.

## The Mac checks that stay

They live in `scheduler/tests`. There are 428 of them, in 22
files. Each one fixes the moment it is about, so the day it is
run does not change the answer. #119-new reported that count
passing, and TypeScript clean. This sitting counted the titles.
It did not run the checks.

What they are about:

- Rolling a dated item forward, and keeping a 31st.
- Creating the replacement before the old reminder is removed.
- Arming one occurrence, and not a second copy.
- Save writing from the table.
- Backup reading the Settings keys, and Replace writing them.
- Banner buttons and the list's Snooze choices sharing one catalog. One Time has no Skip.
- Birthday lines, the age, and the next year.
- A new day taking the Daily tick off.
- What the opening pop-up says, and what it stays quiet about.
- A lead time becoming a moment, including holidays, the 31st, and Weekly Done holding until the next real fire.
- Which items were due on the days that rolled, and so which misses get written.
- The one ordered path when Memory opens.
- Banners already on the phone coming down when Done is saved.
- The words on Scheduled Reminders.
- A wanted list against a pretended phone queue, including the ceiling and an unreadable list.
- A saved item becoming the one reminder the phone would be told to hold, with only the soonest lead armed.
- A second day-roll waiting, and a second run waiting.
- One saved-list change waiting for another.
- Done, Skip, and a push-back, and an item with no time not being wanted.
- Each kind reaching the common shape, and an unknown backup kind changing nothing.
- The Weekly tick staying until that cycle has come round.

These checks do not prove the phone. A sitting does that, and
the sitting is what gets thrown away.

## Sittings that were thrown away

The automated load was built so a person could watch banners
arrive close together. It was four pieces: a scenario, a loader,
a checker, and a cleanup. It was tried on the simulator first,
then on the phone. At #45-new that phone run had 23 passed and
0 failed, after two engine faults from the sitting before had
been mended. The four pieces then left the app. They were for
what the Mac checks cannot prove: a saved item reaching the
engine, the phone queue receiving the notice, the banner words
and buttons, Done, Delay, Skip, and reopening, and recovery
after the app has been closed.

The Sit set at #52-new brought longer-term items near, so they
would fire in a day or two. Wednesday morning all seven fired,
on the simulator and on the phone. Nothing fired at 9:20. That
was his decision: One Time has no reminder at the set time. The
restore file for that set is not kept.

## What his iPhone has shown

The live handoff says the phone proof it carries is complete.
On the load it calls build 98:

- The lists end above the bottom of the screen, so a swipe to delete does not move the page.
- After 24 hours on the build 97 load, no reminder already marked Done fired again. The one reminder that did arrive was for something actually missing.
- A reminder whose set day is a holiday stays on the moved day. Thanksgiving 2026 shows Friday 27 November, including on the calendar.
- Weekly Done puts the next real speaking time on the phone, holiday move included, and the mark comes off when that time arrives.
- A holiday elsewhere in the week does not push the set day.
- Home badges change order while one is sliding.
- Birthday and its backup, the day-roll lock, Settings backup and the back-drag, the Settings Guide tile names, and the designed-machine jobs are verified on the phone.

Testers are on TestFlight External. His phone has the list change, and it verifies.

## What it will cover

Two things are still untried, and both are already in the handoff.

His Galaxy still has the preview file from 2026-09-30. Every
page on that copy stops short of the bottom. The project keeps
the page body above that strip, and Android stays upright. That
copy changes when a new install file is built. It has not been
seen on the Galaxy.

No Google Play file has been built. Nothing has been tried by
that road.

Nothing further is written here as coverage still to come. That
waits on him.
