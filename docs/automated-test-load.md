# Automated reminder test load

This is the live design for the temporary automated load that will prove
the reminder work. A later session builds from this file. It does not
redesign the load or ask Patrick to reconstruct it.

The first recoverable decision is from #29-new. Patrick wanted the
equivalent of Mystery's one-sitting test: real reminder times brought
close together so he can watch the banners arrive and tap their buttons
without waiting days or months. #30-new moved the load until after the
reminder building. #37-new added that it should cover as many completed
features as it can, including a 31st passing through a short month.
#38-new gathered the whole shape here.

## When it is built

The load waits until the remaining reminder features and their
connections to the engine are in. It does not stand in for deciding or
finishing those features.

It is tried on the simulator first, so a setup fault does not spend the
phone build. One later phone build proves the real iPhone path.

The load is temporary. Its loader, cases, checker and cleanup leave
together after the proof. None of them becomes a permanent second way
of scheduling reminders.

## What it proves

The existing Mac suite proves the engine's plain calculations with a
handed-in clock. The temporary load proves the edges that suite cannot:

- ordinary saved items reach the common shape and the engine;
- the scheduler puts the expected requests into the phone's queue;
- real banners arrive with the expected words and buttons;
- Done, Snooze or Delay, Skip and the page actions write the right
  result back;
- reopening rebuilds what should stand and reports what was missed;
- and the pages show the resulting state.

Calendar cases that take weeks or months do not have to be waited out.
Their calculated queue entries can be checked immediately. A smaller
set of near-time cases proves that iOS actually delivers and routes the
banners.

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
real scheduler to run.

The expected answers live in a separate manifest. Each case names:

- its test identifier and visible name;
- the ordinary item and settings to save;
- the expected queue key, firing time, banner words and buttons;
- the action Patrick should tap, when one is part of the case;
- and the state or page result expected afterwards.

The checker reads the actual scheduled queue and compares it with that
manifest. It does not ask the engine under test to calculate its own
expected answer, because agreement with itself would prove nothing.

The Scheduled Reminders screen remains useful for seeing the queue, but
the checker gives a plain pass or failure for each case so Patrick does
not have to compare a long list by eye.

## How the Options join the engine

The #38-new Options trace followed every control through
`reminder_items`, the translator, the common shape and the
phone queue. This is the implementation record for connecting them.
The present Options controls save fields on `reminder_items`. Time zone
reaches the live engine (#40-new). The other Option fields do not: the
translator maps a named zone as a complete pair, and leaves holidays,
Float, the extra tap, a second Thursday, and a Wednesday after the 6th
unmapped until the open decisions are settled.

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

The present page road advances and saves a new date when a Monthly,
Quarterly or Yearly item is marked Done. That road must leave when the
canonical repeat road takes over, or a shifted 31st can permanently
become a 30th or 28th.

### What each Option becomes

- **Holidays** — `before` or `after` is one code, absent when unused.
  The translator carries it into the common shape and one calendar
  block applies the fixed US federal holiday list. No page calculates
  the moved date.
- **Time zone** — the engine's existing `floatsWithPhoneBit` and
  `dueTimeZoneText` are the right facts. True needs no zone. False must
  have the captured zone; the translator rejects or reports an
  incomplete pair rather than silently making no reminder.
- **Calendar shading** — `shadeCalendar` remains a page-display bit,
  not a scheduling instruction. The page asks the same plain engine
  calendar calculation to expand a visible range. The current sample,
  which merely shades every matching weekday, is not the final
  calculation.
- **Second Thursday** — the ordinal and weekday become one complete
  weekday entry in `repeatWeekdayList`. A half-entered pair is not a
  valid recipe.
- **Wednesday after the 6th** — the weekday becomes the weekday entry
  and six becomes `repeatAfterDayCount`. This uses the same calendar
  block for every weekday and numbered floor.
- **A shifted missing day** — `then` or `next day` is not a permanent
  item preference. The engine marks only that wanted reminder with
  `shiftedForMissingDayBit`. The housing carries the bit into the phone
  request and offers the response on that occurrence. Next day writes
  a one-day push-back for that occurrence; the series does not move.
- **Skip** stays off Options. It writes a cycle stamp and the engine
  finds the next occurrence. **Note** remains ordinary item text.
  **Reminders before** remain the engine's existing lead forms.

The Options-to-kind table must name every kind explicitly. It must not
give an unknown kind the Weekly set by default. Extended has no date,
and its Option set remains undecided.

### Combinations and work order

The date recipe, Second Thursday and Wednesday after the 6th can
currently all remain on one item. Before connection, Patrick must
settle whether one item may intentionally produce more than one of
those patterns. If only one pattern is allowed, they are one
`monthlyPatternCode` with its accompanying values, and choosing one
clears the others. A worker must not invent precedence.

Within the calendar calculation, the analysis recommends this order:
choose the item's time-zone calendar, produce the occurrence from the
unchanged repeat recipe, resolve a missing day, apply the holiday move,
turn the final civil date and time into a moment, and calculate lead
reminders from that final due moment. The holiday-and-missing-day order
has not yet been made a Patrick ruling and must be settled before that
block is built.

### Two controls that must not be wired as they stand

The settled engine record says a nonexistent monthly date always uses
the last day that exists and deliberately has no invalid-day code.
Therefore the saved `floatDay` switch currently has no separate job.
Patrick must say what off means, or the switch must leave, before a
worker connects it.

The saved `shiftedChoice` currently makes then or next day a permanent
recipe choice. That conflicts with the settled engine record above,
where it is an action on the one shifted banner. The permanent field
does not go into `ShapedItem`.

### The + OPT save edge

Today Done inside + OPT calls the whole save road when a name has been
entered. On a new item that also runs the scheduler before the form's
main Save, and a later Cancel does not remove the item. Before the
canonical road is finished, Patrick must settle whether + OPT edits a
draft until Save or whether immediate saving includes an explicit
undo-on-Cancel. The current accidental middle state is not carried
forward.

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
ceiling test is a separate case, because deliberately filling the
queue would make every other result harder to read.

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

These are implementation details, not design questions:

- the exact temporary screen or first-run gate that starts the load;
- the minute spacing used on that day's run;
- the complete case names and expected values after all features are
  present;
- and how the temporary pass-and-failure report is laid out.

Those choices must preserve the design above: one removable load,
ordinary inputs, the real engine and queue, independent cases, an
independent expected manifest, safe restoration, and one sitting.
