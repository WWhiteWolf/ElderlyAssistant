# Build sheet — the calendar page

**Read this file and build. Read only the files on the read list. Do not
ask Patrick anything about the design. Every decision here is already
made and is not to be reopened.**

Written at #48-new, 1 September 2026. The picture this sheet copies is
`docs-ref/chalendar.md`. Do not open that file; the answers you need
are here.

If something genuinely is not here, choose the plainest option that
matches the existing code, and put it in your build report to Patrick
rather than writing it into any document. Do not stop to ask.

**Where you build.** Memory, `elderlyassistant`. Open that folder as
the workspace that holds the files you edit.

---

## What this job is

A **calendar page** of its own, reached by a Home button like Daily
and the rest. It shows one month, filling the screen except the
header. Dated items and their recurrences appear on the days they
fall. A tap on a day opens that day’s list. A tap on an item there
opens the item the way any page does. Header Back on the item returns
to that day’s list. Header Back on the day’s list returns to the
month.

The Options row **Calendar shading** comes out. That was the buried
calendar you reached by tapping through Options. The page replaces it.

**#49-new builds this. This sheet’s author does not touch code.**

---

## What this sheet is not

No path from the calendar into Daily, Weekly, or the other views.
No Done or Snooze on the calendar or on that day’s list. Those are
marked on the item after a tap opens it. No + Add on the calendar.
The calendar does not hold items; it shows them. Do not add Calendar
to the + Add where-popup.

No every-day Daily items. No Extended items. No slide to change
month. No 24-hour clock change. No engine rewrite. No banner
landings. No phone build. No Timer. No Memory Test.

Do not connect `floatDay`. Do not treat `shiftedChoice` as a recipe.

---

## The decisions this job uses

**Home.** A tile labelled Calendar, same size and type as Daily. Icon
📅. Put it with the reminder tiles, next to Daily. `handleTile` opens
`/calendar`. Copy the tile from `app/home.tsx`; do not invent a new
tile look.

**The month.** When the calendar is opened from Home, it shows the
current month. Arrows change the month. A slide is not the control,
because each day’s box already needs to scroll. The week starts on
Sunday, the same as the Options shade month already does
(`DAY_NAMES` in `modules/reminder-items.ts`). Empty cells pad the
first week and the last, and they are not tappable.

**Fill.** The month fills the screen except the header. Do not put
`Bridge` between the header and the month. Other pages have that
band; this page needs the space.

**Header, portrait.** The header stays at the top of the phone, copied
from `components/CadenceListPage.tsx`: Home on the left, title in the
middle. Month view title is the month name and year, with an arrow
each side of that name to change month. No + Add. Day-list title is
that day’s date. Day-list left button is Back, not Home.

**Header, landscape.** The header stays at the top of the phone, which
is the **right side** when viewing. The month still fills the rest.
Keep the words upright and readable; do not turn the header text on
its side. Home, the month name, and the arrows stay in that right-hand
strip. This is the hard part of the job. Portrait uses `SafeAreaView`
`edges={['top']}` as the other pages do. Landscape uses the right
edge. Width greater than height is landscape.

**What appears.** An event is any saved item that holds a date, and
each time that item recurs in the month. Skip `kind === 'daily'` and
`kind === 'extended'`. Use `shadedDaysForItem` in
`modules/reminder-items.ts` for the year and month on screen. That
function already asks the engine which days the item falls on,
including a last-existing day and a holiday move. Do not copy
`ShadeMonth` as the page. Do not rewrite `shadedDaysInMonth`. If a
kind’s days look wrong, say so in the build report; do not “fix” the
engine.

**Each day’s box.** The date number, and a tight list of each item
name, one line only, with whatever number of characters will fit on
that line. Do not wrap. The list in the box scrolls vertically, and
horizontally if practical. If horizontal scroll fights the vertical
scroll, keep vertical and one-line names, and say so in the build
report. Names in a day’s box are not tap targets. The whole day is
the tap. Sort names by time when the item has `hour` and `minute`,
then by label.

**A tap on a day** brings up that day’s events. It does not open
Daily or any other page. An empty day still opens, with an empty
list.

**That day’s list.** Names only. A tap on a name opens
`/item-edit` with that item’s `id` and `kind`. No Done. No Snooze.
No swipe to delete. Header Back returns to the month you were on,
not to Home, and not to the current month if you had moved.

**The item.** The same edit page every other page uses. Done and
Snooze are marked there, as they already are. Header Back on the
item, and Cancel, return to that day’s list, on the same month you
came from. Save does the same. Today `item-edit` sends Back to
`pathFor(returnTo)` and forgets any selected day. Teach it
`returnTo=calendar` plus the month and day you came from, and have
the calendar open again on that day’s list. Do not send anyone to
Daily.

