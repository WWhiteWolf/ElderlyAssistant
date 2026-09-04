# Build sheet — leftover cleanup

**Read this file and build. Read only the files on the read list. Do not
ask Patrick anything about the design. Every decision here is already
made and is not to be reopened.**

Written at #68-new, 4 September 2026.

If something genuinely is not here, choose the plainest option that
matches the existing code, and put it in the build report to Patrick
rather than writing it into any document. Do not stop to ask.

**Where you build.** Memory, `elderlyassistant`. Open that folder as
the workspace that holds the files you edit. Run no git command.

**#68-new writes this sheet and does not build this piece. A fresh
session builds it.**

---

## What this job is

A cleanup, found by two independent readings of the code and confirmed
by Patrick. Dead exports, a leftover type name, leftover theme tokens
from pages that are gone, one wrong comment, one test that treats a
source name as a category, leftover page words in test titles, and one
stretch of the live design file that still argues a daily item arms two
occurrences.

Nothing here changes how reminders are armed, named, or shown. A
failing test means the change is wrong. Put it back.

---

## What this job is not

- **`scheduler/types.ts` stays as it is.** `source` and
  `categoryIdentifier` remain plain strings. Do not tighten them.
- **Daily's "One Time for today" is protected** (Patrick, #65-new).
  Those words are not an old name. Do not change a test title that
  means Daily's One Time for today.
- **Nothing in `docs-ref` is edited.**
- **`RETIRED_KEYS` stays.** Do not touch backup strip-keys.
- Do not rename comments on live pages. Leftover words in **test names
  only**, and the assertion message in that same test if it repeats the
  leftover page name.
- Do not reopen depth. Do not put `OCCURRENCES_AHEAD` back. Do not
  change `armdepth.ts`.
- Do not clear the standing TypeScript error in `app/settings.tsx`.

---

## Read list

- `scheduler/readers/occurrences.ts`
- `scheduler/remindersfor.ts` — imports `dayStamp` and `sameDay` from
  that file, and `armDepthFor` from `armdepth.ts`. That is why the
  file stays.
- `scheduler/inputshape.ts`
- `scheduler/leadmoments.ts` — imports `LeadTime` from `inputshape.ts`,
  not `LeadFormCode`
- `scheduler/translators/translate.ts` — imports `LeadTime` and
  `BannerButtonsCode` from `inputshape.ts`, not `LeadFormCode`
- `constants/Themes.ts`
- the three files that read `progressTrack` — find them before editing
  the comment
- `scheduler/tests/reconcile.test.ts`
- `scheduler/tests/translatorcadence.test.ts`
- `scheduler/tests/miss-candidates.test.ts` — leftover titles, and one
  fixture label that is asserted. That label changes with its
  assertion. The other leftover tests in this file use the default
  `'Sit'`, which stays.
- `scheduler/tests/run-all.ts` — for the proof command only
- `docs/reminder-shape.md` — the stretch named below only

Do not open other files unless the build report says you had to. If
you had to, name them.

---

## The five changes

### 1. `scheduler/readers/occurrences.ts`

Delete `OCCURRENCES_AHEAD`, the comment above it that argues for
arming two, and `nextOccurrences` with its own comment.

The file stays. `sameDay` and `dayStamp` stay. `remindersfor.ts`
still imports those two. Nothing imports the two you are deleting.

Do not rewrite the file's opening comment. Do not touch `armdepth.ts`.

If a test still calls `nextOccurrences` or reads `OCCURRENCES_AHEAD`,
that test is testing deleted code — delete those tests too. There is
no occurrences test in `run-all.ts` today.

### 2. `scheduler/inputshape.ts`

Delete the unused type `LeadFormCode`.

The field `leadFormCode` is alive. It lives on the `LeadTime` union
as the two words `'offset'` and `'clock'` written in place. Leave
that union, `LeadUnitCode`, `LeadNamedTimeCode`, and every
`leadFormCode` field exactly as they are.

### 3. `constants/Themes.ts` — unused tokens

**Check first, then delete. Stop if the check finds anything.**

Search the live app for bracket access on a theme object that could
hide a read of these tokens — `theme['priorityUrgent']` and the like,
or a computed key into a `Theme`. `Themes[themeName]` inside
`useTheme` is the name picker and is not a hit.

If any bracket access on the theme object is found, **stop**. Do not
delete the tokens. Put what you found in the build report.

If none is found, delete these ten tokens from the `Theme` interface
and from both the light and dark objects:

- `priorityUrgent`
- `priorityUrgentText`
- `priorityNormal`
- `priorityNormalText`
- `prioritySomeday`
- `prioritySomedayText`
- `statusOnHold`
- `statusActive`
- `statusActiveText`
- `statusOnHoldText`

