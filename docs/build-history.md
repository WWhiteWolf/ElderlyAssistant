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
recorded edge, and docs/college-app-draft-v1.md. A copy of that
chat sits at Projects/Campus travel.rtf, unread.

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
