# College App — Feature Draft v1

For discussion only. Nothing here is decided. Cut freely.

---

## What she asked for

In her words, two things:

- Getting around a big campus, including classes in buildings off the main campus
- Tracking assignments, with reminders of what is due when

Research suggests these are not two apps. They are one app with a shared spine.

---

## The spine

Her class schedule — course, day, time, building, room.

Everything else hangs off it. Navigation is "where do I have to be next." Assignments are "which course is this for." Reminders are "what happens between now and then."

If the schedule is wrong, nothing else works. It is the first thing to get right and the first thing to make easy to correct.

---

## Features

### F-1 — Today

The default screen. What is next, where it is, and when she needs to leave.

Not a list of everything. One card, the next obligation, large enough to read while walking.

*Needs:* schedule.

---

### F-2 — Leave-by alert

The one that isn't available anywhere else.

UNL is three campuses — City, East, and Nebraska Innovation — connected by free student buses with live GPS tracking. When her next class is on a different campus than her current one, the app tells her when to leave, accounting for the bus.

Existing trackers know her schedule but not the buses. The bus map knows the buses but not her schedule. Nobody joins them.

*Needs:* schedule, StarTran data, walking times between buildings.

*Unverified:* the exact StarTran feed URL, and whether it requires a key. Roughly a ten-minute check.

---

### F-3 — Assignments

Pulled automatically from Canvas rather than typed in.

UNL uses Canvas, and Canvas publishes a private per-student calendar feed containing assignments and events from every enrolled course. She copies one URL out of Canvas once; the app reads it from then on.

*Known limits:* 366 days forward, 1,000 items, To Do items excluded, sync lag up to 24 hours, and the feed must be re-copied when she enrolls in new courses.

*Live risk:* the university is consolidating five separate Canvas systems into one. If the address changes, a saved feed URL breaks. Build it so she can paste a fresh one herself.

---

### F-4 — What's due

Assignments ordered by when they are due, not by course.

The research on first-year failure is consistent: the problem is not knowing the work exists, it is losing track of when it lands. A course-by-course list hides that. A single ordered list doesn't.

*Needs:* F-3.

---

### F-5 — Reminders

Two kinds, and they are not the same thing.

- **Due-date reminders** — ahead of a deadline, at a lead time she sets
- **Wake-ups** — a nap alarm, or a nudge before she has to leave

*Constraint:* on iPhone, a saved-to-Home-Screen web app cannot schedule its own alarms. Push notifications work, but must be sent from a server. A wrapped app gets true local alarms. This one feature may decide the build path.

---

### F-6 — Where is it

Building and room lookup, from her schedule and from search.

Deliberately thin. Apple Maps already knows where buildings are. The value is that she doesn't have to type "Henzlik Hall" into anything — it's already attached to her 11:00.

---

### F-7 — The week

A calm view of the whole week. Classes and due dates on one surface.

For Sunday-night planning, not for daily use.

---

### F-8 — Fixing the schedule

She will need to correct something in the first week. Everyone does — a room change, a section swap, a lab that meets somewhere else.

Editing must be obvious and fast. If correcting it is annoying, she will stop trusting it, and then she will stop opening it.

---

## Not in v1

Named here so they stay out of the way:

- Grades and GPA
- Note-taking, flashcards, lecture recording — well served by existing apps
- Anything social
- Dining, laundry, campus events
- Study-time tracking

---

## Constraints on the fast path

If it starts as a web app saved to her Home Screen:

- Push works on her iPhone, but only after Add to Home Screen — a bookmark will not do
- No background refresh; it updates only while open
- No self-scheduled alarms
- If she does not open it for seven days, cached data is wiped
- Around 50MB of storage

None of these block F-1 through F-4, F-6, or F-7. F-5 is the one that strains.

---

## Open questions

**For her:**

- Her actual schedule — course, day, time, building, room
- Whether her first weeks are mostly one campus with occasional crossings, or genuinely split
- Whether she wants reminders that nudge, or reminders that insist

**For you:**

- Web app first, or straight to a wrapped build for the alarms
- Whether this shares any bones with your memory app, or starts clean
- How much she wants to be involved in shaping it

---

## What I'd build first

F-1, F-3, and F-4 — today, assignments in, assignments ordered. That is a useful thing in her hands quickly, and it proves the schedule and the Canvas feed both work before anything harder is attempted.

F-2 is the reason the app deserves to exist. It is also the one with an unverified dependency. Better to earn it second than to stall on it first.
