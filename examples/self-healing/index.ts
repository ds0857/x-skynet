import { AcceptanceGate } from '../../packages/core/src/acceptance-gate.js';
import { TestFeedback } from '../../packages/core/src/test-feedback.js';
import * as fs from 'fs/promises';

async function main() {
  console.log('=== X-Skynet Self-Healing Demo ===\n');

  const gate = new AcceptanceGate();
  const feedback = new TestFeedback();

  // Step 1: Create a file with a bug
  const buggyCode = 'export function multiply(a: number, b: number): number { return a + b; /* BUG: should be * */ }';
  await fs.writeFile('/tmp/demo-multiply.ts', buggyCode);
  console.log('Step 1: Created buggy function (multiply uses + instead of *)');

  // Step 2: Simulate test failure
  const buggyResult = { success: false, output: null, error: 'multiply(3, 4) expected 12 but got 7' };
  const firstCheck = await gate.verify(buggyResult);
  console.log('Step 2: Acceptance check on buggy code:', firstCheck.passed ? 'PASSED' : 'FAILED - ' + firstCheck.reason);

  // Step 3: Generate fix prompt
  const fixPrompt = feedback.generateFixPrompt([{
    testName: 'multiply returns correct product',
    errorMessage: 'Expected 12, received 7',
    filePath: '/tmp/demo-multiply.ts',
  }]);
  console.log('Step 3: Fix prompt generated:\n' + fixPrompt.slice(0, 200));

  // Step 4: Auto-fix (simulate agent applying the fix)
  const fixedCode = buggyCode.replace('a + b', 'a * b');
  await fs.writeFile('/tmp/demo-multiply.ts', fixedCode);
  console.log('\nStep 4: Applied fix (replaced + with *)');

  // Step 5: Verify fix
  const fixedResult = { success: true, output: 'multiply(3, 4) = 12' };
  const secondCheck = await gate.verify(fixedResult, { requiredFiles: ['/tmp/demo-multiply.ts'] });
  console.log('Step 5: Acceptance check after fix:', secondCheck.passed ? 'PASSED' : 'FAILED');

  if (secondCheck.passed) {
    console.log('\n✅ Self-healing cycle complete: PASSED');
    process.exit(0);
  } else {
    console.error('\n❌ Self-healing failed:', secondCheck.reason);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
