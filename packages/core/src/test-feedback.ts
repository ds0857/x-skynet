import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface TestFailure {
  testName: string;
  errorMessage: string;
  filePath: string;
}

export interface TestResult {
  passed: boolean;
  totalTests: number;
  failedTests: number;
  failures: TestFailure[];
  durationMs: number;
  rawOutput: string;
}

export class TestFeedback {
  async runTests(workdir: string, timeoutMs = 60_000): Promise<TestResult> {
    const start = Date.now();
    let output = '';
    try {
      const { stdout, stderr } = await execFileAsync('pnpm', ['test', '--', '--no-coverage'], {
        cwd: workdir,
        timeout: timeoutMs,
        env: { ...process.env, CI: 'true' },
      });
      output = stdout + stderr;
    } catch (err) {
      const e = err as { stdout?: string; stderr?: string };
      output = String(e.stdout ?? '') + String(e.stderr ?? '');
    }
    return {
      ...this.parseJestOutput(output),
      durationMs: Date.now() - start,
      rawOutput: output,
    };
  }

  parseJestOutput(output: string): Omit<TestResult, 'durationMs' | 'rawOutput'> {
    const failures: TestFailure[] = [];
    const summaryMatch = output.match(/Tests:\s+(?:(\d+) failed,\s+)?(\d+) passed/);
    const failedTests = summaryMatch?.[1] ? parseInt(summaryMatch[1], 10) : 0;
    const passedTests = summaryMatch?.[2] ? parseInt(summaryMatch[2], 10) : 0;
    const totalTests = failedTests + passedTests;

    const failureRegex = /●\s+(.+?)\n/g;
    let match: RegExpExecArray | null;
    while ((match = failureRegex.exec(output)) !== null) {
      failures.push({
        testName: match[1].trim(),
        filePath: 'unknown',
        errorMessage: match[0].trim(),
      });
    }

    return {
      passed: failedTests === 0 && totalTests > 0,
      totalTests,
      failedTests,
      failures,
    };
  }

  generateFixPrompt(failures: TestFailure[]): string {
    if (failures.length === 0) return 'All tests pass. No fixes needed.';
    return [
      `Fix the following ${failures.length} test failure(s):`,
      '',
      ...failures.map((f, i) => `Failure ${i + 1}: ${f.testName}\nError: ${f.errorMessage}`),
    ].join('\n');
  }
}
