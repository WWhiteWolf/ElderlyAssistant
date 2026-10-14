# Expo App Awards — 2026

Written at #136-new. This is the record of the competition and the
words for the form. It is not a store listing.

Patrick wants to enter for the publicity, the notoriety, and the
validation of the quality. Those three come only if Expo names the
app. An entry by itself gets an automatic reply. Last year there were
over 1,200 entries.

## The competition

The page is expo.dev/awards/2026. Submissions are open through
October 31. Finalists are named November 6. Winners are named
November 13. One entry per person, one email per entry.

Five awards. App of the Year, Most Creative, Community’s Choice,
Largest Scale, and Most Innovative. The closest fit is Most
Innovative. The thing to tell them is the engine.

The form asks for the app name, the developer name, an email, his
name, a store link, and a description. The store link can be the
App Store, Google Play, or both. The awards require the app to be
available on one of the stores. The form has no place to attach a
picture. A picture gets in only as a link pasted in the description.

## What has to be true first

The entry waits on a public store page. The iPhone is that page.
Build 100 is Waiting for Review and comes off review. Build 117 is
the code of 116 plus the free month, and that is the build to
submit. Release is manual. The entry can be sent after that page
is public, and before October 31.

Android is not that page. The payments profile is not set up, as
far as Patrick knows. The Android release also waits on 12 testers,
which he does not have.

Screenshots already in App Store Connect show the dark theme of the
home page, the calendar, and the daily list. Some items on the daily
list have no clock. Light-theme screenshots go on the 117
submission. While build 100 is Waiting for Review, Apple will not
let screenshots be added or changed.

## The drawing

The reminder path is drawn in
`Projects/Reminder Engine/docs-ref/reminder-shape.drawio`.
A picture of it is `reminder-shape.png` in that same folder.
The picture is the reminder path only. A daily item with no time,
and a Bucket List item, never reach the phone, so they are not on
it. The form cannot take this picture.

Changed at #136-new:

- The box labeled “Siri, and the app itself” was removed, and so was
  the arrow from that box into the input store. Those words were one
  box, so both went. The screens still feed the input store. Done,
  snoozed, skipped, and fired still come back from the phone.
- The output store and the phone were moved to the right, and the
  page was widened, so the words “the next few moments” were no
  longer sitting on the next box. The return arrow moved with the
  phone.
- The picture was exported again after those changes.

## Words for the description

A Place To Remember is a personal daily reminder app for iPhone and
Android, built with Expo. It does not ask for a block of time or a
teammate. It is for a person who is having more trouble remembering
as they grow older.

The heart of it is the engine. Every reminder is one shape. The
screens write an item, when it comes due, and how far ahead to
speak. The kind — daily, one time, weekly, monthly, quarterly,
yearly, appointment, or birthday — decides what that reminder is
allowed to do. An appointment cannot be snoozed. A daily reminder
can be marked done and comes back the next day. A birthday keeps
the birth date and advances the year.

That saved reminder meets one question: is this still wanted? If it
is not, nothing is armed. If it is, the engine decides how far ahead
the phone can actually be armed. The phone only holds so many
upcoming alerts, and only the engine can see how full it is.

What the phone should say is written once, and the banner reads
that. Done, snooze, skip, and a reminder that has already fired
come back to the same question.

A daily item can have no time. Then it does not speak. It stays on
the list so the person can check it off and know they have done it.

Bucket List is not a reminder page. It has no date, no time, and no
banner. It is a list to check off when something is done, and it
stays until then.
