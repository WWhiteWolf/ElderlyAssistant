// The User's Guide words. The Settings page reads USER_GUIDE_BLOCKS.
// The first-load popup on Home reads FIRST_OPEN_PARAGRAPHS: the four
// short paragraphs, then a suggestion to open the Guide.

export const USER_GUIDE_SEEN_KEY = 'user_guide_seen';

export const USER_GUIDE_PARAGRAPHS = [
    "Welcome. Keep the things you want to remember here, and the app will remind you when it's time.",
    "Home is a set of tiles. Tap the one that fits what you have in mind. If you're not sure, tap Help. It asks a couple of questions and opens the right page.",
    'On a page, tap + Add, fill in what you need, and Save. When the time comes, the phone shows a banner. You can tap Done, Skip, or Snooze. The same buttons sit on the row in the list.',
    'The gear on Home is Settings. Backup is there. Everything you enter stays on this phone.',
] as const;

export const FIRST_OPEN_PARAGRAPHS = [
    ...USER_GUIDE_PARAGRAPHS,
    "You should start with the User's Guide. Tap the gear at the top of Home to open Settings, then tap User's Guide at the bottom of that page.",
] as const;

export type GuideBullet = {
    text: string;
    level?: number;
};

export type GuideBlock =
    | { type: 'heading'; text: string }
    | { type: 'paragraph'; text: string }
    | { type: 'bullets'; items: GuideBullet[] }
    | { type: 'lines'; items: string[] };