Delete the comments that name `PRIORITY_COLORS` and `STATUS_COLORS`
(the To-Do conversion note and the Project Planner conversion note).
Those pages are gone.

`progressTrack` stays. It is the next change.

### 4. `constants/Themes.ts` — `progressTrack` comment

The comment says progress-bar track. All three uses are
`borderBottomColor`.

Find those three uses first so the new comment is true. Then change
the comment to say it is the bottom-border colour. Do not change the
key, the values, or the three uses.

### 5. `scheduler/tests/reconcile.test.ts`

`'dailysnooze'` is a source name, not a category. The test
"Changing only the buttons replaces the held reminder" puts it in
`categoryIdentifier` so the string differs from `routineactions`.

Use a registered category instead. The live set is:

- `routineactions`
- `cadenceactions`
- `appointmentsok`
- `shifteddayactions`

The helper already writes `routineactions`. Change both the
assignment and the assertion in that one test to **`cadenceactions`**.
Leave the `OWNED` list as it is — `dailysnooze` belongs there as a
source.

---

## Plus: the design file, and leftover words in test names

### `docs/reminder-shape.md`

The live design file already settles depth later in the same chapter:
**one reminder stands per item**, and **depth is one, for every
kind**. Do not rewrite that later stretch. Do not touch
`armdepth.ts`. Do not touch the still-unchecked claim that a
repeating alarm cannot skip one instance.

Correct the earlier stretch that still argues a daily item arms two,
in the same in-place style this file already uses when a later
settlement has made an earlier claim no longer current (see "What is
not decided", where recovery was updated in place rather than left
reading as open).

The stretch to correct is **"How far ahead do we arm — the number,
reopened at #22-new"**, from the lines that still treat two as live
through **"Daily: the only kind where a second earns its place"**.
Those lines must not still read as current. They were true when
written. Depth was reopened at #22-new and settled at one for every
kind. The second copy's work is recovery on opening.

Keep the history of the discussion. Change only what still argues
that a daily item arms two, that the second occurrence is still
needed, or that Daily is the kind where a second earns its place.

### Test names

Change leftover words in test titles only, and in that test's own
assertion message if it repeats the leftover page name.

**Extended** where the code says `bucketlist` becomes **Bucket List**.
Known in `scheduler/tests/translatorcadence.test.ts`:

- `'An Extended item has no due time'` — the assertion already says
  Bucket List
- `'Extended has no Options cases'` — the assertion still says
  Extended

Known in `miss-candidates.test.ts`:

- `'An Extended item is due on no day'`
- `'An Extended item is never a miss'`

Those two use the default fixture label **`'Sit'`**. It **stays**.

**One Time** where it means the Appointments page becomes
**Appointments**. Known in `translatorcadence.test.ts`:

- `'One Time from its own page keeps holidays and time zone'` — the
  assertion still says One Time on its own page

Known in `miss-candidates.test.ts`:

- `'A One Time item is due on its saved date and not the next day'` —
  default `'Sit'`, which **stays**
- `'A One Time item for yesterday left undone is a miss'` — fixture
  label **`'Sit One Time'`** is compared to `m.label`. It **changes
  with its assertion**. Both become Appointments, or the test fails.

**Leave this one.** It is Daily's One Time for today:

- `'One Time for today from Daily has only time zone'`

Scan the other `scheduler/tests` titles for the same two leftovers
and the same rule. Do not hunt comments, docs, or `docs-ref`.

---

## Build steps

1. Bracket-access check on the theme object. Stop that token deletion
   if anything is found.
2. The five code changes, in the order above.
3. The design-file stretch.
4. The test titles (and those tests' own leftover assertion messages).
5. Proof, below.

---

## Proof

Run:

    node --experimental-strip-types scheduler/tests/run-all.ts

**298 of 298 still passing.** A failing test means the change is
wrong.

Then `npx tsc`. Clean apart from the standing `app/settings.tsx`
error. Do not fix that error. Any new TypeScript error means the
change is wrong.

---

## Done when

- `OCCURRENCES_AHEAD` and `nextOccurrences` are gone; `sameDay` and
  `dayStamp` still compile through `remindersfor.ts`.
- `LeadFormCode` is gone; `leadFormCode` still compiles through the
  lead-time union.
- The ten tokens are gone, or the job stopped on bracket access and
  said so.
- The `progressTrack` comment matches `borderBottomColor`.
- The button-change test uses `cadenceactions`.
- The design-file stretch no longer argues that a daily item arms two.
- Test titles no longer say Extended for `bucketlist`, or One Time
  for the Appointments page. Daily's One Time for today is untouched.
- 298 of 298, and TypeScript no worse than the standing settings
  error.
- Nothing in `docs-ref` changed. `types.ts` unchanged. `RETIRED_KEYS`
  unchanged. `armdepth.ts` unchanged.
