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
import { runReconcileTests } from './reconcile.test.ts';
import { runDailyResetTests } from './dailyreset.test.ts';
import { runWeeklyResetTests } from './weeklyreset.test.ts';
import { runQueueViewTests } from './queueview.test.ts';
import { runHealthTests } from './health.test.ts';
import { runMissCandidateTests } from './miss-candidates.test.ts';
import { runStillWantedTests } from './stillwanted.test.ts';
import { runArmDepthTests } from './armdepth.test.ts';
import { runTranslatorCadenceTests } from './translatorcadence.test.ts';
import { runLeadMomentsTests } from './leadmoments.test.ts';
import { runRemindersForTests } from './remindersfor.test.ts';
import { runApplyTests } from './apply.test.ts';
import { runRunGateTests } from './rungate.test.ts';
import { runResetGateTests } from './resetgate.test.ts';

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

console.log('\nMiss candidates');
runMissCandidateTests();

console.log('\nIs this still wanted?');
runStillWantedTests();

console.log('\nHow far ahead do we arm?');
runArmDepthTests();

console.log('\nOne-list translator');
runTranslatorCadenceTests();

console.log('\nLead moments');
runLeadMomentsTests();

console.log('\nReminders for a shaped item');
runRemindersForTests();

console.log('\nApply order');
runApplyTests();

console.log('\nRun gate');
runRunGateTests();

console.log('\nDay-roll gate');
runResetGateTests();

report();
