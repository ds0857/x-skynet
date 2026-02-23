import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';
import { AcceptanceGate } from '../acceptance-gate.js';

describe('AcceptanceGate', () => {
  let gate: AcceptanceGate;
  let tmpDir: string;

  beforeEach(async () => {
    gate = new AcceptanceGate();
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'acceptance-gate-test-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('rejects a failed task result with no maxErrors', async () => {
    const result = await gate.verify({
      success: false,
      output: null,
      error: 'something went wrong',
    });

    expect(result.passed).toBe(false);
    expect(result.reason).toContain('something went wrong');
  });

  it('rejects a failed task with default criteria (maxErrors = 0)', async () => {
    const result = await gate.verify({ success: false, output: null });

    expect(result.passed).toBe(false);
    expect(result.reason).toContain('unknown error');
  });

  it('passes a successful task result', async () => {
    const result = await gate.verify({ success: true, output: 'done' });

    expect(result.passed).toBe(true);
    expect(result.reason).toBe('All acceptance criteria met');
  });

  it('passes when required files exist', async () => {
    const filePath = path.join(tmpDir, 'output.txt');
    await fs.writeFile(filePath, 'hello');

    const result = await gate.verify(
      { success: true, output: null },
      { requiredFiles: [filePath] },
    );

    expect(result.passed).toBe(true);
  });

  it('rejects when required files are missing', async () => {
    const missingFile = path.join(tmpDir, 'nonexistent.txt');

    const result = await gate.verify(
      { success: true, output: null },
      { requiredFiles: [missingFile] },
    );

    expect(result.passed).toBe(false);
    expect(result.reason).toContain('Missing required files');
    expect(result.reason).toContain(missingFile);
  });

  it('rejects when customCheck returns false', async () => {
    const result = await gate.verify(
      { success: true, output: null },
      { customCheck: () => false },
    );

    expect(result.passed).toBe(false);
    expect(result.reason).toBe('Custom acceptance check failed');
  });

  it('passes when customCheck returns true', async () => {
    const result = await gate.verify(
      { success: true, output: null },
      { customCheck: () => true },
    );

    expect(result.passed).toBe(true);
  });

  it('supports async customCheck', async () => {
    const result = await gate.verify(
      { success: true, output: null },
      { customCheck: async () => Promise.resolve(false) },
    );

    expect(result.passed).toBe(false);
  });
});
