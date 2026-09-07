# Build sheet — Birthdays

**Read this file and build. Read only the files on the read list. Do not
ask Patrick anything about the design. Every decision here is already
made and is not to be reopened.**

Written at #81-new, 7 September 2026.

If something genuinely is not here, choose the plainest option that
matches the existing code, and put it in the build report to Patrick
rather than writing it into any document. Do not stop to ask.

**Where you build.** Memory, `elderlyassistant`. Open that folder as
the workspace that holds the files you edit. Run no git command.

**#81-new writes this sheet and does not build this piece. Build waits
for its own Go.**

---

## What this job is

A **Birthdays** page. It is a copy of Appointments on the screen: the
same list, the same New and Edit, the same reminder chips, the same
datetime control. Each item is a name and a date, and it comes round
every year.

It is a new saved kind on the **one list** the app already has,
`reminder_items`. A page is a filter on that list. Birthdays is not a
second store.

**An item on Birthdays is not also on Appointments, and not on Yearly.**
That is the whole point of a new kind. Do not save a birthday as
`appointments`. Do not save a birthday as `yearly`. Do not copy a
birthday onto another kind when it is added, edited, shown on Daily, or
shown on the calendar.

---

## What this sheet is not

No second new page. That page is not yet named.

No change to what Appointments, Yearly, Daily’s One Time for today, or
Bucket List already save or show.

No Quarterly 30 / 60 / 90 chips. No display-tile work. No phone load.
No Siri commands. No User Guide. No Feedback button. No day-roll lock
test. Do not connect `floatDay`.

No new backup shape. The one list already travels in the backup. Page
logs do not.

---

## The one list

The saved kind is **`birthdays`**. Add it to the `ReminderKind` union
in `modules/reminder-types.ts`, and to every TypeScript union, table,
and test that names the saved kinds so the compiler stays exhaustive.

The visible name is **Birthdays**, in `constants/page-names.ts`, the
same way Appointments is named. `pageLabelFor` then returns it.

An item lives on one page because it has one kind. `CadenceListPage`
already filters by kind. Birthdays uses that page with
`kind="birthdays"` and `returnTo="birthdays"`. Appointments keeps
`kind="appointments"`. Yearly keeps `kind="yearly"`. Those three
filters cannot show the same row.

---

## The Home tile

Add a Home tile for Birthdays in `app/home.tsx`, immediately after
Appointments, before Bucket List. The picture is 🎂. It opens
`/birthdays`.

Keep the existing landscape reordering. Do not shrink tiles or change
another tile’s place except to insert this one.

---

## The page

New file `app/birthdays.tsx`, the same one-line page Appointments is:

```
import CadenceListPage from '../components/CadenceListPage';

export default function BirthdaysScreen() {
    return <CadenceListPage kind="birthdays" returnTo="birthdays" />;
}
```

Register `birthdays` in `app/_layout.tsx` next to `appointments`, same
screen options, no native header.

**+ Add** opens the existing New form (`/item-edit`) with
`kind=birthdays` and `returnTo=birthdays`, which `CadenceListPage`
already does from the kind it is given.

**Tap** opens Edit for that item. **Hold and slide** reorders only
the Birthdays rows. **Swipe** deletes. **Snooze** is the same popup
the cadence list already has. **Log** uses its own key,
`birthdays_history`, added in `historyKeyFor` the same way
`appointments_history` is. Logs stay on the phone and are not backed
up.

---

## New and Edit — copy Appointments, with a date that is required

`app/item-edit.tsx` already builds Appointments. Birthdays uses that
same form, not a new file.

**Name.** Required. Placeholder: `e.g. someone’s name`.

**Date.** Required. A birthday without a date is not a birthday. Do
not offer Appointments’ clear-date control. Save `year`, `month`, and
`day` every time.

**Time.** Optional, the same as Appointments: the optional time
control, `timeSet`, and the 12-hour AM/PM check on Save. If no time
is set, the translator uses noon, the same default Appointments uses
when hour and minute are missing.

**Reminders before.** The same chips Appointments uses, and any and
all of them can be on at once:

- 30 min.
- 1 hour
- 2 hours
- Morning of
- Day Before
- Night Before
- 2 Days Before
- Week
- Month

Those are `ONE_TIME_PRESETS` in `item-edit.tsx`. Show that row for
`birthdays` the same as for `appointments`. Do not use Daily’s shorter
four-chip row.

If the person saves with no chip on, show Appointments’ existing
“No Reminder Set / Are you sure you don't want to set a Reminder?”
popup, with Go Back and Save Anyway.

**Note.** The same note field.

**+ OPT.** The same two cases Appointments has: Holidays and Time
zone. Not Yearly’s extra cases (shifted day, second Thursday,
Wednesday after the 6th). Wire `optionCasesForKind` so `birthdays`
returns the same cases as `appointments`.

**Save** writes one row onto `reminder_items` with `kind: 'birthdays'`.
It does not also write an `appointments` row or a `yearly` row.

**Cancel** and header Back return the way Appointments already
returns, including the helper stack when New was opened from Help.

Add `birthdays` to `KINDS`, `kindFrom`, `pathFor` (returns
`/birthdays`), `formHasTimeSet` (same rule as Appointments: `timeSet`),
`assembleFormItem` (copy the Appointments branch, except the date is
always saved), the date-validity list, the empty-chip warning, and
the datetime block that currently lists `appointments` and `oneTime`.

