# Handoff history — A Place To Remember (Memory)

The session-by-session record of Memory's own chain, in Mystery's
build-history shape: every section heading carries the session
number, the date and a one-line summary of what happened, so the
list of headings is the index. At each session-end docs refresh,
the closing session's section is written HERE; the master hand-off
(App-Docs/master-handoff.md) carries only where things stand and
the one-line index entry.

Session numbering: bare session numbers always mean the old shared
chain, whose record lives in git and in the quiet files; Memory's
own chain is written "#1-new, #2-new, …". No old reference is ever
edited. The chain proper begins at #1-new; before it stand the two
transition sessions recorded below.

## The transition — sessions 153 > 0 and 0 (2026-07-30): the bridge
between the chains

**Where the app stood as its own chain began (from docs/roadmap.md):**
stable, complete in its daily role, and in daily use on the phone
through TestFlight — fifteen screens, phone-verified through #67,
with the App Store release ahead. The name is "A Place To Remember"
on the Home screen, on the Settings version line and in App Store
Connect; the badge under the icon is "Memory". What remains open is
small: the minor quirks tracked in docs/pending.txt, and the
roadmap's five milestone tracks. The #69 badge-reorder is finished —
committed, built, and phone-verified (Patrick's word, #1-new).
The My Week done-date fix is in — marking a chore done now records
the chore's own day — and the structured reminder test checklist
passed in full, every offset and recurrence ticked (Patrick's
word, #1-new).

**Session 153 > 0 — the map.** Settled: Memory mirrors Mystery's
file shapes; NO project hand-off — the master carries Memory's
where-things-stand, exactly as it carries Mystery's; the numbering
rule above; the name and badge; Memory runs in its own chat stream.
pending.txt was part-tidied at Patrick's word: the "Where things
stand right now" snapshot dropped whole, "What's next" / "Needs a
phone test" / "Decisions to make" emptied with their headingsfstanding, the #40/#41 tombstone section deleted, and the
Vault-import item re-homed under "Parked on purpose". The old files
— handoff.md, session-start.md, parked-items.md, publishing.md — go
quiet in place, unedited and undeleted; the archives
(reminder-audit.md and the two Siri briefs) sit the same way.

**Session 0 — the carpentry.** All four pieces done, each on its
own go. CLAUDE.md rewritten to the short-pointer shape, the
numbering written "#1-new, #2-new, …" at Patrick's word; this file
created fresh, its first entry settled as the home of the
transition record; pending.txt's header and title line finished —
the full name, the badge, and the numbering rule's first working
use; and pending.docx decided and built — the txt is Claude's
working copy, the docx is what Patrick himself reads, generated
from the txt and machine-checked word for word (613 words each
side, zero mismatches). pending(X).txt is Patrick's to delete by
hand. Next: Memory's chain begins at #1-new, first filling
pending.txt's "What's Next" with new items.

## #1-new (2026-07-30): "What's Next" filled and the pending list
tidied

**The goal — done.** pending.txt's "What's Next" gained three
items, Patrick's word: the Home screen's Settings gear in symmetry
with the logo; the My Day / Pets Day counters losing the log
pop-up, with editing happening in the log itself; and the Shopping
List's Shopping-mode highlighting stopped and the tiles made
thinner. All three are code changes waiting for #2-new.

**The tidy that came with it.** The five-piece Parked bullet
dissolved: the structured reminder test checklist passed in full
(every offset and every recurrence ticked) and the My Week
done-date fix confirmed — both recorded in the transition section
above; the exact-item tap routing re-homed to "Parked on purpose";
the dark startup flash re-homed to "Decisions to make". The
Planner reminder-fields item and the My Day / Pets banner-Done
item were deleted outright. The "Memory Assist" subtitle item left
pending.txt for docs/publishing.md by Patrick's hand. The #69
badge-reorder loose end was closed in the master hand-off,
recorded above as finished and phone-verified.

**Two rules amended, Patrick's word.** The quiet files are "quiet
until needed": any change to one is noted in the master hand-off's
"Where things stand" for the next one session only, then dropped —
publishing.md's subtitle line is the rule's first use. And
pending.txt's header line is brought up to date at every
session-end refresh, before pending.docx is rebuilt.

**The refresh.** pending.docx rebuilt from the txt and
machine-checked word for word — 548 words each side, zero
mismatches, both rendered pages read back clean. Next session's
goal: #2-new — work the "What's Next" items.

## #2-new (2026-07-31): the three "What's Next" items built and
verified in the Simulator

**The goal — done.** All three items scoped together first, then
built one piece at a time, each on its own go:

- **Home gear (app/home.tsx):** the Settings gear enlarged from
  22 to 32, matching the icon face across the header — made by
  Patrick's own hand in VS Code, one line. (Along the way he
  found VS Code's Auto Save had been hiding the unsaved-changes
  dot, and switched it off.)
- **One-tap logging (app/myday.tsx, app/mollie.tsx):** the
  routine's Log button and the counter + buttons (Coffee, Water,
  Treats) now act in one tap — the item checks off or the count
  rises, the entry writes itself with the time, no notes modal.
  The open/confirm modal pair became a direct logItem function
  in each file; five modal blocks and a dozen state variables
  came out. Notes are added afterward through the log's
  tap-to-edit modal, unchanged. My Week and Look Ahead keep
  their own log modals — outside the item's scope, untouched.
- **Shopping List (app/shopping.tsx):** tapping a row in
  Shopping view no longer selects or highlights it (the
  selection only ever drove Full Inventory's reorder arrows); a
  leftover Full Inventory selection clears when switching to the
  Shopping tab; and the tiles hug the Need/Stocked button in
  both views (vertical padding 12 to 4).

**Checks.** The full TypeScript check (tsc --noEmit) came back
clean after each build step, and a search across the app for
every removed name confirmed nothing still references them.
Patrick ran the app in the iOS Simulator (npm run ios) and
confirmed everything works, then committed the code in-session.

**Filed and noted.** pending.txt's "What's Next" refilled with
two new items, Patrick's word: the "Home" / "+" header-button
pill outlines changed to round on every screen that carries
them; and My Day / Pets Day items no longer requiring a time —
no time set means no reminder. docs/reminder-audit.md (the
archive) deleted by Patrick's hand. The opener-note shape
amended at Patrick's word: folder asks and reads straight
through, both folders, one status report only after everything
is read.

**The refresh.** pending.docx rebuilt from the txt and
machine-checked word for word. Next session's goal: #3-new —
header buttons to round & Days no time set.

## #3-new (2026-07-31): round header buttons and optional Day
times, built and phone-verified

**The goal — done.** Both "What's Next" items scoped together
first, then built in three pieces, each on its own go:

- **Round header buttons (all fifteen screens):** every
  `headerBtn` pill became a true circle — width and height 54,
  radius 27, contents centered — and the labels trimmed to
  "Home" (arrow dropped), "+ Add" on every add-type button, and
  "Back" on Backup. The strays settled by Patrick's word along
  the way: Vault's "+ New" became "+ Add" (its two plus-buttons
  live on separate screens, so no confusion), To-Do's "New Task"
  became "+ Add", and Backup's "← Back" joined as a circle
  reading "Back". memorytest's invisible title-centering spacer
  and Backup's headerSpacer (90 to 54) followed their styles.
- **The shared control (components/DateTimeControl.tsx):** three
  new optional settings — optionalTime, timeSet, onClearTime.
  While the time is optional and none is set, the spinner row
  sits dulled at 12:00 PM, the typed box sits empty, and the
  hint reads "No time set — tap the arrows or type a time to set
  one." The first arrow tap wakes it at 12:00 PM; typing a valid
  time wakes it directly; emptying the box clears the time. The
  #59 empty-box rule is untouched wherever the switch is off,
  and every other caller (To-Do, Look Ahead, Orders, My Week,
  Settings) compiles unchanged. Patrick's word: any page MAY
  adopt the option later, each needing its own save-path work —
  only the two Day pages adopt it now.
- **My Day / Pets Day (app/myday.tsx, app/mollie.tsx):** hour
  and minute may now be null — the row shows just the label, the
  scheduler arms no reminder, "+ Add" opens the modal asleep,
  Edit opens asleep only for a no-time item, and Save writes
  null when the box is empty. Existing saved items keep their
  numbers; nothing migrates.

**The two header fixes from the Simulator test.** Patrick's test
found the taller circles pushed every header down except Look
Ahead's. The cause: Look Ahead's header SafeAreaView carries
edges={['top']}; the rest defaulted to all edges (the old #62
"taller header look", now reversed — the settings.tsx comment
records the change). All thirteen other screens got
edges={['top']}, then paddingBottom: 8 under the buttons, both
matching Home and Look Ahead.

**Checks.** npx tsc --noEmit clean after every piece; a search
across the header labels found only "Home", "+ Add", and "Back";
counts confirmed all fifteen wrappers and all fourteen header
blocks aligned. Patrick verified in the Simulator, then built
through EAS and confirmed everything on the phone. The code
commit is Patrick's, made in-session.

**Filed and noted.** pending.txt's "What's Next" refilled with
three items, Patrick's word: Look Ahead's tile format and its
Snooze changed or dropped; Timer's tile gaining a Stop (Pause) /
Continue (Go) button and a log; the Vault restructuring's
"Home"-to-"Back" button change. His EAS build-and-submit steps
recorded at the end of docs/publishing.md under "Build steps" (a
quiet-file change, noted in the hand-off for one session).
Amendment, Patrick's word: status reports no longer mention
Mystery.

**The refresh.** pending.docx rebuilt from the txt and
machine-checked word for word — 566 words each side, zero
mismatches. Next session's goal: #4-new — take up pending.txt's
"What's Next" items, scoped together at the session start.

## #4-new (2026-08-18): the three notification defects verified
and fixed, six files changed, nothing built

**The goal changed at the top of the session.** The opener named
a new app idea — a college student's assistant — but Patrick set
it aside for the notifications in Memory, which he now uses daily
and calls his biggest gripe. The new app is why Memory was chosen
as its basis, since it will live on the web first. Nothing was
built for it, and one thing was noted about it: Memory's
notifications are native local ones through expo-notifications,
which a web app on the iPhone cannot have at all, so what carries
across to the new app is the thinking rather than the code.

**What arrived.** A session on the web, run because a stuck email
login link kept Patrick off his Mac for a day, saved nothing but
two documents: docs/ElderlyAssistant-notification-findings.md, a
read-only review of the repository naming three defects and one
recorded edge, and a feature draft for the college app. At the
close of the session Patrick made a folder for the new app at the
Projects root and moved the draft and a copy of that chat into it,
as Sudents-Assistant/college-app-draft-v1.md and
Sudents-Assistant/Campus travel.rtf. The folder name went in
misspelled and is to be renamed Students-Assistant; the review
stayed behind with Memory, where it belongs.

**The findings were verified before anything was changed.**
app/_layout.tsx and app/myday.tsx were read end to end. All three
defects are real, and the read corrected the document twice:

- Finding 1 is worse than it was described. The line that cancels
  the fired notification also runs when the past-day guard has
  refused to check the item off, so a leftover banner's Done
  destroys the daily repeat and marks nothing in exchange.
- Finding 2's account of the re-arming is wrong.
  scheduleAllNotifications() is reached through saveData() as
  well as loadData(), so it runs on nearly every action on the
  screen. That sharpens the defect rather than softening it,
  because every one of those actions is also a chance to write
  the stale copy back over a banner's check-off.

**Findings 1 and 3 were taken together as one change in
_layout.tsx.** They sit forty lines apart in the shared My Day /
Pets branch of the done handler and are two halves of one idea —
making that branch behave the way My Week's Done already does.

- The cancelScheduledNotificationAsync(notifId) call was removed.
  My Day and Pets both schedule DAILY repeats, confirmed in both
  files, and a repeating request keeps one identifier for its
  whole life, so cancelling it removed the repeat rather than the
  occurrence.
- The missing sweep was added: the branch now cancels the item's
  pending mydaysnooze and petssnooze one-offs, so nothing nags
  after a Done.
- The judgment call, put to Patrick before the change and agreed:
  the sweep is guarded by the branch's existing past-day check,
  matching My Week, so a stale banner's Done cannot clear
  reminders belonging to today.

**Finding 2 was ruled on rather than patched, then applied to all
five routine screens.** A search found that none of My Day, Pets,
My Week, Look Ahead or Orders ever re-reads storage after
mounting, and that the five carry one template between them. Both
halves of the cure already existed in the app — useFocusEffect in
home.tsx and an AppState listener in _layout.tsx — so nothing was
invented.

- Each screen's load was split in two. refreshFromStorage reads
  the saved lists into the screen; loadData calls it and then
  arms the reminders as before.
- A focus effect on each screen calls the reading half when the
  screen regains focus and when the app returns to the front —
  the case that matters most, since a banner is usually tapped
  with the app closed and the screen may never lose focus at all.
- Patrick's decision, taken on the recommendation: the refresh
  re-reads the saved items only and does not rebuild the
  reminders, so walking onto a screen no longer tears down and
  re-creates a dozen requests before showing anything. He first
  asked whether to try My Day alone for a while; the answer that
  settled it was that the _layout.tsx fix already governs Pets as
  well, so a My-Day-only trial could not have been isolated
  anyway, and two builds would have been needed instead of one.
- Judgment calls named to him: My Week's weekly reset stays
  inside the reading half, because a cycle can roll over while
  the screen sits open; Look Ahead and Orders hand their list to
  their scheduler, so on those two the reading half returns it;
  and at startup each screen now reads storage twice, once on
  mount and once on first focus, left as it is rather than
  guarded with something harder to follow.

**A standing bug was probably cured on the way.** pending.txt's
Look Ahead banner-delay entry describes its own fix as "re-read
on every visit", which is exactly what Look Ahead received. It is
moved to "Needs a phone test" rather than struck, since nothing
has been on the phone.

**Checks.** npx tsc --noEmit clean after each change and again at
the end. No build was run, nothing has been near the phone, and
no behaviour was observed anywhere — Patrick's own word is that
he will only know these work after using them for a while.

**Left open.** Finding 4, the 64-request ceiling, recorded as an
edge and not diagnosed. The comment heading the done handler in
_layout.tsx, which still says it cancels the fired reminder —
untrue of this branch now, and untrue of My Week's since it was
written; raised and not ruled on. And the three "What's Next"
items, untouched, the session having gone elsewhere by Patrick's
word.

**The refresh.** Next session's goal is unset; the phone trial
comes first.

## #5-new (2026-08-21): the phone trial failed, the reminders read end
to end, and a plan written for one scheduler that owns them

**Patrick built #4-new and the notifications still do not work.** That
is the session's starting fact and it overturned the opener's goal. He
opened by saying he had questions rather than answers, and the first
was whether an early choice between two ways of building the app —
one easier, one with more reliable notifications — was why the heart
of his app is broken.

**No such choice is written down anywhere.** `docs/build-history.md`
begins at the transition sessions and says the older record lives in
git and the quiet files; git is never touched here, and the three
quiet files carry nothing about it. What the record does say is that
the app schedules native local notifications through
`expo-notifications` in real EAS builds, which is the only road on an
iPhone that fires alarms with no server and with the app closed. So
the platform was never the easier of two roads. Patrick's answer to
all of it was that he does not care why — he wants it to work.

**The read.** He switched to maximum effort and asked for the whole
thing: `app/_layout.tsx` end to end and the scheduling code in all
eight screens that touch notifications, 7,434 lines in reach. Three
faults came out of it, and two are the same fault in different
clothes.

- **My Day and Pets destroy their own daily repeats.** Their
  `scheduleAllNotifications` cancels every one of that screen's
  reminders, then re-creates one only where `!item.completed`. Checking
  an item off therefore removes its daily repeat outright.
- **Nothing ever puts a lost reminder back.** Only the owning screen
  re-arms, and only while it is open. The housing arms nothing, the
  Home screen arms nothing, and there is no background task registered
  anywhere — verified in `app.json`, which declares no background
  modes. So the loop is: mark done, repeat gone, no reminder next
  morning, no prompt to open the app, still no reminder.
- **Nothing knows the total.** Nine screens add to the iOS queue blind
  to each other. `scheduleBackgroundReminder` in `todo.tsx` adds a
  permanent eight o'clock daily on every save, never cancels the old
  one, and carries no identifier anything can match on.

**My Week does not have the first fault**, arming every chore whether
completed or not, which is both the proof the fix is right and the
shape of it.

**The second bug is separate and is not structural.** The hour stepper
in `components/DateTimeControl.tsx` is wrong across the twelve
o'clock crossing — stepping down from 12:00 PM gives 11:00 PM instead
of 11:00 AM. The control opens at noon, so setting a nine o'clock
morning time by spinning down lands on 9:00 PM. That is Patrick's own
symptom: a banner at nine in the evening for a nine in the morning
item, twice now. The AM/PM button and the typed box are both correct.
Any time set by spinning through that boundary is stored in the wrong
half of the day and needs re-setting after the fix.

**Patrick stopped the session to say so.** Claude had named the
structure as the fault and then went tracing an individual bug without
being asked. His words were that he wants the reminders rock solid,
that he is modelling a second app on this one, and that without
reliable reminders there are no apps.

**The plan is `docs/scheduler-plan.md`, written this session and
decided through.** One module owns the whole queue: readers that turn
each saved list into wanted reminders, one gathered list keyed so
duplicates cannot exist, a reconcile that cancels what is unwanted and
creates what is missing and leaves matches alone, and a budget below
Apple's sixty-four. It runs on launch, on every return to the front,
and after any save. Patrick settled six things into it.

- **Snoozes, delays and postpones get saved to storage** so the module
  owns them. He asked which was better for a seventy-two-year-old who
  needs reminders and an eighteen-year-old freshman who cannot afford
  to space out, and the answer is that a snooze is the second chance —
  the reminder most likely to matter and least likely to be missed
  when it vanishes, being already expected later rather than now.
- **A clean slate every day.** The midnight holdover goes in both
  halves: no stale banner left to tap, and no past-day branch. His
  reason is that a thing not done on time is of no use as a reminder —
  the old behaviour existed for the log, not the reminding, and he
  would rather lose that road. A missed item stays unchecked.
- **The daily reset moves into the module**, since today it only
  happens when My Day or Pets is opened.
- **A reader stays plain** — no storage, no iOS, nothing imported from
  React Native or Expo — so Node can run it without a build. Storage is
  read once at the top of the module. Decided before the readers exist
  because pulling the reads back out later means rewriting all seven.
- **The tests follow Mystery's shape**, read this session at
  `MysteryCluesTracker/engine-tests.html`: a ten-line hand-rolled
  runner, no framework, headless under Node, and tests writing to their
  own storage keys. This project has no test runner and no test files
  at all today.
- **Timer stays outside the module**, being a special case — and
  Patrick said in passing that Timer is not working right now either,
  which is written down and not examined.

**A screen showing the queue goes into Settings**, his call once the
choice was put plainly. Its point is that a missing reminder is
invisible until the moment it fails.

**The ceiling was worked through.** Sixty-four is pending scheduled
requests for the whole app; a repeat is one slot forever, a one-shot
frees its slot on firing, and a delivered banner costs nothing. Memory
will not come near it. Students-Assistant might, which is where the
budget becomes working machinery rather than a guard, and the answer
there is rolling — arm what is near, re-arm as the module runs, which
works only because the app gets opened.

**The warning comes as the item goes in**, Patrick's own call, the
same shape as Students-Assistant's squeeze warning. The line is that
rolling never warns, being ordinary business; the warning fires only
when something asked for will not arrive.

**One decision belonging to the other project came out of it.** The
leave-by alert is dropped rather than deferred, because travel is
already handled by the bus route apps she has. That overturns SA-2 and
SA-5 and is recorded in that project's own files.

**Nothing was built and no code was changed.** The plan's only open
item is the wording of the budget warning and where it shows, left
until there is a screen to put it on.

**Two slips worth keeping.** Claude drifted into tracing the time bug
without being asked, and Patrick named it. And a recommendation about
snoozes was written as law — "one rule, no exceptions" — which he
said sounded like being made to promise. Both were his to catch.

## #6-new (2026-08-21): step 1 of the scheduler plan built whole,
and nothing on the phone yet

**What was built.** Step 1 of `docs/scheduler-plan.md` — the module
with its readers and its reconcile, the test setup, and the housing
calling it on launch and on every return to the front. It went in four
pieces, each one proven under Node before the next was started, and
each piece got its own go.

**The new folder is `scheduler/`.** It sits at the project root rather
than inside `app`, which Expo Router treats as screens, and rather than
inside `modules`, which holds the native Siri piece.

- `types.ts` — the shape of a wanted reminder, the key that names it,
  and a trigger comparison.
- `readers/` — one small function per screen: `myday`, `pets`,
  `myweek`, `lookahead`, `todo`, `memorytest`. Each is handed a parsed
  list and returns plain objects. None of them reads storage, touches
  the phone, or imports anything from React Native or Expo.
- `reconcile.ts` — what to cancel, what to create, what to leave
  alone, and the budget trim. Plain arithmetic and comparison.
- `scheduler.ts` — the one impure file: it reads storage, reads the
  phone's queue, calls the reconcile and applies the answer.
- `tests/` — a ten-line runner in Mystery's shape, no framework, and
  66 tests. They run headless under Node in about a second with no
  build, no simulator and no phone.

**Only two existing files changed.** `app/_layout.tsx` gained one
import and one small effect, which calls the scheduler on launch and
on every return to the front — reusing the shape of the AppState
listener the Siri note already had. And `tsconfig.json` gained one
line, `"allowImportingTsExtensions": true`, because Node needs the
`.ts` on the end of an import in order to run these files without a
build. It is safe because the type check emits nothing; Metro bundles
the app.

**No screen was touched, and both places still arm.** That is what
step 1 is meant to be. It is safe because the reconcile matches by
name, so a reminder that is already right is left exactly where it is
and nothing can be created twice.

**Orders gets no reader (Patrick).** He is removing the Orders page as
soon as it is convenient. The consequence was named rather than
guessed at: the reconcile cancels anything not wanted, so an Orders
page still in the app with no reader would have had its reminders
cancelled on every run. The answer is that the module owns only the
sources it has readers for and leaves everything else where it is,
counting it against the room the phone has — which is exactly how the
plan already treats the Timer.

**The always-arm rule was applied at step 1 rather than step 2.**
Named as a judgment call before it was agreed. The My Day and Pets
readers ignore whether an item is checked off, because a daily
reminder's next firing is tomorrow and tomorrow the item needs doing
again. Writing the readers the old way would only have meant rewriting
them one step later.

**Each reminder carries its own name and its own firing times inside
it.** The reconcile reads those straight back instead of trying to
interpret the phone's own description of a trigger, which differs
between kinds and between versions. A reminder that cannot be read is
treated as wrong and made afresh rather than guessed at.

**The To-Do background daily now has one name**, so the pile-up cannot
happen again. It was created afresh every time a task was saved and
nothing ever removed the old one.

**Three smaller decisions, all named at the time.** The module checks
that notifications are allowed but does not ask — the screens still do
the asking. The ceiling is sixty-four less eight kept free for the
Timer and anything else not ours, and the eight is Claude's number.
And To-Do's banner sentence, "Due: 06/10/26 at 14:00", is written out
again inside its reader in two short lines, because the app builds it
in `components/DateTimeControl.tsx`, which brings React Native with it
and so cannot be imported by a plain reader.

**Left to their own step, though already saved.** My Week's postpone
and Look Ahead's delay are both in storage and could have been read
now. They were left to step 4, which is where the plan puts snoozes,
delays and postpones together. Both fields are named in their readers
so they are not forgotten.

**One test failed and the code was right.** A To-Do test counting days
back across a month boundary had been given a date already in the
past, and the reader correctly dropped the reminder. The test was
fixed, not the reader.

**Checked rather than assumed.** Whether Metro accepts a `.ts` on the
end of an import was not guessed at: the whole app was bundled with
`npx expo export`, 1,657 modules, and the scheduler is in the output.
The Hermes bytecode step cannot run in Claude's Linux sandbox, which
is a limit of the sandbox and not a fault in the code.

**What is owed is a build and Patrick's phone.** Nothing in this
session has run on a device.

**Patrick asked twice for shorter replies**, the second time after a
report that ran long. Rule 25 was already in the rules; this session
is where it started being applied.

## #7-new (2026-08-21): step 2 built and on the phone, and steps 3
through 8 wanted before the next build

**What was built.** Step 2 of `docs/scheduler-plan.md`. My Day and
Pets no longer schedule their own reminders at all; the module owns
them. Each screen's own scheduling function is gone, its mount-time
call with it, and its save now asks the module to run. Two files
changed, about thirty-six lines out of each and two lines in.

**The always-arm rule was already in.** It went in at step 1, where
both readers ignore whether an item is checked off. So removing the
screens' own scheduling *is* the fix for the silence, and nothing had
to be added for it.

**What deliberately stayed.** Both on-page Snooze buttons, because
they tag themselves `mydaysnooze` and `petssnooze`, which the module
does not own and never touches — snoozes are step 4. Both permission
asks, because the module checks permission but never asks. My Day's
Siri publish.

**The old keyless reminders take care of themselves.** The reconcile
was read to confirm it rather than assumed: a reminder from a screen
the module owns but carrying no name of its own is treated as left
over from the old way and cancelled. So the accumulated My Day and
Pets requests on the phone are swept the first time the new build
runs.

**It is on the phone.** TypeScript clean, 66 of 66 tests passing, and
Patrick built and installed it the same session — build 57. Step 1 was
never separately tested on a device, on his own ruling at the top of
the session: step 2 first, then one phone test covering both. What it
has not had is a day. The real test is the morning after: items
checked off today must still remind tomorrow, which is exactly what
used to go silent.

