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

Daily is on the shared list. The banner finds the item by id. It does
not write by source. The job sheet is history:
`docs-ref/build-sheets/build-sheet-banner-housing.md`.

The engine stays. "Not in the engine yet" means a named code is not yet
on the translator's table at the boundary. It does not mean the
scheduler is unfinished or needs changing.

What is written now is the reminder-pages piece: the three ways a
difference is written, what already stands, what Done does, each kind,
Daily on the shared list, and the banner housing. Daily is built. The
banner housing is built.

This file is the guide. There is no password to open the app. The
phone being open is enough (Patrick, #101-new). Do not add another.

The app is self-contained. A person's data stays on the phone. The
app does not reach out to read or write from the outside world. What
is already in App Store Connect stays there. There is no public
website for the user's guide.

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

Keep `ReminderItemRow` and `applyReminderChange`. Done's three words
are on the translator's table in
`scheduler/translators/translate.ts`. The Done door reads them.
stillwanted still answers two ways: the item is finished, or this
occurrence is done.

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
them, or is left off when it does not belong. The live sets at the
translator and banner boundaries are:

- **Which kind the item is** — daily, oneTime, weekly, monthly,
  quarterly, yearly, appointments, birthdays, bucketlist.
- **The unit it repeats in** — day, week, month, year. Left off, it is a
  one-off. Yearly and Birthdays write year on the translator's table.
  The date-advance reads that word.
- **Which banner button set it carries** — routineactions,
  onetimeactions, weeklyactions, cadenceactions, appointmentsok,
  shifteddayactions.
- **What a banner action does** — acknowledge, Done, Skip, push back,
  keep the shifted day, or move the shifted occurrence to the next
  day.
- **How a push-back target is calculated** — 15, 30, or 60 elapsed
  minutes; 1 or 7 calendar days; 1 calendar month; or the next
  calendar day at the item's saved hour and minute.
- **Which source carries a pushed-back reminder** — dailysnooze,
  oneTimesnooze, weeklysnooze, monthlydelay, quarterlydelay, or
  yearlydelay. The kind row leaves this off when push-back is not
  allowed.
- **What Done does** — thisCycle, advanceDate, endItem. This code is
  on the translator's table. The two-way bit is not enough, because
  there are three actions. The code replaces that bit.
- **What Save writes for the date** — none, weekday, calendar, today,
  required. This code is on the translator's table. none drops year,
  month, and day. weekday writes the weekday number as day, and drops
  year and month. calendar always writes the pending date as the cycle
  anchor. A weekday pattern is written beside it and uses that anchor.
  today writes today’s date. required always writes the pending date.
- **What Save writes for the time** — none, ifPendingTime,
  alwaysPendingTime, alwaysPendingDate, ifTimeSet. This code is on the
  translator's table. none drops hour and minute. ifPendingTime writes
  from the pending time when it is there. alwaysPendingTime always
  writes from the pending time, noon if missing. alwaysPendingDate
  always writes from the pending date’s time. ifTimeSet writes from
  the pending date’s time when a time was set.
- **A holiday move** — before, or after. Left off when unused.
- **Day after the set day** — Weekly only. On or off. Off is the
  default. On, a week that has a federal holiday moves the reminder
  to the day after the set day, not to the day before or after the
  holiday. That holiday move stays its own case. The translator writes
  the bit from the saved Options field. The engine applies it as one
  calendar block, the same place as a holiday move. Sunday through
  Saturday is the week, the same weekday counting as Weekly's saved
  day. Friday morning still sees Thursday's move.
- **The form of a lead time** — offset from the due moment, or a clock
  time a number of days before. A lead time is one form, not half of
  each. When Save writes time only if a time was set, and no time is
  set, offset chips sit muted and inactive. Clock chips stay. Save
  drops the offset chips so they cannot stick.
- **The unit of an offset lead** — minutes, hours, days.
- **A named time of day** — morning, midday, evening.
- **A Quarterly step** — none, days30, days60, days90. None means every
  three months. One chip at a time. A second tap clears it. The list
  tile still shows the date. This is a code on the translator's table.
  The saved item still holds the day-count the engine already steps.
- **The date line on New and Edit** — left off, it is Due Date.
  Birthdays write Birthdate. The form reads the table.
- **Which Options cases a kind may carry** — holidays, afterSetDay,
  timezone, secondThursday, and wednesdayAfter. Every kind's translator
  row carries its allowed list. The form and the saved-item translator
  read that row; the Options metadata does not keep another kind switch.

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
- Save keeps the reminders-before chips
- Save keeps a year of birth that Done does not move. That birthdate
  belongs with the name. The next fire date is derived from it.

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
writes at most one. The saved calendar date is not one of those bits. It
remains the cycle anchor whichever weekday bit is on.

## What already stands

Keep these. A build does not replace them.

- One saved list. A page is a filter. An item has one kind. Its physical
  read-and-change path is `modules/reminder-list-storage.ts`.
- One save door: `applyReminderChange`.
- The shared list page: `components/CadenceListPage.tsx`. A route only
  names its kind.
- One edit form: `app/item-edit.tsx`.
- One row: `components/ReminderItemRow.tsx`.
- One log page: `app/log.tsx`. A reminder page only names its kind.
- The date-and-time control, and the page chrome.
- The engine, and the translator's table of kinds.

Layout, colors, and wording come from the page chrome and the theme
that already stand (`components/PageFrame.tsx`, `constants/Themes.ts`).
A sitting reads those. They are not questions for Patrick.

## Saved-list boundary

`reminder_items` has one neutral storage module and one queued physical
transaction. A change waits its turn, reads the latest list, applies one
change, and writes that result before the next change starts. A read
waits for every transaction already in the queue, then returns the
finished list.

`applyReminderChange` completes the day and week rollovers first. It
then puts the person's change through that transaction. Publishing the
Daily names and running the scheduler happen after the transaction has
released the queue. The daily rollover and weekly reset also make their
saved-list changes through this same transaction, with their calculation
inside it against the latest list.

Backup Export reads the saved list through the queued reader, so an
export requested during a list change receives the finished result.
The backup shape and `reminder_last_date` stay unchanged.

When a time or a date does not have to be picked, tapping a field to
set one still leaves a way back to none. That way back is No time on
the date-and-time control. The 12-hour and 24-hour spinners are popups.
Cancel puts the spinner away and restores the time from when it opened.
Done keeps the time and puts it away. You stay on the form. Daily Set
time opens the 12-hour popup. Quiet popup on Save when the time was last
set with the 12-hour spinner; no popup when it was last set with the
24-hour box or the digit spinner.

## What Done does

Done is a code, `doneActionCode`. The three words are:

- **thisCycle** — this occurrence is done. The item comes round again.
  A second tap the same day asks whether to mark it not done. Cancel
  leaves the tick. Mark not done takes the tick off. The morning roll
  takes the tick off. Daily and Weekly.
- **advanceDate** — this cycle is done, and the saved date moves to the
  next occurrence. The tick stays until the morning of the next due
  date, then comes off in the same morning roll as Daily. A second tap
  while the tick is showing is un-check: this cycle was not done. The
  tick comes off, and the saved date is the cycle that had been due, not
  the next one. It is not Done for the newly armed cycle. Monthly,
  Quarterly, Yearly, and Birthdays. Yearly and Birthdays write year on
  the table. The date-advance reads that word. Birthdays keep the
  birthdate with the name. Done moves the derived next fire date, not
  the birthdate. Yearly and Birthdays look from the saved date, as a
  weekday monthly already does. The next fire is not this year's
  still-ahead time.
- **endItem** — the item is finished. It stays on its page. It no
  longer fires. Delete is how you get rid of it. Appointments and
  Bucket List. They are not the dated tick.

Weekly's cycle stamp is not a private check for the saved kind. The
shared answer is the existing field group: Done is thisCycle and the
repeat unit is week. The Done door uses that answer to write `doneAt`,
and the weekly rollover uses the same answer to choose and clear its
items. Daily does not gain a cycle stamp.

Skip is not Done. Skip drops this cycle and arms the next. A one-off
has no next cycle, so Skip does not apply.

## How far ahead to arm

Depth is one. How far ahead a waiting kind looks is a number on the
translator's table. Monthly is thirty days. Quarterly, Yearly, and
Birthdays are sixty days, so a Month-before reminder can be armed.
The join measures from the due date. Daily, Weekly, Appointments, and
the rest do not wait. Several lead times on one item also use that
depth: only the soonest still ahead is armed. When it has fired, the
next run arms the next. The form can still have any and all Reminders
before chips on at once. That is what is set, not how many sit on the
phone.

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
shows other kinds that fall today; those items are not this kind. Its
pushed-back source is dailysnooze.

**oneTime** — Daily's one-shot for today. No page of its own. Saved
kind `oneTime`. Daily shows it. Appointments does not. A banner tap
opens Daily. Save comes back on Daily. Done is thisCycle. It can be
pushed back. Banner set onetimeactions: Done, OK, Delay 15 / 30 / 60
min. It has no Skip because it has no next cycle. Its pushed-back
source is oneTimesnooze. The Reminders before chips are only 30 min.,
1 hour, 2 hours, and Time of. Save does not ask again when none of
them is on. Time is optional. After a time is set, there is a way back
to none. The set time still speaks. It is not an Appointment. 30 min.,
1 hour, 2 hours, and Time of sit muted until a time is set.

**weekly** — page Weekly. Repeats every week on its weekday. Time is
always written. Noon if missing. Done is thisCycle. It can be pushed
back. Banner set weeklyactions: Done, OK, Skip, Delay 15 / 30 / 60 min,
and Delay 1 Day. Speaks at the moment itself. Day after the set day is
an Options choice: in a week that has a federal holiday, the reminder
moves to the day after the set day. It does not have to be on. Its
pushed-back source is weeklysnooze.

**monthly** — page Monthly. Repeats every month. Date required. Done is
advanceDate. A 31st stays the 31st. A month with no such day uses the
last day that exists for that month only. It can be pushed back. Banner
set cadenceactions: Done, Delay 1 Day / 1 Week / 1 Month. A missing day
uses shifteddayactions: Then, Next Day. Speaks at the moment itself. A
second Thursday or Wednesday after the 6th looks from the saved date,
the same as a numbered day. Done moving the date takes it off Daily.
Its pushed-back source is monthlydelay.

**quarterly** — page Quarterly. Repeats every three months when the
step is none, or every 30, 60, or 90 days when that chip is set. Done
is advanceDate. It can be pushed back. Banner set cadenceactions. A
missing day uses shifteddayactions: Then, Next Day. On Add, the chips
are selectable. No chip stays every three months. A chip counts that
many days from the date entered when it is set. One chip at a time.
The list tile still shows the date. Its pushed-back source is
quarterlydelay.

**yearly** — page Yearly. Repeats every year. Date required. Done is
advanceDate. It can be pushed back. Banner set cadenceactions. A
missing day uses shifteddayactions: Then, Next Day. Its pushed-back
source is yearlydelay.

**appointments** — page Appointments. No repeat. Date required. The form
does not offer to take the date off. Things with no date belong on
Bucket List. Time is optional. After a time is set, there is a way back
to none. Done is endItem. It cannot be pushed back. Banner set
appointmentsok: OK only, which closes without opening the app. The form
can have any and all Reminders before chips on at once. Save does not
ask again when none of them is on. Morning of is not the set time. The
phone holds only the soonest of those times still ahead. 30 min., 1
hour, and 2 hours sit muted until a time is set. Morning of and the
day-before chips stay.

**birthdays** — page Birthdays. Own kind. A copy of Appointments on the
screen, and a yearly reminder on the one list. Date required. The date
line is Birthdate. Time is optional. After a time is set, there is a
way back to none. Done is advanceDate. It cannot be pushed back. Banner
set appointmentsok. Same Reminders before chips as Appointments. The
form can have any and all on at once. The phone holds only the soonest
still ahead. Save does not ask again when none of them is on. A missing
day uses shifteddayactions: Then, Next Day. An item on Birthdays is not
also on Appointments or Yearly. The birthdate belongs with the name, not
with the reminder setting. Done does not move it. The next fire date is
derived from that birthdate. The Birthdays row shows the name and the
birthdate. The reminder says the age they turn that day. Calendar
month cells say B-day and the first name. The day’s list, and a
Birthday on Daily, say Birthday, that name, and the age they turn that
day. The first name is the first word of Name. Age is the calendar year
minus the year of birth.

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
a filter, not a second saved kind. A Birthday on Daily says Birthday,
the first name, and the age, and does not add a from-line.

**oneTime.** Daily's filter includes kind `oneTime`. That is not a
visitor.

**Daily's own add.** + Add on Daily asks only: every-day, or One Time for
today. It does not ask which page the item belongs on. That question
is only on Options, from + Screen. Save on either choice comes back on
Daily.

**Same-day undo.** Done is thisCycle. A second tap asks whether to
mark it not done.

The log is one piece. Daily, the shared list, and the banner all write
it. They do not each write their own. The list does not show it. Log in
the header opens that page’s log only. Daily’s list writes a visitor on
Daily’s log, and also on that other page’s log. A banner Done writes
the item’s own log. One Time uses Daily’s key. Cap 50.

## Log

Log is not a Home page and not a kind of its own. The visible name is
Log. Each reminder page carries Log in the header, beside + Add. That
opens `app/log.tsx` for that page’s log only. There is not one log for
everything. Back returns to the list. Clear All is in the header when
there are entries. Swipe deletes one entry. A tap opens a note on that
entry.

## New and Edit

The one form is `app/item-edit.tsx`. Cancel and Save stay at the top
while the form scrolls. Name, then the
date-and-time control for that kind, then Note. The date line comes
from the table. Birthdays say Birthdate. Options in the header
opens the sheet. Applied options show on the form. Daily’s every-day
New and Edit have plenty of room between Name, the time, and Note.

## Banner housing

One plain typed catalog is the only definition of the allowed action
codes, visible button titles, whether the action leaves Memory closed,
the effect, and the named push-back calculation. The housing and the
list popup do not keep copies. Expo registers every catalog row
sequentially; concurrent category writes can lose a row on a cold
first launch.

The six registered sets, and no others, are:

- **routineactions** — Done, OK, Skip, Delay 15 / 30 / 60 min.
- **onetimeactions** — Done, OK, Delay 15 / 30 / 60 min. No Skip.
- **weeklyactions** — Done, OK, Skip, Delay 15 / 30 / 60 min, and
  Delay 1 Day.
- **cadenceactions** — Done, Delay 1 Day / 1 Week / 1 Month.
- **appointmentsok** — OK, which closes without opening the app.
- **shifteddayactions** — Then, Next Day. For a missing day of the
  month. Then keeps the last day that exists. Next Day is a one-day
  push-back for this occurrence only. Dated rows name this set for
  that occurrence. It is not an Options choice.

A response is looked up in the category carried by that notification.
Before an effect changes anything, the housing loads the item by id
and confirms that its current row can carry that category. An old or
impossible action changes nothing. Done, Skip, push-back, and the log
go through the same change door the pages use. OK acknowledges. Then
keeps the shifted last day. Next Day moves that occurrence to tomorrow
at the item's saved clock time. The list popup takes its push-back
choices and words from this same catalog.

A banner naming a set the phone does not know shows no buttons at all.
That has bitten this app before. New sets are added to the named list
and registered; they are not invented at the housing.

## Opening sequence

The root housing owns one opening sequence for launch and every return
to the foreground. It waits until the saved appearance, root
navigation, and launch preparation are ready. It then awaits the
scheduler, which completes the day and week rollover before bringing
the phone reminders up to date.

One scheduler run has one shared promise. A caller arriving during the
run requests one final rerun and waits for the active run and that
rerun. After scheduling, the opening awaits the health and
missed-reminder notice. Notice callers share one presentation. No
notice resolves at once; a real notice resolves only after OK and its
acknowledgement writes have been attempted.

A banner body destination is released only after that sequence. With
nothing to say, its item opens without another stop. With a notice,
the correct page and highlighted item wait behind OK. The persisted
notification-id and action pair prevents an old response from replaying
after a cold launch. Banner action buttons still perform their catalog
effect. A save runs scheduling but does not present the opening notice.

## Home

The Home grid in `app/home.tsx` is the badges for the pages a person
opens from Home. Options is not on that grid. There is no Options page.
The gear in the header stays where it is. It is not a badge.

The ten sit in five rows of two when the phone is upright. When the
phone turns, that same group turns with it, so you see two rows of
five. Each badge stays where it is on the phone, next to the same
neighbors. They do not shuffle into a new arrangement. The pictures
take a comfortable size in the space they have. That size is not how
the places are kept. The turn is the same fill-and-rotate as the
landscape header (`components/PageFrame.tsx`). Built at #112-new.

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

The first time Home opens, a popup shows the User's Guide. Got it puts
it away and it stays away. Deleting the app and installing it again
brings it back. The words are
the four paragraphs from the Settings page, then a fifth: You should
start with the User's Guide. Tap the gear at the top of Home to open
Settings, then tap User's Guide at the bottom of that page.

Appointments is the check-mark. Birthdays is a cake. Bucket List is a
smiling face. They do not share a picture. Yearly keeps the telescope.
Quarterly is a maple leaf. Monthly is a first-quarter moon. Those
three do not share a picture. Weekly is a calendar. Calendar is a
month grid. Daily is a sun. Helper is the thinking face.

On launch and on every return to the front, a popup speaks if a
reminder did not reach you. It does not speak after a Save. OK takes it
away. That tap silences those faults until the next day, and clears the
misses it told.

## Helper

Helper is from Home and from Calendar. The visible name is Helper.
The Home badge is the thinking face. The route is `app/where.tsx`. It is a
transparent screen so New can sit above it.

Helper does not save an item. It asks which kind, then opens
`app/item-edit.tsx` with that kind and `viaHelper`. Cancel on the form
comes back to Helper. Save on the form pops Helper as well, and opens the
page where the item lives.

The first question is: Does this item repeat? The choices are Yes and
No. Cancel closes.

Yes asks: How often does this come round? The choices are Every day,
Weekly, Monthly, Quarterly, Yearly, and For a birthday reminder.
Birthday opens Birthdays’ New, not Yearly. Cancel goes back one step.

No asks: Is this for today? Yes opens Daily’s one-shot, `oneTime`.
No says: If it has a date and time, like a doctor's visit, that is
Appointment. If it is something you want to do someday, with no date,
that is Bucket List. The choices are Appointment and Bucket List.
Cancel goes back one step. Those words are in `docs/user-guide.md`
and in `app/where.tsx` (#104-new).

## Calendar

Calendar is a month view of the one list, not a kind of its own. The
page is `app/calendar.tsx`. Home opens it as `/calendar`.

Daily every-day items and Bucket List stay off the month. One Time for
today sits on the day. Other items sit on the days the engine already
shades. The names in a day cell are not taps. The whole day is. A tap
opens that day's list, time then name. The time is the same 12-hour
clock as the other pages. A Birthday on the month says B-day and the
first name. On the day’s list it says Birthday, that name, and the
age. A tap on a row opens the
one edit form, `app/item-edit.tsx`. After you make the
edit, the save walk back brings you back to the item list. Hitting the
Back button brings you back to the calendar.

There is no + Add. New items from Calendar go through Helper, which sits
in the month header, the same Helper as from Home. Helper only chooses
the kind. The save-the-item popup, New, sits above it.

Arrows change the month. They sit next to the month name in the
middle, not against Home and Helper. Home is in the header. The month
fills the screen.

## Settings

Settings is not a kind of its own. The page is `app/settings.tsx`. Home
opens it from the gear in the header. The gear is not a badge. Helper is
not on this page. Home is in the header.

It holds the person's name, Light or Dark, and popup colors — Match App
or Follow iPhone. Letters and Page sit under Appearance. Middle is the
look the app ships with. Plus is more — darker letters, a darker page.
Minus is less — lighter. Both Light and Dark use them. They stay on the
phone. Built at #111-new.

It holds the three named times of day: morning,
midday, and evening. Those times are the clock for Morning of, Day
Before, and Night Before. A tap opens the time with the same
date-and-time control as the rest of the app.

Scheduled Reminders and Backup & Restore are doors off this page. They
are not this page. User's Guide is a tile on this page. A tap opens the
longer Guide that lives in the app (#104-new). The first-load popup on
Home has the four short paragraphs and then a fifth that suggests
opening this page. It does not go to a website.
Feedback is its own tile on this page. It opens the same popup Mystery
Clues Tracker uses. Send opens the phone's Mail. The person reaches
out; the app does not send the mail.

There is no Reset All Data (Patrick, #106-new). To start with a clean
copy, delete the app from the phone, then install it again. Export a
Backup first if you want to keep what is entered.

## Backup

Backup is not a kind of its own. The visible name is Backup & Restore.
The page is `app/backup.tsx`. Settings opens it. Back is in the header.
Helper is not on this page.

There are three acts: Export Backup, Replace from Backup, and Merge
from Backup. You choose Replace or Merge first, then pick a file, then
confirm. Export saves a file you can keep.

Replace puts the backup's reminders in place of what is here, and takes
off the missed-reminder notes. Merge keeps what is here and adds from
the backup only what is not already here. A backup reminder is already
here when it has the same identity the app wrote into the backup file.
The person's name is saved and restored. Replace writes the name from
the file when the file has one. Merge keeps the name already on the
phone, and takes the backup's only when the phone has none. The rest of
Settings and page logs stay on the phone. The backup does not carry
those. Before confirmation, Replace and Merge validate the whole saved
list against the current kind table and strip live Options fields that
the kind's row does not allow. When that row keeps a birthdate, they
write the year of birth and derive the next fire date from it, so an
older backup still keeps the birthdate. One unknown kind rejects the whole file
and changes nothing. After Replace or Merge, OK lands on Home.

## Scheduled Reminders

Scheduled Reminders is not a kind of its own. The page is
`app/reminders.tsx`. Settings opens it. Back is in the header. Helper is
not on this page.

It shows what the phone is holding, not the saved list. The count sits
under the header, with how much room the phone has on the line beneath.
Rows are grouped Today, Tomorrow, This Week, Later, and Time not known.
A heading with nothing under it is left out. A tap opens a details
popup: where it comes from, when it fires, last due, next due, the
banner words, and its buttons. The time is the same 12-hour clock as
the other pages. Close puts the popup away. A line at the foot names
how many the phone is holding that this list does not show.

## Options

Options is not a Home page and not a kind of its own. The visible name
is Options. `app/item-edit.tsx` carries Options. That opens
`ScreenOptionsSheet` for the cases that belong to that item's kind.
That is the only place Options is reached from. The kind's translator
row owns the allowed case codes; the Options metadata owns the words
and controls for those codes.

Done keeps the cases. Back leaves a case, or closes the sheet. Notes
live on New and Edit, not here. Calendar shading is not a case. The
saved field stays as inert history. `floatDay` remains disconnected.
Save strips every live Options field that the kind's row does not
allow.

The cases are Holidays, Time zone, Day after the set day, a second
Thursday, and a Wednesday after the 6th. Holidays is Day before or
Day after. That is the holiday's day, not the day after the set day.
Day after the set day is Weekly only: a week that has a federal
holiday moves the reminder to the day after the set day. It does not
have to be on. Time zone is Float with phone or Keep this zone. When
Keep this zone is on, the form line says Keep this zone and the zone
name. Then and Next Day are the missing-day banner, not an Options
case.

Daily and One Time get Time zone only. Weekly gets Holidays, Time
zone, and Day after the set day. Appointments and Birthdays get
Holidays and Time zone. Monthly, Quarterly, and Yearly get Holidays,
Time zone, a second Thursday, and a Wednesday after the 6th. Bucket
List gets none.

On Monthly, Quarterly, and Yearly, a second Thursday and a Wednesday
after the 6th are exclusive. Setting one turns the other off. With
neither on, the item uses its numbered date. In all three cases, the
saved date remains the cycle anchor: Save writes it and Done advances
from it.
