# Phase spec — the reminder pages

Written at #32-new. This is the spec for this phase, not a job sheet. A
later sheet tells a worker what to build this time. The pages are not
built from the handoff, and they are not built from this file until a
sheet says so.

**This phase is the pages.** Daily, Weekly, Monthly, Quarterly, Yearly,
One Time, Extended, Options, and the + Add popup. Moving Memory onto the
engine as a whole — saving in the engine's own shape, dropping the old
lists — is a later phase and is not in this file.

Testing waits until the building is done. The phone build waits. The
odds and ends wait. The 24-hour clock waits until after the building.

---

## The pages

- **Daily** — My Day and Pets as items on one list. Daily is also a view
  of the day: anything from Weekly, Monthly, Quarterly, Yearly or One
  Time that falls on today shows there with the every-day items. A
  dateless item has no day, so it does not.
- **Weekly** — My Week.
- **Monthly**, **Quarterly**, **Yearly** — Look Ahead's repeats, split by
  how often. Look Ahead is not a once-only list. A six-month item lives
  on Quarterly, still every six months.
- **One Time** — a date, no repeat, carrying To-Do's Reminders before
  chips. Any and all of those chips can be on at once.
- **Extended** — no date.
- **Options** — its own page, described below.

**To-Do stops being a page.** A dated task that does not repeat goes to
One Time. A dateless one goes to Extended.

**The Input page goes away and nothing replaces it.** The + Add popup is
not its replacement. Input was a separate try. The page built at #29-new
is still in the app; it is a try, not the destination.

---

## One list

**One saved list of items**, each carrying how often it repeats. A page
is a filter on that list, not a store of its own.

**An item lives on one page.** Daily may also show another page's item
when that item falls today.

---

## How an item is viewed and changed

**On Weekly, Monthly, Quarterly, Yearly, One Time, Extended and Daily**,
each item has Done and Snooze. A tap on the tile opens the edit page.
Done on Daily undoes when tapped again.

**A visitor already shows its name.** Next to the name it says where it
is from, written as `from Weekly`, `from Monthly`, and so on. "Tag" was
only a way of saying that, not a separate control. A visitor returns to
Daily when that edit is finished.

The edit is a page, not a modal.

**On Weekly, Monthly, Quarterly and Yearly**, Done finishes this cycle
and arms the next. They repeat. Any adjusting of what is shown is a
separate display change, not part of the Done tap.

**On One Time and Extended**, a tap on Done turns the button to the done
colour. The item stays. It no longer fires or arms. Delete is how you
get rid of it.

---

## Adding

**+ Add opens a short popup that only asks where the new item belongs.**
The fields stay on that kind's own small add. When you are finished you
return to the page you started from. If you are already on Monthly, the
popup opens with Monthly already chosen.

**It opens from the "+ Add" button the pages already have.** No new
control is added. It works the same way from Weekly, Monthly,
Quarterly, Yearly, One Time and Extended. Daily keeps its own narrower
add. Options has no + Add.

**Daily's own add is narrower.** It is only about this day, and offers
two kinds: an every-day item, or a One Time for today with Reminders
before. Pets is just another every-day item on Daily. The other cadence
pages keep their own adds, because on those the page is the whole meaning
of Repeat.

**The Reminders-before chips** are the ones To-Do already uses: 30 min.,
1 hour, 2 hours, Morning of, Day Before, Night Before, 2 Days Before,
Week, and Month. Those are the two lead forms the engine already knows —
counted back from the time, or a named time of day a number of days
earlier. Any and all of those chips can be on at once.

---

## Options

A list in the style of the iPhone's notification-apps list, for the odd
cases and what to do about them.

**Missing days** follow the engine record: the last day that exists, with
an extra tap for then or next day, not skip. **Also** every nth day in a
period, and move the day to before or after a holiday.

That calendar thinking is from RFC 5545 and JSCalendar RFC 8984, without
the file format. The settled engine write-up is
`Reminder Engine/docs/reminder-engine.md`. Skip of a cycle is a different
thing from a missing day, and JSCalendar's own `skip` property is about
dates that do not exist, not about skipping an occurrence.

**When you open Options, you see** holidays, time zone, the float button,
Skip, an extra tap on a shifted day, calendar shading, a notes row, a
second Thursday, and a Wednesday after the 6th. Reminders-before is not
a row; it already lives on One Time. Each row opens that case. Options
has no + Add.
