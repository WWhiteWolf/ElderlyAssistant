# In flight — the working session's desk

**This file is replaced every time, never added to.** The moment it starts
growing it becomes the thing that thins the next session. Half a page is the
limit.

Last written: 2026-10-05, #126-new, open.

## Read this first

- #125-new is committed.
- The saved-list read warning is built. A failed read is not drawn as
  an empty page. The warning says that the phone's reminders were left
  alone, tells the person to close and reopen Memory, and opens the
  existing Feedback popup if the warning remains.
- The question after a successful New save is built. Back Up Now runs
  the same export as Backup & Restore. Not Now makes the ordinary
  return. Edit and Done do not ask. Automatic backup was not chosen.
  Build 105 proved both choices on Patrick's phone.
- Daily's Snooze selector is built. The existing 15, 30, and 60 minute
  choices are stacked on the left. The spinning 1-through-14 minute
  wheel starts at 5 in the middle. Up, Snooze, and Down are on the
  right, and the ends do not wrap. The whole popup owns its controls
  and layout; the shared list only supplies the item and accepts the
  choice.
- Build 105 proved that a 10-minute wheel choice fired, and exposed
  that it counted from the tap even when the original reminder was
  still fifteen minutes away. That rule was rejected. The scheduler
  machine now starts a list Snooze at the next unfired speaking moment,
  starts at the tap after today's occurrence has spoken, and moves an
  existing future Snooze from its own time. The shared page does not
  calculate this.
- 440 Mac checks pass. TypeScript is clean and lint has no errors. The
  corrected Snooze rule is newer than build 105. The saved-list warning
  has not been checked on the phone.

## What is next

A newer phone build and phone proof cover the corrected Snooze timing.
The saved-list read warning also remains to be proved.

## Do not reopen

All changes are built, and the backup question is phone-proved. Do not
rework them unless checking finds a fault. Do not add VoiceOver work,
text-size work, a new
notification-limit warning, gesture replacements, or an elaborate
storage-recovery system from #125-new. Those suggestions were examined
and did not remain.