**The Options calendar comes out.** Remove the **Calendar shading**
case (`id: 'shading'`) from `OPTION_CASES` and from `CONNECTED_IDS`
in `modules/option-cases.ts`. Remove the shading switch, `ShadeMonth`,
and the `shadedDays` prop from `components/OptionCaseBody.tsx`. Drop
`shadedDays` from `components/ScreenOptionsSheet.tsx`, from
`app/options.tsx`, and from `app/item-edit.tsx`. Leave the saved
field `shadeCalendar` on items; do not migrate it off. The calendar
page does not read that field. It shows every dated item’s days
whether or not shading was on.

---

## What to build

**One new screen. Home, layout, item-edit, Options, and the shading
case edited.**

- **New:** `app/calendar.tsx` — month view and that day’s list. One
  route. Day-list vs month is state on this screen, restored from
  params after item-edit.
- **Edit:** `app/home.tsx` — Calendar tile, next to Daily.
- **Edit:** `app/_layout.tsx` — register `calendar` with
  `headerShown: false`. Do not change banner landings.
- **Edit:** `app/item-edit.tsx` — `pathFor` and the params type learn
  `calendar`, and carry the viewed month and the selected day so Back
  and Save land on that day’s list.
- **Edit:** `modules/option-cases.ts` — shading case out.
- **Edit:** `components/OptionCaseBody.tsx` — shading body out.
- **Edit:** `components/ScreenOptionsSheet.tsx` — `shadedDays` out.
- **Edit:** `app/options.tsx` — the preview that existed only to feed
  that shade month, out.

**Nothing else changes.** No scheduler file. No translator. No
`modules/reminder-items.ts` except calling `loadReminderItems` and
`shadedDaysForItem` from the new page. No test in `scheduler/tests`
unless `tsc` forces a type change you already made.

---

## How the days are found

Load the one list with `loadReminderItems`. For the year and month on
screen, for each item that is not `daily` and not `extended`, call
`shadedDaysForItem(item, year, month)`. Each returned day number gets
that item’s label in that day’s box.

Weekly items have a weekday, not a calendar date. The engine still
returns the days in the month that weekday falls on. One Time appears
on its date. Monthly, Quarterly, and Yearly appear on each occurrence
in that month, including a second Thursday and a Wednesday after the
6th when those are set.

Do not show an item on a day the engine did not return.

---

## Returning from the item

`item-edit` already takes `id`, `kind`, and `returnTo`. Add params
for the calendar’s viewed year and month, and for the selected day’s
year, month, and date. Use those names in both files, in full English
if the router allows, otherwise the shortest clear set:
`returnTo=calendar`, `viewYear`, `viewMonth`, `dayYear`, `dayMonth`,
`dayDate`.

`pathFor` must build `/calendar` with those params. Do not default a
missing calendar return to Daily.

When `/calendar` opens with those params, show that day’s list on
that viewed month. Header Back from there clears the selected day and
keeps the viewed month. Opening from Home with no params shows the
current month and no day list.

---

## The read list, which is separate from what you may edit

**Read and edit:** `app/calendar.tsx` (new), `app/home.tsx`,
`app/_layout.tsx`, `app/item-edit.tsx`, `modules/option-cases.ts`,
`components/OptionCaseBody.tsx`, `components/ScreenOptionsSheet.tsx`,
`app/options.tsx`.

**Read only, do not edit:**

- `components/CadenceListPage.tsx` — header, Home, `SafeAreaView`,
  `useTheme` / `makeStyles`. Copy the header look. Do not copy Done,
  Snooze, swipe, log, or + Add.
- `modules/reminder-items.ts` — `loadReminderItems`,
  `shadedDaysForItem`, `DAY_NAMES`, `MONTH_NAMES`. Call them. Do not
  change them.
- `app/weekly.tsx` — how a page is a thin file over shared chrome, if
  you need a reminder. The calendar is not a `CadenceListPage`.
- `constants/Themes.ts` — `useTheme` and `makeStyles(theme)` only.

**Do not open** Memory’s `docs/handoff.md`, `docs/in-flight.md`,
`docs-ref/chalendar.md`, `docs/reminder-shape.md`, `docs/spec-pages.md`,
any other build sheet, Students-Assistant, or the Reminder Engine
folder. This sheet already holds the answers. Do not open
`scheduler/leadmoments.ts`; `shadedDaysForItem` is the call.

---

## House rules

- **Comments are full sentences in plain English** explaining why, in
  the voice of the surrounding file.
- **Run `./node_modules/.bin/tsc --noEmit`** from the
  `elderlyassistant` folder. `npx tsc` can pick up the wrong
  package. Anything it reports is yours. The known
  `.expo/types/router.d.ts` miss for a new screen is the same class
  of thing as Scheduled Reminders; it rewrites on the next build.
- **Run the scheduler suite** —
  `node --experimental-strip-types scheduler/tests/run-all.ts`. It
  was 460 of 460 passing. Nothing here should move that number; if it
  does, the build is wrong.
- **Patrick checks this on the simulator**, so leave the calendar
  openable from Home, in portrait and in landscape.