export const USER_GUIDE_BLOCKS: GuideBlock[] = [
    { type: 'paragraph', text: 'Reminders are of all types, for all occasions.' },
    {
        type: 'paragraph',
        text: 'There are five pages of reminders that repeat. Weekly, Monthly, Quarterly, Yearly, and a special list for Birthdays.',
    },
    {
        type: 'paragraph',
        text: "There are two pages for a one-time event or item you want to be reminded of: Appointments and Bucket List. Appointments is for things like a doctor's visit. Bucket List is for things you want to do someday, that do not have a specific date or time they are due, and you want to keep them on a list.",
    },
    {
        type: 'paragraph',
        text: 'There is one Daily page that operates differently. It is kind of a combination, plus it does some of its own thing.',
    },
    {
        type: 'paragraph',
        text: 'Each page is also for entering a reminder. You open the page that fits, and add it there.',
    },
    {
        type: 'paragraph',
        text: 'Help, the tile with the thinking face, can help you decide which page to put a reminder on by asking you a few questions about what the reminder is for.',
    },
    {
        type: 'paragraph',
        text: 'You can read about each of these below, first the ones that repeat, then the ones that do not.',
    },

    { type: 'heading', text: 'Reminders that repeat' },
    {
        type: 'paragraph',
        text: 'These are the reminders that come round again. When the day and time arrive, the phone reminds you. Done means this round is taken care of, and it will come round again.',
    },
    {
        type: 'paragraph',
        text: 'Weekly is for things that come round every week, on the same day of the week, and you pick the time. You can delay a reminder 15, 30, or 60 minutes, or one day.',
    },
    {
        type: 'paragraph',
        text: 'Monthly is for things that come round every month. You pick the date and a time. A 31st stays a 31st, and if a month has no 31st, it uses the last day of that month.',
    },
    {
        type: 'paragraph',
        text: 'Quarterly is for things that come round every three months. You pick the date and a time, and you can choose 30, 60, or 90 days from that date instead of every three months.',
    },
    {
        type: 'paragraph',
        text: 'Yearly is for things that come round every year. You pick the date and a time.',
    },
    {
        type: 'paragraph',
        text: 'Birthdays is that special list. You enter the birthdate, and the time you want to be reminded at. The year they were born stays as it is, so the app can show how old they turn. You can ask to be reminded ahead of time.',
    },

    { type: 'heading', text: 'Reminders that do not repeat' },
    {
        type: 'paragraph',
        text: 'These are for one occasion, or for something you want to keep on a list with no date. They do not come round again. Done means this one is finished. It stays on the page, and it will not remind you again.',
    },
    {
        type: 'paragraph',
        text: "Appointments is for things like a doctor's visit. You pick the date and the time of the appointment. The choices for how to be reminded are explained below.",
    },
    {
        type: 'paragraph',
        text: 'Bucket List is for things you want to do someday, with no date or time they are due. They stay on the list until you mark them done. The phone does not send a reminder for these.',
    },

    { type: 'heading', text: 'Daily' },
    {
        type: 'paragraph',
        text: 'Daily is a bit of both. It holds the things you do every day, and it also holds things that are only for today. Those are called One Time for today, and they are not appointments. Anything from another page that falls today shows here too, with a note saying where it comes from. When you add something on Daily, you choose every day, or One Time for today.',
    },

    { type: 'heading', text: 'Help' },
    {
        type: 'paragraph',
        text: 'Help asks a few questions so it can open the right page.',
    },
    { type: 'paragraph', text: 'Does this item repeat?' },
    {
        type: 'bullets',
        items: [
            { text: 'Yes — Help asks how often this comes round:' },
            { text: 'Every day', level: 1 },
            { text: 'Weekly', level: 1 },
            { text: 'Monthly', level: 1 },
            { text: 'Quarterly', level: 1 },
            { text: 'Yearly', level: 1 },
            { text: 'For a birthday reminder', level: 1 },
            { text: 'No — Help asks if this is for today:' },
            { text: 'Yes — that is a One Time for today, only for this day', level: 1 },
            { text: 'No — then it is either', level: 1 },
            { text: "Appointment, when there is a date and time, like a doctor's visit", level: 2 },
            { text: 'Bucket List, when it is something you want to do someday, with no date', level: 2 },
        ],
    },
    {
        type: 'paragraph',
        text: 'Pick the one that applies. Or cancel and enter the item directly on a page if that is easier.',
    },
    {
        type: 'paragraph',
        text: 'From Help, Cancel comes back to the questions. Save puts Help away as well, and opens the page where the item lives.',
    },

    { type: 'heading', text: 'Reminders before' },
    {
        type: 'paragraph',
        text: 'The time of the appointment reminds you at the time you set, and also at a choice of before time reminders. You can turn on as many as you like.',
    },
    {
        type: 'paragraph',
        text: 'Three of them count back from the appointment clock: thirty minutes, one hour, and two hours. Those three are offered once a time is set.',
    },
    {
        type: 'paragraph',
        text: 'The rest use the morning, midday, and evening times in Settings.',
    },
    {
        type: 'paragraph',
        text: 'Morning of uses the morning time, on the day itself. It is not the appointment time.',
    },
    {
        type: 'paragraph',
        text: 'Day Before uses the midday time, the day before. 2 Days Before uses that same midday time, two days before.',
    },
    {
        type: 'paragraph',
        text: 'Night Before uses the evening time, the evening before. A week before and a month before are for more notice, and they use that same evening time.',
    },
    {
        type: 'paragraph',
        text: 'A One Time for today has a shorter list: thirty minutes, one hour, two hours, and Time of. Time of is the time you picked.',
    },

    { type: 'heading', text: 'Settings' },
    {
        type: 'paragraph',
        text: 'Settings is reached by tapping the gear in the header of Home.',
    },
    {
        type: 'bullets',
        items: [
            { text: 'Settings is where you choose Light or Dark for the app, and whether the colors match the phone or not.' },
            { text: 'You enter your name.' },
            { text: 'You set Morning Reminder Time, Midday Reminder Time, and Evening Reminder Time.' },
            { text: 'Scheduled Reminders, when tapped, shows the reminders currently armed on your phone.' },
            { text: 'Backup & Restore is for saving and retrieving your reminders.' },
            { text: "This User's Guide is here." },
            { text: 'Feedback is for emailing the developer with comments, suggestions, or problems you want to pass on.' },
        ],
    },
    { type: 'paragraph', text: 'Each of these is explained below.' },
    {
        type: 'paragraph',
        text: 'You choose Light or Dark for the app, whichever is easier on your eyes.',
    },
    {
        type: 'paragraph',
        text: 'The pop-ups can follow that same choice, or they can follow the phone.',
    },
    {
        type: 'paragraph',
        text: 'You enter your name. Tap to set it, type it, and Save. Home will greet you by name.',
    },
    { type: 'paragraph', text: 'You set three times:' },
    {
        type: 'lines',
        items: [
            'Morning Reminder Time',
            'Midday Reminder Time',
            'Evening Reminder Time',
        ],
    },
    {
        type: 'paragraph',
        text: 'Tap one to change it. Reminders that come before an appointment use these clocks. That is explained earlier in this Guide.',
    },
    {
        type: 'paragraph',
        text: 'Scheduled Reminders is a list of what is currently armed on your phone. Tap it to see that list.',
    },
    {
        type: 'bullets',
        items: [
            { text: 'The phone can hold 64 reminders.' },
            { text: 'This app leaves 8 free, so it keeps to 56.' },
        ],
    },
    {
        type: 'paragraph',
        text: 'You can use it to help keep the number of your reminders within that maximum, so that none will be dropped.',
    },
    {
        type: 'paragraph',
        text: 'Backup & Restore is for saving a copy of the reminders from your phone, and for putting them back on your phone. Export Backup saves a file you can keep.',
    },
    {
        type: 'bullets',
        items: [
            { text: "Replace from Backup puts the backup's reminders in place of what is here." },
            { text: 'Merge from Backup keeps what is here and adds from the backup only what is not already here.' },
        ],
    },
    {
        type: 'paragraph',
        text: 'The Settings choices stay as they are on this phone. The app asks you to confirm before it changes anything.',
    },
    {
        type: 'paragraph',
        text: "User's Guide is this Guide. Tap it, and it will help you to understand this app.",
    },
    {
        type: 'paragraph',
        text: 'Feedback is for comments, suggestions, or problems you want to pass on to the developer. Tap it, answer a few questions, and add comments or a question if you care to, then tap the Send Feedback button. It uses the phone\'s Mail to open a pre-addressed email to the developer, and sends it.',
    },
    {
        type: 'paragraph',
        text: 'There is no Reset All Data in the app. To start with a clean copy, delete the app from the phone, then install it again. Export a Backup first if you want to keep what you have entered.',
    },

    { type: 'heading', text: 'Options' },
    {
        type: 'paragraph',
        text: 'Options is on New and Edit. Tap Options in the header.',
    },
    {
        type: 'paragraph',
        text: 'It is extra choices for how this reminder comes round, beyond the date and time on the form. It is not a Home page.',
    },
    {
        type: 'paragraph',
        text: 'Which choices you see depends on the kind of reminder.',
    },
    {
        type: 'bullets',
        items: [
            { text: 'Time zone' },
            { text: 'Holidays' },
            { text: 'Day after the set day' },
            { text: 'A second Thursday' },
            { text: 'A Wednesday after the 6th' },
        ],
    },
    { type: 'paragraph', text: 'Each of these is explained below.' },
    {
        type: 'paragraph',
        text: 'Time zone is for when the reminder should fire. You can let the time follow the zone you and your phone are in, or keep the zone it was originally set for.',
    },
    {
        type: 'paragraph',
        text: 'Holidays moves a reminder to the day before or the day after a holiday. You choose which. That is the day before or after the holiday, not the day after your set day.',
    },
    {
        type: 'paragraph',
        text: 'Day after the set day is for Weekly. In a week that has a federal holiday, the reminder moves to the day after the set day. It is a choice you turn on. It does not have to be on. If it is off, the reminder stays on the set day, and you can still move it yourself.',
    },
    {
        type: 'paragraph',
        text: 'A second Thursday is for a numbered weekday, for example the second Thursday of the month. You pick the weekday and which one: 1st, 2nd, 3rd, 4th, or Last.',
    },
    {
        type: 'paragraph',
        text: 'A Wednesday after the 6th is the first of that weekday after a numbered day, for example the first Wednesday after the 6th which means \'Wednesday on the first full week of the month\'. You pick the weekday and the numbered day.',
    },
    {
        type: 'paragraph',
        text: 'You cannot have both a second Thursday and a Wednesday after the 6th on the same reminder. Setting one clears the other.',
    },
    {
        type: 'paragraph',
        text: 'Daily and One Time for today have Time zone only.',
    },
    {
        type: 'paragraph',
        text: 'Weekly has Time zone, Holidays, and Day after the set day.',
    },
    {
        type: 'paragraph',
        text: 'Appointments and Birthdays have Time zone and Holidays.',
    },
    {
        type: 'paragraph',
        text: 'Monthly, Quarterly, and Yearly have Time zone, Holidays, a second Thursday, and a Wednesday after the 6th.',
    },
    {
        type: 'paragraph',
        text: 'Bucket List has no Options.',
    },
    {
        type: 'paragraph',
        text: 'When a choice is on, it shows on the form under Options. Tap it to change it.',
    },
    {
        type: 'paragraph',
        text: 'A Note is a field on New and Edit. It is not an Options choice.',
    },
    {
        type: 'paragraph',
        text: 'Then and Next Day are for when a month has no such day. They show on the banner, not in Options.',
    },

    { type: 'heading', text: 'Delete' },
    {
        type: 'paragraph',
        text: 'Delete is how you take a reminder off its page. Swipe the row, and a Delete button comes out. Tap it, and the app asks Remove this entry? Cancel leaves everything as it is. Delete takes the reminder off.',
    },
    {
        type: 'paragraph',
        text: 'It really is gone then, not only hidden for today. If a reminder from another page is showing on Daily, deleting it there takes it off that other page too, because it is the same reminder.',
    },

    { type: 'heading', text: 'Save' },
    {
        type: 'paragraph',
        text: 'Save is on New and Edit. It stays at the top while you scroll, next to Cancel. Save keeps the reminder as you set it, and takes you back to the page it belongs on. Cancel leaves everything as it was.',
    },
    {
        type: 'paragraph',
        text: 'If there is no name, Save asks you to enter one.',
    },
    {
        type: 'paragraph',
        text: 'If a date or time you typed is not a real one, that box is outlined in red, and Save asks you to fix it first.',
    },
    {
        type: 'paragraph',
        text: 'If you last set the time with the 12-hour spinner, Save asks you to check AM or PM, so the morning or evening is the one you mean. You can go back and change it, or Save from there. If you last set the time with the 24-hour box or the digit spinner, it does not ask.',
    },

    { type: 'heading', text: 'Done' },
    {
        type: 'paragraph',
        text: 'Done is how you mark that you have taken care of a reminder. On the list the button says Done? Tap it, and it becomes a tick.',
    },
    {
        type: 'paragraph',
        text: 'On reminders that repeat, Done means this round is taken care of, and it will come round again.',
    },
    {
        type: 'paragraph',
        text: 'Daily and Weekly: a second tap the same day takes the tick off. The morning takes it off if you leave it.',
    },
    {
        type: 'paragraph',
        text: 'Monthly, Quarterly, Yearly, and Birthdays: Done moves the date to the next time. The tick stays so you can see this cycle was done. A second tap while the tick is showing means this cycle was not done. The app asks if you want to mark it as not done. Cancel leaves the tick. It is not Done for the new cycle.',
    },
    {
        type: 'paragraph',
        text: 'The next round is armed when it is close enough, so there is room for the before-reminders. Monthly looks about a month ahead. Quarterly, Yearly, and Birthdays look about two months ahead.',
    },
    {
        type: 'paragraph',
        text: 'On Appointments and Bucket List, Done means this one is finished. It stays on the page, and it will not remind you again. Delete is how you get rid of it.',
    },
    {
        type: 'paragraph',
        text: 'Some banners also have a Done button. Appointments and Birthdays do not; those banners only have OK. Bucket List has no banner.',
    },
    {
        type: 'paragraph',
        text: 'Skip is not Done. Skip drops this round and sets up the next. One Time for today, Appointments, and Bucket List have no next round, so they have no Skip.',
    },

    { type: 'heading', text: 'Snooze' },
    {
        type: 'paragraph',
        text: 'Snooze pushes a reminder back. On the list, tap Snooze. A popup titled Snooze Reminder asks you to remind me again in. Cancel leaves it as it is.',
    },
    {
        type: 'paragraph',
        text: 'The list then says Snoozed till and the new time. If that time is another day, it also names the weekday and the date, and the year when the year changes.',
    },
    {
        type: 'paragraph',
        text: 'Which delays you see depends on the kind.',
    },
    {
        type: 'paragraph',
        text: 'Daily, and One Time for today: 15, 30, or 60 minutes.',
    },
    {
        type: 'paragraph',
        text: 'Weekly: those three, and Delay 1 Day.',
    },
    {
        type: 'paragraph',
        text: 'Monthly, Quarterly, and Yearly: Delay 1 Day, Delay 1 Week, or Delay 1 Month.',
    },
    {
        type: 'paragraph',
        text: 'The banner uses the same delays. Those buttons say Delay.',
    },
    {
        type: 'paragraph',
        text: 'Appointments, Birthdays, and Bucket List cannot be snoozed. A Daily reminder with no time has no Snooze button, because there is nothing to push back.',
    },

    { type: 'heading', text: 'Banners' },
    {
        type: 'paragraph',
        text: 'A banner is the notice the phone shows when a reminder is due. The buttons on it depend on the kind.',
    },
    {
        type: 'paragraph',
        text: 'Daily: Done, OK, Skip, Delay 15 min, Delay 30 min, and Delay 60 min.',
    },
    {
        type: 'paragraph',
        text: 'One Time for today: Done, OK, Delay 15 min, Delay 30 min, and Delay 60 min.',
    },
    {
        type: 'paragraph',
        text: 'Weekly: Done, OK, Skip, Delay 15 min, Delay 30 min, Delay 60 min, and Delay 1 Day.',
    },
    {
        type: 'paragraph',
        text: 'Monthly, Quarterly, and Yearly: Done, Delay 1 Day, Delay 1 Week, and Delay 1 Month.',
    },
    {
        type: 'paragraph',
        text: 'Appointments and Birthdays: OK.',
    },
    {
        type: 'paragraph',
        text: 'Bucket List has no banner.',
    },
    {
        type: 'paragraph',
        text: 'OK drops the notice. It does not drop this round, and it does not change what you have set.',
    },
    {
        type: 'paragraph',
        text: 'Skip drops this round and sets up the next.',
    },
    {
        type: 'paragraph',
        text: "If you tap the banner, or a button, the app opens on that reminder's page, on the item that is reminding. A One Time for today opens Daily.",
    },
    {
        type: 'paragraph',
        text: 'When a month has no such day as the one you set, the banner offers Then and Next Day instead. Then keeps the last day that month has. Next Day moves this round by one day only. Those are not Options choices.',
    },

    { type: 'heading', text: 'Log' },
    {
        type: 'paragraph',
        text: "Log is not a Home page. Each reminder page has Log in the header, beside + Add. That opens that page's log only. There is not one log for everything. The list itself does not show it. Back returns to the list.",
    },
    {
        type: 'paragraph',
        text: 'If there are no entries yet, it says No log entries yet.',
    },
    {
        type: 'paragraph',
        text: 'A tap on a line opens a note for that entry. Cancel leaves it. Save keeps the note.',
    },
    {
        type: 'paragraph',
        text: 'Swipe a line, then tap Delete. That deletes the log line only. It does not take the reminder off.',
    },
    {
        type: 'paragraph',
        text: 'Clear All is in the header when there are entries. It asks Delete all log entries? This cannot be undone. Cancel leaves them. Clear All takes them all off.',
    },
    {
        type: 'paragraph',
        text: 'The log keeps the newest 50 entries.',
    },
    {
        type: 'paragraph',
        text: "A reminder showing on Daily from another page writes on Daily's log, and also on that other page's log. Done from a banner writes on that reminder's own page log. One Time for today uses Daily's log.",
    },
];
