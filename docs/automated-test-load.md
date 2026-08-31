# Automated reminder test load

This is the live design for the temporary automated load that will prove
the reminder work. The job sheet is
`docs-ref/build-sheets/build-sheet-automated-load.md`, written at #43-new. It does not
redesign the load or ask Patrick to reconstruct it.

The first recoverable decision is from #29-new. Patrick wanted the
equivalent of Mystery's one-sitting test: real reminder times brought
close together so he can watch the banners arrive and tap their buttons
without waiting days or months. #30-new moved the load until after the
reminder building. #37-new added that it should cover as many completed
features as it can, including a 31st passing through a short month.
#38-new gathered the whole shape here.

## When it is built

The remaining reminder features and their connections to the engine
landed at #42-new. The job sheet is
`docs-ref/build-sheets/build-sheet-automated-load.md`. The load does not stand in for
deciding or finishing those features.

It is tried on the simulator first, so a setup fault does not spend the
phone build. One later phone build proves the real iPhone path.

The load is temporary. It is four pieces: one scenario file, one
loader, one checker, and one cleanup function. All four leave together
after the phone run. None of them becomes a second reminder engine.

## What it proves

The engine already has strong Mac tests for its calculations. The phone
load concentrates on what those tests cannot prove (Patrick, #42-new):

- saved items reaching the engine correctly;
- the phone queue receiving the right notices;
- banners showing the right words and buttons;
- Done, Delay, Skip, and reopening returning correctly;
- and recovery after the app has been closed.

Calendar cases that take weeks or months do not have to be waited out.
Most tests finish without waiting for banners: run the scheduler at
once, then compare the actual phone queue with the expected list. A
few near-future notices prove actual delivery and button actions.

## Shape of the temporary load

**One scenario file, one loader, one checker, and one cleanup
function** (Patrick, #42-new). Remove all four together after the
phone run.

Put test items through the same save path a real item uses. Do not
write shaped items or phone notices directly.

Give every item a clear test name and a unique test identifier.

The scenario file holds the items to save and, kept apart, the expected
notice, time, buttons, and result for each item. Do not calculate that
expected answer with the engine being tested.

Run the scheduler immediately, then compare the actual phone queue
with that expected list.

Test each code or bit alone, then only the combinations where order
matters.

Keep the ceiling test separate so fifty-six notices do not obscure
every other result.

Make loading repeatable without duplication. Cleanup removes only
those test identifiers. Preserve and restore the real items and
settings.

## One load, many small cases

The load contains separate, plainly named cases. It does not put every
setting onto one giant item, because one failure there would not say
which feature failed.

The original minimum was one soon item on each of the five old lists,
staggered a minute or two apart. The current load applies that same
idea to the completed Daily, Weekly, Monthly, Quarterly, Yearly, One
Time and Extended pages, using only the cases that actually apply to
each.

Each independent code, bit or option gets a case of its own. Combined
cases are added only where the order can change the answer. The
important combinations include:

- Done, Skip and a standing Snooze or Delay;
- a lead time crossing a date boundary;
- a named time zone crossing a date boundary;
- a missing day together with its shifted-day choice;
- and a holiday move together with another calendar adjustment.

The short-month proof keeps the intended day: a monthly 31st lands on
the last day that exists in a short month, then returns to the 31st in
the next month that has one.

The final case inventory is made from the completed feature list when
the build sheet is written. That is an inventory, not a reopening of
this design.

## It must use the real road

Test items enter through the same canonical save path as an item made
on a page. The loader does not manufacture a `ShapedItem`, a
`WantedReminder`, or an iOS request directly. After saving, it asks the
real scheduler to run at once.

The expected answers live in the scenario file, apart from the items
to save. Each case names:

- its test identifier and visible name;
- the ordinary item and settings to save;
- the expected queue key, firing time, banner words and buttons;
- the action Patrick should tap, when one is part of the case;
- and the state or page result expected afterwards.

The checker reads the actual scheduled queue and compares it with that
list. It does not ask the engine under test to calculate its own
expected answer, because agreement with itself would prove nothing.

The Scheduled Reminders screen remains useful for seeing the queue, but
the checker gives a plain pass or failure for each case so Patrick does
not have to compare a long list by eye.

## How the Options join the engine

The #38-new Options trace followed every control through
`reminder_items`, the translator, the common shape and the
phone queue. This is the implementation record for connecting them.
The present Options controls save fields on `reminder_items`. Time zone
reaches the live engine (#40-new). Holidays reach it (#41-new): the
translator carries `before` or `after` as one code, and one calendar
block applies the US federal list. A second Thursday and a Wednesday
after the 6th reach it (#41-new): a complete pair becomes the engine's
weekday entry, and the last of those two or a dated day stays and
clears the other two. The extra tap is Then or Next Day on a shifted
banner (#41-new); the saved Then/Next choice is not a recipe. Calendar
shading reaches it (#42-new). The Float row is out (#42-new). `floatDay`
is not mapped.

### One boundary

This is a clean cutover, not a migration or compatibility project.
Patrick is the only user and explicitly told the page worker that
nothing from the removed pages needed preserving. Removing the old
pages meant removing their live storage road too. The first worker
removed the screens but left dual-write, old-list reads, and old-list
writes from banners and Siri. #39-new removed that leftover road.

The connection is `ReminderItem` translated once into `ShapedItem`.
Pages, banners and Siri all write the same `reminder_items` list, and
the scheduler reads that list. Do not enlarge dual-write to carry
Options, retain it as a fallback, or add a migration for data Patrick
said did not need saving. The old reminder-page keys are not part of
any live read or write path. Inert old reader source files stay until
phone proof; they must not be called. Nothing live points at To-Do.

Each page kind may supply its recipe through one explicit table entry,
but no page name is tested in the calendar blocks. The translator sets
the codes, bits and accompanying values. Everything after it reads the
same common fields.

The cutover landed at #39-new. Mac tests for the one-list translator
are in the ordinary suite. The live save, banners and Siri no longer
read or write an old reminder-page key. Phone proof waits.

The checks that had to be true were:

- saving through every new page changes `reminder_items` and creates no
  compatibility copy in an old reminder-page store;
- the scheduler produces the wanted queue when those old stores are
  absent;
- Done, Skip, Snooze or Delay, banner responses and Siri all change the
  canonical item through the one write function;
- none of those live actions reads or writes an old reminder-page key;
- and every such write starts the scheduler or records the required
  rerun.

Only after those checks pass may the work be reported as one-store
cutover complete. #39-new reports that for the live road.

### Keep the recipe separate from the occurrence

The saved repeat recipe never changes merely because one occurrence
had to move. A monthly 31st remains a 31st after February. Done, Skip,
Snooze and a shifted-day response record what happened to that
occurrence; they do not overwrite the recipe's anchor date.

Monthly, Quarterly or Yearly Done no longer advances and saves a new
date (#41-new). The engine finds the next occurrence from the unchanged
recipe.

### What each Option becomes

- **Holidays** — `before` or `after` is one code, absent when unused.
  The translator carries it into the common shape and one calendar
  block applies the fixed US federal holiday list. No page calculates
  the moved date.
- **Time zone** — the engine's existing `floatsWithPhoneBit` and
  `dueTimeZoneText` are the right facts. True needs no zone. False must
  have the captured zone. An incomplete pair currently floats with the
  phone; leave that unless Patrick says otherwise (#41-new).
- **Calendar shading** — `shadeCalendar` remains a page-display bit,
  not a scheduling instruction. The page asks the same plain engine
  calendar calculation to expand a visible range (#42-new). A last
  existing day and a holiday move show on the month; the old weekday
  sample is gone.
- **Second Thursday** — the ordinal and weekday become one complete
  weekday entry in `repeatWeekdayList`. A half-entered pair is not a
  valid recipe.
- **Wednesday after the 6th** — the weekday becomes the weekday entry
  and six becomes `repeatAfterDayCount`. This uses the same calendar
  block for every weekday and numbered floor. **Only the first matching
  weekday after that floor is the occurrence** (Patrick, #42-new).
- **A shifted missing day** — `then` or `next day` is not a permanent
  item preference. The engine marks only that wanted reminder with
  `shiftedForMissingDayBit`. The housing carries the bit into the phone
  request and offers Then or Next Day on that occurrence (#41-new). Next
day writes a one-day push-back for that occurrence; Then keeps the last
existing day. The series does not move. The saved `shiftedChoice` field
does not go into `ShapedItem`.
- **Float around short month** — the row is out (#42-new). Last existing
  day is always the engine’s rule. Do not connect `floatDay`
  (Patrick, #41-new).
- **Skip** stays off Options. It writes a cycle stamp and the engine
  finds the next occurrence. **Note** remains ordinary item text.
  **Reminders before** remain the engine's existing lead forms.

The Options-to-kind table must name every kind explicitly. It must not
give an unknown kind the Weekly set by default. **Extended** is a list
of items to be done sometime in the future, with no deadline, no due
date, and no set time. It gets no banners. New and Edit have only the
name, an optional note, and Done. It can be edited like the others.
That shape is in (#42-new). The Options-to-kind table names every kind.
Extended has no Options cases. Daily’s every-day item and One Time for
today get only time zone (#42-new).

### Combinations and work order

The date recipe, Second Thursday and Wednesday after the 6th can
currently all remain on one item. Patrick, #41-new: both are not
needed; the last of the three stays and clears the other two.

A missing day and a holiday move cannot both apply (Patrick, #41-new).
There is no order between them.

### A control that must not be wired as it stands

The saved `shiftedChoice` currently makes then or next day a permanent
recipe choice. That field does not go into `ShapedItem`. Then or Next
Day is offered on the shifted banner (#41-new).

### The + OPT save edge

**Cancel closes and makes no change** (Patrick, #41-new), including
after + OPT (#42-new). Done inside + OPT keeps the Options values on
the form and does not save the item. The form’s Save (or Extended’s
Done) is the write. A later Cancel leaves storage as it was.

The Mac suite first proves each `ReminderItem` reaches the expected
common codes and bits, each incomplete or conflicting recipe is
handled deliberately, and combinations follow the settled order. The
temporary load then proves those same ordinary items reach the phone.

## Safety and cleanup

Every test item has a reserved prefix and a versioned load identifier.
Running the loader twice does not duplicate anything.

Before loading, the temporary machinery preserves the real reminder
items and the settings it will change. Cleanup removes only records
carrying the test identifier, restores what it preserved, and lets the
real scheduler reconcile the phone. It never clears all storage or all
notifications as a shortcut.

The ordinary feature load stays below the scheduler's allowance. A
ceiling test is a separate case, so fifty-six notices do not obscure
every other result.

## Hardening before the load

The second reading at #38-new found six places to strengthen before
the automated load is the final proof. They do not change the engine's
shape. Each closes a way the right design could still fail at an edge.
Points one through five landed at #40-new. Point six landed at #39-new.

### One: a decision never travels as prose

This point landed at #40-new. `StillWantedAnswer` carries
`skippedThisCycleBit`. `becauseText` remains an explanation for a
person and never controls behaviour. Changing the explanation cannot
change what Skip does.

### Two: an unread source is unknown, not empty

This point landed at #40-new. A read failure leaves that source's
existing phone requests untouched, reports the fault, and tries again
on the next run. It does not claim that no items exist.

### Three: a run requested during a run is not discarded

This point landed at #40-new. A request during a run sets a pending
flag. When the current run finishes, the scheduler runs once more
against the latest saved truth. Many requests collapse into one final
rerun.

### Four: keeping a reminder includes its contents

This point landed at #40-new. The reconcile compares the source, item,
visible name, heading, sentence and button set as well as key and
firing time. A renamed item or changed button set at the same time
replaces the stale banner.

### Five: secure a replacement before removing the old one

This point landed at #40-new. For a changed reminder, the new request
is created first and the old one is cancelled only after that succeeds.
If creation fails, the old reminder remains and the fault is reported.
A request that is simply no longer wanted is still cancelled normally.
The scheduler's reserved room is kept available for this purpose.

### Six: every returning road writes the one truth

This point landed at #39-new. Pages, banners and Siri change the
canonical `reminder_items` store through one write function. That
function also runs the scheduler. Dual-write and every live read or
direct write of an old reminder-page store are gone.

The one-list translator tests join the ordinary Mac suite. The
temporary simulator and phone load still has to prove the same
protections hold across real storage, Expo and iOS.

## What remains for the later build sheet

Those details are now in `docs-ref/build-sheets/build-sheet-automated-load.md`: a Home
tile and Test load screen, two-minute spacing on the live banners, the
case names and how expected values are written, and a Pass / Fail /
Look report on that screen.