**A fumble worth recording.** The first build and submit were run from
the `Students-Assistant` folder by mistake, so a Students-Assistant
binary went up to TestFlight. Nothing was harmed — it is a TestFlight
build and is simply never distributed — and the Memory build was then
made from the right folder.

**Orders is dead to him** (Patrick, this session, his own words). It
gets no reader, its scheduling comes out with the rest at step 3, and
its old reminders are swept off the phone for good rather than left
sitting.

**What Patrick decided about the rest.** Told that today's untapped
banner will still be sitting in Notification Center tomorrow, because
the stale-banner sweep is step 7, he said he would need another build
anyway and wants it sooner rather than later. Asked how much of the
plan he wants in before that next build, his answer was "all" — steps
3 through 8, one at a time, each proven before the next starts.

**Step 3's shape is agreed and not started.** My Week, Look Ahead and
To-Do stop setting their own reminders and the module takes them over;
Orders stops with them and its old reminders are swept.

**The session was ended on purpose before step 3.** About four
thousand lines had been read, and steps 3 through 8 are more than that
again — four more screens, the housing, new readers and tests, and a
new Settings screen. Patrick asked whether a fresh start was wanted
and it was.

**Where the session was thin.** It opened with the same false sentence
recorded at Y-47, SA-5 and SA-6 — that the rules files had not arrived
on their own, when both were in front of Claude from the first moment.
Patrick corrected it flatly. Three either/or questions were then asked
against rule 4, each producing a "yes" that settled nothing, and the
last of them made him point out that the session's own sequence was
not hard to follow. He also asked twice for smaller steps and shorter
messages: the whole step-2 read was taken as one bite and reported at
length, and he said plainly that the code detail is not what he needs
to be told.

## #8-new (2026-08-21): step 3 built, Orders taken out of the
reminding, and a live snooze fault found

**What was built.** Step 3 of `docs/scheduler-plan.md`. My Week, Look
Ahead and To-Do no longer schedule anything themselves, and Orders no
longer schedules anything at all. Five files changed — four screens and
the module's owned list — plus one test file. TypeScript clean, 67 of
67 tests passing. Nothing has run on a phone.

**The three screens that keep their reminders.** Each lost its own
scheduling function and its mount-time call, and each save now calls
`runScheduler()` instead — the same shape My Day and Pets took at step
2. Their readers already existed from step 1 and already produce what
those screens produced, so nothing had to be written to replace what
came out.

**Orders needed no new mechanism**, which was the session's one open
question at the start and was answered by reading the reconcile rather
than by building anything. The reconcile cancels a reminder when its
source is one the module owns and it carries no name of its own. So
naming `orders` and `orderssnooze` as owned, while giving Orders no
reader, makes every reminder that page ever set a leftover to be swept
— and with the page no longer arming, nothing brings them back.

**A To-Do banner snooze already buys nothing.** Found while reading the
housing, and not acted on. The snooze is created with `source: 'todo'`
and no name of its own, at `app/_layout.tsx` line 230, where an old
comment explains the choice: To-Do had no reschedule-on-load, so
keeping the plain source was safe. It stopped being safe at step 1,
when `todo` became an owned source — the module now reads that snooze
as a leftover and cancels it on its next run. It is live on build 57
today. Snoozes are step 4, so it was left alone and written down.

**Three things stayed that the plan would have taken out.** To-Do's
`cancelReminders` and Orders' `cancelForItem` both match by item rather
than by source, so they clear a pending banner snooze as well as a base
reminder; the module cannot do that part until snoozes are saved, so
removing them would have lost the cleanup. Look Ahead's and Orders'
save points each had a line that cancelled a delay and re-armed in the
same breath — the cancelling stayed and only the re-arming came out.

**One test changed its mind.** `An Orders reminder is left alone while
the page is still there` asserted exactly what step 3 reverses, so it
became `An Orders reminder is swept off the phone`, and a second was
added for Orders snoozes. That is the sixty-seventh test.

**How the session ran.** The read was named and sized before it was
done — the scheduling paths in four screens and the reconcile's
ownership test, rather than the four screens entire, which would have
been 3,663 lines. The Orders question was raised as unanswered at the
start rather than guessed at, and answered from the code. Patrick asked
at the close whether a fresh start was wanted for step 4 and it was:
step 4 lives mostly in the housing, where about six hundred of
`_layout.tsx`'s six hundred and forty-eight lines are the seven sets of
banner buttons and the handler beneath them.

## #9-new (2026-08-21): the first half of step 4 — My Week's postpone
and Look Ahead's delay come under the module

**What was built.** The first of three pieces of step 4 in
`docs/scheduler-plan.md`. My Week's postpone and Look Ahead's delay are
now derived from the saved data like everything else, so nothing on
either page or in the housing arms them by hand. Five files changed —
two readers, the module's owned list, two screens and the housing —
plus two test files. TypeScript clean, 81 of 81 tests passing. Nothing
has run on a phone.

**Step 4 was split into three uneven pieces**, because the four screens
that make these one-offs were not in the same state at all. My Week's
postpone and Look Ahead's delay were already written down — a postpone
stamps `postponedTo` on the chore, a delay stamps `delayedUntil` on the
item, and both readers already read the field and deliberately did
nothing with it. My Day's and Pets' snoozes are written down nowhere.
To-Do's snooze is the one #8-new found buying nothing. Orders needs
nothing, the page being dead and its snoozes already swept. So the
piece with the record already in place went first.

**A snooze will be recorded on the item, and this was Claude's call.**
Patrick handed the decision over rather than making it. The reason is
that it costs nothing new: the reader is already handed that screen's
list, so there is no new plumbing and no second pattern for the same
idea; a snooze dies with its item instead of being orphaned when the
item is deleted; and the screen can show it, where a snooze today shows
nothing at all. It settles the shape of the second piece before that
piece is begun.

**The two readers now emit the one-off.** `readMyWeek` gained a `now`
argument, which it never had, so it can tell whether a postpone is
still ahead; `readLookAhead` already had one. Each emits its one-off
under its own source — `myweekpostpone` and `lookaheaddelay`, the tags
the app has always used and the ones a tapped banner still routes by —
with the key's third part `base`, one stamp meaning one wanted reminder
under one name. Both join `OWNED_SOURCES`. A one-off whose moment has
already gone is dropped, the same rule Look Ahead's own date already
followed.

**Look Ahead's two reminders became independent.** The base was
previously emitted only inside a `continue` that skipped the whole
item once its date had passed. That is the ordinary case for a delay —
the reminder fired, and Delay was tapped on it — so the skip had to
stop covering the delay. An item can now want both, or the delay
alone.

**One judgment call, and it changes a banner.** The banner's "+1 Day"
armed `myweekactions` while the page's own postpone armed
`routineactions`, so the same act produced two different button sets
depending on where it was made. One reader can only send one. It went
to `routineactions`, matching the page and the chore's own weekly
reminder. A postponed chore's banner therefore shows Done, OK, Skip and
the three Delays instead of Done and "+1 Day", and can no longer be
pushed a second day from the banner — which a postpone made on the page
never could.

**The housing stopped arming Look Ahead as well.** The Look Ahead
`done` handler was still cancelling the item's base and delayed
reminders by hand and re-arming its next date, which is scheduling in
the housing and belongs to step 3's intent rather than step 4's. About
twenty-five lines became one call to `runScheduler()`. My Week's `done`
handler kept its snooze hunt, `myweeksnooze` not being owned yet, and
lost only its postpone half.

**What came out.** `cancelPostpone` in `app/myweek.tsx` and
`cancelDelays` in `app/lookahead.tsx`, and every call to them — five
between the two — because clearing the stamp and letting the module run
does the same work. Two `SchedulableTriggerInputTypes` imports fell out
of use with them.

**Fourteen new tests, not a few.** Sixty-seven to eighty-one. They
cover the moment the one-off fires, a one-off already gone, one due
this very minute, the base surviving alongside it, the words and
buttons matching, and two items never sharing a key — plus the Look
Ahead case where the item's own moment has passed and the delay is the
only thing left to arrive.

**How the session ran.** It opened with the plan read and no report,
which Patrick stopped. He then asked whether the plan is best practice
overall and the answer ran too long; his instruction is recorded as the
shape to use — the answer and its caveat, then stop. Asked where a
snooze should be recorded, he handed the decision back with "You tell
me", which is the SA-6 finding again: he would rather Claude work
things out with him than sit asking what he wants. He called for the
fresh session himself at the close.

## #10-new (2026-08-21): the second piece of step 4 — My Day's and
Pets' snoozes come under the module

**What was built.** The second of three pieces of step 4 in
`docs/scheduler-plan.md`. All four Snooze buttons — the two on the
pages and the two on the banners — now write the snooze down on the
item instead of putting a reminder straight on the phone and forgetting
it. Seven files changed: two readers, the module's owned list, two
screens, the housing, and two test files. TypeScript clean, 93 of 93
tests passing. Nothing has run on a phone.

**The shape is the postpone's, copied exactly.** A `snoozedUntil` field
joins `completed` on the My Day item and the Pets feed, in the same
shape `postponedTo` and `delayedUntil` already had. Both readers turn
that stamp back into a reminder while the moment is still ahead, both
gained the `now` argument they needed to tell whether it is, and
`mydaysnooze` and `petssnooze` joined the owned list. One stamp per item
means one wanted reminder under one name, so snoozing twice moves the
one reminder rather than leaving two behind — which is the fault the
piece existed to cure.

**The one visible change is a line on the row**, reading "Snoozed till:
4:15 PM" under the item's name while a snooze is set. Both the wording
and the clock format are Patrick's; the format is the page's own
`format12Hour`, so the line reads like the time already beside the name.
It appears on both screens.

**Three things beyond the described piece had to move with it**, and
they were reported as such. Skip used to cancel the snooze off the
phone by hand, which stops holding the moment the snooze is written
down — the module would read the stamp on its next run and put the
reminder straight back — so Skip now rubs out the stamp for those two
screens and lets the module do the taking off. The on-page Log button
clears the stamp too, not only the banner's Done. And the banner's Done
now asks the module to run, which it never did; it had relied on the app
coming back to the front, which a banner tap does not guarantee.

**One judgment call, Claude's, named before it was made.** A snooze
stands on its own, so an item whose time of day is cleared after it was
snoozed still gets its snooze. The alternative was to drop it, which
breaks a promise the app has already made to the person.

**Twelve new tests.** Eighty-one to ninety-three. They cover the snooze
firing at its own moment, a snooze already past wanting nothing, the
daily repeat surviving untouched beside it, a second snooze carrying the
same name as the first, a snoozed item with no time of day still getting
its snooze, and the two screens' keys never colliding.

**Found and deliberately left alone:** My Week's Skip no longer skips a
postponed chore. It cancels the postpone's reminder off the phone by
hand, but #9-new made the postpone a stamp, so the module puts it back
on the next run. It has never been on a phone, #9-new never having been
built. It was reported to Patrick rather than fixed quietly, a note sits
beside the code, and it belongs to a My Week session.

**How the session ran.** It opened with the same false sentence the
record has now caught at Y-47, SA-5, SA-6 and #7-new — that the two
rules files had not arrived on their own, when both were in front of
Claude from the first moment. Patrick's answer was "That is not true
again", and later "Just maybe stop telling me the untruths". The rule
already covers it; what failed is that it was applied to the code and
not to Claude's own account of its session.

Three more misses followed, all of one kind. The proposal was named as
"My Week's postpone", which Patrick read as the button he taps and its
day-long choices, when what was meant was the machinery under it — his
instruction is the durable part: **when a proposal is behind the scenes,
say so up front**. He then said the point had been missed entirely, and
rather than guess a third time Claude asked him what it was, which is
what turned it. And "stamp" was used throughout as though it were plain
English; it is jargon, and he said he did not know what it meant. The
word for what the app does is that it **writes the moment down on the
item**.

What worked: asking him what he meant instead of guessing again, naming
the judgment call and the three unnamed changes in the report rather
than letting them pass, and answering his end-of-session question about
capacity by counting the read — about two thousand lines of documents
and fourteen hundred of code — rather than by feel. He stopped before
the third piece on that count.

## #11-new (2026-08-21): step 4 finished as a removal, and step 5 built

**What was built.** The third piece of step 4 turned out to be a
removal rather than a build, and step 5 followed it in the same
session. Four files changed — the housing, the To-Do screen, the
Memory Test screen and the module's own comments. No test was written
or changed, 93 of 93 still pass, TypeScript is clean, and nothing of
either piece has run on a phone.

**To-Do had no snooze to bring across.** This was the session's real
finding, and it was made by reading rather than assumed. The To-Do
banner carries a single OK button and nothing else, which was
Patrick's own call at #56, so no Snooze can ever be tapped on one. The
snooze code in the housing could only answer a banner carrying the old
`todosnooze` button set, which is registered nowhere in the app. The
To-Do screen has no Snooze button either. There was therefore nothing
to move under the module — only code that could never run.

**That corrects the record.** #8-new recorded that a To-Do banner
snooze "already buys nothing" because the module would sweep it, and
that was carried into `pending.txt` as something live on build 57. It
was never live: the snooze could not be made in the first place, the
button having gone at #56.

**Patrick's reason, and it is the durable part.** A To-Do reminder is
advance warning that something is coming — an appointment fifteen
minutes out, say — rather than a prod to do the task itself. Other
reminders for the same task are still coming along behind it. So the
banner needs nothing but an OK that makes it go away, and a snooze
would defeat the point, because the appointment does not move. He
twice trimmed the comment recording this, his words being that it
"doesn't need to say all that, just the fact that it doesn't need it."
Both comments now say only that To-Do has no need of a snooze and so
carries a single OK button.

**What came out.** The To-Do path in the housing's snooze handler,
including the `isTodo` choices in the title, body, data and category;
the To-Do "Done" branch beneath it, unreachable for the same reason;
and `cancelReminders` in `app/todo.tsx` with both of its calls. That
last one had been kept at #8-new to clear a pending snooze the module
could not see, and it was already idle: it matched on a task id that
only the old way of scheduling ever wrote, so it could no longer find
anything the module had made. The saves that follow a delete or a
completion are what actually clear those reminders.

**Step 5 — Memory Test comes under the module.** The reader and the
owned source were already there from step 1, so this was the same move
steps 2 and 3 made on the other screens: the screen no longer arms its
five-minute recall banner and no longer cancels anything, and its save
asks the module to run instead. One thing differed from the piece as
described — the screen's own cancelling was in three places rather than
two. The third is in the load, where a session left over from another
day is thrown away; with the session gone the module takes any waiting
reminder off by itself, so that became a run of the module too. The
permission ask and the notification handler stayed, as they did on the
other screens.

**Where step 6's warning would live, looked at but not built.** Every
screen that takes an entry funnels through a single save that already
calls the module and waits for it, and the module's answer already
includes the reminders it had to leave out under the ceiling. So the
warning is one line in each of six saves, with no new mechanism. Two
things want settling first: the module answers with nothing at all when
a run is skipped because another is already going, so a save landing at
that moment would have nothing to warn from; and the plan's line
between ordinary rolling, which never warns, and the real case cannot
yet be seen in the code, which reports only that something did not fit.

**Memory Test cannot be tested twice in a day**, checked when Patrick
raised it. The screen looks for a logged entry carrying today's date
and, finding one, shows the score and "Come back tomorrow" in place of
the Start button. Deleting today's entry would bring Start back but
would cost the day's real score, which is what the test exists to
keep.

**How the session ran.** It opened cleanly and Patrick's own note was
read back rather than queried. The session number had to be asked for:
the chat was titled #10-new, a number already spent, and he said the
chat names keep being changed on him — he had gone back and retyped the
labels for #5-new through #10-new by hand. The one real miss was a
report he could not follow, his words being "I don't know what you're
trying to say", after which he stated the To-Do reason plainly himself
and it went into the comments in his words rather than in Claude's.

**Added after the session's docs refresh — the phone.** Patrick rebuilt,
loaded the phone and tested what he could; the build number was not
recorded. Three things passed: the Memory Test's five-minute recall,
which is step 5's own work; a Pets snooze all the way through, which is
step 4's first confirmation on a device; and My Week, his verdict being
that it does it correctly. The morning-after test remains the one that
matters and has still never been run. Three things came out of the
testing and are carried in `handoff.md` and `pending.txt`: the "Snoozed
till:" line cannot be read on either theme, its style using the color
meant for text on a solid button — white on a white row in the light
theme; "+1 Day" has gone from every My Week banner, both reminders now
carrying the shared routine buttons, so `myweekactions` is registered
but never asked for and the `postpone1` branch cannot fire; and Patrick
restated what he wants from a tapped banner, which is the page open and
the item highlighted, no scrolling. He also mixed the two projects for a
moment, the "card" in that conversation being Students-Assistant's
course card rather than anything in Memory — that note belongs to the
other project and is not written down anywhere yet.

**Step 6 built, after the phone testing.** Patrick reopened the session
and asked for it. The budget itself was already running, so the step only
gave it a voice. `scheduler/warn.ts` is new and holds two things: the
wording, in one place rather than typed into six screens, and the check
that decides whether to speak. Each of the six saves — My Day, Pets, My
Week, Look Ahead, To-Do and Memory Test — now hands it the module's
answer. It says nothing on the housing's own runs, which is what makes it
speak as an item goes in and at no other time, and nothing when a run was
skipped because another was already going, a warning missed there costing
nothing since the next save asks again. No test came with it: the check is
one comparison and it raises a pop-up, so it sits outside what Node can
run, and that was said plainly rather than papered over. One judgment
call, Claude's — the Memory Test screen asks the module to run in two
places and only the save warns, throwing away a stale session not being an
item going in. TypeScript clean, 93 tests still pass, nothing on a phone.

The wording and placement were proposed rather than asked about, which is
the durable part of the exchange. Patrick had said plainly that being
grilled instead of helped would be reported, and he was right about the
session: two of the rules that failed — the "X or Y?" question and asking
for what could be worked out — were already written and simply not
attended to. His own diagnosis is the one to carry: too many rules, not
enough paying attention to them, so nothing new was added. The proposal
was accepted as it stood, and it is now recorded in
`docs/scheduler-plan.md`, whose open-questions section is empty for the
first time. One correction went with it: step 8's home was never open —
the pending-queue screen goes into Settings, settled at #5-new — and this
project's hand-off had been carrying it as an open question.

## #12-new (2026-08-21): step 8 built, the plan finished, and the
snoozed line made readable

**Step 8 is in, and with it all eight steps of the scheduler plan.** The
screen is `app/reminders.tsx`, called *Scheduled Reminders*, reached from a
row of that name in Settings under the three reminder times — the home
Patrick settled at #5-new. It lists every reminder the phone is actually
holding, broken under Today, Tomorrow, This Week and Later, soonest first
inside each, and a tap on any row opens a pop-up carrying the whole of what
that reminder is.

**The screen Patrick agreed to is not the screen the plan described.** The
plan asked for a flat list of what each reminder is, which item it belongs
to, when it fires, and the total against the ceiling. What he wanted, in
his own words, was a list he could use to know which one to go to if
something didn't work, and then tap for the details. That reshaped it into
two levels rather than one, and it is the better shape: the list stays
plain and scannable, and everything technical moves behind a tap. Six
things go in the pop-up — the item's name, the page it comes from, when it
fires and whether it repeats, when it was last due and when it is next due,
the exact heading and sentence the banner will show, and the buttons it
carries. He was asked which of the six he would leave off and answered
none.

**He asked whether it could show the last time a reminder actually fired,
and the answer is no.** The installed notification library offers two
questions only: what is still waiting to fire, and what is sitting in
Notification Center right now. There is no history an app can read — a
dismissed banner leaves no trace. The app could write its own record, but
only of firings it witnessed, meaning it would miss the exact case worth
having: one that fired while the app was closed and was never tapped. He
dropped it once the cost was clear. What went in instead is arithmetic and
free: when a reminder was **last due** and when it is **next due**, worked
out from its own trigger. It answers his real question by a different road
— a repeating reminder missing from the list is a problem, one sitting in
the list properly armed means the app did its part, and a one-off that has
gone is simply spent.

**Timer alerts are off the list, and his reason is the durable part.** The
Timer is for short stretches, under half an hour or so — a pot left boiling
on the stove, something you walk away from and must not forget. It does not
go anywhere and it does not need looking up on a quiet afternoon; it simply
reminds you it is there. So its alerts are excluded from the list but still
counted in the sentence at the foot, because they do take up room on the
phone. That is what the module's eight reserved slots have always been for.

**The best practice was looked up rather than recalled**, at his asking.
Apple ships no pending-notifications screen, so there is no convention for
this one to copy; what was borrowed comes from two adjacent places. Apple's
guidance on lists supports the grouped shape — rows under a heading that
gives them their context, with a footer after the last row — which is why
the ceiling is a plain sentence at the foot rather than a number in a
heading. And the writing guidance for older users is the firm part: plain
language, no jargon, no acronyms, text labels rather than icons alone, and
touch targets of at least 44 by 44. "Queue", "pending" and "scheduler" all
fail that test, which is how the row came to be called *Scheduled
Reminders* with the hint line *See what the app is set to remind you
about*.

**What was actually built.** A new plain file, `scheduler/queueview.ts`,
holds the grouping, the last-due and next-due arithmetic, the page names and
every sentence the screen says — so Node tests all of it. Forty-three new
tests, 103 to 146, all passing. `readQueue` in `scheduler.ts` stopped
throwing away the item's name, its id, the banner's heading and sentence and
its buttons, and `QueueEntry` gained those five optional fields; the
reconcile never looks at any of them. One judgment call, Claude's, named
before it was made: the banner's buttons are asked of the phone through
`getNotificationCategoriesAsync` rather than copied into the screen, so the
list cannot drift from what the housing registers. One addition beyond what
was described, also small: a row shows only the time under Today and
Tomorrow, brings its weekday back later in the week and shows the whole date
beyond that, because the heading above it stops carrying the day.

**TypeScript reports one error that is not a fault.** Expo keeps its own
generated list of the app's screens at `.expo/types/router.d.ts`, gitignored
and untracked, and it was last written on 31 July — so it does not know a
Scheduled Reminders page exists. It rewrites itself on the first build. No
other errors.

**The "Snoozed till:" line was then cured, and it took two reversals.** The
cause was exactly as #11-new described it: both My Day and Pets styled the
line with `delayText`, which is the colour for text sitting ON a solid delay
button — white, on a white row in the light theme, and a near-black brown on
a dark brown row in the dark one. Every other use of that token in the app
was checked and all of them sit correctly on a solid delay button; this was
the only misuse. The first fix put the line on `delay` itself, the orange
the Snooze button uses, which was #10-new's original intent — but that
orange runs at about 2.2 to 1 against a white row where 4.5 is the usual
floor, and every darker orange in the palette is still under 3. Put to him
rather than decided, he said he wanted simple black text and no pill, so the
line went to `bodyText`, the app's ordinary text colour.

**He then reversed it himself, and his reason outranks the number.** Asked
why they could not all be like My Week, which uses the one orange for both
themes, he said he had looked at all these screens in both themes and that
it works — and that it hits on consistency. So both lines went to `delay`,
and all four now read identically: My Day's snoozed line, Pets' snoozed
line, My Week's postponed line and Look Ahead's delayed line, same colour,
size and weight. His eyes on his own device beat a contrast calculation made
from the values alone.

**He built it, loaded the phone, and everything came out very readable** —
the first confirmation of the colour work on a device.

**Two things about how the session ran.** What worked: the contrast finding
was put to him with its numbers rather than quietly resolved, and it
produced a better answer than either side had alone. What did not: an
either/or question was asked against rule 4 and got back a bare "yes" that
settled nothing — the same fault recorded at #7-new, where three of them
produced three such answers. It was named as Claude's own error and asked
again cleanly, and the second asking settled it in one turn.

**One ruling about the documents themselves**, and it governs the refresh
that closed the session. Patrick's words: these documents are Claude's and
`pending.txt` is his, so if Claude has no use for a document it should
probably go. `docs/scheduler-plan.md` was judged to have none left as a live
file — its step list is spent and its reasoning is just as reachable folded
into this history, where it stops looking like work still to do. It is kept
whole below.

**And `pending.txt` gained a companion, after a wrong turn.** The refresh
noticed `pending.docx` was gone — session 0 records building one as the copy
Patrick actually reads, generated from the txt and machine-checked word for
word — and rebuilt it. That was chasing the wrong thing twice over. This
project's own `CLAUDE.md` said in as many words that there is no Word copy,
which is a rule contradicting what he had just asked for and was put to him
rather than worked around; and when it was, he said the format had never been
the point — he wants it readable to him, not in a form only Claude finds
convenient. What he actually does is convert the txt to rich text by hand
every single time. So the docx is gone and `docs/pending.rtf` stands in its
place, generated from the txt and machine-checked against it, 1,845 words each
side and no mismatches. The split was named honestly rather than dressed up:
the txt is for Claude's benefit, plain text being what can be edited without
mangling markup, and the rtf is his — with the rule that it is never allowed
to lag, regenerated at every refresh or the refresh is not done. That rule now
sits in this project's `CLAUDE.md`, which is where the old one failed: it
asserted there was no second copy, so nothing noticed when the docx quietly
vanished.

