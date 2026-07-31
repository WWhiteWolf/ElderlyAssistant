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
