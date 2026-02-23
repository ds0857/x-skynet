import { TestFeedback } from '../test-feedback.js';

describe('TestFeedback', () => {
  let feedback: TestFeedback;

  beforeEach(() => {
    feedback = new TestFeedback();
  });

  describe('parseJestOutput', () => {
    it('parses a passing test output', () => {
      const output = `
 PASS  src/__tests__/example.test.ts
  ✓ some test (5ms)

Tests: 10 passed, 10 total
Test Suites: 1 passed, 1 total
Time: 1.234s
`;
      const result = feedback.parseJestOutput(output);
      expect(result.passed).toBe(true);
      expect(result.totalTests).toBe(10);
      expect(result.failedTests).toBe(0);
      expect(result.failures).toHaveLength(0);
    });

    it('parses a failing test output', () => {
      const output = `
 FAIL  src/__tests__/example.test.ts
  ✕ some failing test (10ms)

● some failing test

  Expected: 12
  Received: 7

Tests: 2 failed, 8 passed, 10 total
Test Suites: 1 failed, 1 total
`;
      const result = feedback.parseJestOutput(output);
      expect(result.passed).toBe(false);
      expect(result.totalTests).toBe(10);
      expect(result.failedTests).toBe(2);
    });

    it('captures failure names from bullet points', () => {
      const output = `
● first failing test

● second failing test

Tests: 2 failed, 3 passed, 5 total
`;
      const result = feedback.parseJestOutput(output);
      expect(result.failures.length).toBeGreaterThanOrEqual(2);
      expect(result.failures[0].testName).toBe('first failing test');
      expect(result.failures[1].testName).toBe('second failing test');
    });

    it('returns passed=false when no tests run and no pass keyword', () => {
      const output = 'No tests found';
      const result = feedback.parseJestOutput(output);
      expect(result.passed).toBe(false);
      expect(result.totalTests).toBe(0);
    });
  });

  describe('generateFixPrompt', () => {
    it('returns "All tests pass" message for empty failures', () => {
      const prompt = feedback.generateFixPrompt([]);
      expect(prompt).toBe('All tests pass. No fixes needed.');
    });

    it('generates a prompt listing all failures', () => {
      const failures = [
        { testName: 'test A', errorMessage: 'Expected 1, got 2', filePath: 'a.ts' },
        { testName: 'test B', errorMessage: 'Null reference', filePath: 'b.ts' },
      ];
      const prompt = feedback.generateFixPrompt(failures);
      expect(prompt).toContain('Fix the following 2 test failure(s)');
      expect(prompt).toContain('test A');
      expect(prompt).toContain('Expected 1, got 2');
      expect(prompt).toContain('test B');
      expect(prompt).toContain('Null reference');
    });

    it('numbers failures starting from 1', () => {
      const failures = [
        { testName: 'only test', errorMessage: 'err', filePath: 'x.ts' },
      ];
      const prompt = feedback.generateFixPrompt(failures);
      expect(prompt).toContain('Failure 1:');
    });
  });
});
