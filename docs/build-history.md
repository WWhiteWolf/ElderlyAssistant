# Build history — A Place To Remember (Memory)

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
phone test" / "Decisions to make" emptied with their headings
standing, the #40/#41 tombstone section deleted, and the
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
