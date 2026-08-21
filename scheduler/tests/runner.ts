// The whole test runner. There is no framework here and nothing to install.
//
// A test runs one check. If the check throws, the test failed and the message
// says what was expected. If it does not throw, the test passed. The count at
// the end is the thing to look at.

let passed = 0;
let failed = 0;

/** Throw when a claim is false. The message says what was expected. */
export function assert(claim: boolean, whatWasExpected: string): void {
    if (!claim) throw new Error(whatWasExpected);
}

/** Compare two things by their written-out form, which is enough here. */
export function assertSame(got: unknown, expected: unknown, whatItIs: string): void {
    const a = JSON.stringify(got);
    const b = JSON.stringify(expected);
    if (a !== b) {
        throw new Error(`${whatItIs}\n      expected: ${b}\n      got:      ${a}`);
    }
}

/** Run one check and record how it went. */
export function test(name: string, check: () => void): void {
    try {
        check();
        passed++;
        console.log(`PASS  ${name}`);
    } catch (problem) {
        failed++;
        console.log(`FAIL  ${name}`);
        console.log(`      ${(problem as Error).message}`);
    }
}

/** Print the count. A failure sets the exit code so a script can see it. */
export function report(): void {
    console.log(`\n${passed} passed, ${failed} failed, ${passed + failed} in all.`);
    if (failed > 0) process.exitCode = 1;
}
