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

**The live work is the reminder pages.** A session that opens this file
starts here. It does not start from the engine. Think for him. Do not ask
him what the session is for, and do not make him re-teach the pages.

**Daily through Options are built.** The one list `reminder_items` is
live, with dual-write so the engine still arms. **#34-new is
committed** (Patrick, #35-new): it built the six new screens. Home no
longer has Input, To-Do, Look Ahead, My Week, Project Planner, Orders,
or Watch List. Patrick arranges the Home badges himself. **The old
screens are out** (#35-new), including the `/myday` hop. No leftover hops
and no old-page banners. The taps that already open Daily, Weekly, One
Time, and Monthly stay, because those are the live reminders. The engine
still reads the old lists through dual-write, so those readers stay
until that is swapped. **Backup copies `reminder_items`**, not the old
lists: he deleted the old backup files, so restore does not need to
read them (Patrick, #35-new). After a restore, the engine lists are
written from that one list so reminders still arm. **Next is logs on
the new pages.** Daily already has My Day's log. Weekly uses My Week's.
Monthly, Quarterly, and Yearly share Look Ahead's log, the same as it
would have shown on Look Ahead. One Time and Extended share that log's
style, not the list: each has only its own (Patrick, #35-new). Testing
and the odds and ends wait.

### The pages, settled by Patrick at #30-new

- **Daily** — My Day and Pets as items on one list. Daily is also a view
  of the day: anything from Weekly, Monthly, Quarterly, Yearly or One Time
  that falls on today shows there with the every-day items. A dateless
  item has no day, so it does not.
- **Weekly** — My Week.
- **Monthly**, **Quarterly**, **Yearly** — Look Ahead's repeats, split by
  how often. Look Ahead is not a once-only list. **A six-month item
  lives on Quarterly** (Patrick, #33-new), still every six months.
- **One Time** — a date, no repeat, carrying To-Do's Reminders before
  chips. Any and all of those chips can be on at once.
- **Extended** — no date.
- **Options** — a list in the style of the iPhone’s notification-apps
  list, for the odd cases and what to do about them (Patrick, #32-new).
  Missing days follow the engine record: the last day that exists, with
  an extra tap for then or next day, not skip. Also every nth day in a
  period, and move the day to before or after a holiday. That calendar
  thinking is from RFC 5545 and JSCalendar RFC 8984, without the file
  format, settled in `Reminder Engine/docs/reminder-engine.md`.
  **When you open it you see** holidays, time zone, the float button,
  Skip, an extra tap on a shifted day, calendar shading, a notes row,
  a second Thursday, and a Wednesday after the 6th (Patrick, #33-new,
  from the rest of the Input sheet at #30-new). Reminders-before is
  not a row; it already lives on One Time. Each row opens that case.

**On a view page, each item has Done and Snooze, and a tap on the tile opens the edit page.** Daily is the same: Snooze, Done, and Done that undoes (Patrick, #33-new, looking at Daily). Swipe still deletes. A tap on the name opens the edit page. Hold the name and slide to reorder (Patrick, #33-new). **Daily now carries My Day's log** — the same `my_history` list, written when Done is tapped, titled My Log. **The My Day page is gone** (Patrick, #33-new). The `/myday` hop is not kept (Patrick, #35-new). The engine still names those reminders `myday`, so banners and dual-write keep working.

**An item lives on one page; Daily may also show another page's item (Patrick, #32-new).**

**To-Do stops being a page.** Its tasks split by how they actually repeat:
a dated task that does not repeat goes to One Time, a dateless one to
Extended.

**Daily's own add is narrower than the others'.** It is only about this
day, and offers two kinds — an every-day item, or a One Time for today
with Reminders before. **On One Time for today those chips are only**
30 min., 1 hour, 2 hours, and Time of — Time of is the item's own time
(Patrick, #33-new). Pets is just another every-day item on it. The
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

**Testing waits until the building is done** (Patrick, #30-new). The
automated test load is not next. The phone build still waits. Work stays
on the simulator. The odds and ends wait too.

### What is actually in the app

**The engine is finished and all five reminder screens go through it.**
`gatherWanted` sends My Day, Pets, My Week, Look Ahead and To-Do through
one translator and its table, then `scheduler/remindersfor.ts`, which
writes the reminders the phone should hold. Depth is one for every kind,
with recovery on opening carrying what a second copy used to carry. The
old readers are still in the project but the live run no longer calls
them, except the Memory Test's, which skips the common shape. The Timer
sits outside the module.

**The engine is on the phone from an earlier load.** My Day and To-Do have
each sent a notice. Everything built since — the repeat group, skip, zone
handling, depth of one, the live swap — **has not been proved on the
phone.** Nothing should reach the phone until the reminder work is whole
(Patrick, #15-new).

**The tests run on the Mac in about a second**, headless under Node, with
no build and no simulator. **413 of 413 pass:**

    node --experimental-strip-types scheduler/tests/run-all.ts

**One TypeScript error stands and is not a fault.** Expo keeps its own
generated list of the app's screens at `.expo/types/router.d.ts`,
gitignored and untracked, and it predates the Scheduled Reminders page. It
rewrites itself on the next build. Nothing else reports.

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

## What is open in front of it

**The storage question, and it was the first thing the build sheet needed.
It is answered at the foot of this block.** It was raised at #30-new and
the conversation turned to naming the pages before it was answered, so it
stood open until #32-new. The app today
keeps five separate saved lists, one per old page, and the engine reads
each through a table entry that knows which page it came from. The nine
new pages cut that same content by how often a thing repeats instead. What
was put and not answered was a split: **the recipe** — name, date, time,
repeat, lead times — written once on the add, and **occurrence state** —
ticked, skipped, postponed — written by the viewing page. Each old page
mixes those two in its own saved shape, which is why Reminders before has
a home on To-Do and nowhere else.

**What #32-new found when it read the five screens and the banner
handler.** These are facts about the old screens as they stand today, not
the new pages:

- **The recipe is written in exactly one place per page — the New/Edit
  form.** Name, date, time, day of the week, repeat interval and the
  Reminders-before chips are set there and nowhere else, on all five
  screens.
- **The occurrence state is written by the row and by the banner, never by
  that form.** The row's Log, Done and ✓ buttons, its Snooze, Postpone and
  Delay buttons, the reorder arrows and swipe-to-delete; then eight
  branches of the banner handler in `app/_layout.tsx` — done, skip, three
  snoozes, +1 Day and three delays — each writing straight into storage;
  and Siri's "mark done", which writes `my_routine` and `my_history`
  itself. So the split the storage question describes is already real in
  the code.
- **`_layout.tsx` hardcodes which saved list each notification belongs
  to**, in those same eight places — `my_routine`, `pets_feeds`,
  `week_routine`, `lookahead_items`, `orders_items`. This is the thing the
  storage answer most decides: nine pages cut by cadence mean either nine
  of those branches everywhere, or one store and none.
- **"Done" means four different things today.** My Day and Pets set
  `completed` and let the daily reset clear it; My Week sets `completed`
  plus `doneAt` and waits for the weekly reset; Look Ahead rolls the date
  forward and marks nothing; To-Do deletes the task and writes a log entry.

The old screens' tap-and-Edit shape is in `docs/build-history.md` under
#32-new, not here. The new pages live in `docs/spec-pages.md`.

**Settled by Patrick at #32-new: one saved list of items instead of
nine**, each item carrying how often it repeats, so a page becomes a
filter on that list rather than a store of its own. This answers the
storage question that had been open since #30-new. The two reasons are
that Daily has to show a Monthly item falling today and with separate
stores would have to read all of them to do it, and that one store removes
the eight hardcoded keys above.

**The build sheets are the pattern for this work** — each self-contained,
carrying the answers themselves rather than pointing at other documents,
which is what lets a worker session build without asking a design
question. **A sheet's read list should name what the pattern it points at
actually imports** (#25-new).

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

**Retiring each old reader** once its replacement is proved. That is
Patrick's own order from #19-new and it waits on the phone proof.

**My Week's cure rides on the swap, not on the translator.** Its reader
still ignores the tick, and the header comment of
`scheduler/readers/myweek.ts` and the test named *A chore already ticked
still gets its weekly reminder* both assert the opposite of what is
wanted. Both go out when the screen is swapped over. The translator
already tells the truth about the tick.

**Miss-telling covers My Day and Pets only.** The rollover loop in
`runDailyReset` names `my_routine` and `pets_feeds` and no others, so My
Week, Look Ahead and To-Do record no misses at all. The work is extending
the telling to those three, not building it — both halves of recovery on
opening are already built and tested.

**Skip, a named zone, and the extra repeat shapes have no screen yet on
the old pages.** The engine holds them; nothing writes them. **Options is
now that list** (Patrick, #32-new), in the pages block above.

**`docs/build-sheet.md` has not been brought level with the reorder**
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

**Still open from the shape work**: how the arrow from the store to the
block is actually made so a write cannot fail to turn the loop, and
whether any screen is ever brought round to save in the common shape
rather than being translated at the boundary for good.

**Still unread**: `app/memorytest.tsx`; and the test files other than My
Day's, Pets' and My Week's. The old Look Ahead and To-Do screens went
out unread at #35-new.

**"+1 Day" is dead on every My Week banner** (found #11-new). Both the
base weekly and the postpone carry the shared routine buttons, so
`myweekactions` is registered but never asked for and the `postpone1`
branch in the housing cannot fire. Postponing still works from the page.
Nothing is proposed about it.

**Timer is not working right** (Patrick, #5-new), said in passing and not
examined. It is deliberately outside the module. Two things noticed since
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

**The rest of the fix list** is in `docs/reminder-rebuild.md` and
unstarted: holding a dropped run instead of discarding it, and saying the
banner instruction once in the housing instead of on eight pages.

**Still to come, and untouched:** the two "What's Next" items left in
`pending.txt` — Look Ahead's tile format and its Snooze changed or
dropped, and the Timer tile's Stop (Pause) / Continue (Go) button and log.
**The Look Ahead banner-delay bug** sits in `pending.txt` under "Needs a
phone test"; it was never separately confirmed, and the trial that would
have confirmed it is the one that failed.

## Facts worth carrying

**The hour fix leaves a tail.** Any time set by spinning through noon or
midnight before #27-new is stored in the wrong half of the day and needs
re-setting.

**Memory Test allows one session a day.** The screen shows the day's score
and "Come back tomorrow" once an entry with today's date is logged, so a
second test cannot be started. Deleting the day's entry brings the Start
button back, at the cost of that day's real score.

**A background task and a daily tick are opposites and must never be
merged.** A To-Do background task says a thing is *not yet done* and must
survive the rollover, so `todo_tasks` must never be added to
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
