# Connect submit — A Place To Remember

Written at #82-new, from the first store trip, then filled in with
the tester road from the same sitting. Apple’s missing-items list
names what is empty. It often does not open the box. This file is
the map. Use it instead of Apple’s directions.

There are two destinations. They look alike in Connect and they are
not the same.

**TestFlight** puts a copy on a teammate’s phone. That is how someone
tests. It does not go live on the store.

**App Store review** is Apple looking at the app for the listing.
After they approve, Patrick releases it himself. That is **manual
distribution**. The listing is **free**. A version can sit in Waiting
for Review and still never appear on the store.

The left-side heading **Waiting for Review** is the App Store queue.
It does not mean testers have the build, and straightening TestFlight
does not change that heading.

Ignore the missing-items list as a map. Read the heading on the page
you are actually on, then use the matching section below.

## Two Connect pages, and TestFlight

**App Information** holds the app’s identity: name, subtitle,
category, age rating, privacy URL, and this app’s DSA line.

**Prepare for Submission** is the 1.0 version page. It holds the
description, keywords, screenshots, support URL, marketing URL,
copyright, the **build card**, App Review contact, sign-in, and
review notes.

**TestFlight** is a third area. It is where testers are invited, and
where you confirm a binary exists and read its numbers. You do not
attach the store build from TestFlight. You do not invite testers
from Prepare for Submission.

## The journey, beginning to end

### 1. Build on the Mac and put it on your phone

In VS Code: Commit, then build, then submit.

    eas build --platform ios --profile production

Yes, yes.

    eas submit --platform ios --profile production

Yes, yes, check the build name, yes.

Wait until TestFlight on your iPhone has the new load, and prove it
there.

This first trip used the #82-new load. **72** was the build on the
phone and the one sent to App Store review. **73** was truncated.
**74** is the next binary. For teammates, **72** or **74** is the
same app. The only difference is that **74** turns iPad off. iPad
off matters for Connect’s screenshot slots, not for their test.

A truncated build still consumes a number. The next finished binary
is not the number you cancelled.

Control-C on the Mac only stops the terminal. If Expo’s site already
shows a build running, cancel it there too, or it can still use a
credit.

### 2. Read the two numbers

The marketing version is **1.0** (the binary is **1.0.0** in the
project). The build is a second number, usually in parentheses, like
**1.0 (72)** or **1.0 (74)**.

The surest copy is the iPhone. Open TestFlight, tap this app, and
read the number in parentheses under the version.

On Connect’s TestFlight page, click the **1.0.0** (or **1.0**) row
to see the build rows underneath. If you only see the version and
nothing in parentheses, you are still on the version, not a build.

If that TestFlight row is yellow for Missing Compliance, open it and
answer encryption there: only Apple’s HTTPS, no document to upload.
The app already declares that in `app.json`.

### 3. Put teammates on TestFlight

This is the tester destination. Do it here, not on Prepare for
Submission, and not by pressing Add for Review.

Internal Testing is not an invite box. It only lists people who
already exist under **Users and Access**. If you add yourself, you
are the only name, and it will not let you type someone new.

To put a person on the Apple developer team, leave TestFlight. Open
**Users and Access** at the top of Connect, invite their Apple ID
email, wait until they accept, then they appear in Internal Testing.

If they only need the app on their phone, and should not be inside
the developer account, that is **TestFlight → External Testing**.
That group is where you type an email.

Adding testers does not attach a build. The group can have people
and still say **No Builds Available**.

First open **TestFlight**, then **Test Information** (same TestFlight
area, not the group). Fill the feedback email and a short beta
description, then Save. The store description at the bottom of this
file is the paste for that box. External groups will not see builds
until that page is filled.

Then open **TestFlight → iOS**, open the **72** or **74** row, and
add this external group from that build. The group page is a poor
place to attach a binary. Its picker often says No Builds Available
even when a build exists.

Until Apple clears that build for **external** TestFlight, the
teammates’ phones will also show nothing. That wait is Beta App
Review. It is not the App Store heading on the left. Internal testers
on the Apple team do not wait on that beta review.

### 4. App Information

This section begins the store road. Open **Distribution**, then
**App Information**. Save at the top after you change anything on
this page. Add for Review will not trust an unsaved choice.

Fill:

- Name: **A Place To Remember**
- Subtitle: **Memory Assist reminders**
- Primary category: **Productivity**. The word “Primary” on the
  closed menu is a placeholder, not a choice already made. Open it
  and pick Productivity. Lifestyle is the wrong neighborhood.
- Leave a second category blank.
- Content rights: this app does not contain, show, or access other
  people’s content.
- License: Apple’s standard agreement.
- Age rating: leave the extra capability boxes unmarked. Content
  frequencies none. Not medical treatment. Not Made for Kids.
  Social media: No. Expect **4+**.
- Privacy Policy URL: its own field on this page. It is not the
  Marketing URL. Apple needs a working public page. The text for
  this app has not been written yet, so this box cannot be finished
  until that page exists.
