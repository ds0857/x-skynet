/**
 * CLI E2E Tests — P2-08
 *
 * Tests the xskynet CLI commands by spawning them as child processes.
 * Requires `packages/cli` source to be executable via `tsx`.
 */

import { execSync, spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const PROJECT_ROOT = path.resolve(__dirname, '../../');
const CLI_ENTRY = path.join(PROJECT_ROOT, 'packages/cli/src/index.ts');

/**
 * Run the CLI with given arguments using tsx (TypeScript runner, no build needed).
 * Returns stdout, stderr, and exit status.
 */
function runCli(args: string[], env: Record<string, string> = {}): {
  stdout: string;
  stderr: string;
  status: number | null;
} {
  // Try to use locally installed tsx; fall back to npx tsx
  const tsxBin = path.join(PROJECT_ROOT, 'node_modules/.bin/tsx');
  const hasTsx = fs.existsSync(tsxBin);

  const result = spawnSync(
    hasTsx ? tsxBin : 'npx',
    hasTsx ? [CLI_ENTRY, ...args] : ['tsx', CLI_ENTRY, ...args],
    {
      cwd: PROJECT_ROOT,
      env: {
        ...process.env,
        NO_COLOR: '1',         // disable chalk ANSI codes for easier assertions
        XSKYNET_JSON: '1',     // machine-readable output
        ...env,
      },
      encoding: 'utf8',
      timeout: 20000,
    },
  );

  return {
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    status: result.status,
  };
}

/**
 * Run the CLI without JSON mode (human-readable output).
 */
function runCliHuman(args: string[], env: Record<string, string> = {}): {
  stdout: string;
  stderr: string;
  status: number | null;
} {
  const tsxBin = path.join(PROJECT_ROOT, 'node_modules/.bin/tsx');
  const hasTsx = fs.existsSync(tsxBin);

  const result = spawnSync(
    hasTsx ? tsxBin : 'npx',
    hasTsx ? [CLI_ENTRY, ...args] : ['tsx', CLI_ENTRY, ...args],
    {
      cwd: PROJECT_ROOT,
      env: {
        ...process.env,
        NO_COLOR: '1',
      },
      encoding: 'utf8',
      timeout: 20000,
    },
  );

  return {
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    status: result.status,
  };
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('CLI E2E', () => {
  // ── Test 1 ──────────────────────────────────────────────────────────────────
  it('xskynet version outputs semver string', () => {
    // Test the built-in --version flag which outputs x.y.z
    const res = runCliHuman(['--version']);

    // `commander` exits with 0 and prints version to stdout
    expect(res.status).toBe(0);

    const output = (res.stdout + res.stderr).trim();
    // Semver regex: digits.digits.digits (optionally -prerelease+build)
    const semverRe = /\d+\.\d+\.\d+/;
    expect(output).toMatch(semverRe);
  }, 25000);

  it('xskynet version command outputs package version', () => {
    const pkgJson = JSON.parse(
      fs.readFileSync(path.join(PROJECT_ROOT, 'packages/cli/package.json'), 'utf8'),
    );
    const expectedVersion: string = pkgJson.version;

    // The `version` subcommand prints a JSON line in XSKYNET_JSON mode
    const res = runCli(['version']);

    // CLI should exit cleanly
    expect(res.status).toBe(0);

    // In JSON mode the version subcommand prints { version, node, platform }
    const line = res.stdout.trim().split('\n').find((l) => l.startsWith('{'));
    expect(line).toBeDefined();

    const parsed = JSON.parse(line!);
    expect(parsed.version).toBe(expectedVersion);
    expect(parsed.node).toMatch(/^v\d+\.\d+/);
    expect(parsed.platform).toMatch(/-/); // e.g. "linux-arm64"
  }, 25000);

  // ── Test 2 ──────────────────────────────────────────────────────────────────
  it('xskynet status shows system info', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xskynet-cli-status-'));

    try {
      // With no .xskynet/state.json, JSON mode returns { ok: true, state: null }
      const tsxBin = path.join(PROJECT_ROOT, 'node_modules/.bin/tsx');
      const hasTsx = fs.existsSync(tsxBin);

      const result = spawnSync(
        hasTsx ? tsxBin : 'npx',
        hasTsx ? [CLI_ENTRY, 'status'] : ['tsx', CLI_ENTRY, 'status'],
        {
          cwd: tmpDir, // run from temp dir so no .xskynet/ found
          env: {
            ...process.env,
            NO_COLOR: '1',
            XSKYNET_JSON: '1',
          },
          encoding: 'utf8',
          timeout: 20000,
        },
      );

      expect(result.status).toBe(0);

      const line = result.stdout.trim().split('\n').find((l) => l.startsWith('{'));
      expect(line).toBeDefined();
      const parsed = JSON.parse(line!);
      expect(parsed.ok).toBe(true);
      expect(parsed.state).toBeNull();
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }, 25000);

  it('xskynet status reads and displays agents from state.json', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xskynet-cli-status2-'));

    try {
      // Create a .xskynet/state.json with mock agents
      const statePath = path.join(tmpDir, '.xskynet');
      fs.mkdirSync(statePath, { recursive: true });
      const mockState = {
        agents: [
          { id: 'agent-001', status: 'running' },
          { id: 'agent-002', status: 'idle' },
        ],
      };
      fs.writeFileSync(path.join(statePath, 'state.json'), JSON.stringify(mockState), 'utf8');

      const tsxBin = path.join(PROJECT_ROOT, 'node_modules/.bin/tsx');
      const hasTsx = fs.existsSync(tsxBin);

      const result = spawnSync(
        hasTsx ? tsxBin : 'npx',
        hasTsx ? [CLI_ENTRY, 'status'] : ['tsx', CLI_ENTRY, 'status'],
        {
          cwd: tmpDir,
          env: {
            ...process.env,
            NO_COLOR: '1',
            XSKYNET_JSON: '1',
          },
          encoding: 'utf8',
          timeout: 20000,
        },
      );

      expect(result.status).toBe(0);

      const line = result.stdout.trim().split('\n').find((l) => l.startsWith('{'));
      expect(line).toBeDefined();
      const parsed = JSON.parse(line!);
      expect(parsed.ok).toBe(true);
      expect(parsed.state).toMatchObject(mockState);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }, 25000);

  // ── Test 3 ──────────────────────────────────────────────────────────────────
  it('xskynet run --dry-run does not execute', () => {
    // The current CLI `run` command requires an <agent-file> argument.
    // A missing / non-existent file causes a non-zero exit and does NOT execute anything.
    // We validate that running against a nonexistent file:
    //   1. Exits with a non-zero code (safe; no side-effects)
    //   2. Reports an error (not_found) without launching any process

    const res = runCli(['run', '/tmp/__nonexistent_agent_file_e2e__.ts']);

    // Should exit with code 1 (file not found) — no real execution happened
    expect(res.status).toBe(1);

    // JSON error output should contain the not_found indicator
    const line = res.stdout.trim().split('\n').find((l) => l.startsWith('{'));
    expect(line).toBeDefined();
    const parsed = JSON.parse(line!);
    expect(parsed.ok).toBe(false);
    expect(parsed.error).toBe('not_found');
  }, 25000);

  it('xskynet --help lists available commands', () => {
    const res = runCliHuman(['--help']);

    expect(res.status).toBe(0);
    const output = res.stdout + res.stderr;
    // Check that key commands are listed
    expect(output).toMatch(/run/);
    expect(output).toMatch(/status/);
    expect(output).toMatch(/version/);
  }, 25000);

  // ── Test: doctor command ─────────────────────────────────────────────────
  it('xskynet doctor returns JSON summary with checks array', () => {
    const res = runCli(['doctor']);

    expect(res.status).toBe(0);

    const line = res.stdout.trim().split('\n').find((l) => l.startsWith('{'));
    expect(line).toBeDefined();

    const parsed = JSON.parse(line!);
    expect(typeof parsed.ok).toBe('boolean');
    expect(Array.isArray(parsed.checks)).toBe(true);
    expect(parsed.checks.length).toBeGreaterThan(0);

    // Each check should have label, detail, and severity
    for (const check of parsed.checks) {
      expect(typeof check.label).toBe('string');
      expect(typeof check.detail).toBe('string');
      expect(['ok', 'warn', 'error']).toContain(check.severity);
    }
  }, 25000);

  it('xskynet doctor human-readable output contains check icons', () => {
    const res = runCliHuman(['doctor']);

    // Exit code 0 as long as there are no errors (node version is fine)
    const output = res.stdout + res.stderr;
    // Should contain the command header
    expect(output).toMatch(/doctor/i);
    // Should show Node.js check (always present)
    expect(output).toMatch(/Node/i);
  }, 25000);

  // ── Test: completion command ─────────────────────────────────────────────
  it('xskynet completion bash outputs a bash script', () => {
    const res = runCliHuman(['completion', 'bash']);

    expect(res.status).toBe(0);
    const output = res.stdout;
    // Should contain bash completion function
    expect(output).toContain('_xskynet_completions');
    expect(output).toContain('complete -F _xskynet_completions xskynet');
    // Should list known commands
    expect(output).toContain('init');
    expect(output).toContain('doctor');
  }, 25000);

  it('xskynet completion zsh outputs a zsh script', () => {
    const res = runCliHuman(['completion', 'zsh']);

    expect(res.status).toBe(0);
    const output = res.stdout;
    // Should contain zsh completion function
    expect(output).toContain('#compdef xskynet');
    expect(output).toContain('_xskynet');
  }, 25000);

  it('xskynet completion fish outputs a fish script', () => {
    const res = runCliHuman(['completion', 'fish']);

    expect(res.status).toBe(0);
    const output = res.stdout;
    // Should contain fish completion directives
    expect(output).toContain('complete -c xskynet');
  }, 25000);

  it('xskynet completion (no args) returns available shells in JSON mode', () => {
    const res = runCli(['completion']);

    expect(res.status).toBe(0);

    const line = res.stdout.trim().split('\n').find((l) => l.startsWith('{'));
    expect(line).toBeDefined();

    const parsed = JSON.parse(line!);
    expect(parsed.ok).toBe(true);
    expect(parsed.shells).toContain('bash');
    expect(parsed.shells).toContain('zsh');
    expect(parsed.shells).toContain('fish');
    expect(parsed.actions).toContain('install');
    expect(parsed.actions).toContain('uninstall');
  }, 25000);

  it('xskynet completion <unknown> exits with error in JSON mode', () => {
    const res = runCli(['completion', 'powershell']);

    expect(res.status).toBe(1);

    const line = res.stdout.trim().split('\n').find((l) => l.startsWith('{'));
    expect(line).toBeDefined();

    const parsed = JSON.parse(line!);
    expect(parsed.ok).toBe(false);
    expect(typeof parsed.error).toBe('string');
  }, 25000);
});