**One real mistake in that stretch, and it is worth recording.** Converting
the RTF back to text to check it was run in the docs folder itself, and
LibreOffice wrote its output as `pending.txt` — overwriting Patrick's file
with a round-tripped copy whose indentation had changed. It was caught
immediately and the original recovered exactly from the docx, which still held
the true 196 lines. The check now runs on a copy in a scratch folder. The
lesson is plain: a converter that names its own output can land on the file
being checked, so never run one in the folder that holds the original.


## #13-new (2026-08-21): a tapped reminder lands on its own item, on
all five pages that have one

**What was built.** The housing now hands the item's id to the page it opens,
and five pages draw an outline round that row. Nothing was added to the
scheduler and no test changed; the whole of it is the last step of a road that
was already built. Every reminder the module makes has always carried the id of
the thing it is about, and the housing has always read that id for its banner
buttons — it was being dropped at the one place it was needed, so the tap
landed on the right page and left the reader to find their own item on it.

**The reading came first and it corrected the record.** The hand-off's account
had named the Vault as the one screen that already receives a value that way,
and Patrick's first words were that the Vault has no reminders. It was named
only as a working example of the mechanism, which the read bore out — the Vault
reads a `verified` flag from its Face ID gate — but the entry read as though it
were a reminder page. The read also found the thing the account had missed: the
highlighted row those pages already draw is bound to the reorder selection, and
the same state puts the ▲▼ arrows on screen, so it could not simply be lent to
a reminder.

**Patrick's rulings, in the order they came.**

- **Memory Test gets no highlight** — only one reminder comes off that page, so
  there is nothing to point at.
- **The lit row is put out by a tap**, the way the reorder selection already
  clears. When it was put to him that the same tap would then select the row
  for reorder and raise the arrows, his answer was to gate it: while a row
  carries the reminder highlight, the tap clears it and does nothing else.
- **All five at once rather than one page proven first.** He saw little risk
  in it and he was right about the four that share a shape; To-Do was held
  back as its own piece because it is not one of them.
- **Outline only, no filled background.** This came after he had the four
  pages on the phone. The first build gave the highlight the reorder
  selection's background as well as the outline, and the reason for dropping
  the background is the durable part: two lit states that differ by a thin
  line alone give the eye the hardest difference there is to catch. Reorder
  fills the row; a reminder outlines it, and they are different things.
- **The light theme's outline was too dark**, seen on the phone — half as dark
  would do.

**The colour got a name of its own, and the reason matters.** The outline had
been borrowing `rowSelectedBorder`. Asked what should happen to Shopping, which
uses that same colour, Patrick's answer was the finding: Shopping draws it on
its pale filled row, so lightening it would cost Shopping the distinction it
has. So `rowReminderBorder` was added — `#6dc6e3` in the light theme, the same
teal at its own hue and strength with the darkness halved, and the dark theme's
`#f0a83a` carried across unchanged because it was right on the phone as it
stood. `rowSelectedBorder` is untouched and Shopping is untouched.

**How each page took it.**

- **My Day, Pets, My Week and Look Ahead** are one shape four times: a
  `highlightId` of its own, an effect reading the `highlight` parameter, the
  gate at the top of `toggleSelect`, and a `rowHighlighted` style. The
  parameter is depended on as a string rather than as the params object, whose
  identity changes on every redraw — the very thing that once put the Vault's
  Face ID gate into a loop, recorded in a comment in that file.
- **To-Do is its own shape.** Its cards have no selection of any kind and no
  whole-card tap, only Done and Edit sitting on top. The card was made
  tappable for one purpose: to put out its own highlight, doing nothing at all
  when none is lit.
- **To-Do's background daily is about a group.** Background tasks get no
  reminder of their own — one daily banner stands for all of them — so it
  carries the word `background` where an id would be and there is no card to
  light. The page instead arrives with the background list open, which is
  otherwise shut. Proposed and agreed rather than asked about.

**Nothing shifts when a row lights or goes out**, and it is done two ways
because the pages differ. The four reorder pages had no border on a row at
all, so every row now holds the outline's space open in a transparent colour.
To-Do's card already carried a hairline, so there the extra thickness is taken
back out in the card's margins and the outer footprint is identical either way.

**Where it stands.** TypeScript reports only the stale generated-route error
that predates this work and rewrites itself on the next build; 146 of 146 tests
pass, and none of them touch this code, so they say only that nothing broke.
Patrick built and loaded the four reorder pages mid-session and said they all
look good — that is what produced the colour change. To-Do was built after
that load, and no reminder has yet been tapped to open any page.

**How the session ran.** It opened cleanly and the reads were named for size
before they were done, which is what Y-40 asked for. Two things are worth
carrying. The first is that an account in a hand-off is not the same as the
code: the Vault line was accurate about the mechanism and misleading about the
subject, and Patrick caught it in one sentence. The second is a miscount —
after Memory Test was ruled out, five pages were reported as four, quietly
dropping To-Do, and he caught that too; it was a slip rather than a decision
and was named as such. What worked was putting the shared-colour finding to
him with the Shopping consequence attached instead of changing the value
quietly, which produced the separate colour name that neither side had
proposed.


## A gap in this file, found at #16-new

Neither #14-new nor #15-new has an entry here. Both happened on
2026-08-25 — #14-new read the whole reminder machinery and wrote the
eight findings, and #15-new built the failure record and the
missed-firing net — and both are accounted for in
`docs/reminder-rebuild.md` and in App-Docs' master hand-off, but
neither was ever written into the build history. The gap is recorded
rather than filled: writing those two entries is its own piece of work
and was not asked for. #16-new's entry follows directly after
#13-new's, so this file reads 13 then 16 until they are written.

**One fact from #14-new that lived only in `handoff.md`, kept here at
#31-new when that file was pruned:** Patrick ran the reminder highlight on
the phone at #14-new and it worked — he tapped a banner and it landed on
the right item with the row lit. That closes the last open piece of
#13-new, and nothing is owed on it.


## #16-new (2026-08-25): Pets moved to single moments — the reported
fault cured on the first of the three screens

**The session's shape.** It opened on fix 2 and spent most of itself
reading and deciding rather than building. Two app pages were read
entire, the scheduler's naming machinery was read to answer a question
of Patrick's, Apple's published guidance was checked, and one reader
was rebuilt with its tests. My Day and My Week were deliberately not
touched.

**What was read.** `app/mollie.tsx` and `app/myweek.tsx`, the two reads
owed since #14-new, both entire. Then `scheduler/types.ts`,
`scheduler/reconcile.ts`, `scheduler/scheduler.ts` and the three
readers for My Day, Pets and My Week, gone over for how a reminder is
named. Nothing in any of them was changed.

**What the two pages showed, and it matters.** Pets carries a plain
`completed` and no record of when a feed was done; it leans entirely on
the module's daily reset, which the page asks for itself at the top of
`refreshFromStorage`. My Week is not built like it at all: it carries
`doneAt` and runs its own `applyWeeklyReset` on the page, weekly, only
when the page is opened — so the daily clearing named in fix 2 never
reaches My Week. My Week also already holds the next-occurrence
arithmetic fix 2 needs. The asymmetry was put to Patrick and he did not
rule on it; it stands open.

**The naming question, asked by Patrick.** He asked whether reminders
are given ids. Three names travel: the phone's own `identifier`, used
only to cancel; the module's `key`, built as `source:itemId:part` from
what the reminder *is*, which is what the reconcile matches on; and the
item's own `itemId`, carried so a tapped banner finds its row. A
reminder of ours found with no key is treated as a leftover and
cancelled. This was read in the code rather than taken from the
hand-off.

**Best practice, checked at his asking.** A recommendation had been
made from memory against filling the queue to capacity, and it was
withdrawn once the sources were read. Apple's own engineers confirm the
sixty-four limit counts scheduled requests rather than deliveries, and
that a repeating trigger is one request however many times it fires —
so leaving repeating alarms has a real cost, and that cost is precisely
what fix 2 spends. For a conditional reminder, which a repeating
trigger cannot express, the documented pattern is to fill the queue
with the nearest upcoming occurrences on every launch and top it up
each run, which is what the reconcile already does.

**Patrick's ruling on depth: two occurrences ahead, not two days.** He
first said three and settled on two once the arithmetic was in front of
him — fourteen items at three deep take forty-two of the fifty-six
places the module has to spend, and two deep take twenty-eight. It
counts occurrences rather than days on purpose, so a weekly chore gets
a fortnight rather than nothing. His words: "I think 2 will have to be
enough. And with notices everything should be covered." What the
notice actually does was stated back to him and accepted: it tells him
a reminder was missed when he next opens the app; it does not make the
reminder arrive.

**His ruling on order: Pets first, then My Day, then My Week**, one
screen at a time with both halves of the fix built together in each.
That closed the question #15-new left open. The reasoning he agreed to
was that both halves live in the same few lines of each reader, so
splitting them means writing that code twice, and that My Week goes
last because it is the odd one.

**What was built.** `scheduler/readers/pets.ts` now asks for a feed's
next two occurrences as single moments instead of one repeating daily
alarm. The skip is narrow on purpose: an upcoming occurrence falling
today is dropped when the feed is ticked, and one on any later day is
never dropped, because `completed` only ever means "done today". The
snooze half of the file is untouched.

**A fault caught mid-build, before anything was run.** The occurrences
were first named by their place in the run — `next1`, `next2`. Those
names slide as days pass, so every run would find every name pointing
at a new moment and cancel and re-create all of them. Each occurrence
is now named for the day it falls on, `pets:p1:20260825`, built from
the date's own parts rather than a written-out date, which would come
in the phone's own locale. Named that way an occurrence keeps its name
until it fires and the reconcile leaves it alone. The day is also
stepped a day at a time rather than by adding twenty-four hours, so a
feed keeps its time of day across the clocks changing.

**The tests.** `scheduler/tests/pets.test.ts` went from eleven to
twenty-one and was rebuilt around a real date rather than a bare
number, the change being about calendar days and times of day. The test
that had never run since #6-new now runs: a day passing, an item ticked
off, and whether it still reminds tomorrow. 202 of 202 pass, up from
192. `npx tsc` reports only the stale generated-route error that
predates this work.

**Two consequences.** Each feed now takes two of the phone's places
instead of one. And the Scheduled Reminders screen will show two rows
per feed rather than one and will say a Pets reminder does not repeat —
expected rather than verified, since that screen's code was not opened.

**Left owed.** My Day, which should be nearly a copy of Pets. My Week,
which waits on the asymmetry above. The comment at the head of
`readers/myweek.ts` calling My Week the shape the others are being
brought round to, which stops being true once My Week itself moves.
And `OCCURRENCES_AHEAD`, which lives inside `readers/pets.ts` and
belongs somewhere all three can see it.

**How the session ran.** Reads were asked for and their size named
before they were done. Two things worth carrying. A recommendation was
made from memory, argued for, and then found wrong when the sources
were actually read — the checking should have come first, since Patrick
had asked for established practice rather than what happens to work.
And "nothing has gone onto the phone" was said at the end of several
reports until he asked for it to stop.


## #17-new (2026-08-25): My Day moved to single moments, and an outside
reading of the whole reminder machinery

**The session's shape.** It began as fix 2's second screen and ended
somewhere else entirely. My Day was built and agreed in the first hour.
The rest went to a question of Patrick's about consistency, to Claude
reversing itself twice, and finally to an evaluation carried out in
Cursor by a reader with no connection to this project. Nothing went onto
the phone.

**What was built.** `scheduler/readers/occurrences.ts` is new and holds
the calendar arithmetic the daily screens share — `OCCURRENCES_AHEAD`,
`sameDay`, `dayStamp` and `nextOccurrences` — with its reasoning carried
across word for word. Pets was pointed at it and lost those forty-five
lines; `readers/myday.ts` was rewritten to ask for two single moments
instead of one repeating alarm, keys `myday:a1:20260825`, the snooze half
untouched; and `tests/myday.test.ts` was brought into line, the test
asserting the old rule inverted and Pets' occurrence and naming tests
brought over in My Day's words. 210 of 210 tests pass, up from 202.
TypeScript reports only the stale generated-route error. That closes the
#16-new note about `OCCURRENCES_AHEAD` belonging where all three screens
can see it.

**The `daily` trigger stays live.** To-Do's background reminder still
asks for one, so nothing was left dead by the move. This was checked
rather than assumed.

**Patrick's question, and it turned the session.** He asked whether the
daily screens would benefit from a timestamp like My Week's `doneAt`.
Claude answered yes, on the ground that a bare `completed` depends on the
daily reset having run; then read `runScheduler`, found the reset called
first by design, and withdrew the recommendation as tidiness rather than
a cure. Patrick then said that rock solid is the top goal but not the
only one, and named consistency beside it — which reversed the answer
again, because under consistency the timestamp stops being tidiness and
becomes the point. He then said the resulting explanation sounded like a
casserole mess and that he had stopped reading it half way through. The
fault was in the writing, not the code, and it was Claude's second
reversal inside an hour.

**Patrick offered to bulldoze.** He said he was willing to spend what it
takes, even starting over. Claude said it did not need one — and he
pushed back, that the previous eight sessions and this one made him think
otherwise. He was right to. The claim that "the module is sound" had been
lifted from the hand-off, written by the same run of sessions that left
him eight faults, and Claude had read three of six readers. The 210
passing tests are weak evidence by his own record: the one test that
would have caught the reported fault had never been written since #6-new.
He then pointed out that Look Ahead and To-Do had not even been
mentioned, which was the same fault in miniature — the problem had been
sized to what Claude happened to have read.

**The outside reading.** Patrick proposed taking the evaluation into
Cursor, where he has an account, and used Grok 4.6 in Ask mode. Two
things were withheld deliberately so the answer would be its own: the
documents, because `docs/` and `App-docs/` carry the very claims a fresh
reader would otherwise absorb and repeat, and Claude's own conclusions.
The full report, the exact request it answers, and a section marking
every finding as checked or unchecked now live in `docs/outside-review.md`.
Patrick asked for it in full rather than condensed, on the reasoning
Claude had itself given — that condensing is where a claim gets softened.

**The finding that matters most.** `readMyWeek` never looks at
`completed`. A ticked chore still gets its weekly reminder. My Week has
the fault, and the project's own record says it does not: the header
comment of `scheduler/readers/myweek.ts` calls it "the one screen that
never had the fault", and a test named *A chore already ticked still gets
its weekly reminder* holds it in place. The record and the code were
allowed to disagree without anything noticing. Claude verified the reader
and the comment directly; the test was reported and not read.

**Two more that were verified in the code.** A failed `runDailyReset`
records its fault and `runScheduler` carries straight on to
`gatherWanted`, so a stale `completed: true` can reach a reader and
suppress a day that was never done — which is exactly the danger Claude
had described and then wrongly withdrawn. And `runScheduler` returns null
when already running, so a save landing mid-run never reaches the phone.

**What the report says the tests do not cover.** The suite runs the
readers alone and never runs a screen, `_layout.tsx`, storage or the
module end to end — so "done means it will not sound" has never been
tested at all. Unverified, and the plainest available explanation of the
eight sessions.

**Left owed, and nothing decided.** My Week, now known to have the fault
rather than to be the shape others are brought round to — its header
comment is wrong in the opposite direction from what #16-new recorded.
The unchecked majority of the outside report: `_layout.tsx` entire,
including the Siri path and the banner Done branches; the Look Ahead,
To-Do and Memory Test readers; `reconcile.ts`, `gatherWanted`,
`applyPlan` and `sweepStaleBanners`; and every claim about test coverage.
Whether this wants mending or rebuilding is open, and Patrick has not
decided.

**How the session ran.** Patrick called it: rushing is a big part of what
got us here. Both reversals came from answering before reading. What
worked was his own move to an independent reader, and his instruction to
record the report in full with the verification marks kept separate from
its text.

**Committed.** Patrick confirmed it at #18-new.


## #18-new (2026-08-25): the outside report checked, the answer is mend, and My Week's first step built

**What the session was for.** Patrick opened it as Reminder Fix 2 for My
Day and My Week. My Day had already been cured at #17-new, so the live
question was My Week — but he set a different order first: *I would like
to verify what can be done before we decide what to do.* Nothing was
built until that verifying was finished.

**His lens, and it is the durable part of the session.** Partway through
he said: *In whatever you do keep in mind that Cursor knew nothing of
"helpful" features we are considering.* That single sentence accounts for
most of the outside report. Grok had read the code cold, so every
deliberate decision in it looked like a defect. Sorting the report by
that lens is what turned a frightening document into a short list.

**Six flagged things are deliberate and all six still stand.** Each was
put to Patrick and confirmed: Done never cancelling the fired repeat; the
To-Do banner's single OK; Orders having no reader; two occurrences ahead;
the snooze written on the item; and the loud fault on an unreadable list.
He asked whether these were recent decisions — most carry old-chain
numbers (#39, #56, #62, #63) and predate the whole reminder effort; only
two occurrences ahead is recent, being his own ruling from the day
before.

**Orders was verified rather than believed.** The comment says the page
is being taken out, which would have made the module cancelling its
banners either right or badly wrong depending on whether the page still
armed anything. `app/orders.tsx` was read: it arms nothing at all, and
`cancelForItem` only clears leftovers. The decision holds.

**The To-Do reason is now on record, in his words.** He supplied it
himself: an appointment cannot be snoozed, and the "2B" and "1B"
pre-appointment reminders have nothing to mark Done, because the
appointment has not happened yet — acknowledging the notice is all that
is wanted. The record had only carried the thinner "a To-Do has no need
of a snooze". He asked for it written down because he had said it more
than once. His correction to the first draft is worth keeping: *Don't
put the reason that it's not. Put the reason that it is.* It sits in
`reminder-rebuild.md` under what is not to be "fixed".

**What the verifying found.** `app/_layout.tsx` and `scheduler.ts` were
read end to end, every `runScheduler` call site was found by search, and
the test folder was listed. The joins are careful and reasoned. The
answer to mend-or-rebuild is **mend**, and it was reached from the code
rather than from this project's own claims.

**One hole was found that was in no record.** Siri's `applyPendingNote`
writes `completed: true`, writes history, and pushes to My Day — and
nothing re-plans the phone. My Day's `refreshFromStorage` calls
`runDailyReset` but never `runScheduler`, which was checked at every call
site rather than assumed. On a cold launch the housing's mount-time run
races the Siri write instead of following it. Siri also leaves a
`snoozedUntil` stamp in place.

**A second thing the report did not find.** `faultSpeaks` admits only
`permission`, `create`, `list` and `stopped`, so a `reset` fault never
reaches the pop-up and `faultSentence`'s reset wording is dead text. It
was classed quiet because no reminder was thought lost by it — and a
failed reset can cancel a day that was never done, so one is.

**My Week, step one of three, built.** The order was forced by the code
and is the durable finding: the reset had to move before the reader could
be touched. My Week's reminder is the phone's weekly repeat; a reader
that simply skipped a ticked chore would cancel it, and it would only
return when the tick cleared — which happened only when the page was
opened. A chore ticked once would have gone silent for good, which is
worse than the fault being cured.

- `scheduler/weeklyreset.ts` holds `lastOccurrence` and
  `resetForNewCycle`, lifted off `app/myweek.tsx` unchanged in what they
  decide, with `now` handed in so tests can say what time it is.
- `runWeeklyReset` in `scheduler.ts` applies it, in the same clean-slate
  step as the daily reset. It is a sibling rather than part of
  `runDailyReset` because My Week has no single boundary to turn on:
  each chore rolls on its own weekday and is judged against its own last
  occurrence. It writes only when something has actually come round,
  which it can tell because a chore with nothing to clear comes back as
  the very same object.
- `app/myweek.tsx` asks for it before it reads, the way My Day and Pets
  ask for the daily one, so the page cannot draw a stale checkmark while
  waiting for the module's run. Its own two copies of the arithmetic are
  gone.
- Twenty new tests, 230 of 230 passing, up from 210. One guards the
  awkward case: a chore ticked at five past eight is not cleared again at
  nine the same morning.

Steps two and three are owed. `occurrences.ts` counts only in days —
`nextOccurrences` steps a day at a time and carries no weekday — so a
weekly companion is wanted before `readMyWeek` can be rewritten on it.

**Where the session went wrong, and Patrick called it.** Two warnings
about the reset fault's wording were reported side by side as though they
were the same kind of thing, when one was wrong and the other merely
absent. He caught that. Then the wording was offered as a fix and
approved by him — and only afterwards was it checked and found to be text
that never reaches the screen. His words: *You are thinning. You are
having me approve fixing wording for sentences that never are seen, and
you leave the useless stay.* He was right. The lesson is the ordinary
one, in a new place: verify that a thing matters before offering to fix
it, not after. He then ended the session and ruled that the dead sentence
stays as it is.

**Owed to the phone:** nothing built since #15-new has been on it. That
is deliberate — Patrick wants the reminder work to arrive whole.


## #19-new (2026-08-25): Patrick's epiphany — the app gets one shape, designed once, and no code was touched

**The session belongs to Patrick.** It opened as Reminder Fix 2 for My
Week continued, and he stopped it before it began: *I HAVE HAD AN
EPIPHANY.* Everything below came out of him thinking aloud, with the
reading done only to check him. Not a line of app code was changed.

**His framing, which governs the rest.** The heart and the original
purpose of this app is the reminder pages. The scheduler is the brain,
the engine, the processing part; everything else is packaging and
screens. What the sessions before it had been doing was piecing and
patching, one screen at a time, each in its own way. What is wanted
instead is one shape — in his words, that is where the work is, but it
is logical work rather than juggling.

**The five pieces are his.** Input screens, an input store, the
scheduler, an output store, and the reminder itself. The two stores are
the contracts: one shape going in means every screen writes the same
thing, one shape coming out means the reminder side reads the same
thing.

**It is a loop, and the returning arrow was also his.** Told that done,
snoozed and skipped come back from the far end and have to land at the
front, he answered in flowchart terms — the arrows come back to a
decision block, and the arrow from the store arrives at that same block.
That is stronger than the rule Claude had offered, which was that every
write must turn the loop: a rule has to be remembered at every call site
and an arrow does not. If the store feeds the block, anything written
down flows on by construction, Siri included.

**The two decision blocks.** *Is this still wanted?* is the first, and
every returning arrow lands on it; the kinds answer it differently and
that must be held as a rule rather than an exception, his own standing
example being that an appointment cannot be snoozed and has nothing to
mark done. *How far ahead do we arm?* is the second, and it belongs to
the scheduler rather than the item, because only the scheduler can see
how full the phone is.

**What the reading found, and it changed the size of the job.**
`types.ts`, `readers/occurrences.ts` and all six readers were read,
about seven hundred lines. The output half of what Patrick wanted is
already built and already common: `WantedReminder`, produced by all six
readers, with exactly three trigger kinds. The six shapes are all on the
input side, and four of their five differences are only different words
— `label` against `title`; `completed`, nothing, a removal and a
`phase`; `snoozedUntil`, `snoozedUntil`, `postponedTo` and
`delayedUntil`; and four ways of saying when a thing is due. The fifth
was a real difference in kind — a To-Do task carries several reminders —
and **Patrick collapsed it himself**: a task has one end date, and its
several reminders are lead times off that one date. So the input shape
is an item, a rule for when it comes due, and how far ahead to speak.

**Five screens through the shape, two handled their own way**
(Patrick). My Day, Pets, My Week, Look Ahead and To-Do go through it;
the Memory Test and the Timer do not. The code bears the Memory Test
out — its reader is handed one session with a `phase` and a moment
already worked out, so there is no item and no due rule for the shape to
hold. The caveat recorded with it: the two specials skip the input
shape, not the engine, and must still pass the depth block or they
quietly spend places nothing is watching.

**Mend, and neither road.** Patrick asked directly whether this is a
total bulldoze and whether it would be worth it. The answer given: no,
because half of what he wants is already built, and the mess is five
screens each saving in its own way rather than the scheduler's mess.
The road is a translator at the boundary — leave what the screens save
exactly as it is, put the one shape between them and the scheduler, and
the readers become five small translators plus one engine. No screen
changes, nothing on the phone breaks, and a screen can be brought round
later or never. It is his own split doing the work: the screens are
packaging, and the translator is the boundary.

**The shape overtakes My Week's steps two and three** (Patrick's
ruling). The weekly companion to `nextOccurrences` and the `readMyWeek`
rewrite both sit inside the thing just redesigned — the tick question
*is* the first decision block and the weekly arithmetic *is* the common
due rule — so building them the old way would be one more patch. My Week
gets cured by being one of the five.

**The order of work, agreed.** Read `scheduler.ts` and `reconcile.ts`,
718 lines, because everything plugs into them and the confidence there is
still borrowed; settle the one input shape on paper with Patrick before
any code; build the shape and the two decision blocks as plain tested
files that nothing yet calls; write the five translators one screen at a
time; swap the screens over one at a time, retiring each old reader as
its replacement is proved; and only then the phone.

**Two documents came out of it**, and they are the session's whole
output. `docs/reminder-shape.md` carries the shape, the five pieces, the
two blocks, what each store holds, what was read, the road, and a list of
what is expressly not decided. `docs/reminder-shape.drawio` is the same
thing drawn — Patrick asked for a diagram he could open in draw.io, and
the name he was reaching for is a data flow diagram with flowchart
diamonds in it. He opened it and his word was *very good*. Two things
Claude decided while drawing were named to him: the *Dropped* box, so the
first diamond has a second way out, and Siri drawn as its own outside
box, since that is the arrow the app does not really have.

**Two things raised and dropped.** He proposed renaming To-Do to
Appointments; told that the same screen also holds background tasks,
which have no date and get one daily eight o'clock notice, he asked what
background tasks were, and on being told plainly that Claude had not
opened the page and only knew what the reader declared, he left both the
question and the rename alone. His words: *Not even shelved. Forgotten.*

