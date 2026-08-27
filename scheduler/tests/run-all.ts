// Run every test in the scheduler.
//
// On the Mac, from the project folder:
//
//     node --experimental-strip-types scheduler/tests/run-all.ts
//
// It takes about a second, needs no build, no simulator and no phone, and
// prints a PASS or FAIL line per test with a count at the end.
//
// As more of the scheduler is written, each part's tests get a line here.

import { report } from './runner.ts';
import { runMyDayTests } from './myday.test.ts';
import { runPetsTests } from './pets.test.ts';
import { runMyWeekTests } from './myweek.test.ts';
import { runLookAheadTests } from './lookahead.test.ts';
import { runToDoTests } from './todo.test.ts';
import { runMemoryTestTests } from './memorytest.test.ts';
import { runReconcileTests } from './reconcile.test.ts';
import { runDailyResetTests } from './dailyreset.test.ts';
import { runWeeklyResetTests } from './weeklyreset.test.ts';
import { runQueueViewTests } from './queueview.test.ts';
import { runHealthTests } from './health.test.ts';
import { runStillWantedTests } from './stillwanted.test.ts';
import { runArmDepthTests } from './armdepth.test.ts';
import { runTranslatorMyDayTests } from './translatormyday.test.ts';
import { runTranslatorPetsTests } from './translatorpets.test.ts';
import { runTranslatorMyWeekTests } from './translatormyweek.test.ts';
import { runTranslatorLookAheadTests } from './translatorlookahead.test.ts';
import { runTranslatorToDoTests } from './translatortodo.test.ts';
import { runLeadMomentsTests } from './leadmoments.test.ts';
import { runRemindersForTests } from './remindersfor.test.ts';

console.log('\nMy Day reader');
runMyDayTests();

console.log('\nPets reader');
runPetsTests();

console.log('\nMy Week reader');
runMyWeekTests();

console.log('\nLook Ahead reader');
runLookAheadTests();

console.log('\nTo-Do reader');
runToDoTests();

console.log('\nMemory Test reader');
runMemoryTestTests();

console.log('\nReconcile');
runReconcileTests();

console.log('\nDaily reset');
runDailyResetTests();

console.log('\nWeekly reset');
runWeeklyResetTests();

console.log('\nQueue view');
runQueueViewTests();

console.log('\nRun health');
runHealthTests();

console.log('\nIs this still wanted?');
runStillWantedTests();

console.log('\nHow far ahead do we arm?');
runArmDepthTests();

console.log('\nMy Day translator');
runTranslatorMyDayTests();

console.log('\nPets translator');
runTranslatorPetsTests();

console.log('\nMy Week translator');
runTranslatorMyWeekTests();

console.log('\nLook Ahead translator');
runTranslatorLookAheadTests();

console.log('\nTo-Do translator');
runTranslatorToDoTests();

console.log('\nLead moments');
runLeadMomentsTests();

console.log('\nReminders for a shaped item');
runRemindersForTests();

report();
