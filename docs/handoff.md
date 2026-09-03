# Session hand-off — A Place To Remember (Memory, iPhone)

This file carries the continuity and nothing else: where the work stands
and what is open in front of it. Finished work goes to
`build-history.md`, opened only when something needs tracing.

**A decision is written in here the moment it is made, in that turn — not
saved up for the end of a session.** That rule and the conditions around
it are `CLAUDE.md` rule 4, and `docs/check-docs.py` reports the three that
can be machine-checked.

**This file was pruned at #31-new**, from 906 lines. Everything finished
was checked against `build-history.md` and written there where it was
missing — #24-new, #25-new, the 2026-08-28 Cursor engine build, #29-new
and #30-new all had no entry at all.

## Where things stand

**#58-new built the Where? helper** from
`docs-ref/build-sheets/build-sheet-where-helper.md`. One transparent
route (`app/where.tsx`), six files edited. `formContext: oneTimeForToday`
is separate from `returnTo` in `item-edit`. Mac suite 489 of 489. Not
on the phone yet. Not committed yet — Patrick will commit when he
comes in.

**#57-new is committed** (Patrick, #58-new). The helper design and
build sheet only; no code in that session.

**#56-new is committed** (Patrick, #57-new; Patrick said very good).
One Time is **Appointments** and Extended is **Bucket List** on every live
screen — headers, Home badges, + Add, Daily's from-line — all from
`constants/page-names.ts` via `pageLabelFor`. Scheduled Reminders
already read it (#54-new). **A failed daily clear-out now speaks** in
the opening pop-up (`faultSpeaks` includes `reset`; #18-new's call to
leave it reversed this sitting). Saved kinds, routes, and words on the
phone stay as they are. Mac suite 489 of 489. Not on the phone yet.
Story in `build-history.md`.

**#55-new is committed** (Patrick, #56-new). Pending 4: the day-roll
now writes misses for Weekly, Monthly, Quarterly, Yearly, and One
Time as well as Daily. Monthly, Quarterly, and Yearly Done leave a
tick; the saved date is not advanced. Extended has no day. Not on
the phone yet.

**#53-new is committed** (Patrick, #54-new). Scheduled Reminders rows name Daily, Weekly, Monthly,
Quarterly, Yearly, and One Time. Monthly, Quarterly, and Yearly
take the name from the banner heading, because they share one
source. A leftover banner without one of those headings still
says Look Ahead until it cycles off. Siri still says My Day
Item. Unused old files still use the old names and are not on
screen. **Daily and Weekly through Extended share one list row**
(`components/ReminderItemRow.tsx`). Daily still composes its
name; the cadence pages still pass the when-line. Mac suite
466 of 466. Sit tests finished at #55-new.

**#52-new through #45-new are committed.** Landscape lock, Sit load,
calendar, engine cutover — stories in `build-history.md`.

**He is living with this build on the phone.** Old reader files stay
until each replacement is proved and are not called. **A banner while
Memory is on screen** asks to show, the same way Timer already
does, at app start (#51-new, missing until then).

**Daily through Options are built.** Pages, banners and Siri write
`reminder_items` through one save. Dual-write is gone. **The morning
after is done** (#45-new): loading the list rolls the day and the week
first, and Daily plus the other cadence pages read again when the app
comes to the front. **Skip is off Options**. **Note is a field on New
and Edit.** **The Float row is out.** Last existing day is always the
engine’s rule; do not connect `floatDay`. An incomplete zone currently
floats with the phone; leave that unless Patrick says otherwise
(#41-new).

**The engine reads** a named time zone, holidays, a second Thursday
and a Wednesday after the 6th, Then or Next Day on a shifted banner,
and calendar shading from that same calculation. Weekly’s Options set
is holidays, time zone, and calendar shading. Daily’s every-day item
and One Time for today get only time zone. Monthly, Quarterly, Yearly,
and One Time add the extra tap, a second Thursday, and a Wednesday
after the 6th. A weekday after a numbered day is the first occurrence
after that day only. A half-entered second Thursday is not a valid
recipe; both weekday patterns together are not a combination. Then or
Next Day is an action on a shifted banner, not a recipe. A missing day
and a holiday move cannot both apply. Monthly, Quarterly, and Yearly
Done do not advance the saved date. Extended has no banners; New and
Edit have only the name, an optional note, and Done. Cancel closes and
makes no change, including after + OPT.

**Mac suite 489 of 489.** One TypeScript error stands and is not a
fault: Expo's generated router list predates Scheduled Reminders and
rewrites itself on the next build.

### The pages, settled by Patrick at #30-new

- **Daily** — My Day and Pets as items on one list. Daily is also a view
  of the day: anything from Weekly, Monthly, Quarterly, Yearly or One Time
  that falls on today shows there with the every-day items. A dateless
  item has no day, so it does not.
- **Weekly** — My Week.
- **Monthly**, **Quarterly**, **Yearly** — Look Ahead's repeats, split by
  how often. Look Ahead is not a once-only list. **A six-month item
  lives on Quarterly** (Patrick, #33-new), still every six months.
- **Appointments** (saved kind `oneTime`) — a date, no repeat, carrying To-Do's Reminders before
  chips. Any and all of those chips can be on at once. **There is no
  reminder at the set time** (Patrick, #52-new): that is too late;
  you are either there or you missed it. Renamed from One Time at
  #56-new; saved words on the phone stay as they are.
- **Bucket List** (saved kind `extended`) — items to be done sometime in the future,
  with no deadline, no due date, and no set time. It gets no banners.
  New and Edit have only the name, an optional note, and Done. It can
  be edited like the others. **That shape is in** (#42-new).
- **Options** — a list in the style of the iPhone’s notification-apps
  list, for the odd cases and what to do about them (Patrick, #32-new).
  Missing days follow the engine record: the last day that exists, with
  an extra tap for then or next day, not skip. Also every nth day in a
  period, and move the day to before or after a holiday. That calendar
  thinking is from RFC 5545 and JSCalendar RFC 8984, without the file
  format, settled in `Reminder Engine/docs/reminder-engine.md`.
  **When you open it you see** holidays, time zone, an extra tap on a
  shifted day, calendar shading, a second Thursday, and a Wednesday
  after the 6th. **Float around short month is not a row** (Patrick,
  #42-new): last existing day is always the engine’s rule. **Skip is not a
  row** (Patrick, #37-new): it belongs on the banner and the page.
  **Note is not a row** (Patrick, #37-new): it is a field on New and Edit.
  **Float is only a missing date** (Patrick, #37-new), not a holiday —
  Holidays is the before-or-after. Reminders-before is
  not a row; it already lives on One Time. Each row opens that case.

**On a view page, each item has Done and Snooze, and a tap on the tile opens the edit page.** Daily is the same: Snooze, Done, and Done that undoes (Patrick, #33-new, looking at Daily). Swipe still deletes. A tap on the name opens the edit page. Hold the name and slide to reorder (Patrick, #33-new). **Daily now carries My Day's log** — the same `my_history` list, written when Done is tapped, titled Log (Patrick, #36-new: none of the pages say My). **The My Day page is gone** (Patrick, #33-new). The `/myday` hop is not kept (Patrick, #35-new). The engine still names those reminders `myday`, so banners still open Daily.

**An item lives on one page; Daily may also show another page's item (Patrick, #32-new).**

**To-Do stops being a page.** Its tasks split by how they actually repeat:
a dated task that does not repeat goes to One Time, a dateless one to
Extended.

**Daily's own add is narrower than the others'.** It is only about this
day, and offers two kinds — an every-day item, or a One Time for today
with Reminders before. **On One Time for today those chips are only**
30 min., 1 hour, 2 hours, and Time of — Time of is the item's own time
(Patrick, #33-new). **+ OPT on those two Daily adds is only time zone**
(#42-new). Pets is just another every-day item on it. The
other cadence pages keep their own adds, because on those the page is the
whole meaning of Repeat.

Save on an every-day item returns to Daily. **Save on One Time for
today returns to One Time** (#34-new). Cancel and the header Home still
go to Daily, where the add started. A My Day banner
or a Siri mark-done now opens Daily, not the old My Day page, so a
save is not followed by that page covering what you just landed on
(Patrick, #33-new).

**+ Add opens a short popup that only asks where the new item belongs**
(Patrick's own). The fields stay on that kind's own small add, and when
you are finished you return to the page you started from. If you are
already on Monthly, the popup opens with Monthly already chosen, so the
extra step is a confirm rather than a quiz.

**It opens from the "+ Add" button the pages already have** (Patrick,
#31-new). No new control is added anywhere to reach it. It works the
same way from Weekly, Monthly, Quarterly, Yearly, One Time and
Extended. Daily keeps its own narrower add. **Options has no + Add**
(Patrick, #33-new: "from any page" was too wide — Options is the
odd-cases list, not a page that holds items).

**The Reminders-before chips already exist** on To-Do's Add box, in the
chip look the app already uses: 30 min., 1 hour, 2 hours, Morning of, Day
Before, Night Before, 2 Days Before, Week, and Month. Those are the two
lead forms the shape already knows — counted back from the time, or a
named time of day a number of days earlier.

**The Input page goes away and nothing replaces it** (Patrick, #31-new,
correcting how it had been written down). In particular **the + Add popup
is not its replacement.** This work is the app's own reminder pages being
reshaped by how often a thing repeats — My Day, Pets, My Week, Look Ahead
and To-Do becoming Daily, Weekly, Monthly, Quarterly, Yearly, One Time and
Extended. Input was a separate try at a different idea. Writing the work
as "the pages instead of Input" makes it sound smaller than it is and
points at the wrong thing.

**Why the one Input page was dropped**, and the reason is the durable
part: one form has to ask every kind of question and then guess which list
you meant, so it grows to hold the whole app, while each page only ever
needs its own small part. Patrick's own picture was of the user facing the
huge input page. The page built at #29-new came out at #35-new.

**The engine is finished and the one list goes through it.** Depth is
one for every kind. The old readers are still in the project and the
live run does not call them. **Memory Test is temporary and coming
out** (Patrick, #51-new). **Timer is isolated deliberately** (Patrick,
#51-new). Neither is a reason to keep the old reminder readers.

    node --experimental-strip-types scheduler/tests/run-all.ts

## Standing rulings

These are Patrick's and they govern the work rather than describing it.
They are kept here because they still decide things.

- **Reminders being rock solid is the top goal — but not the only one,
  and consistency is another high priority** (#16-new, corrected at
  #17-new). That correction reversed a recommendation made minutes
  earlier: a change dismissed as tidiness becomes worth making once
  consistency is a goal in its own right.
- **"Rock solid is for when you use it"** (#22-new). The standard covers
  the app in use, not a stretch when it is not.
- **When something has to give, the old reminder is thrown away and the
  new one kept.**
- **The reminders should follow established practice** rather than a
  private arrangement that happens to work.
- **A rule that has to be remembered at every place that might need it is
  the wrong shape.** Build it into the machinery instead, so nothing has
  to remember. This is why the returning arrows land on a decision block,
  and why recovery on opening is not a step bolted to the front of a run.
- **Landscape is an optional view** (Patrick, #50-new). It does not
  force rotating the phone. **Only 0 and 90° counter-clockwise**
  (`LandscapeRight`: island on the left). 180, 270, and the other
  90 are out because the island and the home indicator stay put
  and cover the view. The same limits on the calendar. **The
  header stays at the top of the normal portrait view** — on the
  **left** in landscape, which is the island for this turn
  (Patrick, #52-new) — **as the portrait header itself**: original
  place and shape, the round buttons, the title in the middle, not
  restacked down the side. Titles stay the same way up as in
  portrait because the whole header is rotated as a unit. One-
  character vertical titles are out. **The Bridge lines stay with
  the headers.** Pages that open from other places turn with the
  page, in the same window. The calendar month grid was not rebuilt.
  **The header buttons rotate in-place on the header**
  (Patrick, #50-new). The words on the buttons sit the right way
  up for landscape, still in the same spots. The title stays as
  it is. Built at #51-new.

## What is open in front of it

**Nothing from #56-new or #58-new is on the phone yet.**

**Pending 7:** calendar day list should show 24-hour fire time. Sit
tests are finished. **Not safe to compress** (#56-new): no build sheet,
and "fire time" may need a one-line decision (saved time vs engine)
before building. Its own short session.

**Pending 9:** all screens in any rotation. Today the lock is 90°
counter-clockwise, headers on the left.

**The paperwork half** (Patrick, #52-new): a thorough design spec
(Pending 11; the rename belongs there), a User Guide from that or
after it, on his website, and a way in the app to find it (Pending
12), a Feedback button similar to Mystery (Pending 13), a file for
what testing has covered and will cover (Pending 14; during-build
tests are thrown away).

**Pending 5:** date picker inactive for Wednesday after the 6th, noted only.

**Memory Test is temporary and coming out. Timer is isolated
deliberately.** Neither is a reason to keep the old reminder
readers (Patrick, #51-new).

**The build sheets are the pattern for this work** — each self-contained,
carrying the answers themselves rather than pointing at other documents,
which is what lets a worker session build without asking a design
question. **A sheet's read list should name what the pattern it points at
actually imports** (#25-new).

**The 24-hour digit spinner is built** (#36-new). Tapping the 24-hour
type-in box opens four arrows, one for each digit, in the same style as
the 12-hour hour and minute. **The AM/PM removal is mitigated by that
spinner** (Patrick, #36-new) and is not a separate job. The 12-hour row
with AM/PM stays.

**The app goes to the 24-hour clock, after the building** (Patrick,
#30-new). He keeps leaving the time on the wrong AM or PM. The read was
done at #30-new and does not need doing again:

- **The setter is one file**, `components/DateTimeControl.tsx`. The hour
  stepper shows 1 to 12 and would show 00 to 23, and the third stepper —
  AM/PM — comes off with `toggleAmPm` and the `ampmDisplay` style.
- **The arithmetic needs nothing.** #27-new already moved the hour
  stepping onto the 24-hour clock, and the type-in box below has always
  been 24-hour, hint and all. So the box and the spinners disagree today,
  which may be part of what trips him.
- **The display copies on the old pages went out with them** (#35-new).
  What remains is `settings.tsx`, plus `formatClock` in
  `scheduler/queueview.ts`, which writes the Scheduled Reminders screen's
  sentences.
- **Eleven assertions** in `scheduler/tests/queueview.test.ts` hold
  strings like `8:05 AM` and `Every day at 8:00 AM`.
- **The logs are already 24-hour everywhere.** It is the tiles that are
  not.

**My Week's old reader still ignores the tick.** That file is not
called. The live weekly road reads the tick. The old test named *A chore
already ticked still gets its weekly reminder* goes when the reader
files come out.

**Miss-telling extended to all cadences** (#55-new). Committed. Not on the phone yet.

**A named zone, holidays, a second Thursday and a Wednesday after the
6th are read from the saved item.** Then or Next Day is an action on a
shifted banner, not a field on the item. **`floatDay` is not connected**
(Patrick, #41-new).

**`docs-ref/build-sheets/build-sheet.md` has not been brought level with the reorder**
(#24-new). It is the standing description of what the three shape files
hold, and it describes `stillwanted.ts` asking no due time first. The code
no longer does.

**One claim still unchecked**: that a repeating alarm cannot be told to
skip a single instance. The whole case for arming ahead rests on it, and
it is general knowledge of the phone rather than something read in the
installed notification package.

**A thing to add later if wanted, and never underneath**: a background
task, so the phone can top the queue up on days the app is not opened.
None of its pieces are installed. It can only ever sit on top of arming
ahead, because the days it fails are the days the arming is for.

**Still unread**: `app/memorytest.tsx`; and the test files other than My
Day's, Pets' and My Week's. The old Look Ahead and To-Do screens went
out unread at #35-new.

**Timer is not working right** (Patrick, #5-new), said in passing and not
examined. It is deliberately outside the module, and the whole Timer
effort is parked as a different piece of work (Patrick, #42-new). Two things noticed since
and not chased: its alerts carry only a timer id, no name and no record of
when they fire; and the loud alarm meant to follow five minutes after the
base alert is created only when two conditions are both true, one of them
a `profile` value that has never been looked at. Patrick raised the loud
alarm himself at #12-new as something that was meant to work and does not.

**Showing the run record on the Scheduled Reminders screen** was held back
from #15-new and has still not been built.

**Check My Reminders, from Still To Do** (raised by Patrick, #15-new). Its
six checks and its shape are already settled in that project at SA-19 and
SA-20 — whether it was ever actually built there has not been checked. It
answers a different half than the failure record does: it asks why the
phone stayed quiet, where the record asks whether the app armed anything
at all. Agreed to come after the reminders themselves are solid.

**One separate fix-list item** remains in `docs/reminder-rebuild.md`:
saying the banner instruction once in the housing instead of on eight
pages. The dropped-run item landed with the hardening points at
#40-new.

## Facts worth carrying

**The hour fix leaves a tail.** Any time set by spinning through noon or
midnight before #27-new is stored in the wrong half of the day and needs
re-setting.

**Memory Test allows one session a day.** The screen shows the day's score
and "Come back tomorrow" once an entry with today's date is logged, so a
second test cannot be started. Deleting the day's entry brings the Start
button back, at the cost of that day's real score.

**A background task and a daily tick are opposites and must never be
merged.** An Extended item says a thing is *not yet done* and must
survive the rollover, so those items must never be handed to
`runDailyReset`. The coffee-and-water kind says a thing *was done*, is
meaningless the morning after, and is cleared by the rollover on purpose.
The full reasoning is in `docs/reminder-shape.md`.

**`elyfont-home/index.html` in THIS project is the SOURCE of the live
elyfont.com home page.** If it is ever edited, the live copy must be
re-uploaded to the public `WWhiteWolf/mystery-tracker` repo — upload
replaces; never rename anything to or from `index.html` there (see
`MysteryTracker/docs/DEPLOY.md`).

**The drawing of the shape is not in this folder.** It lives at
`Projects/Reminder Engine/docs-ref/reminder-shape.drawio`.

**Working documents live in `docs`.** History lives in `docs-ref`,
including the twelve build sheets. `docs/index.md` says which file is
the home. He calls them working documents; live desk means the same
thing. This was written in an App-Docs session, 2026-08-31. This
session is #58-new.
