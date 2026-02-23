/**
 * X-Skynet Self-Healing Demo
 *
 * Demonstrates the autonomous self-repair cycle:
 * 1. A task produces a buggy result
 * 2. AcceptanceGate rejects it and explains why
 * 3. TestFeedback generates a fix prompt for an AI agent
 * 4. The bug is corrected
 * 5. AcceptanceGate verifies the fixed result
 *
 * Run: pnpm --filter @xskynet/example-self-healing start
 */
import { AcceptanceGate, TestFeedback } from '@xskynet/core';
import * as fs from 'fs/promises';

async function main(): Promise<void> {
  console.log('=== X-Skynet Self-Healing Demo ===\n');

  const gate = new AcceptanceGate();
  const feedback = new TestFeedback();

  // ── Step 1: Simulate a task that produced a buggy file ────────────────────
  const buggyCode =
    '// BUG: uses addition instead of multiplication\n' +
    'export function multiply(a, b) { return a + b; }\n';
  await fs.writeFile('/tmp/xskynet-demo-multiply.js', buggyCode);
  console.log('Step 1: Task output written (contains bug: multiply uses + instead of *)');

  // ── Step 2: AcceptanceGate rejects the result ─────────────────────────────
  const buggyTaskResult = {
    success: false,
    output: null,
    error: 'Test failed: multiply(3, 4) expected 12 but received 7',
  };
  const rejection = await gate.verify(buggyTaskResult);
  console.log(`Step 2: Acceptance check → ${rejection.passed ? 'PASSED ✅' : 'REJECTED ❌'}`);
  console.log(`        Reason: ${rejection.reason}\n`);

  // ── Step 3: TestFeedback generates a fix prompt ───────────────────────────
  const fixPrompt = feedback.generateFixPrompt([
    {
      testName: 'multiply returns correct product',
      errorMessage: 'Expected: 12  Received: 7',
      filePath: '/tmp/xskynet-demo-multiply.js',
    },
  ]);
  console.log('Step 3: Fix prompt generated for AI agent:');
  console.log('        ' + fixPrompt.split('\n').join('\n        '));

  // ── Step 4: Agent applies the fix ─────────────────────────────────────────
  const fixedCode = buggyCode.replace('a + b', 'a * b').replace('// BUG:', '// FIXED:');
  await fs.writeFile('/tmp/xskynet-demo-multiply.js', fixedCode);
  console.log('\nStep 4: Agent applied fix (replaced + with *)');

  // ── Step 5: AcceptanceGate verifies the corrected result ──────────────────
  const fixedTaskResult = {
    success: true,
    output: 'multiply(3, 4) = 12 ✓',
  };
  const acceptance = await gate.verify(fixedTaskResult, {
    requiredFiles: ['/tmp/xskynet-demo-multiply.js'],
    customCheck: async () => {
      // Read the (now fixed) file and verify it uses multiplication, not addition
      const content = await fs.readFile('/tmp/xskynet-demo-multiply.js', 'utf-8');
      return content.includes('a * b') && !content.includes('a + b');
    },
  });
  console.log(`Step 5: Acceptance check after fix → ${acceptance.passed ? 'PASSED ✅' : 'FAILED ❌'}`);

  // ── Summary ───────────────────────────────────────────────────────────────
  if (acceptance.passed) {
    console.log('\n✅ Self-healing cycle complete: PASSED');
    console.log('   Bug detected → Fix prompt generated → Fix applied → Verified');
  } else {
    console.error('\n❌ Self-healing failed:', acceptance.reason);
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error('Fatal:', err);
  process.exit(1);
});
