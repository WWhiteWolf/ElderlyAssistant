# A Place To Remember — Notification Findings

Read-only review of `WWhiteWolf/ElderlyAssistant` at HEAD, 19 Aug 2026.
No code changed. Nothing here is a fix — these are the causes, with
locations, so the repairs can be decided one at a time.

**Scope of confidence.** Findings 1, 2 and 3 are read directly from the
code and the reasoning is traceable in the listings below. Finding 4 is a
mechanism that exists but probably does not apply to Patrick's usage; it
is recorded so it is not rediscovered later.

---

## The three reported symptoms

- They don't fire
- They fire after being tapped Done
- They don't always check things off

These map to three separate defects. None of them is a platform
limitation — this is a native Expo app with `expo-notifications`, so
local notifications are fully available.

---

## Finding 1 — My Day's Done deletes the daily repeat

**Symptom:** they don't fire.

**Where:** `app/_layout.tsx` line 568, inside the `action === 'done'`
handler, on the My Day / Pets path.

```
await Notifications.cancelScheduledNotificationAsync(notifId);
```

`notifId` is `response.notification.request.identifier` (line 163) — the
identifier of the request that fired. My Day's reminders are scheduled
with a `DAILY` trigger (`app/myday.tsx` line 179), and a repeating
request keeps one identifier for its whole life. Cancelling that
identifier does not dismiss one occurrence. It removes the repeat.

**The codebase already states the rule.** My Week's Done handler, at
lines 406–410 of the same file, carries this comment:

> We do NOT cancel the fired notification's id — the base reminder is a
> WEEKLY repeat that must fire again next week; iOS auto-clears the shown
> banner on an action tap.

My Week follows it. My Day and Pets do not.

**Why it looks intermittent.** The reminder is re-armed by
`scheduleAllNotifications()` (`app/myday.tsx` line 152), which is called
only from `loadData()`, which is called only from a mount-only effect
(line 77, empty dependency array). Whether tomorrow's reminder exists
therefore depends on whether the My Day screen happened to remount
between the Done tap and the next morning. Nothing in the app makes that
predictable.

See Finding 2 — the same mount-only effect makes remounting rarer than
it looks.

---

## Finding 2 — A mounted screen has no way to learn about a banner action

**Symptom:** they don't always check things off. Also the reason
Finding 1 persists.

**Where:** `app/myday.tsx` lines 77–95.

```
useEffect(() => {
    const setup = async () => {
        ...
        await loadData();
    };
    setup();
}, []);
```

Empty dependency array: this runs once, when the screen first mounts.
There is no `useFocusEffect`, and no `AppState` listener on this screen.

A banner Done is handled in `app/_layout.tsx`, which writes
`completed: true` straight to `AsyncStorage` (line 543). The My Day
screen, if already mounted, holds its own copy in React state and never
re-reads storage.

**The overwrite.** `saveData()` (`app/myday.tsx` line 143) writes the
in-memory list back to `my_routine`. Any later interaction that calls it
persists the stale copy — erasing the check-off that the banner had
correctly written.

**The cold-launch variant.** If the app was not running, `_layout`'s
write and `myday`'s `loadData()` read start at the same moment with no
ordering between them. Sometimes the read wins and the check-off is
invisible; sometimes the write wins and it holds. Same defect, presented
as randomness.

**Note on scope:** this pattern should be checked on the other routine
screens as well — Pets (`mollie.tsx`), My Week, Look Ahead and Orders all
have banner actions that write to storage from `_layout`. This review
confirmed it only on `myday.tsx`.

---

## Finding 3 — My Day and Pets never clear their pending snoozes on Done

**Symptom:** they fire after being tapped Done.

**Where:** `app/_layout.tsx` lines 530–569, the My Day / Pets branch of
the `done` handler.

That branch writes the check-off, writes a history entry, and cancels the
fired notification. It never scans the pending queue for one-off snoozes
belonging to the same item.

Snoozes are scheduled with `source: 'mydaysnooze'` or `'petssnooze'` and
the item's id (lines 212–214). They survive the Done and fire later.

**Two sibling handlers already do this correctly:**

- My Week's Done, lines 452–459, sweeps `myweekpostpone` and
  `myweeksnooze` for the item id
- Orders' HERE, lines 352–358, sweeps `orders` and `orderssnooze`

The `skip` handler (lines 180–193) has the same sweep, and its
`oneOffSources` list — `mydaysnooze`, `petssnooze`, `myweeksnooze`,
`myweekpostpone` — is exactly the set the My Day Done branch is missing.

---

## Finding 4 — The 64-request ceiling (recorded, not diagnosed)

iOS permits 64 pending local notification requests per app. Confirmed by
an Apple engineer on the developer forums: past that, further requests
are dropped silently, with no error.

Nothing in the app counts pending requests or guards against the limit.
Every screen schedules independently: a DAILY per routine item, a WEEKLY
per chore, one per reminder per To-Do (a To-Do may carry several), up to
three per Timer, plus Orders, Look Ahead, Pets and Memory Test.

**Patrick's note: he never holds more than about a dozen at a time.** If
that is the pending count and not just the visible banners, this ceiling
is not in play and Findings 1–3 account for all three symptoms.

Worth distinguishing, once, because the two numbers are easy to conflate:
a *pending* request is one that is scheduled and waiting, including every
repeating reminder, which occupies its slot permanently. A *delivered*
banner is what appears on the lock screen. The pending count is always
the larger number.

Left here as a known edge, not an open bug.

---

## Suggested order of repair

1. **Finding 3** — smallest and safest. Add the missing snooze sweep to
   the My Day / Pets branch, matching what My Week already does. Isolated
   to one branch of one handler.

2. **Finding 1** — remove the `cancelScheduledNotificationAsync(notifId)`
   call on the My Day / Pets path, matching My Week's documented rule.
   One line. Should be done after 3, so that a stale snooze isn't left
   behind once the repeat survives.

3. **Finding 2** — the largest, and the one to think about rather than
   patch. The screens need a way to re-read storage when they regain
   focus. Worth deciding as a pattern once and applying to every routine
   screen, rather than screen by screen.

Findings 1 and 3 are contained edits. Finding 2 is a design decision.

---

## What was not examined

- Pets (`mollie.tsx`), Look Ahead, Orders, Memory Test and Timer were
  read only where they intersected the handlers above
- No build was run, and no behaviour was reproduced on a device
- Everything above is read from source at HEAD, not observed