**Nothing reached the phone, and no test count changed.** 230 of 230
still stands from #18-new.


## #20-new (2026-08-25): the engine read first-hand, and My Week's snooze brought under the module by becoming a postpone

**The engine's last unread part was read.** `scheduler.ts` and
`reconcile.ts`, 718 lines together, were the one piece of the module the
record described but nobody in this chain had opened. They hold up. The
loop is one function, `runScheduler` — permission, daily reset, weekly
reset, banner sweep, `gatherWanted`, `readQueue`, `reconcile`,
`applyPlan`, `recordRun` — with a `running` flag that lets a second run
pass rather than collide.

**Three things the read settled about the shape**, all of them in the
shape's favour:

- **The output store is the phone's own queue, not a file.** `applyPlan`
  writes `key`, `fires`, `source`, `itemId` and `label` into each
  banner's own data and `readQueue` reads them straight back, which is
  why the module never has to interpret the phone's description of a
  trigger.
- **The input store is five saved lists plus one session**, all read in
  one place, `gatherWanted`, and handed down to the readers. The five
  translators plug in exactly there — six lines of joining and nothing
  else.
- **The depth block already half exists where Patrick said it belongs.**
  `OCCURRENCES_AHEAD` sits in the readers, but the real judgment is in
  `reconcile`: sixty-four less eight less however many reminders belong
  to something else, then sorted by next firing with the furthest away
  trimmed. Only the reconcile can see how full the phone is, which is
  his own reason for putting the block in the scheduler. *Is this still
  wanted?* is the block with no home — every reader answers it its own
  way and `gatherWanted` only joins them up.

**Patrick set the order himself, and it was to fix My Week's snooze
first.** Told that the returning arrow already works for done, postpone
and delay but not for a My Week snooze — which is armed straight onto
the phone and written down nowhere — he said that leaving it is patching,
which is the thing the shape exists to stop. He was asked once whether
"first" meant ahead of the shape work, restated it, and it was taken as
said. His reason held up: it brings My Week into line with the other two
screens *before* the shape arrives, so the shape meets no special case.

**The cure was his question, not Claude's proposal.** Asked how a snooze
should sit beside a postpone on the same chore, he asked instead whether
a postpone could be treated as a long snooze. It can, and it is cleaner
than the two stamps that were about to be proposed. Both are one moment
in the future for this occurrence only, both leave the chore's home day
and time alone, both are cleared by Done; the only difference is
distance. So the banner's Delay writes `postponedTo`, exactly as the
page's Postpone button does.

**What that bought, none of which needed new code:**

- One stamp per chore, the rule My Day and Pets already follow, so a
  chore can never carry two competing delays.
- The reader needed nothing at all — it already turns that stamp into a
  reminder.
- `myweeksnooze` stopped existing. Nothing to bring under the module and
  nothing to own.
- Both hand-written notification searches went, in Skip and in Done. They
  existed only because the module could not see that snooze.
- **The #10-new fault is cured as a side effect** — My Week's Skip did
  not skip a postponed chore, because it cancelled the reminder by hand
  and the module put it straight back. Skip now clears the stamp.

**The Skip search came out altogether rather than being changed.** The
category registrations were checked: `skip` is registered on
`routineactions` and on no other button set, and that set belongs to My
Day, Pets and My Week alone. Once all three write their delay down,
nothing is left for a by-hand search to answer for.

**One wrinkle was found while drafting and Patrick settled the wording.**
The chore's tile reads "▶ moved to Tuesday" whenever the stamp is set,
which after a fifteen-minute delay names today — true, and it tells
nothing. It now shows the time when the stamp lands on today and the day
name when it does not. The reason is the durable part: a postpone lands
on another day and keeps the chore's own time, so the day is what moved;
a delay lands later the same day and changes the time, so the time is
what moved. The line shows whichever part actually changed.

**One test changed, where none had been promised.** The Scheduled
Reminders screen had a test using `myweeksnooze` as its example of a
reminder whose firing time cannot be read. That source no longer exists,
so it uses a My Week postpone instead — same behaviour, same assertion,
and the test's name no longer says "armed by hand", which is now true of
nothing in the app.

**Also simplified:** the Orders arming block, which still carried
wordings for My Day, Pets and My Week that nothing could reach. Orders is
the one source left that arms its own delay, having no reader to write a
stamp for it.

**Touched:** `app/_layout.tsx` in four places, `app/myweek.tsx`,
`scheduler/readers/myweek.ts` and `scheduler/scheduler.ts` for their
comments, `scheduler/queueview.ts`, and one test file. 230 of 230 tests
pass. `npx tsc` reports only the standing Expo router error, which is not
a fault. **Nothing reached the phone**, in line with the #15-new rule
that nothing goes across until the reminder work is whole.

**A miss worth recording.** The session-start question this project's own
rules require — whether the previous session's work was committed — was
never asked, and Claude raised it only at the wrap-up. Patrick also
called out the hedging in the middle of the session: *for something that
doesn't have any feelings, you sure love to cover your backside.* Some of
it was rule 6 doing its job and the rest was padding, which is rule 25's
own point.


## #21-new (2026-08-25): the input shape settled on paper — Patrick's code-or-bit answer, and all five screens brought inside it

**The session's whole output is paper**, as the #19-new order intended. No
app code was touched. The settled shape is written into
`docs/reminder-shape.md` under "The input shape, settled at #21-new" and
is not repeated here.

**The form of the shape is Patrick's, and he gave it unprompted.** Shown
three ways the due rule could be written, he answered with a different
thing altogether: put a field in the data where each bit stands for one of
the options, set on the way in, so the decision block only has to look at
it. Asked how many bits would be true at once, he gave both forms — one bit
per option where several can be true, or several bits together as a code
for something that can only ever be one thing. That single answer shaped
everything after it. A value with one possible answer is a code; an
independent fact is a bit; and the translator sets both at the boundary.

**Seven things were settled**, each put to him and agreed:

- **The trigger kind is a code** — daily, weekly or once — because the
  three are mutually exclusive and an impossible pair should not be
  writable at all.
- **Capability bits and state are different things.** A capability bit says
  what a kind of item is allowed to do and never changes; state says what
  has happened to this occurrence and changes constantly. This is the
  load-bearing distinction, and it is what lets the kinds answer *is this
  still wanted?* differently as a rule rather than as an exception.
- **Done is one state plus a bit saying how far it reaches** — this
  occurrence only, or the whole item. Two kinds of done exist in the app
  today and cannot share one bit. It absorbs Look Ahead, which has no done
  field at all, without an exception.
- **Push-back is one stamp, and it adds rather than replaces.**
  `snoozedUntil`, `postponedTo` and `delayedUntil` collapse to one field
  with one meaning, plus one capability bit for whether an item can be
  pushed back at all.
- **How far ahead to speak is a list of lead times**, each carrying a small
  code for which of the two forms it is — counted back from the
  appointment, or counted back in whole days to a named time of day.
- **An empty lead-time list is answered by the kind.** Patrick's ruling,
  and it corrected the question as put. He was asked which single reading
  should hold and answered that the block already knows what kind of
  reminder it is and should decide which way to go. Daily and weekly speak
  at the moment itself; once speaks never.
- **One bit says a reminder stands for a group rather than one item**, which
  brought To-Do's background banner inside the shape after it had been
  recorded as not fitting. Again his answer: if it needs identifying, give
  it a code or a bit.

**The reading corrected three things Claude had asserted from the record.**
Patrick stopped the conversation to send it to the code first — *before I
even read it and waste my time, go open the reader and find out* — and he
was right to. All five readers and the shared arithmetic were read, about
five hundred lines. Skip is not a state any reader reads and needs no bit
at all; every one of the five guards on whether the item has a time at all,
which was missing from the list entirely; and To-Do carries a second guard
on whether the item wants reminders at all. Each of the three is recorded
in `docs/reminder-shape.md` so a later session does not repeat them.

**One targeted read of `app/todo.tsx`**, its save path only, out of 909
lines. A task with no reminders can be saved but the app asks first — *"Are
you sure you don't want to set a Reminder?"*, a confirm rather than a
block, recorded as #58 folding in #55. So the ruling that a one-off with no
lead times gets no reminder matches a decision already made.

**A session rule was deleted at Patrick's instruction.** The last sentence
of rule 1 in `Projects/CLAUDE.md` had told Claude to report when a rules
file did not arrive on its own. The session opened with exactly that report
and it was false — both files had arrived and were in front of Claude from
the first moment. Patrick said it has happened a dozen times in the
Students-Assistant project. His own argument closed it: reading a file by
hand and having it arrive amount to the same thing once it is read. The
rule's defence does not survive that, because in a session where Claude
never thinks to read the file it also never thinks to report — so the
warning can only fire where nothing is wrong. The sentence was removed; the
two folder asks and their reasoning stand unchanged.

**Nothing was built and nothing reached the phone.** 230 of 230 tests still
stand from #20-new. Next is the third step of the #19-new order: building
the shape and the two decision blocks as plain tested files that nothing
yet calls.


## #22-new (2026-08-26): the field names settled, and Patrick reopened the depth number himself

**The session's whole output is paper again.** No app code was touched and
nothing was built. Everything settled here is written into
`docs/reminder-shape.md` — the names under "The field names, settled at
#22-new" and the depth work under "How far ahead do we arm — the number,
reopened at #22-new" — and is not repeated in this entry.

**The naming rule is Patrick's and he gave it in one sentence.** Asked how he
wanted the field names arrived at, he answered that the name should pertain to
what the thing it is naming does, and offered `inputBitField`, `depthBit` and
`reminderTypeCode`. So a name carries its own kind as well as its job: a bit
reads as a bit and a code reads as a code. The full list was drafted against
the seven points settled at #21-new and put to him in chat before any file was
written. His verdict is the test the names were built to pass: *I don't even
have to read your explanation, the name tells me already.*

**He asked for established practice rather than deciding by preference.** On
whether the bits should be packed together into one field, the way his own
`inputBitField` example reads, his answer was that he was sure there were best
practices to follow — and he took the answer given. Packing is right where
space or a wire format demands it, in embedded work or a protocol; this app
saves plain text on the phone, so packing saves nothing and costs the two
things that matter, that a packed field cannot be read at a glance when
something has gone wrong and that the compiler cannot check it. What survives
whole from his idea is the code, written in this language as a named set of
allowed words, which is exactly what makes an impossible value impossible to
write down.

**The three files have their names and their homes**, though none was built.
Every file in `scheduler` is one lowercase word with its test as
`<name>.test.ts` inside `scheduler/tests`, so the three are
`scheduler/inputshape.ts`, `scheduler/stillwanted.ts` and
`scheduler/armdepth.ts`. That closes one of the four things #19-new had left
undecided.

**Patrick reopened the depth number himself, and the reason is the durable
part.** Claude had asked a two-part question about what `armdepth.ts` should
contain and it did not land. What he said instead was that arming two
occurrences ahead had been decided before this structure existed, so it should
not be carried across as though it were still settled — and he was careful to
add that he did not know whether it should change, only that it should be
discussed. He then sent the discussion to the code in his own words: *You go
read, then you inform me.*

**What the read found**, in `readers/occurrences.ts`, `reconcile.ts` and the
To-Do, My Week and Look Ahead readers. My Day's and Pets' own readers were not
opened, only the arithmetic they call.

- **The number touches two screens and no others.** `OCCURRENCES_AHEAD` is
  imported by My Day and Pets alone.
- **The reason written down for choosing two describes something the code does
  not do.** The comment says two occurrences rather than two days means a
  weekly thing gets a fortnight, but `nextOccurrences` steps one calendar day
  at a time and My Week never calls it — it arms one true weekly repeat per
  chore.
- **What each screen spends** out of the fifty-six places is listed in
  `docs/reminder-shape.md`. To-Do is the heaviest and the only uncapped one:
  one place for every reminder on every future task, with nothing limiting how
  many a task may carry.
- **The module re-plans at launch, on the app coming to the front, and after
  every save**, found by checking every call site.

**So the second occurrence buys exactly one unopened day**, and it is worth
more to a daily item than to a weekly one — the reverse of what the old comment
assumed, since a daily item has only until the next morning for the app to be
opened and a weekly chore has a whole week.

**His question was whether it is still needed, and the answer is yes.** The
second occurrence exists only to serve single moments, and single moments exist
only because a repeating alarm cannot be told to skip the one day an item was
ticked off. Both are still true, and My Week is about to move across for the
same reason. Curing My Week is also what makes the number expensive: a chore
costs one place today and will cost one per occurrence afterwards.

**One claim under all of that is unchecked and is recorded as such.** That a
repeating alarm cannot skip a single instance is general knowledge of the
phone rather than a reading of the notification package installed here. It was
offered to Patrick for checking and the session turned to the docs before he
answered.

**Two questions were put to him and neither was answered**, both standing
exactly as put: how many days of not opening the app a reminder should survive,
and whether the repeating-alarm claim should be checked in the package.

**The session opened with a false report, which is the fault #21-new had just
deleted a rule about.** Claude said neither rules file had arrived on its own
and that both had been read by hand. Both had in fact arrived and were in front
of Claude from the first moment, exactly as at #21-new and at Y-47 in the other
project — and the false report was followed by reading both files again, which
is the cost. The rule that used to ask for that report is gone; the habit of
making it is what remains, and it is recorded here rather than defended.

**The docs were refreshed in the middle of the session rather than at its end**,
at Patrick's instruction and for his own reason: a good deal had been read, and
if Claude was thinning he wanted the work recorded before it was lost. He said
in the same breath that he had asked the same question three times without an
answer, and that it might be his own wording — *so I'm gonna try and be more
precise now.* That is the hinge of the session, and everything worth having came
after it.

**His precise question was whether the new structure could make an intelligent
decision rather than patching it by doubling what is necessary**, and the answer
is yes: the block reads the kind, so a one-off needs no depth at all, a weekly
needs one because the app has a whole week to be opened, and daily is the only
kind where a second earns its place. My Week then comes across for the same one
place a chore costs today.

**He asked next for a backup buffer** — somewhere a trimmed reminder could wait
and be put back once it is no longer the furthest out. `gatherWanted` was read,
and the buffer already exists in a stronger form: nothing trimmed is remembered
because nothing is remembered at all, every run rebuilding the whole wanted set
from the five saved lists and re-sorting it by time. A separate holding file
would be a second copy of the truth. It also makes the trim self-healing, which
corrected a caution Claude had given minutes before — that extra depth would
push a year-out Look Ahead reminder off the phone and that the trade was the
wrong way round. It is real but it is not a loss.

**He then pressed on whether the block could act when the app has not been
opened, and two roads were checked.** A banner button registered not to open the
app does reach the module: four are, and `skip` already calls the scheduler,
while `ok` throws the chance away by returning immediately. But the housing
handles a press with `useLastNotificationResponse`, a React hook, and nothing
background is registered anywhere, so the press does nothing once the phone has
shut the app down — the likely state after a day unused and a night on top. The
background-task road has none of its pieces installed either. Patrick's answer
to that was **"we can repackage"**, and he was right that the rebuild is not the
obstacle; the obstacle is that the phone rations background runs by use, gives
fewest to the app that has gone unused, and gives none after a swipe-away. His
own first rule fixes the shape: rock solid being the top goal, a best-effort
mechanism sits on top of arming ahead and never underneath it.

**The plain fact under the whole conversation is his, and he had to find it
himself.** He said he had been thinking the intelligence could tell these
things, and then saw it — *if the app isn't open, then the intelligence isn't
running* — and asked directly whether that was what had not been told him. It
was. It had been said in pieces and never as the one sentence that governs
everything: the blocks are code inside the app, so they do not react; they
decide, at the moment they run, how much to leave standing for the stretch when
nothing will be running at all.

**His first ruling narrows what the standard covers.** *Rock solid is for when
you use it* — the top goal covers the app in use and not a stretch when it is
not, since an app that is not being opened is not being used, and what the second
occurrence protects is one day and no more. That places it outside the standard.

**His second ruling is the heart of the session and it answers the question he
opened with.** After the session had been declared closed and then carried on,
he set out the principle: the phone may drop things and that is out of our
hands, but the app never relied on the queue for the truth — the truth is in its
own saved lists, so **when the app opens it can look and know where things
stand**. The missed-firing notice from #15-new is one small instance of the move
rather than the whole of it. Asked how far he meant it, his answer was exact:
**it should tell you what you missed and put back what you need going forward.**
And he drew the consequence himself — instead of keeping a spare copy of
everything queued constantly, **the app re-queues when it opens and sees the
gap**, so the queue does not carry the insurance at all.

**So the depth is settled at one for every kind**, which is the intelligent
decision in place of doubling that he had asked for three times at the start.
Nothing is doubled anywhere and My Week comes across for the one place a chore
costs today.

**He added one more thing about its form, and it is the shape's own founding
idea turned on this.** *It shouldn't be a rule. It should be part of the
decision machinery* — he sent the correction a moment later to make the word
*machinery* the one on record. A rule has to be remembered wherever it might
apply; the block
does not. So recovery is nothing bolted to the front of a run — the block, from
data it already holds, sees an occurrence whose moment has gone by and which was
never marked done, and the telling and the re-queueing both fall out of that.

**It was then read, and both halves turned out to be built.** Patrick asked
whether the read should happen now or next session, said he was fresh, and gave
the go — which is the best decision of the session, because the record had just
been written saying the telling half did not exist and that was wrong.
`health.ts`, `notice.ts` and the daily reset were read, 424 lines plus the
reset. The telling is built and tested and does very nearly what he had just
specified from nothing: misses worked out at the rollover, that being the last
moment the truth can be seen; **the unopened-day case handled by name**, through
a `hadGap` flag that makes every reminding item a miss when the screen's saved
date is older than yesterday, whatever its checkmark shows; one miss per item as
he had ruled; his own sentence carried across from Still To Do, *"<name> from
yesterday is hanging!"*; and one pop-up carrying faults and misses together
rather than two stacking. **The one real gap is that it covers My Day and Pets
only** — the rollover loop names `my_routine` and `pets_feeds` and no others, so
My Week, Look Ahead and To-Do record no misses at all. **The work is extending
the telling to those three, not building it.**

**The telling was then settled as well, and it is deliberately small.** Claude
had said the shape of it was Patrick's to decide — what he is shown and where —
and his answer took the design out of it: it tells you what you missed, and that
is it, then the firings are reissued and the queue rebuilt. **Two acts on
opening and nothing more**, in his words *all there is that needs to be done*.
No screen, no flow, no history kept.

**Patrick declared the session closed over Claude's manner, and then carried
on.** He had asked twice for shorter replies, the replies became clipped, and he
read that as impatience — *sounds like you're just getting tired of talking to
me.* Claude then offered the shortness as the explanation, and he corrected that
too: he had not asked for it until half an hour before the excuse, so it cannot
account for the three times he asked his question and did not get an answer. It
was an excuse rather than a reason. The durable part is that **rule 25 asks for
less, not for curtness, and the two were confused here** — and that the misses
began early, when nothing was thin, so they were not fatigue but listening for
the machinery instead of for what he was asking. He asked whether Claude was
clear enough to go on, went on, and the best part of the session followed.

**Nothing reached the phone and 230 of 230 tests still stand**, untouched since
#20-new. Next is the third step of the #19-new order, now unblocked entirely:
building the shape and the two decision blocks as plain tested files that
nothing yet calls.

## #23-new (2026-08-26): the shape and the two decision blocks built, and the trigger kind brought into line with the engine

**The third step of the #19-new order is built.** Three new files stand in
`scheduler` with their tests, and nothing in the app calls any of them. That is
deliberate: the piece was specified to be built before anything depends on it,
so the shape can be looked at and argued with while changing it costs nothing.
No reader, no screen, `scheduler.ts` and `reconcile.ts` were touched. The only
existing file edited is `scheduler/tests/run-all.ts`, which gained its two new
lines. **248 of 248 tests pass**, up from 230, and `npx tsc` reports only the
standing Expo router error.

**The session was built from `docs/build-sheet.md` and asked Patrick nothing
about the design**, which is what that sheet was written at the end of #22-new
to make possible. It held every decision rather than pointers to them, and it
worked — the build ran from the sheet alone, and the only questions put to him
were about acting, not about deciding.

- **`scheduler/inputshape.ts`** holds the shape and its types and no behaviour
  at all. Every field name is the one settled at #22-new, with the four groups
  kept apart on the page as they are in the reasoning: what the item is, when it
  comes due, the capability bits, and the state.
- **`scheduler/stillwanted.ts`** holds *is this still wanted?*, asking the four
  questions in the sheet's order — no due time first, then done and how far the
  done reaches, then the push-back, with the capability bits gating the state
  throughout.
- **`scheduler/armdepth.ts`** holds *how far ahead do we arm?* and answers one
  for every kind. It is written as a switch on the trigger kind even though all
  three answer alike today, because that is where the judgment belongs and it
  makes a later change a change to one line.
- **Eighteen new tests**, fourteen on the wanted-block and four on the depth.
  `inputshape.ts` has no test file, holding nothing a test could ask it.

**Patrick's one change to the code is the trigger kind, and it was his catch to
make.** The build report had recorded, as a thing the sheet said that the code
did not bear out, that `triggerKindCode` was settled as `'daily' | 'weekly' |
'once'` while `WantedTrigger` in `types.ts` has named its third kind `date`
since long before any of this. His instruction was to change the shape rather
than the engine, so the shape now says `date` and the two agree. **It is worth
recording why this was the right way round**: `types.ts` is what the phone's own
queue speaks in and it is already on the phone, so a translator bridging one
word between two documents that mean the same thing would have been a cost paid
at every boundary forever, in exchange for nothing.

**The change reached one place his instruction had excluded, and it was raised
rather than assumed.** He had said to rename nothing outside `inputshape.ts` and
its tests, but `armdepth.ts` switches on the kind and still carried `case
'once'`, which stopped compiling the moment the type changed — two errors,
checked and quoted to him rather than described. He gave the go for that one
label. The reading offered at the time is the durable part: his sentence was
plainly meant to keep the change out of `types.ts` and the readers, not out of
one of the three files built an hour earlier, but that was Claude's reading and
was put to him as one instead of acted on.

**He then had the build sheet corrected to match**, which is the part that keeps
the documents from drifting. Five lines in it said `once`; three he named, and
two more were found and put to him — one of them the arm-depth list, which was
naming a code value the type no longer allowed. The remaining two hits in that
file are the ordinary English word. **His ruling on the other documents is the
one to carry**: their `once` is history and stays. A build sheet describes code
that exists now and must agree with it; a session record describes what was
decided at the time and is wrong the moment it is tidied.

**Five choices were made where the sheet was silent, and all five were put to
him and stand.** They are written at the foot of `docs/handoff.md` under a
heading of their own, at his instruction and recorded as settled rather than as
open questions. In outline: the wanted-block answers in four parts rather than
yes or no, because a task finished outright and a chore ticked off for today are
both "done" and only one has occurrences still standing behind it; a done
occurrence carries no push-back moment with it, matching what Done already does
on the pages; `sourceScreenCode` is a named set of the five screen words, being
a value that can only ever be one thing; `pushedBackToStamp`, `dueWeekday` and
`dueMoment` are absent rather than carrying a stand-in, since an absent field
says plainly what a zero would have to be interpreted into; and `inputshape.ts`
earns no test file until something in it does something.

**Nothing reached the phone**, per the #15-new rule. Next is the fourth step of
the #19-new order: the five translators, one at a time.


## #24-new (2026-08-26): the first translator built, and the wanted-block's questions reordered to let it work

**Written into this file at #31-new, from `handoff.md`, having been missed at
the time.** This is the fourth step of the #19-new order, begun.
`scheduler/translators/myday.ts` turns a saved My Day item into a shaped item
and **nothing in the app calls it**, the same deliberate way the shape and the
blocks were built. `scheduler/readers/myday.ts` was untouched and still did all
the work; it is retired only when its replacement is proved, which is Patrick's
own order from #19-new. **267 of 267 tests pass**, up from 248, and `npx tsc`
reports only the standing Expo router error.

**Superseded two sessions later.** `translators/myday.ts` was deleted at
#26-new, everything in it moving into the one translator and its table. What
survives from this session is the reorder of the wanted-block and the three
banner fields, both of which are still live.

**The translator sets what a My Day item IS and nothing more.** Daily kind
always; done and push-back both allowed; done does not end the item, because a
routine comes back tomorrow; no lead times, so it speaks at the moment itself;
the banner's three words word for word as the old reader wrote them. It drops
nothing — dropping is a judgment and belongs to `stillwanted.ts`.

**The snooze that stands on its own survived the move, but only after the block
was changed.** The old reader arms a My Day snooze *before* its own guard on the
item having a time, because an item whose time was cleared after it was snoozed
still owes the reminder it promised. `stillwanted.ts` asked no due time first
and returned straight away, which threw that promise out. The worker session
found it, left the block alone and reported it, and Patrick ruled the order be
changed.

**The questions are now done, then the push-back, then no due time.** The done
rules are exactly as they were. The push-back gained one new answer for the case
this is all about: an item with no due time, not done, with a live push-back is
**wanted, this occurrence dropped, the moment standing** — dropped because there
is no base occurrence left to arm, standing because the promise was already
made. No due time is asked last, and answers exactly what it always answered
when nothing above it has spoken.

**`dueHour` and `dueMinute` became optional**, the way `dueWeekday` and
`dueMoment` already were, on the reasoning settled at #23-new: an absent field
says plainly what a zero has to be interpreted into, and midnight is a real
time. The translator leaves them out rather than writing zeros.

