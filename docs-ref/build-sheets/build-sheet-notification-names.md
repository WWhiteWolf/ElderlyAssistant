# Build sheet — current notification names

**Read this file and build. Read only the files on the read list. Do not
ask Patrick anything about the design. Every decision here is already
made and is not to be reopened.**

Written at #61-new, 3 September 2026.

If something genuinely is not here, choose the plainest option that
matches the existing code and put it in the build report to Patrick.
Do not widen the job to another naming pass.

**Where you build.** Memory, `elderlyassistant`. Open that folder as the
workspace that holds the files you edit. Run no git command.

---

## What this job is

Replace the retired page names still used by the live notification
machinery. One current name must travel all the way from a saved item,
through the translator and scheduler, onto the phone, back through a
banner tap, and onto Scheduled Reminders.

Daily, Weekly, Monthly, Quarterly, Yearly, and Appointments each get
their own current source. A snooze or delay gets a current source tied
to the same page. This also cures the present fault where a Quarterly
or Yearly banner tap opens Monthly.

Remove the old notification categories, old source aliases, and the
Pets and Orders cleanup entries. There is no compatibility layer.
Patrick is the app's only holder, has reset it to nothing, and has
removed the old storage pages.

**#61-new writes this sheet and does not build this piece. A fresh
session builds it.**

---

## What this job is not

Do not rename storage or history keys. In particular, leave
`my_history`, `week_history`, and `lookahead_history` as they are.

Do not rename the Siri or App Group road. Leave `setMyDayItems`,
`MyDayItem`, the native `myDayItems` key, and the Intent files alone.
That is a separate piece.

Do not change saved reminder kinds. `oneTime` remains the saved kind
and `/onetime` remains its route. Do not migrate saved items.

Do not change reminder times, repeat calculations, lead times, Done,
Snooze, Delay, Skip, Then, Next Day, logging, missed-item handling,
calendar shading, or the order in which a replacement is made.

Keep the visible banner headings **Daily Routine**, **Weekly Chore**,
**Monthly**, **Quarterly**, **Yearly**, and **📋 Reminder: [name]**.
Those are current words, not retired page names.

Memory Test keeps the source `memorytest`. Timer stays isolated.
Bucket List still makes no notification.

Do not perform a one-time purge of old phone reminders. The phone was
reset and there is nothing old to sweep.

---

## The exact source names

Use these source words in notification data and in the first part of
each reminder key:

- Daily base: `daily`.
- Daily snooze: `dailysnooze`.
- Weekly base: `weekly`.
- Weekly snooze: `weeklysnooze`.
- Monthly base: `monthly`.
- Monthly delay: `monthlydelay`.
- Quarterly base: `quarterly`.
- Quarterly delay: `quarterlydelay`.
- Yearly base: `yearly`.
- Yearly delay: `yearlydelay`.
- Appointments: `onetime`.
- Memory Test: `memorytest`, unchanged.

Examples are `daily:a1:20260825`, `dailysnooze:a1:base`,
`monthly:d1:20260914`, and `onetime:t1:r1`.

Remove all live use of these retired source words:

- `myday`;
- `mydaysnooze`;
- `pets`;
- `petssnooze`;
- `myweek`;
- `myweekpostpone`;
- `lookahead`;
- `lookaheaddelay`;
- `todo`;
- `orders`;
- and `orderssnooze`.

The shaped-item source type contains the current reminder kinds:
`daily`, `weekly`, `monthly`, `quarterly`, `yearly`, `onetime`, and
`extended`. Extended is truthful in the common shape even though its
rules produce no wanted reminder.

The translator now accepts only `ReminderItem`. Work out the source
from `item.kind` in one place. The only spelling conversion is saved
kind `oneTime` to notification source `onetime`. Do not infer a source
from a banner title, and do not keep an old source as a fallback.

The shared dated rules may remain shared. They must produce the exact
source for the saved kind, so Monthly, Quarterly, and Yearly no longer
share one notification identity.

---

## The exact banner categories

The complete live category set for these reminders is:

- `routineactions` for Daily and Weekly, including their snoozes;
- `cadenceactions` for Monthly, Quarterly, and Yearly;
- `appointmentsok` for Appointments;
- and `shifteddayactions` for a missing-day occurrence.

