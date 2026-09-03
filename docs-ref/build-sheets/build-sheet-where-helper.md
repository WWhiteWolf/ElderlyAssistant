# Build sheet — the Where? helper

**Read this file and build. Read only the files on the read list. Do not
ask Patrick anything about the design. Every decision here is already
made and is not to be reopened.**

Written at #57-new, 3 September 2026.

If something genuinely is not here, choose the plainest option that
matches the existing code, and put it in the build report to Patrick
rather than writing it into any document. Do not stop to ask.

**Where you build.** Memory, `elderlyassistant`. Open that folder as
the workspace that holds the files you edit.

---

## What this job is

A short helper that guides a person to the right New form. It asks one
question at a time and takes two or three taps to reach the form. The
helper decides where the item belongs. The New form still decides how
the item is set.

There are two ways in:

- A new **Where?** badge on Home.
- The unused right-hand header button on the calendar month.

The helper itself is one popup. A choice replaces the current question
inside that popup. The final choice opens the existing New form for the
chosen kind. It does not open the chosen list first, and it does not
create another New form.

**#57-new builds this. This sheet’s author does not touch code.**

---

## What this sheet is not

No helper button on Daily, Weekly, Monthly, Quarterly, Yearly,
Appointments, Bucket List, or Options. No + Add on the calendar day
list. No date from the calendar rides into a New form.

No new saved kind. No saved-item migration. No scheduler, engine,
banner, Siri, reminder wording, log, Done, Snooze, Options, or backup
change.

No rearrangement or removal of today’s other Home badges. Memory Test
is still temporary, but it does not come out in this job. Timer Alerts
and Shopping List do not change.

Fine-tune choices do not move into the helper. They remain on the New
form, on Options, or later in the User Guide.

---

## The questions and landings

The first question is:

**Does this item repeat?**

Its choices are **Repeats** and **Does not repeat**.

**Repeats** replaces the first question with:

**Does this item occur every:**

The five choices and their landings are:

- **Every day** opens Daily’s every-day New form.
- **Week** opens Weekly’s New form.
- **Month** opens Monthly’s New form.
- **Quarter** opens Quarterly’s New form.
- **Year** opens Yearly’s New form.

**Does not repeat** replaces the first question with:

**Is that for today?**

**Yes** opens Daily’s existing One Time for today form. It has today’s
date, the four reminder choices 30 min., 1 hour, 2 hours, and Time of,
and time zone as its only + OPT case. The saved kind remains `oneTime`.

**No** replaces that question with:

**Is this an occurrence that has a specific time and date, like an
appointment? Or is it the rare item with no deadline or due date, like
a Bucket List desire?**

The choices are **Appointment** and **Bucket List**. Appointment opens
the ordinary Appointments New form. Bucket List opens the ordinary
Bucket List New form.

There are eight final landings: five repeating kinds, One Time for
today, an ordinary Appointment, and Bucket List.

Every question has Cancel. There is no second form and no extra
confirmation between the final answer and New.

---

## The Home badge

Add **Where?** as another badge in `app/home.tsx`. Its picture is the
emoji compass 🧭. It follows Daily in the normal Home order and opens
the helper.

Keep the existing landscape reordering, which puts Memory Test last.
That naturally leaves Where? and Memory Test together at the bottom.
Do not tighten the grid, shrink badges, or move another badge to keep
three rows. Patrick will rearrange and remove some badges in later
work.

Put the visible name in `constants/page-names.ts` with the other page
names. The helper is not a `ReminderKind`, and `pageLabelFor` must
continue to accept saved reminder kinds only.

---

## The calendar button

In the calendar’s month header, replace the unused right-hand
`HeaderButton` with **Where?**. It opens the same helper route as the
Home badge.

The day-list header keeps an empty right-hand button. There is no
Where? and no + Add while a day list is open.

The calendar screen remains underneath the helper. Returning from the
helper or from a saved New form shows the same viewed month. No viewed
month or selected date is handed to the New form.

---

## Navigation is a stack, not a patch

Model the journey as three ordinary layers:

1. Home or the calendar month.
2. The helper popup.
3. The existing New form.

Create the helper as its own transparent Expo Router screen,
`app/where.tsx`. Register it in `app/_layout.tsx` as a transparent
screen with no native header and transparent content. Draw the shaded
overlay and popup card inside that screen. This lets the helper remain
as the real layer beneath New without a root-level `Cover` staying on
top of New.

Home and the calendar push `/where`. The helper’s Cancel pops one
layer and reveals the exact Home or calendar screen beneath it.

A final helper choice pushes `/item-edit`. Header Back and Cancel on
that New form pop one layer and reveal the helper at the question from
which the form was opened.

After a successful Save, pop both New and the helper. This reveals the
exact Home or calendar screen where the journey began. Do not rebuild
that origin from a route name, do not send the person to the chosen
list, and do not leave the helper showing after Save.

Validation does not count as a Save. Missing Name, an invalid date or
time, and the No Reminder Set confirmation continue to behave as they
do now. Only a completed save closes both layers.

Use a clear route value to tell `item-edit` that it was opened by the
helper. That value controls only how Back, Cancel, and successful Save
close the stack.

---

## One Time for today is an explicit form context

Today `item-edit` uses `returnTo === 'daily'` for two separate facts:
where navigation goes and whether a `oneTime` form has Daily’s
for-today shape. Separate those facts.

Add one explicit form-context route value for **One Time for today**.
Use that value for:

