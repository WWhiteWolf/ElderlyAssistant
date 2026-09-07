# Connect submit — A Place To Remember

Written at #82-new, from the first store trip. Apple’s missing-items
list names what is empty. It often does not open the box. This file
is the map. Use it instead of Apple’s directions.

The listing is **free**. After Apple approves, Patrick releases the
version himself. That is **manual distribution**. Keep working on the
app while it is in review.

## Two pages, and TestFlight

**App Information** holds the app’s identity: name, subtitle,
category, age rating, privacy URL, and this app’s DSA line.

**Prepare for Submission** is the 1.0 version page. It holds the
description, keywords, screenshots, support URL, marketing URL,
copyright, the **build card**, App Review contact, sign-in, and
review notes.

**TestFlight** only confirms that a binary exists and shows its
numbers. You do not attach the store build from that page.

Ignore the missing-items list as a map. Read the heading on the page
you are actually on, then use the matching section below.

## The journey, beginning to end

### 1. Build on the Mac and put it on the phone

In VS Code: Commit, then build, then submit.

    eas build --platform ios --profile production

Yes, yes.

    eas submit --platform ios --profile production

Yes, yes, check the build name, yes.

Wait until TestFlight on the iPhone has the new load. Prove it there
before you send it to review. This first trip used the #82-new load,
build **72**.

### 2. Read the two numbers

The marketing version is **1.0** (the binary is **1.0.0** in the
project). The build is a second number, usually in parentheses, like
**1.0 (72)**.

The surest copy is the iPhone. Open TestFlight, tap this app, and
read the number in parentheses under the version.

On Connect’s TestFlight page, click the **1.0.0** (or **1.0**) row
to see the build rows underneath. If you only see the version and
nothing in parentheses, you are still on the version, not a build.

If that TestFlight row is yellow for Missing Compliance, open it and
answer encryption there: only Apple’s HTTPS, no document to upload.
The app already declares that in `app.json`.

### 3. App Information

Open **Distribution**, then **App Information**. Save at the top
after you change anything on this page. Add for Review will not
trust an unsaved choice.

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

### 4. Prepare for Submission

This is the 1.0 version page. The **1.0 (72)** in the title is the
version name. That is not an attached binary. Scroll to the **Build**
section. You want a **build card** you could remove. If you only have
the title and no card, press **+** there, pick **72** (or whichever
build you proved on the phone), confirm it, then **Save**.

Do not type `1.0 (72)` into the Version box. Version stays **1.0**.
The **72** belongs only under Build.

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
- Screenshots: Apple will not take Submit without them. They are
  not started.

Then **Save**.

### 5. Add for Review

Press **Add for Review** only after both pages have been saved.

If it says you must choose a build, look at the Build **card**, not
the title. If it says you must choose a primary category, go back to
App Information, open the category menu, pick **Productivity**, and
Save. The placeholder fooled this sitting.

**Submit for Review** only when the version has a build card, the
description, review contact, screenshots, a working support URL, and
a working privacy URL. App Privacy data types also have to be
answered: only what the app actually uses (reminders on the phone,
notifications, Siri). Nothing is sold, and there are no ads.

### 6. After Apple approves

Do not let it go live by itself. Open the approved version and
release it by hand.

## Description to paste

This is a self-contained ordinary personal reminder.

Daily is the ordinary reminder — 10:00, take your medication — and the standing list with no clock: did I take my vitamins? Have I texted my family? You tell it you did it, and when. Tomorrow it is still there. Whatever from the other pages belongs today shows there too.

Weekly, Monthly, Quarterly, and Yearly are how often a thing comes back. Quarterly can be every 30, 60, or 90 days, for things like a prescription. Appointments are one date, with reminders before. Birthdays come round each year. The Bucket List is for someday, with no deadline.

The app tells you when something is due. When you open it, it tells you what you missed. You can snooze, skip this time, or mark it done. A backup file keeps your lists.

## Still blocking Submit

- A public privacy-policy page, and its URL in App Information.
- A public support page, and its URL on Prepare for Submission.
- Screenshots.
- App Privacy data types, when Connect asks them.

Timer, Vault, Shopping List, and Memory Test stay off the listing.
They left the app.
