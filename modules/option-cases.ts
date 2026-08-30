export type OptionCase = {
    id: string;
    icon: string;
    name: string;
    body: string;
};

export const OPTION_CASES: OptionCase[] = [
    {
        id: 'holidays',
        icon: '🎉',
        name: 'Holidays',
        body: 'Move a reminder to the day before or after a holiday. The engine already knows this calendar thinking; this page is where that case lives.',
    },
    {
        id: 'timezone',
        icon: '🌐',
        name: 'Time zone',
        body: 'A named zone for when the reminder should fire, rather than only the phone’s current zone.',
    },
    {
        id: 'float',
        icon: '🔘',
        name: 'The float button',
        body: 'A control on the item for floating the day around a holiday or a missing date, instead of typing a new date.',
    },
    {
        id: 'skip',
        icon: '⏭',
        name: 'Skip',
        body: 'Skip of a cycle is a different thing from a missing day. This is skipping one occurrence, not a date that does not exist.',
    },
    {
        id: 'shifted',
        icon: '👆',
        name: 'An extra tap on a shifted day',
        body: 'When a day does not exist in that month, the last day that exists is used. An extra tap then chooses that day or the next day, not skip.',
    },
    {
        id: 'shading',
        icon: '📅',
        name: 'Calendar shading',
        body: 'Shade the calendar so a shifted or holiday-moved day is visible on the page.',
    },
    {
        id: 'notes',
        icon: '📝',
        name: 'A notes row',
        body: 'A notes line on the item, for the odd cases that need a word or two besides the name and the day.',
    },
    {
        id: 'secondThursday',
        icon: '📆',
        name: 'A second Thursday',
        body: 'Every nth weekday in a period — for example the second Thursday of the month.',
    },
    {
        id: 'wednesdayAfter',
        icon: '📅',
        name: 'A Wednesday after the 6th',
        body: 'A weekday after a numbered day in the period — for example Wednesday after the 6th.',
    },
];

const WEEKLY_IDS = ['holidays', 'timezone', 'shading', 'notes'];

export function optionCasesForKind(kind: string): OptionCase[] {
    if (kind !== 'weekly') return [];
    return WEEKLY_IDS.map((id) => OPTION_CASES.find((one) => one.id === id)).filter(
        (one): one is OptionCase => one != null,
    );
}
