# Designed implementation — A Place To Remember

This is the guide for the whole app. A sitting builds from this file. It
does not ask Patrick a design question. If an answer is not here, the
file is not finished (Patrick, #84-new).

`docs/reminder-shape.md` remains the live engine detail. This file is
the vocabulary those details sit in, and it is for the whole app, not
only the reminder engine.

## What this spec is supposed to be

It is the designed implementation of the whole app, not a layer of
decisions and rules, and not a photograph of the current code. Design
first, then make the changes from this file.

Daily is on the shared list. The banner still writing by source is
what a build replaces. That is not the destination. The job sheet is
`docs-ref/build-sheets/build-sheet-banner-housing.md`.

The engine stays. "Not in the engine yet" means a named code is not yet
on the translator's table at the boundary. It does not mean the
scheduler is unfinished or needs changing.

What is written now is the reminder-pages piece: the three ways a
difference is written, what already stands, what Done does, each kind,
Daily on the shared list, and the banner housing. Daily is built. That
is enough to build the banner, without asking Patrick those questions.

What is not written: a Settings password. Pending 1 is still the
thorough spec for the whole app. This file is the start of that, not
the finish.

## How to implement Daily (`app/daily.tsx`)

Built at #84-new. The engine was not changed. The extras are named
under **Daily on the shared list** below.

Weekly through Bucket List already use the shared list as a thin
route. `app/weekly.tsx` is the pattern:

    return <CadenceListPage kind="weekly" returnTo="weekly" />;

`app/daily.tsx` is that same kind of route, with kind `daily` and
returnTo `daily`. Daily's jobs — list, row, Done, Snooze, log — live
in `components/CadenceListPage.tsx`. They do not stay as a second copy
in `app/daily.tsx`.

The shared page does Daily's extras. They are:

- **The visible list** is `sortDailyVisible` / `shownOnDaily`, not
  `kind === 'daily'` only. Visitors and `oneTime` appear. Reorder uses
  `dragVisibleTo` / `placeVisible`, not `dragKindTo`.
- **The log key** is `daily_history`. The list does not show the log.
  Log in the header opens Daily’s log only.
- **+ Add** opens Daily's own short choice: Every day, or One Time for
  today. Then it opens `item-edit` with that kind and `returnTo` daily.
  It does not send every add to kind `daily` the way Weekly does.
- **Edit** uses the item's own kind, and comes back to Daily. A visitor
  is not saved as Daily.
- **The row label** is the time, the name, and the from-line. The other
  pages keep the when-line as the subtitle.
- **Done follows the item**, not the page. A visitor on Daily uses that
  item's Done action.

Keep `ReminderItemRow` and `applyReminderChange`. Do not change
`armdepth.ts` or the scheduler core. Done's three words are on the
translator's table in `scheduler/translators/translate.ts`. The Done
door reads them. stillwanted still answers two ways: the item is
finished, or this occurrence is done.

The design answers are in this file. A sitting that still has to ask
Patrick a design question is not using it.

## Three ways a difference is written

A difference in the app is written in one of three ways. A rule that
has to be remembered at every place that might need it is the wrong
shape; the difference belongs here instead.

### Code words

A code word is one word from a named set of allowed words. Only one of
the set is in force. An impossible word cannot be written down at all.

The set is declared as a named list of words. A field holds one of
them, or is left off when it does not belong. The live sets in
`scheduler/inputshape.ts` are:

- **Which kind the item is** — daily, oneTime, weekly, monthly,
  quarterly, yearly, appointments, birthdays, bucketlist.
- **The unit it repeats in** — day, week, month, year. Left off, it is a
  one-off.
- **Which banner button set it carries** — routineactions,
  cadenceactions, appointmentsok, shifteddayactions.
- **What Done does** — thisCycle, advanceDate, endItem. This code is
  on the translator's table. The two-way bit is not enough, because
  there are three actions. The code replaces that bit.
- **A holiday move** — before, or after. Left off when unused.
- **The form of a lead time** — offset from the due moment, or a clock
  time a number of days before. A lead time is one form, not half of
  each.
- **The unit of an offset lead** — minutes, hours, days.
- **A named time of day** — morning, midday, evening.
- **A Quarterly step** — none, days30, days60, days90. None means every
  three months. One chip at a time. A second tap clears it. The list
  tile still shows the date. This is a code on the translator's table.
  The saved item still holds the day-count the engine already steps.

A code word is the right shape when the thing is a choice of names.

### Option bits

An option bit is a named yes-or-no. Several can be on at once. They are
separate named fields, not one packed number. Packing buys nothing on a
phone that saves plain text, and it costs both readability and the
compiler's checking. That is how it is now, and it stays.

**Option bits say what this kind is allowed to do.** They are set once
for the kind, in the translator's table. After Done is a code, the
option bits that remain are:

- it can be marked done at all
- it can be pushed back

**State bits say what has actually happened to this occurrence.** They
change. Done right now is one of them. A pushed-back stamp and a
skipped-cycle stamp are the same idea: one stamp, or nothing.

Due facts that are also bits — it has a time, it floats with the phone
— are not option bits.

The translator's table is where each kind's option bits and code words
are set. The rest of the engine, the row, and the banner read those
fields. They do not remember the page.

### Exclusive groups

An exclusive group is a group of bits that work together. Only one of
them can be true at once. Turning one on turns the others off. There is
no both-true case.

This is for a difference that looks like bits but must not combine. A
code word is the right shape when the thing is a choice of names.

**A second Thursday and a Wednesday after the 6th cannot both be true.**
That is one exclusive group, on the translator's table. The Options
sheet turns the others off when you set the last pattern. The translator
writes at most one.

## What already stands

Keep these. A build does not replace them.

- One saved list. A page is a filter. An item has one kind.
- One save door: `applyReminderChange`.
- The shared list page: `components/CadenceListPage.tsx`. A route only
  names its kind.
- One edit form: `app/item-edit.tsx`.
- One row: `components/ReminderItemRow.tsx`.
- One log page: `app/log.tsx`. A reminder page only names its kind.
- The date-and-time control, and the page chrome.
- The engine, and the translator's table of kinds.

When a time or a date does not have to be picked, tapping a field to
set one still leaves a way back to none.

## What Done does

Done is a code, `doneActionCode`. The three words are:

- **thisCycle** — this occurrence is done. The item comes round again.
  A second tap the same day is undo. The morning roll takes the tick
  off. Daily and Weekly.
- **advanceDate** — this cycle is done, and the saved date moves to the
  next occurrence. The tick stays until the morning of the next due
  date, then comes off in the same morning roll as Daily. A second tap
  while the tick is showing is un-check: this cycle was not done. The
  tick comes off, and the saved date is the cycle that had been due, not
  the next one. It is not Done for the newly armed cycle. Monthly,
  Quarterly, Yearly, and Birthdays.
- **endItem** — the item is finished. It stays on its page. It no
  longer fires. Delete is how you get rid of it. Appointments and
  Bucket List. They are not the dated tick.

Skip is not Done. Skip drops this cycle and arms the next. A one-off
has no next cycle, so Skip does not apply.

## Each kind

The row and the banner read these fields. A page does not keep a
private copy of Done, Skip, or Snooze. When a delay is later today,
the row says Snoozed till and the clock. When it is another day, it
also names the weekday and the date. If it crosses the year, the year
is there too.

**daily** — page Daily. Repeats every day. Time is optional. New starts
with no time until Set time. After a time is set, there is a way back
to none. With a time, it speaks at that moment. With no time, it does
not speak. It is there so you can mark it done when you have already
done it. Done is thisCycle. It can be pushed back. Banner set
routineactions: Done, OK, Skip, Delay 15 / 30 / 60 min. Daily also
shows other kinds that fall today; those items are not this kind.

**oneTime** — Daily's one-shot for today. No page of its own. Saved
kind `oneTime`. Daily shows it. Appointments does not. A banner tap
opens Daily. Save comes back on Daily. Done is thisCycle. It can be
pushed back. Banner set routineactions, same words as Daily. The
Reminders before chips are only 30 min., 1 hour, 2 hours, and Time of.
Save does not ask again when none of them is on. Time is optional.
After a time is set, there is a way back to none. The set time still
speaks. It is not an Appointment.

**weekly** — page Weekly. Repeats every week on its weekday. Done is
thisCycle. It can be pushed back. Banner set routineactions. Speaks at
the moment itself.

**monthly** — page Monthly. Repeats every month. Date required. Done is
advanceDate. A 31st stays the 31st. A month with no such day uses the
last day that exists for that month only. It can be pushed back. Banner
set cadenceactions: Done, Delay 1 Day / 1 Week / 1 Month. A missing day
uses shifteddayactions: Then, Next Day. Speaks at the moment itself.

**quarterly** — page Quarterly. Repeats every three months when the
step is none, or every 30, 60, or 90 days when that chip is set. Done
is advanceDate. It can be pushed back. Banner set cadenceactions. On
Add, the chips are selectable. No chip stays every three months. A
chip counts that many days from the date entered when it is set. One
chip at a time. The list tile still shows the date.

**yearly** — page Yearly. Repeats every year. Date required. Done is
advanceDate. It can be pushed back. Banner set cadenceactions.

**appointments** — page Appointments. No repeat. Date required. The form
does not offer to take the date off. Things with no date belong on
Bucket List. Time is optional. After a time is set, there is a way back
to none. Done is endItem. It cannot be pushed back. Banner set
appointmentsok: OK only, which closes without opening the app. Speaks
at the set time, and at any Reminders before chips. Any and all of
those chips can be on at once. Save does not ask again when none of
them is on. The set time still speaks. Morning of is not the set time.

**birthdays** — page Birthdays. Own kind. A copy of Appointments on the
screen, and a yearly reminder on the one list. Date required. Time is
optional. After a time is set, there is a way back to none. Done is
advanceDate. It cannot be pushed back. Banner set appointmentsok. Same
Reminders before chips as Appointments, any and all on at once. Save
does not ask again when none of them is on. An item on Birthdays is not
also on Appointments or Yearly.

**bucketlist** — page Bucket List. No date and no time. Done is
endItem. It cannot be pushed back. No banner to arm. It must never be
handed to the morning roll that clears a Daily tick. It says a thing
is not yet done, and it must survive the night.

## Daily on the shared list

Daily is the shared list page with kind `daily`. It does not keep its
own list, row, Done, Snooze, or log. What Daily has extra is designed
here, not invented on the page.

**Visitors.** An item of another kind that falls today is shown on
Daily, with a from-line naming its page. It still lives on that page. A
tap to edit returns to Daily when that edit is finished. Showing it is
a filter, not a second saved kind.

**oneTime.** Daily's filter includes kind `oneTime`. That is not a
visitor.

**Daily's own add.** + Add on Daily asks only: every-day, or One Time for
today. It does not ask which page the item belongs on. That question
is only on Options, from + Screen. Save on either choice comes back on
Daily.

**Same-day undo.** Done is thisCycle. A second tap undoes.

The log is one piece. Daily, the shared list, and the banner all write
it. They do not each write their own. The list does not show it. Log in
the header opens that page’s log only.

## Log

Log is not a Home page and not a kind of its own. The visible name is
Log. Each reminder page carries Log in the header, beside + Add. That
opens `app/log.tsx` for that page’s log only. There is not one log for
everything. Back returns to the list.

## Banner housing

The housing reads `bannerButtonsCode` and the option bits. It does not
branch on which page the item came from. Done, Skip, Snooze, and the
log go through the same door the pages use: `applyReminderChange`, and
the one log.

The four registered sets, and no others, are:

- **routineactions** — Done, OK, Skip, Delay 15 / 30 / 60 min.
- **cadenceactions** — Done, Delay 1 Day / 1 Week / 1 Month.
- **appointmentsok** — OK, which closes without opening the app.
- **shifteddayactions** — Then, Next Day. For a missing day of the
  month. Then keeps the last day that exists. Next Day is a one-day
  push-back for this occurrence only. Dated rows name this set for
  that occurrence. It is not an Options choice.

A banner naming a set the phone does not know shows no buttons at all.
That has bitten this app before. New sets are added to the named list
and registered; they are not invented at the housing.

## Home

The Home grid in `app/home.tsx` is the badges for the pages a person
opens from Home. Options is not on that grid. There is no Options page.
The gear in the header stays where it is. It is not a badge.

Options lives on the individual item form. `app/item-edit.tsx` carries
Options. That opens `ScreenOptionsSheet` for the cases that belong to
that item's kind. That is the only place Options needs to be reached
from.

Home badges move the way iOS already does, because people are already
familiar and comfortable that way. You hold a badge. It comes up. It
gives you the option to edit the screen. Then you slide a badge to the
slot you want. The others make room. You leave edit with Done. The new
order is remembered the next time Home opens.

A tap still opens the page when you are not editing.

Appointments and Bucket List do not share a picture.

## Help

Help is the helper from Home and from Calendar. The visible name is
Help. The Home badge is ?. The route is `app/where.tsx`. It is a
transparent screen so New can sit above it.

Help does not save an item. It asks which kind, then opens
`app/item-edit.tsx` with that kind and `viaHelper`. Cancel on the form
comes back to Help. Save on the form pops Help as well, and opens the
page where the item lives.

The first question is: Does this item repeat? The choices are Repeats
and Does not. Cancel closes.

Repeats asks: How often does this item occur? The choices are Every day,
Week, Month, Quarter, Year, and Birthday. Those words do not carry a
stray “every”. Birthday opens Birthdays’ New, not Yearly. Cancel goes
back one step.

Does not asks: Is that for today? Yes opens Daily’s one-shot,
`oneTime`. No asks: Is this an occurrence that has a specific time
and date, like an appointment? Or is it the rare item with no
deadline or due date, like a Bucket List desire? The choices are
Appointment and Bucket List. Cancel goes back one step.

## Calendar

Calendar is a month view of the one list, not a kind of its own. The
page is `app/calendar.tsx`. Home opens it as `/calendar`.

Daily and Bucket List stay off the month. Other items sit on the days
the engine already shades. The names in a day cell are not taps. The
whole day is. A tap opens that day's list, time then name. The time is
the same 12-hour clock as the other pages. A tap on a row opens the
one edit form, `app/item-edit.tsx`. After you make the
edit, the save walk back brings you back to the item list. Hitting the
Back button brings you back to the calendar.

There is no + Add. New items from Calendar go through Help, which sits
in the month header, the same Help as from Home. Help only chooses
the kind. The save-the-item popup, New, sits above it.

Arrows change the month. Home is in the header. The month fills the
screen.

## Settings

Settings is not a kind of its own. The page is `app/settings.tsx`. Home
opens it from the gear in the header. The gear is not a badge. Help is
not on this page. Home is in the header.

It holds the person's name, Light or Dark, and popup colors — Match App
or Follow iPhone. It holds the three named times of day: morning,
midday, and evening. Those times are the clock for Morning of, Day
Before, and Night Before. A tap opens the time with the same
date-and-time control as the rest of the app.

Scheduled Reminders and Backup & Restore are doors off this page. They
are not this page. Reset All Data asks the phone to confirm who you
are, then wipes everything and lands on Home.

## Backup

Backup is not a kind of its own. The visible name is Backup & Restore.
The page is `app/backup.tsx`. Settings opens it. Back is in the header.
Help is not on this page.

There are three acts: Export Backup, Replace from Backup, and Merge
from Backup. You choose Replace or Merge first, then pick a file, then
confirm. Export saves a file you can keep.

Replace puts the backup's reminders in place of what is here, and takes
off the missed-reminder notes. Merge keeps what is here and adds from
the backup only what is not already here. A backup reminder is already
here when it has the same identity the app wrote into the backup file.
Settings and page logs stay on the phone. The backup does not carry
them. A file that is not a current backup from this app changes
nothing. After Replace or Merge, OK lands on Home.

## Scheduled Reminders

Scheduled Reminders is not a kind of its own. The page is
`app/reminders.tsx`. Settings opens it. Back is in the header. Help is
not on this page.

It shows what the phone is holding, not the saved list. The count sits
under the header, with how much room the phone has on the line beneath.
Rows are grouped Today, Tomorrow, This Week, Later, and Time not known.
A heading with nothing under it is left out. A tap opens a details
popup: where it comes from, when it fires, last due, next due, the
banner words, and its buttons. Close puts the popup away. A line at the
foot names how many the phone is holding that this list does not show.

## Options

Options is not a Home page and not a kind of its own. The visible name
is Options. `app/item-edit.tsx` carries Options. That opens
`ScreenOptionsSheet` for the cases that belong to that item's kind.
That is the only place Options is reached from.

Done keeps the cases. Back leaves a case, or closes the sheet. Notes
live on New and Edit, not here. Calendar shading is not a case. The
saved field stays.

The cases are Holidays, Time zone, a second Thursday, and a Wednesday
after the 6th. Holidays is Day before or Day after. Time zone is Float
with phone or Keep this zone. When Keep this zone is on, the form line
says Keep this zone and the zone name. Then and Next Day are the missing-day
banner, not an Options case.

Daily and One Time get Time zone only. Weekly, Appointments, and
Birthdays get Holidays and Time zone. Monthly, Quarterly, and Yearly
get Holidays, Time zone, a second Thursday, and a Wednesday after the
6th. Bucket List gets none.

On Monthly, Quarterly, and Yearly, the last pattern you set stays —
the date, a second Thursday, or a Wednesday after the 6th — and the
other comes off. That is how turning one on turns the others off, on
the sheet.
