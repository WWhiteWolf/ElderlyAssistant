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
- Build 106 is on Patrick's phone. It contains the machine rule that
  starts an advance Snooze at the original speaking moment instead of
  the tap. The original and later follow-up both alerted. Keep both:
  that safety is wanted and matches **remind me again**.
- Build 106 exposed the wheel running in the wrong visual direction
  and sometimes reopening at 1. The code after it puts 14 at the top
  and 1 at the bottom, makes Up go to the higher number above, and
  resets both the selected number and physical wheel to 5 on every
  opening.
- A One Time item on Daily now says **One Time only** on a second line.
- 442 Mac checks pass. TypeScript and lint are clean. The latest wheel
  corrections and One Time marker are not on the phone. The saved-list
  warning has not been checked there.

## What is next

A newer phone build and phone proof cover the two wheel corrections and
the One Time marker. The saved-list read warning remains to be proved.

## Do not reopen

All changes are built. The backup question and the original-plus-
follow-up Snooze are phone-proved. Do not replace the original alert
with the Snooze. Do not rework anything unless checking finds a fault.
Do not add VoiceOver work, text-size work, a new notification-limit
warning, gesture replacements, or an elaborate storage-recovery system
from #125-new. Those suggestions were examined and did not remain.