Keep the existing buttons and their order. Only the category names
change.

Remove `mydaysnooze`, `petssnooze`, `myweekactions`,
`lookaheadactions`, `todook`, and `orderactions` from the type and
from registration. Remove the dead `postpone1` action handler.

The action identifiers inside the current categories stay as they are:
`done`, `ok`, `skip`, `snooze15`, `snooze30`, `snooze60`,
`delayday`, `delayweek`, `delaymonth`, `then`, and `nextday`.

---

## The housing

In `app/_layout.tsx`, register only the four live categories above.

The shared routine handlers recognise:

- `daily` and `dailysnooze` as Daily;
- and `weekly` and `weeklysnooze` as Weekly.

Daily and Weekly continue to write `snoozedUntil`. The Weekly Done
road still writes its existing history key; storage naming is outside
this job.

The dated Done and Delay roads recognise:

- `monthly` and `monthlydelay`;
- `quarterly` and `quarterlydelay`;
- and `yearly` and `yearlydelay`.

Their existing history key remains unchanged in this job.

Remove the Pets Done branch. Appointments keeps only its OK action.

A plain banner tap lands as follows:

- `daily` or `dailysnooze` opens `/daily`;
- `weekly` or `weeklysnooze` opens `/weekly`;
- `monthly` or `monthlydelay` opens `/monthly`;
- `quarterly` or `quarterlydelay` opens `/quarterly`;
- `yearly` or `yearlydelay` opens `/yearly`;
- `onetime` opens `/onetime`;
- and `memorytest` opens `/memorytest`.

Carry the existing `highlight` item id on every reminder-page landing.
Do not keep a retired source branch.

The Siri section at the top of `_layout.tsx` and the three history
storage keys inside its Done roads are deliberate exceptions. Do not
rename them in this job.

---

## Translation and joining

In `scheduler/inputshape.ts`, replace the retired source and category
unions with the exact current sets above. Rewrite comments around
those fields so they describe the one saved list and current pages.

In `scheduler/translators/translate.ts`, assign current source codes
for every kind and use `cadenceactions` and `appointmentsok`.
Extended carries `extended` in its shaped item and still has no due
time or lead time.

In `scheduler/remindersfor.ts`, the push-back names are:

- `daily` to `dailysnooze`;
- `weekly` to `weeklysnooze`;
- `monthly` to `monthlydelay`;
- `quarterly` to `quarterlydelay`;
- and `yearly` to `yearlydelay`.

Appointments and Extended cannot be pushed back. Represent that
plainly rather than inventing a source for an impossible reminder.

Do not change key construction beyond the new source word. Do not
change trigger construction or reminder depth.

---

## Reconciliation and the queue

`OWNED_SOURCES` contains:

- `daily` and `dailysnooze`;
- `weekly` and `weeklysnooze`;
- `monthly` and `monthlydelay`;
- `quarterly` and `quarterlydelay`;
- `yearly` and `yearlydelay`;
- `onetime`;
- and `memorytest`.

`REMINDER_ITEM_SOURCES` contains the same set without `memorytest`.
That is the set preserved when `reminder_items` cannot be read.

Remove Pets and Orders ownership and their special cleanup comments
and tests. A source outside the current set is treated like Timer:
it is not owned, is not cancelled, is not listed, and counts against
the phone's room.

In `scheduler/queueview.ts`, map each current source directly:

- Daily and its snooze read **Daily** and **Daily — snoozed**.
- Weekly and its snooze read **Weekly** and **Weekly — snoozed**.
- Each dated base reads its own page name.
- Each dated delay reads that page name followed by **— delayed**.
- `onetime` reads **Appointments**.
- `memorytest` reads **Memory Test**.

Use `PAGE_LABELS`. Remove the old title-based Look Ahead fallback;
the source now says which dated page owns the reminder. A source not
in the current map does not become a row.

---

## Fault names

The live scheduler now reports only `reminder_items`, `weekly`, and
`memtest_session`.

In `scheduler/health.ts`, remove the branches for `my_routine`,
`pets_feeds`, `week_routine`, `lookahead_items`, and `todo_tasks`.
There are no old fault records to preserve.