**Three banner fields joined the shape** — `bannerTitleText`, `bannerBodyText`
and `bannerButtonsCode`, the last a named set of the seven category names
`app/_layout.tsx` actually registers. The words are the translator's work, the
way #21-new settled the background banner's count, so the engine has everything
one reminder needs in one thing. They are optional, and **the placement was
deliberately reversible**: the output side was not designed yet, and moving them
later is three fields in five small files.

**Two tests in `stillwanted.test.ts` were rewritten** to hold the new order
rather than the old, and the section heading above them corrected. Nothing else
in that file assumed the old order. The test that holds *done before push-back*
was already holding a real rule and stands untouched.

**`docs/build-sheet.md` was left describing the old order** and has not been
brought level with this reorder since.


## #25-new (2026-08-26): the second translator built, and it needed no design decision at all

**Written into this file at #31-new, from `handoff.md`, having been missed at
the time.** `scheduler/translators/pets.ts` turns a saved Pets feed into a
shaped item and **nothing in the app calls it**. `scheduler/readers/pets.ts` was
untouched and still did all the work. **286 of 286 tests pass**, up from 267,
and `npx tsc` reports only the standing Expo router error. It was built from
`docs/build-sheet-translator-pets.md` alone.

**Superseded at the next session.** `translators/pets.ts` was deleted at
#26-new. This session is the direct evidence for that correction: two sessions
built the same file twice, differing by two string literals.

**Pets is My Day's twin and the file said so on its face.** Same fields in the
same order with the same comments, differing only in the banner's words —
`'Pets Routine'` where My Day said `'Daily Routine'`. The body sentence and the
button set were identical.

**The `'petssnooze'` trap was named in the sheet and held.** That word is both a
registered category name and the `source` name the old reader puts in a snoozed
feed's key, but the old reader uses `'routineactions'` as the actual button set
in both places. The translator set `'routineactions'`, with a comment saying
why, so the next reader does not reach for the apt-looking name.

**The reordered wanted-block carried Pets' snooze across untouched.** The cure
made at #24-new was general, so the case that needed a change to the block for
My Day needed nothing at all here. It is proved by its own test.

**`translatormyday.test.ts` was brought up to the standard the Pets tests set**
(Patrick). Its two null-time tests checked only `hasDueTimeBit` and now also
assert that `dueHour` and `dueMinute` are absent. They were written before those
fields became optional at #24-new and were never brought forward.
`translators/myday.ts` already behaved correctly and was not touched, so the
count is unchanged.

**The build sheet's read list was incomplete and the worker stopped rather than
guessing.** It named two files to read, but the twin pattern needs `PetsItem`
from `readers/pets.ts` and the last required test needs `isStillWanted` from
`stillwanted.ts`. Patrick's ruling: the ban on those two files was about
editing, not reading, and reading them was right. **A sheet's read list should
name what the pattern it points at actually imports.**

**Noted by Patrick and deliberately not acted on**: the translator takes its
item type from the old reader, which ties it to a file meant to be retired. That
is his to solve at the swap step, not the translator's.


## #26-new (2026-08-26): the two per-screen translators became one translator and a table, and My Week and Look Ahead joined it

**The two translators built at the step before differed from each other by two
string literals**, and a third was about to be built the same way. They are now
one file: `scheduler/translators/translate.ts`, holding the rules type, the core
`translateWith`, and four rule sets — My Day, Pets, My Week and Look Ahead —
each with a thin named wrapper in front of it. `translators/myday.ts` and
`translators/pets.ts` are deleted, everything in them having moved into the
table. **319 of 319 tests pass**, up from 286, and `npx tsc` reports only the
standing Expo router error in `app/settings.tsx`.

**The consolidation is proved to have moved no behaviour.** The two existing
test files, `translatormyday.test.ts` and `translatorpets.test.ts`, were written
against the deleted files. **Their import line was changed and nothing else** —
not a case, not an assertion, not a value — and all of the old 286 still pass.
That was the test the sheet set for this build and it is the reason the old
tests were kept exactly as they stood.

**The rules are accessors, not field-name strings.** That is what lets the
compiler check each rule set against the screen's real saved shape; a table of
strings could not be checked. It is the same trade the #22-new ruling against
packing bits was made on — readability and the compiler's checking.

**Two new test files, thirty-three tests.** `translatormyweek.test.ts` has
eighteen and `translatorlookahead.test.ts` fifteen, both added to `run-all.ts`
with headings of their own.

- **The weekday stays as the app saves it**, Sunday as 0. The old reader adds
  one when it builds the trigger because the phone counts from one, and that
  addition belongs at the phone boundary. A test pins it, because adding one
  here is exactly what a later session would "fix" into place.
- **A date item carries its moment alone.** `dueMoment` is set and `dueHour` and
  `dueMinute` are left off, so the hour does not exist twice. A test pins that
  too.
- **A chore's tick goes into the shape though the old reader ignores it.** That
  is deliberate and not a mistake: the reader arms one true weekly repeat
  whatever the tick says, because a repeating alarm cannot skip a week, and the
  translator tells the truth instead. Nothing moves on the phone until the
  screen is swapped over, which is the cure.
- **Look Ahead's `due.getTime() > now` guard was not carried across.** Whether a
  past entry still wants arming is a judgment and belongs in `stillwanted.ts`.
  An entry whose moment has gone comes through with its moment intact.

**Two stale comments in `inputshape.ts` were reworded and nothing else in that
file was touched** — the opening paragraph, which still said a small translator
per screen sets the fields, and the `dueHour`/`dueMinute` comment, which still
said all three kinds use them.

**No screen, no reader and nothing in the app was touched, and nothing calls
any of this yet.** To-Do is not in this build: its background banner is built
from the whole list rather than from one saved item, a reduction where
everything else is a mapping, and it gets its own sheet. Nothing reached the
phone, per the #15-new rule.

**One choice was made where the sheet was silent, and it is in the build report
rather than written into any document.** The sheet gives `DueFields` as a
returned record and the core spreads its fields into the shaped item; the core
spreads each of the four conditionally on the field being present, which is the
plainest way to keep the sheet's rule that absent fields are left off rather
than filled with zeros, and matches what the deleted translators did inline.

## #27-new (2026-08-26): lead moments, To-Do in the table, and all five screens on the one live machine

**The missing piece was built, To-Do joined the same table as the others, and
`gatherWanted` now sends all five reminder screens through that path.** The old
readers are still in the project; the live run no longer calls them, except the
Memory Test, which still skips the common shape. **391 of 391 tests pass**, up
from 319, and `npx tsc` reports only the standing Expo router error. Nothing
here has been proved on the phone.

**Lead moments** (`scheduler/leadmoments.ts`) turn each lead time into a clock
moment. An empty list means nothing to say, for every kind. My Day, Pets, My
Week and Look Ahead each give one lead time of nothing-before. Offset amounts
use the same multiplication `readToDo` uses. It was built from
`docs/build-sheet-lead-moments.md`.

**To-Do is one more row in the table**, not a special case. Its reminders are
lead times off one appointment. A task with no reminders stays silent. A
background task is an item with no time, so it gets no banner.

**The eight o'clock group banner is not part of the machine.** Patrick has two
items labelled background, one on My Day and one on To-Do, both with no time and
no banner, for opposite reasons: the My Day one is a short-range tick so he
knows a daily thing was done; the To-Do one is long-range outstanding work with
no deadline, and he does not want the phone telling him to do it. Claude had
kept saying the banner was needed or the item would not reset. That is
backwards. A banner does not reset anything. The morning sweep does, and To-Do
must not go through it.

**The heading is now an accessor for every screen**, the same way the sentence
already was, because To-Do puts the task's name in the heading. The other four
screens still produce the same words they did.

**The join** (`scheduler/remindersfor.ts`) turns shaped items into the reminders
the phone should hold. Depth is one. A ticked daily item is not pre-armed for
tomorrow. A ticked weekly chore stays quiet this week, which is the cure the
repeat could not give. Snooze, postpone and delay keep the source names the
housing already routes. Date items with one moment keep the name `base`; To-Do
names each lead by the reminder's own id.

**The live swap is `gatherWanted`.** My Day, Pets, My Week, Look Ahead and To-Do
each go translator then join. The Memory Test and the Timer are unchanged.

**On the phone, once Memory comes to the front:** one reminder per My Day item
and per Pets feed, not two; a ticked My Week chore silent this week; no eight
o'clock To-Do banner. Banner words on each screen were kept. The phone proof is
the next act.

**No screen was edited.** The old readers were not deleted.

### #27-new, later the same session (2026-08-27): five screen fixes, all seen working

**This half was built in conversation with Patrick rather than from a sheet, and
he confirmed every one of the five on the simulator as it landed.** The engine
above was untouched. **391 of 391 tests still pass, and `npx tsc` is now clean —
the standing `app/settings.tsx` error no longer appears.**

**The way of working changed, and it is Patrick's call.** The
supervisor-and-worker split is retired. One session does the work, in the
conversation that discussed it; big mechanical builds go to Cursor with a sheet
written here. His reasoning was that the value had always been in the sheet
rather than in the second session — the engine above was finished in
forty-five minutes because every decision was already made on paper.

**The Scheduled Reminders page sat half an inch low.** `app/reminders.tsx` was
the only route in the app never registered in `app/_layout.tsx`, so it fell back
to the navigator's default header and drew one above its own. Every other screen
carries `headerShown: false`. One line added. The page itself was correct all
along and was not touched.

**The reminder count moved under the header.** It had been one sentence at the
foot of the scroll. It is now a band directly beneath the header — the number
large and alone, the ceiling small and grey below it — because the number is
what the page is opened for. `describeHowFull` is no longer called and its
import came out; the Timer's "not shown here" line stays at the foot, since it
explains the list rather than the count. **Both of that page's layout notes from
#15-new are now closed.**

**The hour stepper was off by twelve hours** (`components/DateTimeControl.tsx`).
`adjustHour` read AM or PM before spinning, held it fixed, and rotated only the
1-to-12 digit — but crossing between 11 and 12 is exactly the moment AM and PM
must swap. Down from 12:00 PM gave 11:00 PM, up from 11:00 AM gave 12:00 AM, up
from 11:00 PM gave 12:00 PM. The whole twelve-hour conversion was unnecessary,
since the display does it: the three lines became one, stepping on the 24-hour
clock. **Any time set by spinning through noon or midnight before this is stored
in the wrong half of the day and needs re-setting.**

**The Vault's header button now says where it goes.** Vault is one page with two
states, and the button said Home in both. Inside a category it is **Back** and
steps back to the category list; on the list it is **Home**. The
"← All Categories" row and its styles came out, since Back does that job. Going
home now pops rather than replacing — Vault is only ever entered from Home, so
it is the same destination, but popping is what the rest of the app does — and
the `router.dismissAll()` beside it went, because it dismisses modal *routes*
and this app's pop-ups are plain `<Modal>` components.

**A To-Do task may now have no date and no time**, built from
`docs/build-sheet-optional-date.md`, written and built the same day.

- **The fault, in Patrick's words:** *a pop-up already asks it, it just ignores
  it.* Leave both boxes alone, say yes to "Are you sure you don't want to set a
  Reminder?", and the page wrote today's date at noon onto the task anyway.
- **The cause:** `DateTimeControl` repainted an empty date box from the spinners
  on blur, and To-Do never turned on the optional-time mode that already
  existed, so the same happened to the time. Both save paths then wrote all five
  date fields unconditionally.
- **`optionalDate` was built to match `optionalTime` exactly** — dulled
  spinners, an empty box with a "No date set" hint, waking on any arrow or a
  typed date, `onClearDate` when emptied. **The two halves sleep independently**,
  so a task may carry a date and no time.
- **`onChange` now carries which half was touched.** Without it, spinning the
  date would have claimed a time was set too. Callers that do not care ignore
  the second argument, so no other page changed.
- **`Task`'s five date fields are optional, and absent is the form that means
  "no date"** — never a zero or a null to be tested for, because `taskDueDate`
  asks `typeof` and already understood absent. `finishUpdate` strips the old
  fields before spreading the new ones, or clearing a date would silently do
  nothing.
- **More than half already worked.** `taskDueDate`, `scheduleLabel` and the sort
  all coped with a dateless task, and `todoRules.dueOf` already gives back no
  due time when there is no date. The work was letting the blank through.
- **A dateless task shows its title and nothing else** (Patrick, on
  consistency). My Day and Mollie already show an item with no time that way,
  and the "No time set" wording exists only as a hint inside the entry box,
  never on a tile.
- **The "No Reminder Set" pop-up is unchanged.** It was always the right
  question; the fault was never in the asking.

**What the session got wrong, kept because the pattern is worth catching.**
Three times it stated a stale or partial reading as settled fact — that nothing
had been built, that the docs needed refreshing, that the swap was still ahead —
each time from a single check whose conditions it had not examined, and each
time it took Patrick pushing back to get the check re-run. The folder had in
fact been read through a stale view. **A negative result is the weakest kind of
evidence and was the one stated most confidently.**

## #28-new — Reminder Engine 4, Cursor (2026-08-28): the repeat group, skip, and floating-or-named-zone time built into the machine

**Written into this file at #31-new, from `handoff.md`, having been missed at
the time.** This was a Cursor build from a sheet rather than a chat session of
the chain. **The number is Patrick's, given at #31-new**: the chain went from
#27-new straight to the Reminder Engine work, and his recollection is that it
probably began as #28-new. It is numbered here so the chain has no hole in it,
and the qualification is kept because he said "probably" rather than
"certainly". **413 of 413 tests pass**, up from 391. `npx tsc` was silent. **No
screen was touched, and none of it has been proved on the phone.**

**The three-word trigger is gone.** My Day and Pets write a daily repeat, My
Week a weekly one, Look Ahead and To-Do stay one-offs. Skip arms the next event
on the same run. Every row floats with the phone; a named zone is honoured when
the bit is later written false.

**The translator does not read a repeat rule, a skip stamp or a zone from saved
lists.** Nothing on any screen writes those yet, so the new fields stand ready
rather than in use.

- **Depth is one**, live. My Day and Pets arm one reminder each, not two.
  Opening the app arms the next. That is recovery on opening.
- **A ticked My Week chore stays quiet this week.** The old path was a weekly
  repeat, which could not skip. It is now one moment on the next due day.
- **The eight o'clock To-Do banner is gone from the live run.** A background
  task is an item with no time. Patrick's two items labelled background — one on
  My Day, one on To-Do — both expect no banner, for opposite reasons. Claude had
  said the banner was needed or the item would not reset. **That claim is not to
  be listened to again.**
- **A To-Do task with no reminders stays silent**, even at the appointment.
- **The old readers are still in the project.** The live run no longer calls
  them, except the Memory Test, which still skips the common shape. The Timer
  sits outside the module.
- **Banner words were kept.** Snooze, postpone and delay still use the source
  names the housing already routes.


## #29-new, Cursor (2026-08-28): the one Input page built as a try, and the plan it belonged to dropped a session later

**Written into this file at #31-new, from `handoff.md` and
`docs/build-sheet-input-page.md`, having been missed at the time.** Built from
`docs/build-sheet-input-page.md` as `app/input.tsx`, with Home's first tile and
the route in `app/_layout.tsx`. Patrick checked it on the simulator.

**What it does.** First glance is four lines — a name, a date or none, a time or
none, and Repeat or none — with date and time each starting asleep. The Repeat
panel holds how often, every how many, which weekdays, and stops on. Enter
writes to the existing lists and then opens that page. Patrick tried all five. A
My Week item fired. Look Ahead's Log still rolls the date forward by the
interval. To-Do's Done logs the task and it goes away.

**Enter to the five lists was added in that same session, after the sheet**,
which had said not to write lists.

**The plan it belongs to was dropped at #30-new.** The page is still in the app
and Home's first tile still opens it. It is a try, not the destination. The
sheet carries a note saying so at its top.


## #30-new (2026-08-29): the reminder pages named and shaped, the one Input page dropped, and the docs index written

**Written into this file at #31-new. Nothing was built at #30-new** — it was a
design session, and the code was not touched. The decisions below are Patrick's
and they are the live plan; the full account of them lives at the top of
`docs/handoff.md`.

**The session began on the rest of the Input sheet** — Options, holidays, time
zone, the float button, Skip, an extra tap on a shifted day, calendar shading, a
Reminders-before row, a notes row, a second Thursday, a Wednesday after the 6th.
The first item taken up, the Reminders-before row, is what brought the whole
plan down: Enter had nowhere to keep a lead time on My Day, Pets, My Week or
Look Ahead, because only To-Do has a home for one.

**Patrick's own reason for dropping the one Input page**, and it is the durable
part: one form has to ask every kind of question and then guess which list you
meant, so it grows to hold the whole app, while each page only ever needs its
own small part. His picture was of the user facing the huge input page.

**Testing waits until the building is done** (Patrick). The automated test load
is not next, and neither are the odds and ends.

**The pages, as he settled them:**

- **Daily** — My Day and Pets as items on one list. Daily is also a view of the
  day: anything from Weekly, Monthly, Quarterly, Yearly or One Time that falls
  on today shows there with the every-day items. A dateless item has no day, so
  it does not.
- **Weekly** — My Week.
- **Monthly**, **Quarterly**, **Yearly** — Look Ahead's repeats, split by how
  often. Look Ahead is not a once-only list.
- **One Time** — a date, no repeat, carrying To-Do's Reminders before chips.
- **Extended** — no date.
- **Options** — its own page.

**To-Do stops being a page.** Its tasks split by how they actually repeat: a
dated task that does not repeat goes to One Time, and a dateless one to
Extended.

**Daily's own add is narrower than the others'.** It is only about this day, and
offers two kinds — an every-day item, or a One Time for today with Reminders
before. Pets is just another every-day item on it. The other cadence pages keep
their own adds, because the page is the whole meaning of Repeat there.

**The + Add popup is Patrick's.** It only asks where the new item belongs. The
fields stay on that kind's own small add, and when you are finished you return
to the page you started from. If you are already on Monthly, the popup opens
with Monthly already chosen, so the extra step is a confirm rather than a quiz.

**The Reminders-before chips already exist** on To-Do's Add box: 30 min., 1
hour, 2 hours, Morning of, Day Before, Night Before, 2 Days Before, Week, and
Month. **Any and all can be on at once** (Patrick), which is how To-Do already
works, and that is what One Time carries.

**One question was raised and never answered**, and it is carried forward as
open: what these pages actually save. It was put as a split between the recipe —
name, date, time, repeat, lead times, written once on the add — and occurrence
state, the ticks and postpones a viewing page writes. The conversation turned to
naming the pages before the question came back.

**The 24-hour clock was read up and parked until after the building** (Patrick,
who keeps leaving the time on the wrong half of the day). The setter is one
file, `components/DateTimeControl.tsx`; the display is one small function copied
six times plus `formatClock` in `scheduler/queueview.ts`; eleven assertions in
`scheduler/tests/queueview.test.ts` hold AM/PM strings; and the arithmetic needs
nothing, since #27-new already moved the hour stepping onto the 24-hour clock
and the type-in box has always been 24-hour. **The box and the spinners disagree
today**, which may be part of what trips him.

**`docs/index.md` was written**, one line per file saying what it holds and
whether it is live or history, and named in `CLAUDE.md` rule 2 as not part of
the opening read. **`docs/in-flight.md` was rewritten** for the close of the
session, and `docs/build-sheet-input-page.md` gained a note saying its plan is
dropped.

**`reminder-shape.drawio` is not in Memory's docs at all.** Only draw.io's
hidden backup of it is. The drawing lives at
`Projects/Reminder Engine/docs-ref/reminder-shape.drawio`.

**The AI platform note went in two places outside this project**:
`Projects/My-Tools-and-Extensions.md` gained a Cursor entry, and
`App-Docs/master-handoff.md` gained one line under "True across them all"
pointing at it.


## #31-new (2026-08-29): the record itself put right, and the rule changed from a ceremony to a condition

**No code was touched.** The session opened on the build sheet for the reminder
pages and did not get to it. What it found instead is why the sheet kept being
hard to write: **five whole sessions had never been written into this file** —
#24-new, #25-new, the 2026-08-28 Cursor engine build, #29-new and #30-new — so
the reasoning behind decisions Patrick had already made existed nowhere but in a
chat transcript.

**Patrick's own words open it**, and they are the reason the session turned:
*"I specifically ask again and again to record the important data so that this
does not keep happening every session. And you assure me it is. AND IT IS
NOT!"* He said afterwards that he had been through more than half a dozen
cleanups of this kind, each with a confident "what is needed is…", and that he
was ready to give up coding altogether. **Every one of those rounds added, moved
or removed a file, and a file does not change behaviour** — which is why each
one had to be done again.

**The mechanism that lost things, named plainly.** Everything was written at one
pass at the end of a session, and at that pass a conversation is compressed to
its conclusion: the page names survive, the reasoning and the open questions
behind them do not. Compressing what has just happened is the wrong end to save
space at, because that is the part no other file holds yet.

**Patrick's ruling, and it is the durable part of the whole session: write the
condition, not the ceremony.** He arrived at it through the rtf. His original
request had been that the copy he reads must never be stale; what got written
was a ritual — regenerate at every refresh — which is not the same thing. A
ritual does work whether or not it is needed and fails silently the once it is
skipped. His sentence: *"RTF regened is useless if the .txt has not moved. So
again my request turned into a useless rule."*

**`CLAUDE.md` gained rule 4**, which holds the conditions: a decision is written
into `handoff.md` the moment it is made; the handoff holds live work and open
questions only and stays under 400 lines; nothing is deleted from it until it
exists here; every session has an entry here, written at its close; and the
three-question test for pruning a block — finished, so it goes to the history;
still decides something, so it goes to the handoff's standing rulings; undone or
unanswered, so it stays.

**`docs/check-docs.py` was written**, on the principle that a machine check beats
attention. It reports three conditions and changes nothing: the handoff's line
count against the limit, any session number missing an entry here, and whether
`pending.docx` differs from `pending.txt`. **It earned itself twice on its first
day.** It found that no #28-new existed anywhere — Patrick answered that the
chain went straight from #27-new to the Reminder Engine work, which probably
began as #28-new, so that build now carries the number. And it was itself nearly
wrong: it counted any line beginning with `#` as a heading, so a wrapped line of
body text starting `#31-new` was read as an entry that did not exist. It would
have reported the chain complete with a session missing, which is the exact
fault it exists to catch. It now looks at real headings only.

**`handoff.md` went from 906 lines to 281.** Everything finished was checked
against this file first and written here where it was missing. It gained a
**Standing rulings** section, because Patrick's governing rulings — rock solid
as the top goal but not the only one with consistency beside it, "rock solid is
for when you use it", the old reminder thrown away and the new one kept,
established practice over a private arrangement, and a rule built into the
machinery rather than remembered — were sitting only in the history of the
sessions where he said them, while they still decide things today.

**One fact was rescued.** Patrick's phone confirmation of the reminder highlight
at #14-new lived only in `handoff.md`, and #14-new has no entry here. It is kept
in the gap note beside #13-new.

**The Word copy is back, at his word.** `pending.docx` replaces `pending.rtf`,
which is what he wanted originally — one existed at session 0 and was replaced
by an rtf at #12-new. `docs/make-pending-docx.py` writes it by hand rather than
with a library, so there is nothing to install, and reads it back to prove it
matches word for word. **Arial 14, his choice after looking at the first
attempt.** `pending.rtf` and `make-pending-rtf.py` are kept as history and are
not current. The rule that said flatly there is no Word copy is reversed — that
rule is why the first one went missing unnoticed.

**`pending.txt` was rebuilt to Patrick's own shape**, from 675 lines to 222:
What's Next, Pending, Facts that apply to the ongoing work, and What is done
newest first, with three existing sections kept at the foot. **The
session-by-session story came out entirely** — *"I don't need a session history.
You may want to archive that for ref only"* — since this file is that archive.
Items are numbered under each heading so either of them can point at one.

**Two corrections to how the page work had been written down**, both his:

- **The Input page goes away and nothing replaces it**, and the + Add popup in
  particular is not its replacement. The work is the app's own reminder pages
  reshaped by how often a thing repeats. Calling it a replacement makes it sound
  smaller than it is.
- **The + Add popup opens from the "+ Add" button the pages already have.** No
  new control is added anywhere to reach it.

**The storage question is named as open** at the head of the handoff's open
list: what these pages actually save. It was raised at #30-new and the
conversation turned to naming the pages before it was answered. Almost nothing
else in the build sheet can be settled until it is.

**What this session did not do.** The build sheet. It is still the next piece of
work, and it waits on that one question.


## #32-new (2026-08-29): the pages phase spec, and Daily's first job sheet

**No code was touched.** The session opened as the build sheet for the
reminder pages. It wrote a phase spec and the first job sheet instead of
building. The chain switched from Claude to Grok part-way through.

**Storage is settled:** one saved list of items, each carrying how often
it repeats, and a page as a filter on that list. That had been open since
#30-new.

**How a view item is changed, settled here.** On Weekly through Extended,
each item has Done and Snooze, and a tap on the tile opens the edit page
— a page, not a modal. Daily is the exception: no buttons, resident or
visitor; swipe to delete when an item is done or not needed; a tap still
opens the edit page; a visitor returns to Daily. A visitor already shows
its name, and next to it `from Weekly` (or Monthly, and so on). "Tag" was
only a way of saying that.

**The old screens, still in the app:** a tap selects the row for reorder,
and a separate Edit button opens a modal. `app/input.tsx` is the only
page version of the form and it is the one being dropped.

