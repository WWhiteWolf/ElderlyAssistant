# Test load — sitting list

A follow-along for the simulator, then the same walk on the phone.
The load is not built yet. When it is, this is the order.

Every test name on the screen starts with TEST. Your own reminders
are copied first and come back at Clean up.

---

## Before you start

1. Open Memory.
2. On Home, tap **Test load** (the last tile).
3. Tap **Load the cases** and confirm. Your real list is saved to
   the side and replaced by the test items.

---

## Part 1 — Check, no waiting

4. Tap **Check the queue**.
5. Read the count under the header. Failed rows name what differed.
6. These should be **Pass** without you waiting for a banner:

   1. Daily with a time — on Daily, one notice, Daily heading and
      buttons.
   2. Daily with no time — on Daily, no notice.
   3. Weekly for today — on Weekly, and on Daily as from Weekly.
   4. Monthly for today — on Monthly, and on Daily as from Monthly.
   5. Quarterly for today — on Daily as from Quarterly.
   6. Yearly for today — on Daily as from Yearly.
   7. One Time for today — on One Time, and on Daily as from One
      Time, OK button only.
   8. Extended — on Extended only, no notice.
   9. One Time, 30 minutes before — two notices, the appointment
      and one 30 minutes earlier.
   10. One Time, Time of — one notice at the item’s own time.
   11. Lead across midnight — the early notice is today at 23:40,
       for an appointment at 00:10 tomorrow.
   12. Named zone — fire time is Los Angeles, not the phone’s
       clock.
   13. Zone across a date — 00:30 in Los Angeles; if the phone is
       ahead, the date on Scheduled Reminders is the earlier day.
   14. Monthly 31st — next fire is the last day that exists in the
       short month; Then and Next Day if that day is not the 31st;
       the item is still a 31st.
   15. Holiday, day after — next Christmas moves to 26 December.
   16. Holiday, day before — if the next 4 July falls on that
       weekly item’s day, the notice is 3 July.
   17. Second Thursday — the Thursday in days 8–14 of this month,
       or next month if that Thursday is already past.
   18. Wednesday after the 6th — the first Wednesday after the 6th,
       not later Wednesdays.
   19. Rename — the Daily notice now says TEST Daily renamed.
   20. Monthly Done does not move the date — still the 15th, and
       the next occurrence is still queued.
   21. Delay then a delayed notice — original Daily notice still
       there, plus a delay about 15 minutes out; not checked.
   22. Skip leaves it not done — unchecked, no new Log line, next
       Daily notice still queued.
   23. Done, then tomorrow still arms — checked, Log line, notice
       for tomorrow at the same time.
   24. Next Day on a shifted 31st — only if that fire used a missing
       day: item is still a 31st, and a delay notice exists for
       tomorrow.

---

## Part 2 — Look with your own eyes

The report marks these **Look**. Open the page it names.

7. Daily. Every-day items, plus today’s visitors with from Weekly
   (or Monthly, and so on) next to the name. Extended is not there.
   A Daily with no time is on the list and has no notice.
8. Extended. The test item is there, with its note. No banner for
   it on Scheduled Reminders.
9. Monthly. On the 31st item, the last day of the short month is
   shaded. On the Christmas item’s month, the moved day is shaded.
10. Scheduled Reminders. Spot-check a few names against Part 1.
    Then and Next Day appear on the shifted 31st, not OK.

---

## Part 3 — Five banners, two minutes apart

The Test load screen names each one and the tap to use. Times count
from when Load finished.

11. **Plus 2 minutes — Daily.** Tap **Done**. Open Daily: that row
    is checked, Log has a line, and tomorrow still has a notice.
12. **Plus 4 minutes — Daily.** Tap **Delay 15 min**. The row is
    not checked. A delay notice exists about 15 minutes later.
13. **Plus 6 minutes — Daily.** Tap **Skip**. The row is not
    checked. No new Log line. The next cycle still has a notice.
14. **Plus 8 minutes — Weekly.** Tap **Done**. Open Weekly: that
    row is checked, and the week log has a line.
15. **Plus 10 minutes — One Time.** Tap **OK**. The banner is gone.
    The item is not marked done.

Skip and OK do not bring the app forward. After those two, open
Memory yourself and look. If a banner’s time has already passed,
that is not a feature failure; the screen will say so.

---

## Part 4 — Close and open again

Do this before Clean up.

16. Open Daily. Send Memory to the background. Open it again.
    Yesterday’s ticks are not back. The test notices that should
    still be there still are. No duplicates.
17. Leave Daily on the screen. Send Memory to the background.
    Open it again without changing page. Daily still shows today,
    not yesterday’s ticks.

---

## Part 5 — Clean up

18. On Test load, tap **Clean up**.
19. Your own reminders are back. No name starting with TEST.
    Scheduled Reminders matches your list again.

---

## Part 6 — Ceiling, on its own

Only after Clean up, or instead of Parts 1–5, never at the same
time.

20. On Test load, tap **Ceiling test**.
21. You should see: **No room for this reminder.** Your phone
    holds only so many reminders and it is full. This one is
    saved, but the one furthest in the future will not go off
    until something makes room.
22. Fifty-six of ours on the queue, not more.
23. Tap **Clean up** before you live with the app again.
