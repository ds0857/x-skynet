/**
 * doctor.ts — xskynet doctor
 *
 * Environment health-check command.
 * Verifies Node.js version, package manager, config file, plugins, and
 * the ~/.xskynet/ state directory.
 */
import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';

// ─── Check result ─────────────────────────────────────────────────────────

type Severity = 'ok' | 'warn' | 'error';

interface CheckResult {
  label: string;
  detail: string;
  severity: Severity;
}

function ok(label: string, detail: string): CheckResult {
  return { label, detail, severity: 'ok' };
}

function warn(label: string, detail: string): CheckResult {
  return { label, detail, severity: 'warn' };
}

function error(label: string, detail: string): CheckResult {
  return { label, detail, severity: 'error' };
}

// ─── Individual checks ────────────────────────────────────────────────────

/** Check Node.js version >= 18 */
function checkNode(): CheckResult {
  const raw = process.version; // e.g. "v20.11.0"
  const match = raw.match(/^v?(\d+)/);
  const major = match ? parseInt(match[1], 10) : 0;
  if (major >= 18) {
    return ok('Node.js', `${raw} (required: >=18)`);
  }
  return error('Node.js', `${raw} — requires Node.js >= 18`);
}

/** Check if pnpm is installed */
function checkPnpm(): CheckResult {
  try {
    const result = spawnSync('pnpm', ['--version'], { encoding: 'utf8', timeout: 5000 });
    if (result.status === 0 && result.stdout) {
      const version = result.stdout.trim();
      return ok('pnpm', `${version} found`);
    }
  } catch {
    // fall through
  }
  return warn('pnpm', 'not found — run: npm install -g pnpm');
}

/** Check if xskynet config file exists in cwd */
function checkConfig(): CheckResult {
  const candidates = [
    'xskynet.config.ts',
    'xskynet.config.js',
    'xskynet.config.mjs',
    'xskynet.config.cjs',
  ];
  for (const f of candidates) {
    const full = path.resolve(process.cwd(), f);
    if (fs.existsSync(full)) {
      return ok('xskynet config', f);
    }
  }
  return warn('xskynet config', 'not found in current directory (run from project root)');
}

/** Check known plugin env vars */
function checkPlugins(): CheckResult[] {
  const results: CheckResult[] = [];

  // shell — always available, no env needed
  results.push(ok('plugin-shell', 'built-in, no env required'));

  // memory — no env needed
  results.push(ok('plugin-memory', 'built-in, no env required'));

  // telegram — needs TELEGRAM_TOKEN
  const telegramToken = process.env.TELEGRAM_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  if (telegramToken) {
    results.push(ok('plugin-telegram', 'TELEGRAM_TOKEN set ✓'));
  } else {
    results.push(warn('plugin-telegram', 'TELEGRAM_TOKEN not set (optional)'));
  }

  // http — no env needed
  results.push(ok('plugin-http', 'no env required'));

  return results;
}

/** Check ~/.xskynet/ state directory is writable */
function checkStateDir(): CheckResult {
  const stateDir = path.join(os.homedir(), '.xskynet');
  try {
    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true });
    }
    // Write a probe file to test writability
    const probe = path.join(stateDir, '.write-probe');
    fs.writeFileSync(probe, 'ok');
    fs.unlinkSync(probe);
    return ok('~/.xskynet/', 'state directory writable');
  } catch (e: any) {
    return error('~/.xskynet/', `not writable — ${e?.message || e}`);
  }
}

// ─── Formatting ─────────────────────────────────────────────────────────────

function formatCheck(c: CheckResult, noColor: boolean): string {
  let icon: string;
  let colorFn: (s: string) => string;

  if (c.severity === 'ok') {
    icon = '✅';
    colorFn = noColor ? (s) => s : chalk.green;
  } else if (c.severity === 'warn') {
    icon = '⚠️ ';
    colorFn = noColor ? (s) => s : chalk.yellow;
  } else {
    icon = '❌';
    colorFn = noColor ? (s) => s : chalk.red;
  }

  const label = noColor ? c.label : colorFn(c.label);
  return `${icon} ${label}: ${c.detail}`;
}

// ─── Command ─────────────────────────────────────────────────────────────────

export function registerDoctorCommand(program: Command) {
  program
    .command('doctor')
    .description('Check environment and configuration for X-Skynet')
    .action(() => {
      const isJson = !!process.env.XSKYNET_JSON;
      const noColor = !!process.env.NO_COLOR || !chalk.level;

      const checks: CheckResult[] = [
        checkNode(),
        checkPnpm(),
        checkConfig(),
        ...checkPlugins(),
        checkStateDir(),
      ];

      if (isJson) {
        const summary = {
          ok: checks.every((c) => c.severity !== 'error'),
          checks: checks.map((c) => ({ label: c.label, detail: c.detail, severity: c.severity })),
        };
        process.stdout.write(JSON.stringify(summary) + '\n');
        return;
      }

      // Human-readable output
      console.log('');
      console.log(chalk.bold('xskynet doctor') + chalk.dim(' — environment check'));
      console.log('');

      for (const c of checks) {
        console.log(formatCheck(c, noColor));
      }

      const errors = checks.filter((c) => c.severity === 'error');
      const warnings = checks.filter((c) => c.severity === 'warn');

      console.log('');
      if (errors.length > 0) {
        console.log(chalk.red(`❌ ${errors.length} error(s) found — please fix before running xskynet`));
        process.exitCode = 1;
      } else if (warnings.length > 0) {
        console.log(chalk.yellow(`⚠️  ${warnings.length} warning(s) — xskynet should work, but some features may be unavailable`));
      } else {
        console.log(chalk.green('✅ All checks passed — environment looks great!'));
      }
    });
}