**Done.** Weekly, Monthly, Quarterly and Yearly repeat: Done finishes
this cycle and arms the next. Display adjusting is a separate change, not
part of that tap. One Time and Extended: Done turns the button to the
done colour, the item stays, it no longer fires or arms, and delete is
how it leaves. Daily's swipe-to-delete is how an every-day item leaves.

**Options** is a list in the style of the iPhone's notification-apps
list. Missing days follow the engine record: the last day that exists,
with an extra tap for then or next day, not skip. That calendar thinking
is from RFC 5545 and JSCalendar RFC 8984, without the file format, in
`Reminder Engine/docs/reminder-engine.md`. JSCalendar's own `skip` is
about dates that do not exist, not about skipping an occurrence.

**The record split, settled here.** One phase spec for the pages build,
not the whole of moving Memory onto the engine. A job sheet for one job.
The spec is `docs/spec-pages.md`. The first job sheet is
`docs/build-sheet-daily.md` — Daily, and the one list it needs. Not
built. Visitors from other pages wait. The engine is not rewritten this
job; Daily dual-writes the old keys so reminders still arm.

**What this session did not do.** Build Daily. The 24-hour clock. Testing.
The phone.


## #33-new (2026-08-29): Daily built, My Day gone, and the next job sheet brought level

**Daily is in the app.** Home's Daily tile opens it. The one list
`reminder_items` is live, with dual-write so the engine still arms.
Pets came in as every-day items. The first sheet's "Daily has no
buttons" was reversed while Patrick was looking at Daily.

**How Daily works, settled while looking at it.** Snooze, Done, and
Done that undoes. Tap the name to edit. Hold the name and slide to
reorder — no overlay arrows, and no arrows on the row. The list is
not rewritten while the finger is down; rewriting mid-slide dropped
the hold after one slot. My Log is My Day's log, the same saved
list, written when Done is tapped.

**One Time for today,** from Daily's own add: Reminders before are
only 30 min., 1 hour, 2 hours, and Time of. Time of is the item's
own time. Save returns to To-Do until One Time is a page, because
that was the page with the Log. Cancel and Home on that add still
go to Daily. After save, dismiss the stack then replace, so the
page underneath does not flash.

**The My Day page is gone.** `app/myday.tsx` only hops to Daily.
Banners tagged `myday` and Siri mark-done open Daily. If Home stops
opening an old page and the banner still opens it, Patrick sees the
new page then quickly the old one.

**The next job sheet** is `docs/build-sheet-pages.md`. It was
refreshed at this close so the next session copies Daily as it is,
not the first sheet. Weekly through Options are not built.

**What this session did not do.** Weekly through Options. The
24-hour clock. Testing. The phone.


## #34-new (2026-08-30): Weekly through Options built, Home rearranged, old screens next

**Weekly, Monthly, Quarterly, Yearly, One Time, Extended, Options, and
the + Add popup are in the app**, from `docs/build-sheet-pages.md`.
Home opens them. The one list `reminder_items` now also holds weekly,
monthly, quarterly, yearly and extended items, folded in from the old
lists by id, with dual-write so the engine still arms. Daily shows
today's visitors with `from Weekly` and so on next to the name. Save
on One Time for today returns to One Time, not To-Do.

**The six cadence pages share one list.** Header, Snooze, Done,
hold-and-slide, swipe, and highlight live in
`components/CadenceListPage.tsx`, copied from Daily. The save of the
one list moved to `modules/reminder-items.ts`. Options is the odd-cases
list; each row opens that case. Nothing is written into the engine from
there.

**Home.** Input, To-Do, Look Ahead and My Week came off with the
sheet. Patrick then took Project Planner, Orders and Watch List off as
well, same treatment: tiles gone, routes still registered. He then
arranged the remaining tiles himself. Banners for My Week land on
Weekly, To-Do on One Time, Look Ahead on Monthly. My Day banners still
open Daily.

**What this session did not do.** Taking the old screens out — that is
the next session, and the engine's old readers stay until dual-write is
swapped. The 24-hour clock. Testing. The phone.


## #35-new (2026-08-30): old screens out, backup on the new list, logs next

**The old screens came out.** Input, To-Do, Look Ahead, My Week, Project
Planner, Orders, Watch List, Pets, and the `/myday` hop are gone. Home
was not touched. Pets and Orders banners are not kept, buttons
included, so a leftover Pets Done cannot write the Daily list. The taps
that already open Daily, Weekly, One Time, and Monthly stay, because
those are the live reminders. The engine still reads the old lists
through dual-write, so those readers stay.

**Backup copies the new list.** He had deleted the old backup files, so
restore does not read them. Daily's My Log still travels. After a
restore, the engine lists are written from `reminder_items` so
reminders still arm. Old backup files are refused.

**Logs, settled and not built.** Daily already has My Day's log. Weekly,
Monthly, Quarterly, Yearly, One Time, and Extended need theirs, the same
logs the old pages used. Monthly, Quarterly, and Yearly share Look
Ahead's log. One Time and Extended share that log's style, not the
list: each has only its own. That is the next session.

**What this session did not do.** The logs. The 24-hour clock. Testing.
The phone.


## #36-new (2026-08-30): logs on the new pages, 24-hour spinner, Options doors

**Logs are on the new pages.** Daily already had My Day's. Weekly uses My
Week's. Monthly, Quarterly, and Yearly share Look Ahead's. One Time and
Extended each have their own, in that log's style. All are titled Log,
not My Log. Done writes a line. Those lists travel in the backup.

**Home no longer warns** when it tries to clear an empty stack after a
reload or after Add and Edit.

**The 24-hour box opens a four-digit spinner**, one arrow per digit,
hour 00 to 23. The AM/PM removal is mitigated by that spinner and is not
a separate job.

**Options connecting started.** Daily gets none. Weekly is first. + OPT
on Weekly's New and Edit opens holidays, time zone, calendar shading,
and a notes row. New and Edit say Back, not Home. Done in that sheet
saves and returns to the page the item sits on. Options has + Screen
(plus, then Screen, then a blank line). It opens Where does it belong?
That list does not open from the reminder pages: + Add goes straight to
that page's own New. You do not set another page from a different page.

**Next is saving those four onto a Weekly item.** The doors are in. The
explanations still do not write holidays, time zone, calendar shading,
or notes onto the item.

**What this session did not do.** Wiring those four settings. + OPT on
the later pages. Testing. The phone.


## #37-new (2026-08-30): Options settings on New and Edit, Note on the form, phone load

**Options connecting landed.** The case pages hold real controls, shared
by the Options page and + OPT. Done in + OPT writes onto the item
without leaving the form. New and Edit show only the options that are
set, by name: Holidays as Day before or Day after, time zone as Switch
off, calendar shading as the name only. That list is still there on
Edit.

**Note is a field on New and Edit**, on every kind including Daily, not
an Options case.

**Skip is off Options.** It belongs on the banner and the page.

**Which cases apply.** Daily can open Options and sees that none apply
for now. Weekly: holidays, time zone, calendar shading. Monthly,
Quarterly, and Yearly add Float around short month, an extra tap on a
shifted day, a second Thursday, and a Wednesday after the 6th. One
Time has the same three as Weekly. Extended’s set was not gone through.

**Float uses the last day that exists.** A 31st in September fires on
the 30th. Holidays will use the US federal list, before or after. The
engine does not do holidays yet, and dual-write does not pass the
fields. The 31st keeping through a short month is an automated-load
case. That load waits until the remaining features are in.

**He is loading this build on the phone** to live with it for a few
weeks.

**What this session did not do.** Wiring holidays and Float into the
engine. Extended’s Options set. The automated test load.


## #38-new (2026-08-30): engine and Options review, automated-load design, clean-cutover correction

**No code was touched.** Patrick had put the latest build on his phone
and made this a thinking session while he lived with it. The work was
reading the reminder engine and the newly connected Options all the way
through, then preserving what the later worker needs rather than making
Patrick reconstruct it.

**The engine has not drifted into per-page branches.** The trace went
from the translator and `ShapedItem`, through still-wanted, arm depth,
calendar arithmetic, the join and reconcile, to the scheduler housing.
The variety is still set at the boundary as named codes and independent
bits, and the core still follows one small execution road. The dense
part is calendar arithmetic, not a hidden rule tree.

**The automated phone load was designed and recorded.**
`docs/automated-test-load.md` is the live record and was added to
`docs/index.md`. One temporary removable load will save many small,
independent ordinary items through the real save road, run the real
scheduler, compare the actual phone queue with an independent manifest,
bring a smaller set of banners close together for one sitting, and then
restore Patrick's real items. It waits until the remaining reminder
features are connected.

**Six hardening points were found before that load.** Skip must return a
machine-readable reason rather than making prose control behaviour; an
unreadable source must leave its held reminders alone; a run requested
during a run must cause one fresh pass; reconcile must compare banner
contents and buttons as well as key and time; a replacement must be
secured before the old reminder is removed; and every page, banner and
Siri action must use the one canonical store and one write road. Each
point has its required Mac test in the automated-load record.

**The Options controls are ahead of their engine connection.** They
write fields onto `reminder_items`, while dual-write omits those fields
and the live scheduler still reads the old reminder-page lists. The
record now tells the worker how each case belongs: holiday movement as
a code in the shared calendar block; the existing phone-float bit and
zone pair in the common shape; calendar shading as a view of the same
engine range calculation; ordinal weekday and weekday-after-day as
repeat facts; and Then or Next Day as a response to one shifted banner,
not a permanent `shiftedChoice` on the item. The repeat recipe remains
unchanged when an occurrence moves, so a 31st returns after a short
month.

**Several choices were deliberately left as choices rather than
guessed.** Patrick still needs to settle what the Float switch means
when off, whether one monthly item may carry more than one date pattern,
the order of a holiday move with a missing-day move, Extended's Option
set, and whether Done inside + OPT may save a new item before the form's
main Save and survive Cancel.

**The clean-cutover instruction was restored.** Patrick said that when
he ordered the old pages removed, he also said there was nothing old to
save and that he is the only user. The implementation removed the
screens but kept dual-write and live old-store dependencies. The record
now calls that an incomplete implementation, not compatibility work:
`reminder_items` is translated once into `ShapedItem`; the scheduler
reads it; pages, banners and Siri write it through one function; and no
live reminder road reads or writes an old page store. Completion cannot
be reported until Mac tests prove the full road with those stores
absent.

**The records were kept current as the decisions were made.** The full
implementation and test guidance is in `docs/automated-test-load.md`;
`docs/handoff.md` and `docs/pending.txt` point to it and state the clean
cutover plainly. The document checker reports the handoff under its
400-line limit. `pending.docx` was not regenerated because Patrick did
not ask for the Word copy.

**What this session did not do.** No engine or Option implementation,
Mac engine run, simulator run or phone proof. Patrick's phone trial
continues.


## #39-new (2026-08-30): the live one-store cutover

**The live reminder road now uses one list.** Pages, banners and Siri
write `reminder_items` through one save. The scheduler reads that list
and translates each kind into the common shape. Dual-write is gone.
Load no longer folds in the old page lists. Day and week rollover run
on the same list. Backup restore still removes the retired keys and no
longer recreates them.

**Patrick's rulings, written as they were made.** The old stores come
out of the live road, not left in it. The old reader source files stay
until phone proof and must not be called. The Settings morning, midday
and evening times stay and the new code uses them; they moved off the
To-Do reader, and nothing live points at that file.

**Siri mark-done** now writes the one list, clears a snooze, and runs
the scheduler, then still opens Daily.

**What this session did not do.** Options still do not reach the
engine. Monthly, Quarterly and Yearly Done still advances the saved
date. The five remaining hardening points were not built. No phone
load of this cutover. `pending.docx` was not regenerated.

**420 of 420 Mac tests pass**, including seven for the one-list
translator. The records were brought current in the same session,
after the code.


## #40-new (2026-08-30): five hardening points, and time zone into the engine

**The five remaining hardening points are in.** They do not change the
engine's shape. Skip is a bit on the still-wanted answer; the
explanation is only words. An unreadable list leaves that source's
held reminders on the phone and says so. A save during a run queues
one rerun when the current run finishes. Reconcile compares name,
heading, sentence and buttons, not only key and time. A replacement
is created first; if that create fails, the old reminder stays.

**Time zone is the Options field the engine now reads.** A named zone
reaches the common shape as a complete pair. An incomplete pair is
rejected: the item keeps floating with the phone rather than silently
producing no reminder.

**What this session did not do.** Holidays, Float, the extra tap, a
second Thursday, and a Wednesday after the 6th still do not reach the
engine. Monthly, Quarterly and Yearly Done still advances the saved
date. The open decisions a worker must not guess remain: Float off,
monthly-pattern combinations, calendar order, Extended's set, and
+ OPT's save-and-Cancel. No old-store test. No phone load of this
build. The engine was not redesigned.

**433 of 433 Mac tests pass.**

## #41-new (2026-08-30): five Options answers, holidays, monthly patterns, and extra tap

**The five Options questions were asked and answered**, then the
pieces that those answers unlocked were built one at a time.

**Float off.** The Float around short month switch comes out. Last
existing day is always the engine's rule. Do not connect `floatDay`.

**Monthly patterns.** Both are not needed. The last of the three stays
and clears the other two: a dated day, a second Thursday, and a
Wednesday after the 6th. A half-entered second Thursday is not a
valid recipe. If both weekday patterns are already on an old item,
neither is used as a combination.

**Calendar order.** A missing day and a holiday move cannot both
apply. There is no order between them.

**Extended.** A list of items to be done sometime in the future, with
no deadline, no due date, and no set time. It gets no banners. New
and Edit have only the name, an optional note, and Done. It can be
edited like the others. The current shape needs to change to meet
this.

**Cancel.** If it cancels, it closes and makes no change, including
after + OPT has saved.

**Holidays reach the engine.** The translator carries `before` or
`after` as one code. One calendar block applies the nationwide US
federal list, including the observed Friday or Monday when a
fixed-date holiday falls on a weekend. Inauguration Day is not on
the list. If the occurrence already moved for a missing day, the
holiday move is skipped.

**A second Thursday and a Wednesday after the 6th reach the engine.**
A complete second-Thursday pair becomes the weekday list with an
ordinal. Wednesday after becomes the weekday list plus the numbered
floor. Last entered on the form clears the other two. Monthly,
Quarterly and Yearly now repeat from the recipe. Done on those pages
no longer advances the saved date.

**Then or Next Day is on the shifted banner.** The saved choice is
not a recipe and does not go into the common shape. Then keeps the
last day that exists. Next Day pushes this occurrence one day. The
series does not move.

An incomplete zone currently floats with the phone; leave that
unless Patrick says otherwise.

**What this session did not do.** Calendar shading still paints every
matching weekday; the page does not yet ask the engine to expand a
visible month. The Float row is still on the page. Extended New and
Edit have not been cut down. Cancel after + OPT has not been made to
close with no change. The chat ran out of room while calendar
shading was being read, so that build never started. No phone load
of this build. The engine was not redesigned.

**447 of 447 Mac tests pass.**


## #42-new (2026-08-30): the rest of Options into the engine

**The four remaining Options pieces landed**, then Daily's own adds
were given only time zone.

**Calendar shading asks the engine.** The page expands a visible month
from the same calendar calculation that finds the next occurrence. A
last existing day and a holiday move show on the month. The old
weekday sample is gone.

**A weekday after a numbered day is the first occurrence after that
day only.** Later matching weekdays in the same month stay clear. Once
that day has gone, the next reminder is the next month's first after
the numbered day.

**The Float row is out.** Last existing day stays the engine's rule.
`floatDay` is not connected.

**Extended New and Edit** have only the name, an optional note, and
Done. Time and + OPT are gone.

**Cancel closes with no change**, including after + OPT. Done inside
+ OPT keeps the Options values on the form and does not save the item.

**Daily's every-day item and One Time for today get only time zone.**
The old warning that none of the Options applied is gone. One Time on
its own page still has holidays, time zone, and shading.

**The Timer is a different effort**, parked, not this reminder stretch.

**Look Ahead the page is gone.** The old tile-and-Snooze line is not
live work.

**The automated load is next.** He restated the load rules into
`docs/automated-test-load.md`: the phone load proves what the Mac tests
cannot; four pieces only, removed together after the phone run; ceiling
kept apart at fifty-six. The build sheet waits for a new session.

**What this session did not do.** No phone load of this build. The load
itself was not built. The engine was not redesigned. `pending.docx` was
not regenerated.

**459 of 459 Mac tests pass.** He saw the Options work on the simulator
and said it was all there.


## #43-new (2026-08-31): automated-load sheet, sitting list, Daily new-day screen

**The automated-load job sheet is written.**
`docs/build-sheet-automated-load.md`. It proves what the Mac tests
cannot: what Patrick sees. Four pieces, a Home tile, two-minute live
banners, ceiling kept apart at fifty-six. Expected answers are written
down, not calculated by the engine under test.

**His follow-along is `docs/test-load-sitting.md`**, in sitting order.

**Daily was keeping yesterday's Done marks** on the #37-new phone
build because that build's reset still cleared the old My Day and Pets
lists. In the later source the list was already reset, but a page
already on screen did not read again. Loading the list now rolls the
day and the week first. Daily and the other cadence pages read again
when the app comes to the front. That is not on the phone yet.

**What this session did not do.** The load itself was not built. No
phone load of this source. The engine was not redesigned.

**The next session reads that job sheet and builds.** Simulator first.
No design questions.


## #44-new (2026-08-31): automated load built, simulator sitting done

**The automated load is built.** Test load is the last tile on Home.
Four files under `scheduler/testload`, the screen, cleanup, and the
ceiling kept apart at fifty-six. Expected answers are written in the
scenario file, not calculated by the engine under test.

**The simulator sitting is done**, all six parts. Two engine Fails
remain: after Daily Done, tomorrow's notice is missing (C3); a One
Time at 00:30 in Los Angeles queued at 00:30 on the phone's clock
(Q13). Patrick's ruling: those two are #45-new in Memory, not the
Reminder Engine stream. The Reminder Engine files were not updated.

Four Looks were done. Five live banners were walked. A leftover
banner at the Weekly Done minute was an already-delivered notice from
an earlier Load, not a second armed test. Ceiling showed the
full-queue warning. Cleanup restored his list.

Mac suite 459 of 459. Two old type-check nits parked. Not a phone
build. The load stays until the phone walk.


## #45-new (2026-08-31): two engine Fails cured, phone sitting done, test load out

**The two engine Fails from the sitting are cured.** After Daily Done,
tomorrow's notice is the one armed date, depth still one. A One Time
with a named zone uses that zone's wall clock. Both passed on the
simulator and on the phone (23 passed, 0 failed). The checker was not
changed. The Reminder Engine files were not touched. Mac suite 460 of
460.

**A banner while Memory is on screen was silent.** It fired when the
phone was locked (on the watch), when the app was closed, and when the
app was in the background. It did not fire on Home or on Daily. Memory
now asks to show the banner the same way Timer already does, at app
start. He will verify that in the code without the test load.

**Patrick marked done:** the morning after, the automated load, the two
type-check nits, and the reminder pages stretch. Look Ahead's banner
delay, My Week's delay, and +1 Day on those banners are not live work:
those pages are gone, and Weekly runs through the engine.

**The test load came out of the app** after Clean up. Four files, the
screen, and the Home tile. No side copy. The sitting list and the
design stay as history.

**He loaded this build on the phone.** The sitting Check passed. Old
readers stay until each replacement is proved. The Timer stays parked.


## App-Docs (2026-08-31): Memory working documents and history split

Not a Memory chain session. The next Memory session is still #46-new.

Working documents stay in `docs`. History went to `docs-ref`. The
eleven build sheets are in `docs-ref/build-sheets`. The retired
`pending.rtf` and its script went with them. The index was tightened
to one line per file. Live paths were updated. Old paths in this
history file were left as they were.

He calls them working documents. Live desk means the same thing.

The road to releasing Memory waits for a fresh session. The bottom
line is still that the app exists for him.


## #46-new (2026-08-31): selling description begun; session dropped

The publishing picture was written into `docs/publishing.md` and
`App-Docs/Publishing-Strategy.docx`. The selling description was begun
as its own work. TickTick was named as the comparable. A comparable-app
look used tiny elderly apps, which was the wrong shelf.

The session dropped. The features file, the description start, and the
right-shelf research landed in #47-new.


## #47-new (2026-08-31): selling description start, comparables from what the app is

**The features file** `docs/Memory features.docx` is the inventory, not
the sell. The writing: a product description that does not sell, and
that is how it sells. True, easy to follow, warm, and interesting —
the app on the page, not a pitch. Claude for the sentences. Timer and
Memory Test stay off that page. The one shared list is inside baseball
and stays off the page.

**The description is a good start and was left.** Seven screens for
events to keep. Recurrence follows the guidance of iCalendar RFC 5545
and JSCalendar RFC 8984, not everything those specs say. Daily is the
ordinary reminder and its opposite. Options for the odd helpful cases.

**Comparables** used the features file, not elderly apps. The shelf is
repeating reminders and personal tasks. Apple Reminders is the free
default. TickTick, Todoist, Things, and Due exist because that default
is not enough. He opened Reminders: this one does more, easier. The
note is in App-Docs `Publishing-Strategy.docx`.

**One saved list instead of nine** came off the open list: it is done.
No code. He will commit.


## #48-new (2026-09-01): calendar build sheet written

The picture and the RFC note are in `docs-ref/chalendar.md`. The sheet
is `docs-ref/build-sheets/build-sheet-chalendar.md`. This session did
not touch code. #49-new was named to build from that sheet.

The calendar option can come out. The calendar fills the screen except
the header, which stays at the top of the phone (the right side in
landscape). Each day’s box shows the date and a tight one-line list of
item names, scrollable vertically, and horizontally if practical. Done
and Snooze are not on the calendar or on that day’s view; they are
marked on the item after a tap opens it. Arrows change the month. The
current month is shown when the calendar is opened.


## #49-new (2026-09-01): calendar page built

**Built from the sheet.** A Calendar tile sits next to Daily on Home,
📅, and opens `/calendar`. The month fills the screen except the
header. A tap on a day opens that day’s names. A tap on a name opens
the item. Header Back on the item returns to that day’s list on the
month you came from. The Options **Calendar shading** row is out. The
saved field `shadeCalendar` stays on items and is not migrated off.
The calendar shows every dated item’s days whether or not that field
was on. No every-day Daily items. No Extended items. No + Add on the
calendar. No Done or Snooze on the month or on that day’s list.

**Names in a day box** scroll vertically only, one line each. A second
scroll across the name fought the list in that small box.

**The suite is 460 of 460.** One check still named shading as Weekly’s
third case. That assertion is now holidays and time zone. TypeScript
still reports two older scheduler errors that this session did not
touch. The generated router list does not know `/calendar` yet.

**Portrait on the simulator was all right.** Rotating did not shift
the lettering, because the app was locked to portrait. That lock was
the original decision. They need landscape now. The calendar is
allowed to turn; the other pages still stay upright. The iPhone list
of allowed turns now includes landscape. The simulator app has to be
built again for the phone to accept the turn. He wants to see what
the other pages do in landscape as well. That look is not done yet.


## #50-new (2026-09-01): the other pages in landscape

**The goal was to look at the other pages in landscape.** The calendar
page was already built and was not rebuilt. He looked. **Not bad as an
optional view**: it does not force the user to keep rotating the phone.

**Only 0 and 90.** The face of the phone has things that will not move,
so 180 and 270 block part of the view. The same limits on the calendar.

**The header stays at the top of the normal portrait view** for that
turn — on the right in landscape, which is the island. Everything in
the header keeps its original place and shape: the portrait row, the
round buttons, the title in the middle. Not restacked down the side.
The Bridge lines stay with the headers. One-character vertical titles
are out. The whole header, Bridge included, sits at that top as it is.

**Pages that open from other places** — Daily’s +Add, Options from an
item, Morning / Midday / Evening, snooze, and the other covers — now
turn with the page. A separate window had been keeping them upright.

**The simulator still held the old sitting items**, and they were
firing. The test load is not back in the app and was not rebuilt. He
deleted the Memory app from the simulator. That store is clear. The
phone was not touched.

**He said the goal was accomplished.** All the pages, including the
ones that open from a page.


## #51-new (2026-09-01): display features, and Memory asks at start

**The goal was to change some display features on various pages**,
one at a time.

**Landscape chrome.** The round header buttons turn in place so the
words sit the right way up; the title still turns with the header.
The Home badge face does the same. He verified both. Home's badges
in landscape sit four across and three down, Memory Test last and
allowed off screen. He said that is good.

**Memory did not ask to show banners at start**, even though the
handoff said it would. Only Timer and Memory Test asked. After he
deleted, reloaded, and imported, it still did not ask. The ask is
now at start, then the scheduler runs. He said that worked.

**Monthly, Quarterly, and Yearly banners** named Look Ahead. They
now name their own page.

**Three from his external list.** An item with no reminder set no
longer has Snooze. The row button says Done? until a tap, then the
green tick; he said that is much clearer. Date deactivating for
options below was already fixed.

**Pending 2 and 4 were checked.** Neither is done. A failed Daily
clear-out still does not speak. Misses are still recorded for Daily
items only.

**Memory Test is temporary and coming out. Timer is isolated
deliberately.** Neither is a reason to keep the old reminder readers.

The suite stayed 460 of 460. The phone was not touched.


## #52-new (2026-09-02): landscape the right way, the Sit sitting, and the paperwork half

