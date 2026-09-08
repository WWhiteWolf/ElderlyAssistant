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
what a build replaces. That is not the destination.

The engine stays. "Not in the engine yet" means a named code is not yet
on the translator's table at the boundary. It does not mean the
scheduler is unfinished or needs changing.

What is written now is the reminder-pages piece: the three ways a
difference is written, what already stands, what Done does, each kind,
Daily on the shared list, and the banner housing. Daily is built. That
is enough to build the banner, without asking Patrick those questions.

What is not written: Home, Help, Calendar, Settings, Backup, Scheduled
Reminders, Options beyond the exclusive-pattern refusal, movable Home
badges, Option off Home, and a Settings password. Pending 1 is still
the thorough spec for the whole app. This file is the start of that,
not the finish.

Home badges, Option off Home, and a Settings password are a separate
issue from putting the reminder pages on this machinery.

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
- **The log key** is `daily_history`.
- **+ Add** opens Daily's own short choice: Every day, or One Time for
  today. Then it opens `item-edit` with that kind and `returnTo` daily.
  It does not send every add to kind `daily` the way Weekly does.
- **Edit** uses the item's own kind, and comes back to Daily. A visitor
  is not saved as Daily.
- **The row label** is the time, the name, and the from-line. The other
  pages keep the when-line as the subtitle.
- **Done follows the item**, not the page. A visitor on Daily uses that
  item's Done action.

Keep `ReminderItemRow` and `applyReminderChange`. Do not touch
`stillwanted.ts`, `armdepth.ts`, or the scheduler core. If Done's three
words are written down for the pages to read, they go on the
translator's table in `scheduler/translators/translate.ts`, not inside
the scheduler's decisions.

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
  not in the engine yet. The two-way bit `doneEndsItemBit` is not
  enough, because there are three actions. The code replaces that bit.
- **A holiday move** — before, or after. Left off when unused.
- **The form of a lead time** — offset from the due moment, or a clock
  time a number of days before. A lead time is one form, not half of
  each.
- **The unit of an offset lead** — minutes, hours, days.
- **A named time of day** — morning, midday, evening.
- **A Quarterly step** — none, days30, days60, days90. None means every
  three months. One chip at a time. A second tap clears it. The list
  tile still shows the date. This is a code, not a remembered chip
  rule. It is not in the engine yet as a named set; today it is a
  number on the saved item.

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
them can be true at once. Turning one on turns the others off.

This is for a difference that looks like bits but must not combine. A
code word is the right shape when the thing is a choice of names.

**A second Thursday and a Wednesday after the 6th cannot both apply.**
That is one exclusive group. The translator already refuses both; the
design is that refusal, not a remembered rule.

## What already stands

Keep these. A build does not replace them.

- One saved list. A page is a filter. An item has one kind.
- One save door: `applyReminderChange`.
- The shared list page: `components/CadenceListPage.tsx`. A route only
  names its kind.
- One edit form: `app/item-edit.tsx`.
- One row: `components/ReminderItemRow.tsx`.
- The date-and-time control, and the page chrome.
- The engine, and the translator's table of kinds.

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
private copy of Done, Skip, or Snooze.

**daily** — page Daily. Repeats every day. Done is thisCycle. It can be
pushed back. Banner set routineactions: Done, OK, Skip, Delay 15 / 30
/ 60 min. Speaks at the moment itself. Daily also shows other kinds
that fall today; those items are not this kind.

**oneTime** — Daily's one-shot for today. No page of its own. Saved
kind `oneTime`. Daily shows it. Appointments does not. A banner tap
opens Daily. Save comes back on Daily. Done is thisCycle. It can be
pushed back. Banner set routineactions, same words as Daily. The
Reminders before chips are only 30 min., 1 hour, 2 hours, and Time of.
It is not an Appointment.

**weekly** — page Weekly. Repeats every week on its weekday. Done is
thisCycle. It can be pushed back. Banner set routineactions. Speaks at
the moment itself.

**monthly** — page Monthly. Repeats every month. Date required. Done is
advanceDate. It can be pushed back. Banner set cadenceactions: Done,
Delay 1 Day / 1 Week / 1 Month. Speaks at the moment itself.

**quarterly** — page Quarterly. Repeats every three months when the
step is none, or every 30, 60, or 90 days when that chip is set. Done
is advanceDate. It can be pushed back. Banner set cadenceactions. On
Add, the chips are selectable. No chip stays every three months. A
chip counts that many days from the date entered when it is set. One
chip at a time. The list tile still shows the date.

**yearly** — page Yearly. Repeats every year. Date required. Done is
advanceDate. It can be pushed back. Banner set cadenceactions.

**appointments** — page Appointments. No repeat. Date required. Done is
endItem. It cannot be pushed back. Banner set appointmentsok: OK only,
which closes without opening the app. Speaks at the set time, and at
any Reminders before chips. Any and all of those chips can be on at
once. Morning of is not the set time.

**birthdays** — page Birthdays. Own kind. A copy of Appointments on the
screen, and a yearly reminder on the one list. Date required. Done is
advanceDate. It cannot be pushed back. Banner set appointmentsok. Same
Reminders before chips as Appointments, any and all on at once. An
item on Birthdays is not also on Appointments or Yearly.

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

The log is one piece. Daily, the shared list, and the banner all call
it. They do not each write their own.

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
  push-back for this occurrence only.

A banner naming a set the phone does not know shows no buttons at all.
That has bitten this app before. New sets are added to the named list
and registered; they are not invented at the housing.
