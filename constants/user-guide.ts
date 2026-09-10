// The User's Guide words. The Settings page reads USER_GUIDE_PARAGRAPHS.
// The first-load popup on Home reads FIRST_OPEN_PARAGRAPHS: those four,
// then a suggestion to open the Guide.

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