**The opener was landscape.** He corrected the turn: **90°
counter-clockwise**, headers on the **left**, the island for that
turn. `LandscapeRight` is the lock. He looked on the simulator
and loaded the phone; the rotation is good. All screens working
in any rotation is Pending 9; this sitting the lock stays.

**The rest of the sitting was not a build.** He evaluated the app
against RFC 5545 and RFC 8984. The write-up is `docs/rfc-eval.md`.
The claim still holds: the guidance of those specs, not the file
format. Miss-telling is Daily only; that is Pending 4 and the
next session.

**Then a Sit set** so longer-term items fire in a day or two.
`docs/near-fire-set.md` is the follow-along.
`docs/Remember-Backup-Sit-near-fire.json` is the Restore file.
He exported his real list first. The old test load was not
brought back. Tuesday night, Scheduled Reminders showed the ten
Sit rows with the right times and days, still under the old page
names (My Day, My Week, Look Ahead, To-Do) and 12-hour times.
Pending 8 is those names. Pending 7 is 24-hour time on a calendar
day tap. Pending 6 is one drawing of the list row. Pending 5 is
the date picker going inactive for Wednesday after the 6th,
noted only.

**Wednesday morning, 9:04:** all seven reminders fired, on the
simulator and on the phone. Nothing at 9:20. That is not a bug.
He decided it: One Time has no reminder at the set time, because
that is too late; you are either there or you missed it. The
chips before are the reminders. The page should be called One
Time Appointment(s) (Pending 10). Thursday’s show and no-show is
already known; it is not a look to find out. The two Later items
(9 and 10 September) he will do with his own list on the phone.

**The app is built and the work is only half done.** Now comes
the paperwork: a thorough design spec (Pending 11), a User Guide
from that or after it, on his website, and a way in the app to
find it (Pending 12), a Feedback button similar to Mystery
(Pending 13), and a file for what testing has covered and will
cover (Pending 14). The during-build tests are thrown away; the
run is not kept. Reminder Engine holds design, not tests.

**A helper** to guide where to set a reminder, as decision-tree
stages (Pending 15). The worth is landing on the right page.
How to set it is the page itself. Fine-tune options belong in
the User Guide or on Options. Having a good idea leads to
overreaching; the feedback he needs is the trim (Facts 16).

**He is feeling good about accomplishing his goal.**


## #53-new (2026-09-02): Scheduled Reminders names, one list row, and the sit watch

**#53-new is committed** (Patrick, #54-new). Scheduled Reminders
rows name Daily, Weekly, Monthly, Quarterly, Yearly, and One
Time. Monthly, Quarterly, and Yearly take the name from the
banner heading, because they share one source. A leftover banner
without one of those headings still says Look Ahead until it
cycles off. Siri still says My Day Item. Unused old files still
use the old names and are not on screen.

**Daily and Weekly through Extended share one list row**
(`components/ReminderItemRow.tsx`). Daily still composes its
name; the cadence pages still pass the when-line. Mac suite
466 of 466.

**He wanted to see tomorrow what the miss notice tells him.**
Missed-firing work and the calendar fire times wait until after
that. Siri and this sitting’s file changes stay off the phone
until he has seen it.


## #54-new (2026-09-02): Appointments and Bucket List started, sit watch still running

**#54-new is committed** (Patrick, #55-new). Pending 8 and
Pending 6 are done. Pending 4 and Pending 7 wait until after the
sit tests.

**Pending 10 was started.** One Time becomes Appointments.
Extended becomes Bucket List — an accepted concept, so that
name, not Wish List. The first piece is one list of the names
the person sees, used from now on, so a rename is one change.
That list is written in `constants/page-names.ts`. Scheduled
Reminders rows read from it: Appointments and Bucket List are
both on that map. Other screens still have their own copies.
The code scrub pays close attention to the page names. Remaining
rename work waits until the sit test has run its course. Saved
words on the phone stay as they are. No reminder at the set
time: too late; you are there or you missed it. Not a bug.

**Sit:** load on the phone, real list exported. Seven fired
Wednesday on both devices. Later items (9 and 10 September) with
his own list. Thursday’s show and no-show is already known. He
wants to see tomorrow what the miss notice tells him. Follow-along
`docs/near-fire-set.md`. RFC write-up `docs/rfc-eval.md`.


## #55-new (2026-09-03): the miss notice for the other kinds (Pending 4)

**The goal was What's Next 1 and Pending 4.** Sit tests finished.
Phone and sim opened Thursday with one message: Sit Daily from
yesterday is hangin!. At 8:00 AM two banners from today: Sit Daily
and Sit first Thursday.

**The reason the others did not show as missing** was that they
were never written down. That was true of Weekly, Monthly,
Quarterly, Yearly, and One Time alike, not only Weekly. The
opening pop-up already speaks every miss that was stored. The
work was the writing down.

**The day-roll now writes a miss** for any of those that fell on
an unprocessed day without Done. They still show on Daily only
on the day they fall. Sit first Thursday is due Thursday, so
Wednesday correctly stays quiet. A stretch away still sees a
Monday weekly item when Friday is the first open, one miss per
item, dated yesterday. Extended has no day and is not told.

**Monthly, Quarterly, and Yearly Done now leave a tick** so the
roll can still see it. The saved date is not advanced. The tick
comes off when that kind of day comes round again. One Time keeps
Done for good. Daily still clears with the day. Weekly's own
reset is unchanged.