---

## It comes round every year

Appointments is a one-off: Done ends it. Birthdays is not a one-off.

**Done on the page** copies Yearly, not Appointments: it advances the
saved date to the next year that is still in the future, using
`advanceDatedItem`, then ticks the item. Add `birthdays` to that
`advanceDatedItem` step of **12 months**, and to the cadence-list
Done branch that already calls it for monthly, quarterly, and yearly.

Undo Done is the same confirm Appointments and Yearly already share.
Add `birthdays` to that list.

**The translator** gives Birthdays a yearly repeat **and**
Appointments’ lead chips, so the engine speaks on the day and on every
selected chip, then again next year.

Copy Appointments’ lead rule: the set time itself, then the chips. An
empty chip list still speaks at the set time.

Copy Yearly’s repeat: `repeatUnitCode` `year`, interval 1, from the
saved date.

**Done does not end the item.** `doneEndsItemBit` is false, as Yearly
is, not as Appointments is.

**Banner buttons** are Appointments’ existing **OK** set
(`appointmentsok`). Do not invent a new category. A banner tap of the
body opens `/birthdays` with `highlight` set to the item id, the same
way Appointments opens `/appointments`. Add that source next to
`appointments` in `app/_layout.tsx`.

**Snooze on the page** stays, because the cadence list already has it.
The translator’s push-back bit copies Appointments (`false`), so a
banner has no delay buttons.

---

## Daily, the calendar, and the from-line

When the saved date is today, the birthday shows on Daily as a
visitor, with **from Birthdays** next to the name. Add `birthdays` to
`FROM_PAGE` in `modules/reminder-items.ts`.

`shownOnDate` already treats Yearly as a dated repeat and Appointments
as a one-off on the saved date. Birthdays belongs on Daily on the
saved date, and on the day the engine’s next yearly occurrence lands,
the same way Yearly does — so a date that has already passed this
year still finds the next one. Add `birthdays` to that dated-repeat
side, not to the appointments/oneTime early return.

Add `birthdays` to `DAILY_KIND_RANK` next to Appointments.

The calendar already shades every kind except Daily and Bucket List,
through `shadedDaysForItem`. Once the translator repeats yearly, the
birthday’s day shades each year. Do not add a second calendar entry
from another kind.

`formatItemWhen` already prints a dated row for Appointments. Include
`birthdays` in that same date line.

---

## Help

Help must not file a birthday as Yearly or as an Appointment. That
would put the item on the wrong page.

On the **how often** step (after Repeats), add **Birthday** as a
choice. It opens Birthdays’ New form (`kind=birthdays`, `viaHelper=1`),
the same way **Year** opens Yearly’s New form.

**Year** still opens Yearly only.

Do not put Birthday on the Does-not-repeat path. A birthday repeats.

Cancel and Back on Help do not change.

---

## Backup, banners, and Siri

Backup already writes `reminder_items`. A birthday row goes with that
list. Do not add `birthdays_history` to the backup.

Restore Merge and Replace already work by item id on that list. Do not
add a special birthday merge.

Siri’s voice list stays Daily’s own items. Do not add Birthdays to it.

---

## Files this job touches

**New**

- `app/birthdays.tsx`

**Edit**

- `app/home.tsx`
- `app/_layout.tsx`
- `app/item-edit.tsx`
- `app/where.tsx`
- `constants/page-names.ts`
- `components/CadenceListPage.tsx`
- `modules/reminder-types.ts`
- `modules/reminder-items.ts`
- `modules/option-cases.ts`
- `scheduler/inputshape.ts`
- `scheduler/translators/translate.ts`
- `scheduler/shown-on-date.ts`
- every test that names the saved kinds, so the unions stay closed

Do not edit Appointments’ own screen file except that shared files
above now mention `birthdays` beside `appointments` where the copy
requires it.

---

## Read list

- This sheet
- `app/appointments.tsx`
- `app/yearly.tsx`
- `app/item-edit.tsx`
- `app/where.tsx`
- `app/home.tsx`
- `app/_layout.tsx`
- `components/CadenceListPage.tsx`
- `constants/page-names.ts`
- `modules/reminder-types.ts`
- `modules/reminder-items.ts`
- `modules/option-cases.ts`
- `scheduler/translators/translate.ts`
- `scheduler/shown-on-date.ts`
- `scheduler/inputshape.ts`

Do not open `docs/handoff.md`, `docs/spec-pages.md`, or other build
sheets to decide anything. The answers are in this file.

---

## Checks when the build is done

```
node --experimental-strip-types scheduler/tests/run-all.ts
npx tsc
```

Say how many tests passed, and whether TypeScript is clean.

On the simulator, not the phone:

- Home shows Birthdays. It opens an empty list of its own.
- + Add saves a name, a date, and at least one chip. The row appears
  on Birthdays only.
- That same row does not appear on Appointments or on Yearly.
- Daily on that date shows it with from Birthdays.
- Help → Repeats → Birthday opens Birthdays’ New, not Yearly’s and
  not Appointments’.
- Help → Repeats → Year still opens Yearly.
- Done on the page moves the date to next year.

---

## What “copy of Appointments” does not copy

These stay different on purpose:

- Saved kind `birthdays`, not `appointments`.
- Date is required.
- It repeats every year. Done advances the date. Appointments’ Done
  still ends an appointment.
- Help has a Birthday choice on the repeating path.
- The Home tile and the from-line say Birthdays.