Keep:

- `reminder_items` as **reminders**;
- `weekly` as **Weekly**;
- and `memtest_session` as **Memory Test**.

Rewrite the Weekly reset comment in current words. Do not rename the
health storage keys in this job.

---

## Comments in the notification road

Remove retired page names from comments in the files on the edit
list. Describe Daily, Weekly, the dated cadences, Appointments, and
the one saved list as they work now.

Do not turn this into a whole-project comment cleanup. Old names in
storage, Siri, native code, theme archaeology, edit-screen history,
Settings, and Memory Test are explicitly left for their own pieces.

---

## Read and edit

- `app/_layout.tsx`
- `app/reminders.tsx`
- `constants/page-names.ts`
- `scheduler/inputshape.ts`
- `scheduler/translators/translate.ts`
- `scheduler/remindersfor.ts`
- `scheduler/reconcile.ts`
- `scheduler/scheduler.ts`
- `scheduler/queueview.ts`
- `scheduler/health.ts`
- `scheduler/dailyreset.ts`
- `scheduler/weeklyreset.ts`
- `scheduler/stillwanted.ts`
- `scheduler/leadmoments.ts`
- `scheduler/clocktimes.ts`
- `scheduler/tests/apply.test.ts`
- `scheduler/tests/health.test.ts`
- `scheduler/tests/leadmoments.test.ts`
- `scheduler/tests/queueview.test.ts`
- `scheduler/tests/reconcile.test.ts`
- `scheduler/tests/remindersfor.test.ts`
- `scheduler/tests/stillwanted.test.ts`
- `scheduler/tests/translatorcadence.test.ts`

No other production or test file is edited.

---

## Read only

- `constants/page-names.ts` is also the canonical source for visible
  page labels; do not duplicate those labels elsewhere.
- `modules/reminder-types.ts` holds the saved kinds. Do not change it.
- `scheduler/types.ts` holds `WantedReminder` and `makeKey`. Their
  shapes do not change.
- `scheduler/apply.ts` holds the replacement order. It does not change.
- `scheduler/readers/memorytest.ts` shows the unchanged Memory Test
  source.
- `scheduler/tests/memorytest.test.ts` must pass unchanged.
- `scheduler/tests/run-all.ts` is the current test inventory. No test
  file is added or removed in this job.

Do not open another build sheet, build history, the Reminder Engine
folder, Timer implementation, backup implementation, CadenceListPage,
the App Group module, native folders, or Siri plugins. This sheet
already holds the boundary.

---

## Checks

Before editing, run:

`./node_modules/.bin/tsc --noEmit`

The handoff reports four existing errors in `scheduler/leadmoments.ts`
and `scheduler/scheduler.ts`. Save the exact starting messages. After
the build there may be no new or changed error. Do not repair an
unrelated starting error.

Run after the build:

`node --experimental-strip-types scheduler/tests/run-all.ts`

The starting result after the old-reader removal is 300 of 300. This
job renames expectations rather than removes coverage, so all 300 must
pass.

The checks must establish:

- every live kind produces the source named in this sheet;
- Daily and Weekly snoozes use their current sources;
- each dated delay keeps the source of its own page;
- Appointments uses `onetime` and `appointmentsok`;
- Bucket List still produces no reminder;
- a body tap reaches the correct current page;
- failed `reminder_items` reading preserves every current item source;
- Pets and Orders are not owned or listed;
- Scheduled Reminders shows only current page names;
- the current buttons and firing times are unchanged;
- and Memory Test is unchanged.

Search the edited source and test files for every retired source and
category word listed in this sheet. None may remain.

Old-name matches are expected only in the explicitly deferred storage,
Siri, native, backup, theme-history, edit-screen-history, Settings,
Memory Test, and reminder-item comments. Report them as the named
later pieces rather than changing them.

No simulator or phone load belongs to this job unless Patrick asks
for it separately.

---

## House rules

- Make no compatibility alias and no migration.
- Keep one source vocabulary from translator to banner return.
- Reuse `PAGE_LABELS` for visible page names.
- Add no dependency.
- Run no git command.
- Do not edit documentation.
- Report only what differed from this sheet, what turned up, and what
  remains.