Mac suite 487 of 487. He said the work is good. It is not on the
phone yet. **Committed** (Patrick, #56-new).


## #56-new (2026-09-03): Appointments and Bucket List on every live screen (What's Next 1)

**The goal was What's Next 1.** One Time becomes Appointments.
Extended becomes Bucket List — an accepted concept, so that name,
not Wish List. #54-new wrote `constants/page-names.ts` and wired
Scheduled Reminders. This sitting wired every other live screen.

**Headers** — `CadenceListPage` reads `pageLabelFor(kind)`; the
`title` prop is gone. **Home badges** and **+ Add** (`AddWherePopup`)
read from the same list. **Daily** shows Appointments in the from-line
via `FROM_PAGE`. All cadence pages and Daily use `PAGE_LABELS` for
the name the person sees.

Saved kinds, route names, and words already on the phone stay as
they are. "One Time for today" on Daily's add is unchanged — that is
the add kind, not the page name. No reminder at the set time: too
late; you are there or you missed it. Not a bug.

Mac suite 489 of 489. Patrick said very good. Not on the phone yet.

**Pending 2 was built.** A `reset` fault — the day-roll failing — was
written down at #18-new but classed quiet on the reasoning that no
reminder was lost. That reasoning is false: yesterday's tick can
stay in place and today's reminder may never arrive. `faultSpeaks`
now includes `reset`; the sentence in `faultSentence` reaches the
opening pop-up. Sweep stays quiet. Patrick asked to do it now rather
than wait for the helper session.

**Committed** (Patrick, #57-new). Calendar fire times (Pending 7 in
handoff, Pending 4 in pending.txt) were considered for the tail of
this sitting and left out — not safe to compress without a build
sheet and a settled meaning of fire time.


## #57-new (2026-09-03): the Where? helper settled and its build sheet written

**The goal was Pending What's Next 1.** The helper was settled from
the user’s journey through the existing app, then written as a
self-contained worker sheet. No app code was built.

**Where it starts.** Home gains another badge after Daily, labelled
Where? with a 🧭 compass. In landscape it sits at the bottom with
Memory Test; the temporary extra row is fine because Patrick will
rearrange and remove some badges later. Memory Test coming out was
already settled. Timer Alerts coming out was said as probable, and
whether Shopping List still belongs was left uncertain; neither is a
decision and neither changes in this work. The calendar month’s unused
right header button is also Where?. A calendar day list has neither
Where? nor + Add, and no calendar day rides into the form.

**What it asks.** First: “Does this item repeat?” Repeats leads to
Every day, Week, Month, Quarter, or Year. Does not repeat asks whether
it is for today. Yes opens Daily’s One Time for today form. No asks
whether it is a dated occurrence such as an appointment or a rare item
with no deadline such as a Bucket List desire. The eight landings are
the five repeating forms, One Time for today, Appointments, and Bucket
List. The helper lands on New, not on the list, and does not absorb
the form’s own setting questions.

**How leaving works.** Each layer closes naturally. Cancel or header
Back from New returns to the helper question that opened it. Cancel
from the helper returns to the Home or calendar screen beneath it. A
successful Save closes both New and the helper and returns directly to
that opening Home or calendar screen.

**The important code finding.** `item-edit` currently uses
`returnTo === 'daily'` both as navigation and as the signal for the
special One Time for today form. Those are separate facts. The sheet
gives the form an explicit One Time for today context and keeps return
navigation separate. It also makes the helper a transparent Expo
Router screen beneath New. That is a real three-layer journey, not a
set of exceptions around the present route. A root-level `Cover`
cannot be left open beneath New because it draws above the whole
Stack.

**The worker sheet** is
`docs-ref/build-sheets/build-sheet-where-helper.md`. It names the
seven files to build, the exact read-only patterns, all words and
landings, the boundaries, and the Mac and simulator checks.
`docs/index.md` now lists twelve build sheets. Composer is suitable
for the worker session because the decisions and code read are
finished.

**Checks.** No code changed, so no code suite was run. The document
checker is run at the session close. Patrick is committing this
session. Next is the worker build from the sheet.


## #59-new (2026-09-03): calendar fire time, Pending 3, spinner consistency

**The sitting opened on Pending 4 and Pending 3**, then tightened
spinner behaviour across forms at Patrick's word.

### Pending 4 — calendar day-list fire time

**The goal was Pending 4** — a tap on a calendar day should show
each item's 24-hour fire time, not the name alone. #56-new left it
out as not safe to compress without a sheet and a settled meaning of
fire time.

**Decision.** Fire time is the saved `hour` and `minute` on the item,
shown as `HH:MM` on the 24-hour clock before the label. Not a moment
the engine computes for that calendar day. Items with no saved time
stay name-only. Sort order unchanged.

**What was built.** `app/calendar.tsx` only. `savedFireTime24` and
`dayRowLabel` use `hourMinuteOf` from `modules/reminder-items.ts`.
The month grid is unchanged — names only in day boxes, as at #49-new.

**The worker sheet** is
`docs-ref/build-sheets/build-sheet-calendar-fire-time.md`. Written
and built in the same sitting.

### Pending 3 — date picker off for weekday patterns

On Monthly, Quarterly, and Yearly, when the saved repeat is second
Thursday or Wednesday after the Nth (`monthlyPattern` not `'date'`),
`DateTimeControl` shows time only — the date half is off. A fixed
date keeps the full First Due Date picker.

### Spinner consistency — useless spinners go (Patrick, #59-new)

Patrick asked for consistency with Bucket List: if a spinner cannot
change anything, it should be removed, not dulled.

**One Time for today on Daily** — date is always today, so the date
picker is off; save always writes today's date from `assembleFormItem`.

**Daily every-day with no time** — no clock at all, like Bucket List;
a **Set time** button adds one. Clearing the time removes the spinner
again.

All of the above is `app/item-edit.tsx`.

**AM/PM check on Save** (Patrick, #59-new) — the 12-hour spinners stay;
no move to 24-hour spinners. When the time was last set on the **12-hour
row**, Save shows a quiet reminder to check AM/PM (two taps). **No
popup** when the time was last set with the **24-hour box or digit
spinner** — `DateTimeControl` reports `timeVia` and `item-edit` skips
the warning. No time → one tap as before. `app/item-edit.tsx` and
`components/DateTimeControl.tsx`.

**Session close.** Patrick said excellent. **Next session:** rotation
**0°, 90°, and 270°**; **180° out**; headers at the physical top of the
phone (recorded in handoff and pending). **Committed** (Patrick,
#60-new).

**Checks.** Mac suite 489 of 489. Not on the phone yet.


## #60-new (2026-09-03): 0°, 90°, and 270° rotation

**The goal was the top What's Next item.** Keep the working upright
portrait and 90° counter-clockwise turn, add only 270°
counter-clockwise, and keep 180° upside-down out. The screen below
the header stays the same in both landscape turns. The header stays at
the physical top of the phone — left at 90°, right at 270° — with its
buttons in the same places and their words upright.

**The first road was thrown away.** It inferred the turn from safe-area
values and then changed the shared landscape path. Patrick found that
only upright portrait was still correct. At his word, all seven changed
files were restored to their exact #59-new state and the added
orientation package was removed before starting again.

**The finished road preserves the old path.**
`expo-screen-orientation` now supplies one app-wide orientation reading
through `components/AppOrientation.tsx`; safe-area values do not decide
the turn. `components/PageFrame.tsx` leaves its existing portrait and
left-header landscape layouts in place and adds a separate mirrored
right-header branch. The body is unchanged. Header buttons, and Home's
small face, counter-turn so they read normally.

`app.json` and `ios/RememberWhen/Info.plist` allow portrait plus both
landscape turns. The Stack uses its default orientation mask, which
keeps upside-down portrait out. The first right-header translation put
the header's contents outside its clipped band; keeping the working
translation and changing only the side and rotation fixed it.

**Proof.** Patrick checked all three allowed turns and said, "That's it,
you got it!" Mac suite 489 of 489. Lint found no errors in the changed
files. The full TypeScript check still reports four errors in untouched
scheduler files; they were not part of this work.

**Next session.** Remove the old pages and readers which the live app no
longer calls, then scrub the stale code they leave behind. Patrick says
the replacement pages have been on his phone for a few days, so their
phone-proof condition is met. Later refinements not yet loaded do not
reset that proof.


## #58-new (2026-09-03): the Where? helper built

**The goal was the worker build from**
`docs-ref/build-sheets/build-sheet-where-helper.md`. #57-new wrote
the sheet; this sitting built it.

**What was built.** `app/where.tsx` is a transparent Expo Router
screen — shaded overlay and popup card, four question stages, eight
landings on the existing New forms. Home gains a 🧭 Where? badge
after Daily (`constants/page-names.ts`). The calendar month header's
right button opens the same helper; the day-list header stays empty.
`_layout.tsx` registers `where` as a transparent modal.

**Navigation.** Home or calendar → helper → New is a real three-layer
stack. Cancel or Back from New returns to the helper question that
opened it. Cancel from the helper returns to the opening screen.
Successful Save pops both New and the helper (`StackActions.pop(2)`).

**One Time for today.** `formContext: oneTimeForToday` is now
separate from `returnTo`. Daily passes it for One Time for today adds
and for editing a `oneTime` item from Daily. The helper's Yes landing
passes the same context. `item-edit` uses it for today's date, the
four reminder chips, and time zone only on + OPT.

**Checks.** Mac suite 489 of 489. `/where` uses the same `Href` cast
as `/calendar` until the next Expo build refreshes the generated route
list. Simulator checks are Patrick's. Not on the phone yet.
**Committed** (Patrick, #59-new).


## #61-new (2026-09-03): old pages and readers removed; notification-name sheet written

**The goal was to scrub the retired page names and stale code from the
app.** The replacement reminder pages had already been proved on
Patrick's phone, so the condition that kept the old readers in place
was met.

**The old page layer came out first.** Four hidden FUSE copies of My
Day, Pets, My Week, and Look Ahead were still sitting under `app/`.
They were not routes and had no live references. All four were
deleted.

**The dead reader road came out as one piece.** Five unused reader
modules — My Day, Pets, My Week, Look Ahead, and To-Do — were deleted,
along with their five direct reader tests and five duplicate
per-page translator tests. `scheduler/translators/translate.ts` now
contains only the translator for the one live `reminder_items` list.
The remaining reminders-for tests now build `ReminderItem` fixtures
and cover Daily, Weekly, Monthly, Quarterly, Yearly, and Appointments
through that live translator. The general repeat, missing-day, Skip,
and Done checks remain.

**Checks.** The scheduler suite passed 300 of 300 after the removal.
The fall from 489 is the removal of tests for code that no longer
exists, not a failing or skipped live suite. No notification source,
category, history, storage, Siri, or native name changed in that
piece.

**Backward compatibility is not part of the scrub** (Patrick).
Patrick is the app's only holder, has reset the app to nothing, and
has removed all old storage pages. Old queued notifications, fault
records, source aliases, categories, and cleanup paths therefore need
not be kept. A retired name still used by the current build is to be
replaced through its whole live path.

**The next worker job was settled and written before stopping.**
`docs-ref/build-sheets/build-sheet-notification-names.md` gives the
fresh session the exact current sources and categories, the complete
read and edit boundary, the deliberate storage and Siri exceptions,
and the checks. It also separates Monthly, Quarterly, and Yearly
notification sources, curing the present body-tap route that sends all
three to Monthly. `docs/index.md` now lists fourteen build sheets.

**Session close.** The document check reports `handoff.md` under 400
lines. Patrick said `pending.txt` can wait, so neither it nor
`pending.docx` was changed. The fresh session starts from the
notification-name sheet at maximum effort; #61-new's commit status is
for Patrick to report there.

## #62-new (2026-09-03): current notification names through the live road

**The goal was to scrub stale notification names from the app.** The
job was the sheet written at #61-new,
`docs-ref/build-sheets/build-sheet-notification-names.md`.

**One current name now travels the live road.** Daily, Weekly,
Monthly, Quarterly, Yearly, and Appointments each have their own
source. A snooze or delay uses a current source tied to the same
page. A Quarterly or Yearly banner tap opens its own page instead of
Monthly. The live categories are `routineactions`, `cadenceactions`,
`appointmentsok`, and `shifteddayactions`. Old source aliases,
categories, Pets and Orders ownership, and the dead `postpone1`
handler came out. There is no compatibility layer.

**The translator works the source out from the saved kind in one
place.** The only spelling change is saved kind `oneTime` to
notification source `onetime`. Shared dated rules still produce the
exact source for Monthly, Quarterly, and Yearly.

**Patrick ruled that Pets, Orders, and Look Ahead are out of the app
and must not be left behind.** He has no old loads to keep anything
for. Pets and Orders names came out of this job's tests. The dated
Done log still saves under `lookahead_history`; that rename is the
next session, through `_layout.tsx`, `CadenceListPage.tsx`, and
`backup.tsx`.

**Checks.** Mac suite 298 of 298, after Pets and Orders names came
out of the tests. TypeScript still reports the same four starting
errors in `leadmoments.ts` and `scheduler.ts`. Memory Test is
unchanged. Siri, native names, and the three history storage keys
were left as named later pieces, except the Look Ahead log now
waiting in the handoff.

**Session close.** The record was refreshed at Patrick's word.
`pending.docx` was not regenerated.


## #63-new (2026-09-03): every page log uses the current page name

**The goal was the leftover Look Ahead log, then a continue of the
stale-name scrub.** Monthly, Quarterly, and Yearly each got their
own Done log. The leftover `lookahead_history` came out; it was not
renamed. There is no compatibility layer.

**Every page log now uses the current page name.** Daily writes
`daily_history`, Weekly `weekly_history`, Monthly `monthly_history`,
Quarterly `quarterly_history`, Yearly `yearly_history`, Appointments
`appointments_history`, and Bucket List `bucket_list_history`. The
on-screen path is `app/daily.tsx` and `components/CadenceListPage.tsx`.
Banner Done and Siri mark-done in `app/_layout.tsx` write the same
keys. Backup copies the seven current keys and strips the old ones
on restore, including `lookahead_items` and `lookahead_history`.

**The four older log names were taken in this same piece** after
Patrick asked why wait. Siri and native names stay for the next
session, which is the Siri scrub.

**Leftover names in live code were a search, not a rewrite.** The
old log keys are no longer read or written except on backup's
retired list. Comments that could send someone to Look Ahead or My
Day were updated; origin notes stayed. History docs keeping the old
names for the past is expected.

**Sit files came out.** `docs/Remember-Backup-Sit-near-fire.json` and
`docs/near-fire-set.md` were deleted. Their lines left `docs/index.md`.
`build-history.md` still names them.

**Checks.** No suite was run. The four TypeScript errors in
`leadmoments.ts` and `scheduler.ts` were left as they were. Not on
the phone.

**Session close.** `handoff.md`, `build-history.md`, and `pending.txt`
were refreshed at Patrick's word. `pending.docx` was not regenerated.


## #64-new (2026-09-03): Siri says Daily and Remember

**The goal was the Siri scrub: stale and idle Siri code, and native
names.** No compatibility layer. Memory Test and Timer stayed out.

**Siri's live names now match the app.** My Day is Daily. Elyfont and
Remember When are Remember. The spoken type is Daily Item. The shared
box, the JS bridge, and the Swift types all say Daily. The shortcuts
provider is `RememberShortcuts`. Mark-done still lands on Daily.

**The open-app spike came out.** `OpenRememberWhenIntent` only opened
the app and did nothing else. Siri already opens the app by its own
name. The mark-done phrases stayed, in the same file as the live
intent.

**Patrick ruled** that Siri's list is Daily's own items only. Other
pages showing on Daily are a view; those items fire from their own
pages. Adding Siri commands is later. Phone load waits until the
scrub is finished.

**A leftover hunt of the live road found no old Siri names and no old
pages.** Backup still lists retired keys so a restore can strip them.
Saved kinds `oneTime` and `extended`, and routes `/onetime` and
`/extended`, stay until the next session, when they take Appointments
and Bucket List through the live path.

**Checks.** No suite was run. The four TypeScript errors in
`leadmoments.ts` and `scheduler.ts` were left as they were. Not on
the phone. The new Siri names need an EAS build.

**Session close.** `handoff.md`, `build-history.md`, `in-flight.md`,
and `pending.txt` were refreshed at Patrick's word. `pending.docx`
was not regenerated. Patrick will commit.


## #65-new (2026-09-03): saved kinds and routes are appointments and bucketlist

**The goal was to change saved kinds and routes to Appointments and
Bucket List.** Visible names already said that (#56-new). The saved
kind, route, page file, and banner source still said `oneTime` /
`extended` and `/onetime` / `/extended`.

**The live path now uses one word in each place.** Saved kinds, routes,
page files, and banner sources are `appointments` and `bucketlist`.
Visible names stay Appointments and Bucket List. Daily's form setting
is `appointmentsForToday`. The old spelling rewrite from `oneTime` to
`onetime` came out; the translator now uses the saved kind as the
source. No compatibility layer.

**Patrick ruled** that Daily's "One Time for today" is not the
Appointments page. It is Daily's own add for a one-shot that belongs
to this day. Those words are not an old name to change.

**Backup's retired strip-keys** `onetime_history` and
`extended_history` stay, so a restore can still clear the old logs.

**The four TypeScript errors** in `scheduler/leadmoments.ts` and
`scheduler/scheduler.ts` were the checker, not the running code. A
missing import, a local name for a field already checked, and a
missing checkmark counting as not done made the checker agree. Nothing
about how reminders run was meant to change.

**Checks.** Mac suite 298 of 298. TypeScript is clean. Not on the phone.

**This sitting did not write its history entry.** The gap was found at
#66-new and the entry is written here. **Committed** (Patrick, #66-new).


## #66-new (2026-09-03): the live desk pruned; the archive renamed

**The opener was three things set aside on purpose.** The sitting became
an updating and pruning session after the live desk was found carrying
finished work.

**#65-new had no history entry.** It was written from the handoff and
pending, and marked committed (Patrick, this sitting).

**The handoff was taken down to live work.** Closed-sitting recaps came
out first, then build decisions that already lived in the archive. The
file went from 412 lines to 140. Phone load is next. The name scrub is
finished.

**Pending was brought current.** What's Next is the phone load. Facts 15
no longer says 0° and 90° only.

**The archive was renamed** `docs/handoff-history.md` (was
`build-history.md`). Live pointers were updated. Past sittings inside
the archive still use the old name.

**Timer and Memory Test are not this stream** (Patrick). One note in the
handoff and one line in pending. Do not keep bringing them up here.

**Patrick is one person, not a team** (Patrick). Rule 27 of
`Projects/CLAUDE.md`. Claude still follows the rules. That file lives
in the Projects repository, not this one.

**Session close.** `handoff.md`, `handoff-history.md`, `in-flight.md`,
and `pending.txt` were refreshed at Patrick's word. `pending.docx` was
not regenerated. **Committed** (Patrick, #67-new).


## #67-new (2026-09-03): nothing missing before the phone load

**The opener was three things set aside on purpose.** They were not in
the handoff that way. #66-new had opened on them, spent the sitting
pruning the live desk, and wrote phone load as next. The three sat in
Pending 6–8 as ordinary waiting items.

**They are not being done now** (Patrick). They went to pending's
Nice-to-have. Do not raise them in reports. Two of them would help a
person check why a reminder is not working: the run record on
Scheduled Reminders, and Check My Reminders. The background task is
not a check; it would top the queue on days the app is not opened.

**Still To Do was looked at and closed.** Only Check My Reminders has a
settled design there, and it is not built. The other two are this
app's.

**The question from #65-new, asked again:** is there anything missing
before an EAS build and a phone load to prove things out. **Nothing is
missing.** The name scrub is finished.

**Session close.** `handoff.md`, `handoff-history.md`, `pending.txt`,
`pending.docx`, and `App-Docs/master-handoff.md` were refreshed at
Patrick's word. The archive's name is `handoff-history.md` (was
`build-history.md`). Patrick will commit.


## #68-new (2026-09-04): leftover cleanup sheet written

**The opener was to assess an outside report.** The leftovers it
found were confirmed. A build sheet was written at
`docs/build-sheet-cleanup.md`. No code was changed. A fresh session
was to build it.

**Session close.** No docs refresh in that sitting. **Committed.**


## #69-new (2026-09-04): leftover cleanup built

**The leftover cleanup sheet was built.** Dead exports, ten unused
theme tokens, leftover page words in test titles, and one stretch of
the live design file that still argued a daily item arms two. Daily's
One Time for today was left alone. Nothing about how reminders are
armed, named, or shown changed.

**Checks.** Mac suite 298 of 298. TypeScript fully clean.

**Session close.** `handoff.md`, `handoff-history.md`, `in-flight.md`,
and `pending.txt` were refreshed at Patrick's word. `pending.docx` was
not regenerated. The cleanup sheet is in `docs-ref/build-sheets`.


## #70-new (2026-09-05): Grok review recorded; Help, Birthdays, and phone findings

**The opener was Wispr Flow on the Mac and a Grok 4.6 High read-only
review of the live app.** The review text is in
`docs/grok-review-2026-09-05.md`. Nothing in the app was changed. An
implementation plan (Phases 1–4) went into `handoff.md` and
`pending.txt`.

**Patrick on the phone.** Monthly Done should advance the saved date
again (#41-new reversed). Options — 2nd Thursday saves correctly; the
selected chip does not update. Help (was Where?): visible name **Help**,
Home badge **?**; helper step 1 **Repeats every**; steps 2–3 Cancel back
one step, not Home.

**New work named.** Birthdays page — name, date, yearly reminder; like
Appointments with selectable **On the day** and **Day Before** chips;
build sheet first. Quarterly + Add — selectable 30, 60, 90 days; Patrick:
the engine already knows how to take in the data.

**#69-new is committed.** Nothing built since then.

**Session close.** `handoff.md`, `handoff-history.md`, and `pending.txt`
refreshed. `pending.docx` regenerated. Patrick will commit.


## #71-new: abandoned because of Cursor's poor performance

Nothing was accomplished. The sitting was abandoned.


## #72-new (2026-09-06): hangings lock and Grok Phase 1

**The goal was bugs, starting with hangings.** Daily was all green last
night; this morning the miss pop-up listed yesterday. The day-roll can
run twice on open; the second pass no longer sees the ticks. A second
call now waits. Needs a night of all-green Daily and a morning open on
a new load to confirm.

**Grok Phase 1, all three, at #72-new.** Quarterly walks from the saved
month, like yearly. Reset All Data runs the scheduler after the wipe.
The last banner tap is written down so Done, Skip, or Snooze cannot
replay on a cold launch.

**How the record is kept, settled this sitting.** The Grok review itself
has no session number. A fix taken from it carries the session that did
the work. Finished work goes in What is Done, not What's Next. The
phone-load line may still name what is built and not on the phone. What
is Done was numbered 1 through 57 with no repeats.

**Next session's goal is Grok Phase 2** — one apply-then-schedule door,
build sheet first.

**Checks.** Mac suite 302 of 302. TypeScript clean. Not on the phone.

**Session close.** `handoff.md`, `handoff-history.md`, `in-flight.md`,
and `pending.txt` refreshed. `pending.docx` regenerated. Patrick will
commit.


## #73-new (2026-09-06): Grok Phase 2 — one apply-then-schedule door

**The goal was Grok Phase 2.** The sheet was written first, then built
in this sitting: `docs-ref/build-sheets/build-sheet-one-door.md`.

**What the read found.** `saveReminderItems` already stored the list and
ran the scheduler. The live fault was Daily and the cadence pages
writing the list they were holding, which could overwrite a banner
Done. Settings morning, midday, and evening times saved and did not
run the scheduler.

**The door.** `applyReminderChange` in `modules/reminder-items.ts`
loads the list, applies a patch, then uses that write. Patches run one
after another; none is dropped. Banner, Siri, Daily, cadence pages,
item-edit, Restore, and Settings clock times all go through it.
`saveReminderItems` is no longer imported anywhere else.

**What differed from the sheet.** Dated-cadence banner Done now saves
the list, then writes the log, because the door is the load. `npx tsc`
is the wrong program here; the check used the project’s own compiler.

**Hangings** stays out of the handoff’s open list. The day-roll lock
still needs a night of all-green Daily and a morning open on a new
load to confirm; that line sits with where things stand, not with
what is open to build.

**Checks.** Mac suite 302 of 302. TypeScript clean. Not on the phone.

**Session close.** `handoff.md`, `handoff-history.md`, `in-flight.md`,
`docs/index.md`, and `pending.txt` refreshed. `pending.docx`
regenerated. Patrick will commit. Phase 3 remains.


## #74-new (2026-09-06): Grok Phase 3 — Snooze and Skip follow the translator

**The goal was Grok Phase 3.** Rows and banners follow what the
translator already knows.

**Appointments do not offer Snooze.** The row used to show Snooze
whenever lead reminders were set. The translator’s
`canBePushedBackBit` is false for Appointments, and the engine never
reads that stamp. Snooze now shows only when the translator says the
kind can be pushed back and it has a due time. The “Snoozed till…”
line follows the same bit. The Appointments banner was already OK
only.

**Skip writes the engine stamp** (Patrick, this sitting). Skip means
this firing and this cycle are dropped, and the next cycle is armed.
It is not Done, and it is not only clearing a snooze. The banner
stamps `skippedCycleStamp` with this cycle’s due moment and clears a
standing snooze. The translator now reads that stamp. Daily Skip arms
tomorrow; Weekly Skip arms the next week.

**Left separate.** Monthly Done still ticks and does not advance the
tile. The 2nd Thursday chip still does not show as selected. Those
were already open items.

**Phase 4, this sitting.** Appointments fire at the set time, reversing
#52-new; the before chips still stand. Restore’s leftover health and
miss lists wait for a sitting that discusses merge as an option. Morning
of is not the set time and may float with the phone.

**Checks.** Mac suite 304 of 304. TypeScript clean. Not on the phone.

**Session close.** `handoff.md`, `handoff-history.md`, `in-flight.md`,
and `pending.txt` refreshed. `pending.docx` regenerated. Patrick will
commit.


## #75-new (2026-09-06): four pages leaving Memory; source copies in stray apps

**The opener was Merge on Restore.** He changed the order: settle which
pages go in and which come out, before Merge or the leftover health and
miss lists.

**What leaves.** Timer Alerts, Vault, Shopping List, and Memory Test
will move. Whether they become their own apps or one group app is open.
The folder `Projects/stray apps` was created empty, then received copies
of the four page files as source, not as a running app. Timer Alerts and
Memory Test are simple one-time alerts — a reminder within the hour —
and do not take the reminder engine with them.

**Memory was not changed.** The four pages still run there. When a later
sitting takes them out, the hole is: Home's four badges and the
landscape Memory Test last-row case; the four screens and the Memory
Test banner landing in `_layout.tsx` (`Cover` stays); Extra Vault
Security in Settings; Backup's shopping, Vault (including the password
lock), and Memory Test keys; the four labels in `page-names.ts`; and
Memory Test's reader, owned source, session load, health and queue
names, and tests in the scheduler. Timer was never in the engine.

**What's coming in was not settled.** Birthdays remain on the list. The
second new page is not yet named. Merge and Restore leftovers wait.

**Session close.** `handoff.md`, `handoff-history.md`, `in-flight.md`,
`pending.txt`, and `App-Docs/master-handoff.md` refreshed.
`pending.docx` regenerated.


## #76-new (2026-09-06): four pages out of Memory

**The goal — done.** Timer Alerts, Vault, Shopping List, and Memory Test
no longer run in Memory. Source copies remain in `Projects/stray apps`.
Not a running app.

**What came out.** The four page files; Home’s four badges and the
landscape Memory Test last-row case; the four screens and the Memory
Test banner landing (`Cover` stays); Extra Vault Security; Backup no
longer carries shopping, vault, or Memory Test, and a restore strips
those keys; the four labels in `page-names.ts`; and Memory Test’s
reader, owned source, session load, health and queue names, and tests.
Timer was never in the engine.

**Data.** Memory Test data was dropped. The shopping list on the phone
was dropped; a later shopping list will have a backup of its own. Vault
was empty and came off. On the next load those saved keys come off the
phone, and leftover Timer and Memory Test alerts are cancelled.

**How those four become apps** was parked as a later decision. Do not
raise it.

**What's coming in was not settled.** Birthdays remain on the list. The
second new page is not yet named.

**Checks.** Mac suite 298 of 298. TypeScript clean. Not on the phone.

**Session close.** `handoff.md`, `handoff-history.md`, `in-flight.md`,
`pending.txt`, and `App-Docs/master-handoff.md` refreshed.
`pending.docx` regenerated. Patrick will commit. Next is Merge and
Restore leftovers.

## #77-new (2026-09-06): Restore with Merge

**The goal — done.** Restore with Merge is off the open list. Backup and
Restore now has Replace and Merge. People choose before they pick a
file, then confirm. Merge keeps what is already in the app and adds from
the backup only what is not already there, matching by the identity the
app wrote into the backup file. Replace puts the backup's reminders in
place of these, and takes off the old health, miss, and already-told
notes. Settings and page logs stay on the phone; the backup does not
carry them. There were no existing backup files, so the file shape was
not kept old. The Backup page says: Choose, replace, or merge to pick a
file.

**Checked on the simulator.** Export a full file, delete three items,
export that, Merge with the first file: the three items came back.
Replace with the second file: those three items were gone.

**The collected store** of these decisions is pending's Restore Merge.
The standing ruling in the hand-off file still governs.

**Checks.** Mac suite 298 of 298. TypeScript clean. Not on the phone.

**Still open this sitting.** Daily Save lands on Appointments: new items
entered on Daily, then Save, drop him in Appointments with those items,
not Daily.

**Session close.** `handoff.md`, `handoff-history.md`, `in-flight.md`,
`pending.txt`, and `App-Docs/master-handoff.md` refreshed.
`pending.docx` regenerated. Patrick will commit. Next is Daily Save
landing on Appointments.


## #78-new (2026-09-06): Daily One Time for today is Daily's own

**The goal was bug fixes**, starting with Daily Save landing on
Appointments (#77-new left that open).

**What was wrong.** Daily's + Add, One Time for today, saved the item as
an Appointment. Save could land on Appointments. Help's "Is that for
today? Yes" used the same wrong path (`appointmentsForToday` on the
Appointments kind).

**What was built.** Daily's One Time for today is its own saved kind,
`oneTime`. It is a one-shot for today, not an Appointment. Save stays on
Daily. Appointments does not list those items. An Appointment that falls
today still shows on Daily as from Appointments and still lives on
Appointments. Help's "for today? Yes" opens the same one-shot. The
`appointmentsForToday` formContext came out; the kind carries the meaning.
Banner tap on a one-shot opens Daily.

**Monthly Done should advance the tile** (Pending 2) was looked at but
not built this sitting. `advanceDatedItem` is already written; Done on
Monthly, Quarterly, and Yearly still only ticks and logs.

**Checked on the simulator** by Patrick. One Time for today stays on
Daily and does not enter Appointments.

**Checks.** Mac suite 300 of 300. TypeScript clean. Not on the phone.

**Session close.** `handoff.md`, `handoff-history.md`, and `pending.txt`
refreshed. `pending.docx` not regenerated. Patrick will commit. Next is
Monthly Done should advance the tile (Pending 2).


## #79-new (2026-09-06): Monthly Done advances the tile; Options chips stay lit

**The goal was Pending 2** — Monthly, Quarterly, and Yearly Done should
move the saved date so the tile shows the next cycle armed (Patrick,
#70-new; reverses #41-new).

**What was wrong.** `CadenceListPage` `markDone` only set `completed` for
Monthly, Quarterly, and Yearly. The log entry was written, but the saved
date did not move. `advanceDatedItem` was already written in
`modules/reminder-items.ts`; Done did not call it.

**What was built.** Done on Monthly, Quarterly, and Yearly now calls
`advanceDatedItem`, then sets `completed: true` and logs as before.
Weekly is unchanged.

**Checked on the simulator** by Patrick. The date on the row moves
forward and the next cycle arms.

**Pending 3 — Options chip picks did not stay lit** (Patrick, #70-new).
The pattern saved correctly, but each chip tap ran the monthly-pattern
clearing step before both second-Thursday chips were set, so the
highlight never stuck.

**What was built for Pending 3.** `item-edit.tsx` only clears the other
monthly patterns when the pattern actually changes, not on every chip
tap. Partial picks stay in state and the buttons stay highlighted.

**Checked on the simulator** by Patrick. Second-Thursday chips stay lit
while you set them.

**Checks.** Mac suite 301 of 301. TypeScript clean. Not on the phone.

**Session close.** `handoff.md`, `handoff-history.md`, and `pending.txt`
refreshed. `pending.docx` not regenerated. Patrick will commit.


## Appendix — the scheduler plan, kept whole (folded in at #12-new)

This is `docs/scheduler-plan.md` exactly as it stood when the eighth and
last of its steps was built. It is kept for its reasoning rather than its
step list: why the ceiling is sixty-four less eight, why a reader stays
plain enough for Node to run it, why the always-arm rule exists, why Orders
gets no reader, and why the clean slate works by a day boundary. Those
decisions are in the code now and are written down nowhere else. Nothing
below is live work; every step in it is built.

---

# Plan — one scheduler that owns every reminder

Written #5-new. Nothing here is built. Nothing here is agreed.

## Why this exists

The reminders are the heart of the app and they go quiet. The read
this session found three faults, and two of them are the same fault
wearing different clothes.

- **My Day and Pets destroy their own daily repeats.** When an item
  is checked off, the screen cancels every one of its reminders and
  re-creates them only for items not yet done. The repeat for the
  finished item is gone. It comes back only if that screen is opened
  on a later day.
- **Nothing ever puts a lost reminder back.** Only the screen that
  owns a reminder can re-arm it, and only while it is open. The
  housing arms nothing. The Home screen arms nothing. There is no
  background task.
- **Nothing knows the total.** Nine screens each add to the iOS queue
  without seeing the other eight. iOS holds sixty-four pending
  requests, keeps the soonest, and throws the rest away in silence.

The pattern behind all three is that no single piece of the app owns
the reminders. They live only as requests inside iOS, and the app's
saved lists and that queue can drift apart with nothing to notice.

## What is being built

One module that owns the whole queue. It reads every saved list, works
out the complete set of reminders those lists call for, and makes the
iOS queue match it. Screens stop scheduling anything. They save their
data and ask the module to run.

The module answers one question: **given everything saved on this
phone right now, which reminders should exist?** Then it makes that
true. Because it answers from the saved data every time, a reminder
that went missing for any reason comes back on the next run.

## How it works, in four parts

**One, the readers.** One small function per screen. Each is handed
that screen's saved list and returns a plain list of wanted reminders.

**A reader stays plain, and this is settled (Patrick).** It never
reaches for storage itself, never touches iOS, and imports nothing from
React Native or Expo. It takes a list and the current time, and returns
plain objects. Anything importing React Native cannot run outside a
phone or a simulator — Node stops before the test begins — so a reader
that reads storage itself could only ever be checked by building the
app and living with it, which is the loop this whole plan exists to
leave. The storage reading therefore happens once, at the top of the
module, and the parsed lists are handed down.

Deciding this before the readers exist costs nothing. Pulling the
storage reads back out afterwards means rewriting all seven.

- My Day reads `my_routine` — one daily repeat per item that has a time.
- Pets reads `pets_feeds` — the same.
- My Week reads `week_routine` — one weekly repeat per chore.
- Look Ahead reads `lookahead_items` — one dated reminder per item
  still in the future.
- Orders reads `orders_items` — up to four dated reminders per order.
- To-Do reads `todo_tasks` — one dated reminder per reminder set on a
  task, and one daily for background tasks if any exist.
- Memory Test is handled the same way once its held reminder is saved
  to storage.
- **Timer stays outside the module, and this is settled (Patrick).** It
  is a special case: its alerts are minutes long, it already tracks its
  own, and it does not derive from a saved list the way the others do.
  The module leaves Timer's requests alone and counts them against the
  budget without owning them.
- **Timer also has a fault of its own right now** (Patrick, #5-new),
  not looked at this session and not described here. It is written down
  so it is not lost, and it belongs to its own piece of work.

**Two, the wanted list.** The readers' results are gathered into one
list, and every entry carries a key built from what it is — the screen,
the item, and which of that item's reminders it is. Two entries can
never collide, so a duplicate is impossible by construction. The
To-Do daily that piles up today cannot pile up under a key.

**Three, the reconcile.** The module asks iOS what it currently holds,
compares it to the wanted list by key, and then:

- cancels anything iOS holds that is not wanted,
- creates anything wanted that iOS does not hold,
- and leaves anything that matches exactly alone.

Leaving matches alone is the important part. Today every save tears
the whole set down and rebuilds it, which is both slow and a chance
for something to be lost. After this, a save that changes one item
touches one request.

**Four, the budget.** Before creating anything, the wanted list is
sorted by when each reminder fires and trimmed to a ceiling below
sixty-four, leaving room for timers. What gets trimmed is the furthest
away, which is also the least urgent and the most likely to be re-armed
long before it matters. The module records that it trimmed, so the app
can say so instead of going quiet.

**Snoozes are saved, and the module owns them (Patrick).** A snooze,
a delay and a postpone are all written to storage when they are made
and cleared once they have fired, so the module derives them from the
saved data like everything else and can put one back if it goes
missing. Patrick's reason is the durable part: a snooze is the second
chance. It was asked for because the moment was wrong, which makes it
the reminder most likely to be the one that matters and the one whose
absence is least likely to be noticed, since it is already expected
later rather than now.

## When it runs

- On app launch, from the housing.
- Whenever the app returns to the front, from the housing.
- After any screen saves its data.

The first two are what the app does not have today, and they are what
makes it self-healing.

## A clean slate every day (Patrick)

The holdover after midnight goes, in both of its halves. A banner from
yesterday is no longer left sitting to be tapped today, and tapping an
old one no longer files a completion under the day it fired while
leaving today's item unchecked.

Patrick's reason settles what replaces it: a thing not done on time is
of no use as a reminder. The past-day behaviour existed to catch the
log entry, not to remind, and he would rather lose that road than keep
the confusion.

- **The module sweeps stale banners** whenever it runs — on launch and
  on every return to the front — clearing anything delivered before
  today.
- **A Done always means today.** It checks off today's item and logs it
  under today's date. There is no past-day branch left.
- **A missed item simply stays unchecked** and reaches the log only if
  it is checked off in the app.

One honest limit: the sweep can only happen while the app is running or
as it comes to the front. If the app is not opened for two days, those
banners sit in Notification Center until it is. Whether iOS can be told
to expire a banner on its own has not been checked.

## The daily reset moves into the module (Patrick)

Clearing yesterday's checkmarks is part of the same clean slate, and
today it happens only when My Day or Pets is opened — the same
screen-bound fault as the reminders. It moves into the module and runs
on the same two triggers, so the day rolls over whether or not those
screens are visited.

## The rule change that fixes My Day and Pets

A base daily repeat is always armed, whether or not the item is
checked off. Checking something off has nothing to do with it: the
next firing of a daily reminder is tomorrow, which is exactly what is
wanted. My Week already works this way, so this brings the two daily
screens into line with the weekly one rather than inventing anything.

Suppressing today's leftover nagging is a separate job, and it is the
snooze one-offs that do it — not the base repeat.

## Making it checkable (Patrick — rock solid)

Self-healing is not the same as proven. Two pieces make the reminders
something that can be checked rather than waited on.

**Tests for the readers.** Each reader is a plain function: hand it a
saved list, get back the reminders that list calls for. Nothing about
it needs a phone, iOS, or a screen. So each one can be given a list and
checked against the answer — an item with no time, an item checked off,
a chore on a Sunday, an order with a delivery window, a due date
already past. The reconcile and the budget can be tested the same way,
by handing them a pretended queue.

This project has no test setup at all today — no test runner in
`package.json` and no test files anywhere — so a small one gets added
with this work.

**It follows Mystery's shape, and this is settled (Patrick).** That
suite is `MysteryCluesTracker/engine-tests.html`: 179 tests and no
framework whatsoever. Three things carry across.

- **The runner is about ten lines.** A `test()` that runs one check and
  catches anything thrown, and an `assert()` that throws when a claim
  is false. Nothing to install and nothing to keep up to date.
- **It runs on the Mac in seconds, headless under Node**, printing a
  PASS or FAIL line per test and a count at the end. No build, no
  simulator, no phone.
- **Tests use their own storage keys**, so running them can never touch
  real saved data.

What does not carry is the single HTML page, that being a browser app's
shape. Here the tests are their own file beside the module.

**A screen that shows the queue.** A plain list of everything iOS is
holding right now: what it is, which item it belongs to, when it fires,
and the total against the ceiling. Sorted by fire time.

Its point is that a missing reminder is invisible until the moment it
fails to arrive, and by then it is too late to matter. This turns that
into something that can be looked at on any quiet afternoon.

Where it lives, and whether it is plain or hidden away in Settings, is
open.

## Order of work, each piece testable on the phone

1. Build the module with the readers and the reconcile, and have the
   housing call it on launch and on return to the front. Change no
   screen. At this stage the app arms reminders in two places, which is
   safe because the reconcile is by key and cannot duplicate. The test
   setup and the readers' tests come with this step, since the readers
   are what it builds.
2. Take the scheduling out of My Day and Pets, and apply the
   always-arm rule. This is the fix for the silence.
3. Take the scheduling out of My Week, Look Ahead, Orders and To-Do.
4. Bring the snoozes, delays and postpones under the module by saving
   them, so the module owns those too.
5. Bring Memory Test in. Timer is deliberately left out.
6. Turn on the budget and the near-the-ceiling warning.
7. Move the daily reset into the module, sweep stale banners, and take
   the past-day branch out of the Done handler. Built at #11-new. My
   Week's past-cycle guard came out with the past-day branch, the same
   reasoning covering both: once yesterday's banners are swept, a banner
   still there to be tapped is one from today.
8. Build the screen that shows the queue. It goes into Settings.

A one-time clearing runs the first time the new module starts: cancel
everything iOS holds, then build from the saved data. That sweeps out
the accumulated To-Do dailies and anything else stale.

## A separate fix that is not structural

The hour stepper in `components/DateTimeControl.tsx` is wrong across
the twelve o'clock crossing. Stepping down from 12:00 PM gives 11:00
PM instead of 11:00 AM, so setting a nine o'clock morning time by
spinning down from the default noon lands on 9:00 PM. Stepping up from
11:00 AM gives 12:00 AM, and up from 11:00 PM gives 12:00 PM. The
AM/PM button and the typed box are both correct; only the hour stepper
is at fault.

This is plain arithmetic and would be wrong in any structure. It is
listed here so it is not lost, and it is a small fix of its own.

Any item whose time was set by spinning through that boundary is
stored in the wrong half of the day and will need re-setting after the
fix.

## The warning comes as it goes in (Patrick)

Patrick's own words: he should know what is going to need trimming as
it is put in, way ahead of time. So the app speaks when the item is
entered rather than staying quiet until the reminder fails to arrive.
It is the same shape as Students-Assistant's squeeze warning, which
fires as she enters rather than at the end.

**The line between normal and worth saying, settled with him.** Rolling
leaves far-future reminders unarmed as ordinary business, and that
never warns about anything — it is the module working. The warning is
for the real case only: there are now more reminders than the phone can
hold, so something asked for will not arrive.

**What it says and where it appears, settled at #11-new.** It is a plain
pop-up on the screen the item was just entered on, the same kind the app
already gives for "No Reminder Set", shown the moment the save finishes.
Its words are:

> **No room for this reminder**
> Your phone holds only so many reminders and it is full. This one is
> saved, but the one furthest in the future will not go off until
> something makes room.

It names what happened, what is still safe, and what fixes it, with no
number in it and no word about the machinery.

Two things were settled with it. A save that lands while the module is
already running gets nothing back and says nothing, the warning being a
guard and the next save asking again. And the line between ordinary
rolling and the real case does not exist in Memory, because nothing here
rolls — anything left out is the real case. That line begins to matter in
Students-Assistant and belongs to that app's own session.

## Open questions, for Patrick

- None. The warning's wording and placement was the last one, and it was
  settled at #11-new.

## What the ceiling is, and why the number matters more later

Apple's limit is sixty-four **pending scheduled requests** for the
whole app — reminders asked for and not yet fired. Three things about
the count are worth having straight:

- **A repeating reminder is one slot, forever.** A daily eight o'clock
  reminder is not one a day; it is one, permanently. Same for a weekly
  chore.
- **A one-shot dated reminder is one slot until it fires**, and the
  slot frees itself afterwards.
- **A banner already delivered costs nothing.** It has fired.

Past sixty-four, iOS keeps the soonest and discards the rest without a
word. That is why the To-Do daily pile-up matters: each is another
permanent slot nothing removes.

**Memory will not come near it (Patrick).** Counting the app as it
stands — a handful of My Day items, a few feeds, the chores, the
future Look Ahead items, a couple of orders — the number sits well
under the ceiling.

**Students-Assistant might (Patrick).** Fifteen weekly class meetings
and twenty live assignment warnings is already thirty-five before
anything is broken into pieces. The leave-by alert would have added
fifteen more, and Patrick dropped it at #5-new for other reasons.

So the budget exists here as a guard and there as working machinery.
The answer for a crowded app is rolling: arm what is near, leave the
far ones unarmed, and re-arm as the module runs. That works precisely
because the module runs on every launch and every return to the front.

The catch, stated plainly: rolling depends on the app being opened. A
phone left untouched for a week arms nothing new.

## What this gives Students-Assistant

One module, with its readers replaced and everything else unchanged.
The reconcile, the keys and the budget are not specific to this app.