- setting today’s date on a new item;
- showing only 30 min., 1 hour, 2 hours, and Time of;
- limiting + OPT to time zone;
- preserving the same shape when a One Time item is edited from Daily.

Daily must pass that context when it opens a new One Time for today
item and when it opens an existing `oneTime` item from Daily. The
helper’s **Yes** landing passes the same context. No other landing
passes it.

`returnTo` keeps its navigation meaning for ordinary page entry. Do
not add another test of `page === 'daily'` as a shortcut, and do not
make a duplicate One Time form.

Existing direct entry remains unchanged:

- Daily’s every-day Save and Cancel return to Daily.
- Daily’s One Time for today Save returns to Appointments; Back and
  Cancel return to Daily.
- Each cadence page’s own + Add returns to that page.
- Editing from the calendar day list returns to that day list.

The helper journey overrides only its own stack closing: Back or
Cancel returns to the helper, and Save returns to the opening Home or
calendar screen.

---

## The popup

Use the existing + Add popup’s colors, card, choice buttons, type
sizes, spacing, shaded background, and Cancel look. The visible
question takes the title position. Do not add explanatory paragraphs
or a progress display.

The long Appointment-or-Bucket-List question and all its controls must
fit in portrait and landscape. If the short landscape height requires
scrolling inside the card, keep the question and Cancel reachable.
Do not make the whole app screen scroll behind the popup.

Each new opening starts at **Does this item repeat?** Returning from a
New form by Back or Cancel shows the same helper question and choices
that launched that form. Cancel from there closes the helper.

---

## What to build

**One new helper screen and six existing files edited.**

- **New:** `app/where.tsx` — the transparent helper popup, its four
  question stages, and all eight landings.
- **Edit:** `app/home.tsx` — the 🧭 Where? badge after Daily and its
  route.
- **Edit:** `app/calendar.tsx` — Where? in the month header only.
- **Edit:** `app/_layout.tsx` — register the transparent `where`
  screen.
- **Edit:** `app/item-edit.tsx` — explicit One Time for today context
  and the helper journey’s one-layer Cancel and two-layer Save.
- **Edit:** `app/daily.tsx` — pass the explicit One Time for today
  context instead of making `item-edit` infer it from `returnTo`.
- **Edit:** `constants/page-names.ts` — the one visible source for
  **Where?**.

**Nothing else changes.** In particular, do not edit `Cover`,
`PageFrame`, `CadenceListPage`, reminder item types, option cases,
storage, scheduler files, generated Expo router types, or another
Home module.

---

## The read list, which is separate from what you may edit

**Read and edit:** `app/where.tsx` (new), `app/home.tsx`,
`app/calendar.tsx`, `app/_layout.tsx`, `app/item-edit.tsx`,
`app/daily.tsx`, and `constants/page-names.ts`.

**Read only, do not edit:**

- `components/Cover.tsx` — `CoverRoot` draws registered children above
  the whole Stack. This is why the helper is a transparent route
  rather than a visible `Cover` left mounted beneath New.
- `components/PageFrame.tsx` — `HeaderButton`, `useLandscape`, and the
  existing landscape behavior used by Home and the calendar. Do not
  change the shared frame.
- `components/CadenceListPage.tsx` — direct + Add routing and the
  cadence pages’ established return behavior. Do not put Where? there.
- `constants/Themes.ts` — the theme values used by the existing popup.
  Use the active theme; do not add fixed light or dark colors.

The visual popup pattern is the `showAddPopup` block and its matching
styles in `app/daily.tsx`. That pattern imports `Cover` from
`components/Cover.tsx`, `TouchableOpacity`, `Text`, and `View` from
React Native, and `useTheme` / `Theme` from `constants/Themes.ts`.
Copy its appearance. The new route supplies the layer, so do not
import or mount `Cover` in `app/where.tsx`.

Do not open another build sheet, the Reminder Engine folder, old
reader screens, Timer, Memory Test, Shopping List, scheduler
implementation files, or build history. This sheet already holds the
answers.

---

## Checks

Run:

`./node_modules/.bin/tsc --noEmit`

Expo’s generated route list already predates Scheduled Reminders and
may also not know the new `/where` route until the next build. Do not
edit generated router files. Use the same local `Href` cast already
used for `/calendar` if the new route alone needs it, and report the
known generated-list result plainly.

Run:

`node --experimental-strip-types scheduler/tests/run-all.ts`

The starting result is 489 of 489. This work does not change the
scheduler, so all 489 must still pass.

On the simulator, check:

- Where? follows Daily in portrait and sits with Memory Test at the
  bottom in landscape.
- Home and the calendar month open the same helper at its first
  question.
- All eight final choices open the correct existing New form.
- One Time for today has today’s date, its four reminder choices, and
  time zone only.
- Back and Cancel from New return to the same helper question.
- Cancel from the helper returns to the exact Home or calendar screen.
- Save returns directly to that same opening screen and leaves the
  helper closed.
- The calendar keeps its viewed month, passes no calendar day into
  New, and shows no Where? on a day list.
- Direct + Add and edit journeys that did not begin in the helper
  still return exactly where they did before.
- The helper card remains usable in portrait and in the allowed
  landscape turn.

No phone load belongs to this job unless Patrick asks for it
separately.

---

## House rules

- Comments are full sentences in plain English and explain why.
- Reuse the existing forms and theme. Add no dependency.
- Keep the route values about navigation separate from the value about
  the One Time for today form shape.
- Do not broaden this into Home cleanup or removal of temporary pages.
- Report only what differed from this sheet, what turned up, and what
  remains.