- Digital Services Act: already **Active** under **Business** at
  the top of Connect, and this account is **not a trader**. Do not
  fill the name-and-address form. That form publishes personal
  details and is the trader path. If App Information → App Store
  Regulations and Permits → Digital Services Act → Edit is that
  name form, leave it. The in-app “Complete compliance
  requirements” link can dump you on the same form. Do not use it.

Skip:

- App Encryption Documentation: no file to upload. If Connect asks
  the encryption question, the answer is only Apple’s HTTPS.
- Korea, China, Vietnam extra fields, unless you are deliberately
  selling there.
- Regulated medical device: this is not one.
- Custom license, App Clips, in-app purchases, Game Center, ads.

Pricing, if it is not already set:

- Price: **Free**.
- Availability: the countries you want.
- Version release: **manual**.

### 5. Prepare for Submission

This is the 1.0 version page, a different activity from TestFlight.
The **1.0 (72)** in the title is the version name. That is not an
attached binary. Scroll to the **Build** section. You want a **build
card** you could remove. If you only have the title and no card,
press **+** there, pick the build, confirm it, then **Save**.

Do not type `1.0 (72)` into the Version box. Version stays **1.0**.
The build number belongs only under Build.

This first submit attached **72**. **74** is the later iPhone-only
binary. Testers may use either. For the store, the build on the
card is the one Apple reviews. The left-side heading follows that
card, not the TestFlight group.

Fill on this same page:

- Description: the four paragraphs at the bottom of this file.
- Keywords, no spaces after the commas, 99 of 100 characters:

      daily,weekly,monthly,quarterly,yearly,appointment,birthday,medication,calendar,checklist,alarm,task

  Name and subtitle already cover remember, memory, assist, and
  reminders, so those words stay out.

- Support URL: a working page people can open. There is none for
  this app yet.
- Marketing URL: leave blank. The privacy policy does not go here.
- Copyright: your name and the year.
- App Review Information, further down, under Contact Information:
  your name, email, and phone as **+1** then the number. This is so
  a reviewer can call if the review gets stuck. It is not shown on
  the store page. It is not the DSA trader form. The missing-items
  list names the phone and does not open this box. Scroll to it.
- Sign-in: none. This app has no account.
- Review notes: it is a personal reminder app, nothing to log in to.
- What’s New: skip on a first version.
- Screenshots: Apple uses the same slots for review and for the
  store page. Add for Review will not go through without them.
  Three iPhone shots were supplied on this trip. Connect also asked
  for iPad shots because **72** declared iPad. That was
  `supportsTablet` in `app.json`, Expo’s default, not a choice made
  in Connect. **74** turns iPad off. Do not spend an extra EAS
  credit only to drop iPad; that change waits for a build you were
  already going to pay for. To send **72** without a new credit,
  fill the iPad slots from the Mac Simulator.

Then **Save**.

### 6. Add for Review

This is the full store review. It is not how a teammate gets the
app. Press **Add for Review** only after App Information and
Prepare for Submission have been saved.

If it says you must choose a build, look at the Build **card**, not
the title. If it says you must choose a primary category, go back to
App Information, open the category menu, pick **Productivity**, and
Save. The placeholder fooled this sitting.

**Submit for Review** only when the version has a build card, the
description, review contact, screenshots, a working support URL, and
a working privacy URL. App Privacy data types also have to be
answered: only what the app actually uses (reminders on the phone,
notifications, Siri). Nothing is sold, and there are no ads.

If you want the App Store heading gone, cancel that submission on
the 1.0 version that says Waiting for Review, using **Cancel
Review**. That does not take a TestFlight build away from teammates.
If you leave it, manual release still means it will not go live on
its own.

### 7. After Apple approves

Do not let it go live by itself. Open the approved version and
release it by hand.

## Description to paste

This is a self-contained ordinary personal reminder.

Daily is the ordinary reminder — 10:00, take your medication — and the standing list with no clock: did I take my vitamins? Have I texted my family? You tell it you did it, and when. Tomorrow it is still there. Whatever from the other pages belongs today shows there too.

Weekly, Monthly, Quarterly, and Yearly are how often a thing comes back. Quarterly can be every 30, 60, or 90 days, for things like a prescription. Appointments are one date, with reminders before. Birthdays come round each year. The Bucket List is for someday, with no deadline.

The app tells you when something is due. When you open it, it tells you what you missed. You can snooze, skip this time, or mark it done. A backup file keeps your lists.

## Still blocking a store Submit, if you do this again from scratch

- A public privacy-policy page, and its URL in App Information.
- A public support page, and its URL on Prepare for Submission.
- App Privacy data types, when Connect asks them.
- iPhone screenshots. iPad screenshots only if that binary still
  declares iPad.

Timer, Vault, Shopping List, and Memory Test stay off the listing.
They left the app.
