/**
 * init.ts — xskynet init [name]
 *
 * Interactive project scaffold wizard.
 * Uses @clack/prompts for a friendly TUI when running interactively.
 * Falls back to headless / JSON mode for CI.
 */
import { Command } from 'commander';
import * as clack from '@clack/prompts';
import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline/promises';
import { spawn } from 'node:child_process';

// ─── Helpers ────────────────────────────────────────────────────────────────

function sanitizeName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_.]/g, '-')
    .replace(/\.{2,}/g, '.')
    .replace(/-{2,}/g, '-')
    .replace(/^\./, '')
    .replace(/^_+/, '')
    || 'xskynet-project';
}

function findTemplateBasic(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(here, '../../..', 'templates', 'basic'), // repo root when running from source
    path.resolve(process.cwd(), 'templates', 'basic'),     // fallback when run inside repo
  ];
  for (const p of candidates) {
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) return p;
  }
  throw new Error('Cannot locate templates/basic directory. Set XSKYNET_TEMPLATES env or run inside repo.');
}

async function promptName(): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question('Project name: ');
    return answer.trim();
  } finally {
    rl.close();
  }
}

async function copyDir(src: string, dest: string) {
  await fs.promises.mkdir(dest, { recursive: true });
  if (fs.promises.cp) {
    await fs.promises.cp(src, dest, { recursive: true });
  } else {
    const entries = await fs.promises.readdir(src, { withFileTypes: true });
    for (const e of entries) {
      const s = path.join(src, e.name);
      const d = path.join(dest, e.name);
      if (e.isDirectory()) {
        await copyDir(s, d);
      } else if (e.isSymbolicLink()) {
        const link = await fs.promises.readlink(s);
        await fs.promises.symlink(link, d);
      } else {
        await fs.promises.copyFile(s, d);
      }
    }
  }
}

// ─── Available plugins ───────────────────────────────────────────────────────

const AVAILABLE_PLUGINS = [
  { value: 'shell',    label: 'shell    — run shell commands' },
  { value: 'memory',  label: 'memory   — key-value persistent store' },
  { value: 'telegram', label: 'telegram — Telegram bot integration' },
  { value: 'http',    label: 'http     — HTTP request executor' },
] as const;

// ─── Interactive wizard ──────────────────────────────────────────────────────

interface WizardAnswers {
  projName: string;
  plugins: string[];
  useTs: boolean;
  gitInit: boolean;
}

async function runInteractiveWizard(prefilledName?: string): Promise<WizardAnswers | null> {
  clack.intro(chalk.cyan(' xskynet init ') + chalk.dim('— create a new agent project'));

  // 1. Project name
  let projName: string;
  if (prefilledName) {
    projName = sanitizeName(prefilledName);
    clack.log.step(`Project name: ${chalk.bold(projName)}`);
  } else {
    const nameInput = await clack.text({
      message: 'Project name:',
      placeholder: 'my-agent',
      validate: (v) => (!v.trim() ? 'Name cannot be empty' : undefined),
    });
    if (clack.isCancel(nameInput)) {
      clack.cancel('Cancelled');
      return null;
    }
    projName = sanitizeName(String(nameInput));
  }

  // 2. Plugins (multiselect)
  const selectedPlugins = await clack.multiselect<string>({
    message: 'Choose plugins:',
    options: AVAILABLE_PLUGINS.map((p) => ({ value: p.value, label: p.label })),
    required: false,
  });
  if (clack.isCancel(selectedPlugins)) {
    clack.cancel('Cancelled');
    return null;
  }

  // 3. TypeScript?
  const useTs = await clack.confirm({
    message: 'Use TypeScript?',
    initialValue: true,
  });
  if (clack.isCancel(useTs)) {
    clack.cancel('Cancelled');
    return null;
  }

  // 4. Git init?
  const gitInit = await clack.confirm({
    message: 'Initialize a git repository?',
    initialValue: true,
  });
  if (clack.isCancel(gitInit)) {
    clack.cancel('Cancelled');
    return null;
  }

  return {
    projName,
    plugins: (selectedPlugins as string[]) ?? [],
    useTs: Boolean(useTs),
    gitInit: Boolean(gitInit),
  };
}

// ─── Scaffold actions ────────────────────────────────────────────────────────

async function scaffold(targetDir: string, projName: string, answers: WizardAnswers, isJson: boolean): Promise<boolean> {
  const spinner = isJson ? null : clack.spinner();

  // Copy template
  if (spinner) spinner.start('Scaffolding ' + projName + '...');
  const templateDir = findTemplateBasic();
  await copyDir(templateDir, targetDir);

  // Update package.json name
  const pkgPath = path.join(targetDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkgRaw = await fs.promises.readFile(pkgPath, 'utf8');
    const pkg = JSON.parse(pkgRaw);
    pkg.name = projName;
    await fs.promises.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  }

  // Update xskynet.config.ts agent name if present
  const cfgPath = path.join(targetDir, 'xskynet.config.ts');
  if (fs.existsSync(cfgPath)) {
    const cfgRaw = await fs.promises.readFile(cfgPath, 'utf8');
    const updated = cfgRaw.replace(/name:\s*'[^']*'/, `name: '${projName}'`);
    await fs.promises.writeFile(cfgPath, updated);
  }

  if (spinner) {
    spinner.stop('');
    clack.log.success(`Created ${chalk.cyan(projName + '/')}`);
  }

  // Install dependencies
  if (spinner) spinner.start('Installing dependencies (pnpm install)...');
  const install = spawn('pnpm', ['install'], { cwd: targetDir, stdio: isJson ? 'pipe' : 'pipe' });

  let installStdout = '';
  let installStderr = '';
  install.stdout?.on('data', (d) => (installStdout += String(d)));
  install.stderr?.on('data', (d) => (installStderr += String(d)));

  const code: number = await new Promise((resolve, reject) => {
    install.on('error', reject);
    install.on('close', (c) => resolve(c ?? 0));
  });

  if (code !== 0) {
    if (spinner) {
      spinner.stop('');
      clack.log.error('Dependency installation failed');
    }
    if (isJson) {
      process.stdout.write(JSON.stringify({ ok: false, step: 'install', code, stdout: installStdout, stderr: installStderr }) + '\n');
    }
    return false;
  }

  if (spinner) {
    spinner.stop('');
    clack.log.success('Installed dependencies');
  }

  // Git init
  if (answers.gitInit) {
    try {
      const git = spawn('git', ['init', '--quiet'], { cwd: targetDir, stdio: 'pipe' });
      await new Promise<void>((resolve) => git.on('close', () => resolve()));
      // Create .gitignore if missing
      const gitignorePath = path.join(targetDir, '.gitignore');
      if (!fs.existsSync(gitignorePath)) {
        await fs.promises.writeFile(gitignorePath, 'node_modules/\ndist/\n.xskynet/\n');
      }
      if (spinner) clack.log.success('Initialized git repository');
    } catch {
      if (spinner) clack.log.warn('git init skipped (git not found)');
    }
  }

  return true;
}

// ─── Command registration ────────────────────────────────────────────────────

export function registerInitCommand(program: Command) {
  program
    .command('init')
    .argument('[name]', 'project name')
    .description('Initialize a new X-Skynet project from template')
    .action(async (name: string | undefined) => {
      const isJson = !!process.env.XSKYNET_JSON;

      try {
        // ── JSON / CI mode ──────────────────────────────────────────
        if (isJson) {
          if (!name) {
            process.stdout.write(JSON.stringify({ ok: false, error: 'name_required' }) + '\n');
            return;
          }
          const projName = sanitizeName(name);
          const targetDir = path.resolve(process.cwd(), projName);

          if (fs.existsSync(targetDir)) {
            const files = await fs.promises.readdir(targetDir);
            if (files.length > 0) {
              process.stdout.write(JSON.stringify({ ok: false, error: 'dir_exists', path: targetDir }) + '\n');
              return;
            }
          }

          const answers: WizardAnswers = { projName, plugins: [], useTs: true, gitInit: false };
          const ok = await scaffold(targetDir, projName, answers, true);
          if (ok) {
            process.stdout.write(JSON.stringify({ ok: true, path: targetDir }) + '\n');
          } else {
            process.exitCode = 1;
          }
          return;
        }

        // ── Interactive wizard mode ─────────────────────────────────
        const answers = await runInteractiveWizard(name);
        if (!answers) {
          process.exitCode = 1;
          return;
        }

        const { projName } = answers;
        const targetDir = path.resolve(process.cwd(), projName);

        if (fs.existsSync(targetDir)) {
          const files = await fs.promises.readdir(targetDir);
          if (files.length > 0) {
            clack.log.error(`Directory already exists and is not empty: ${chalk.yellow(targetDir)}`);
            clack.outro(chalk.red('Initialization cancelled'));
            process.exitCode = 1;
            return;
          }
        }

        console.log('');
        console.log(chalk.bold('🚀 Scaffolding ' + projName + '...'));

        const ok = await scaffold(targetDir, projName, answers, false);
        if (!ok) {
          clack.outro(chalk.red('Initialization failed'));
          process.exitCode = 1;
          return;
        }

        clack.outro(
          chalk.green('✅ Ready!') +
          `  Run: ${chalk.cyan('cd ' + projName + ' && xskynet run workflow.yaml')}`,
        );
      } catch (err: any) {
        if (isJson) {
          process.stdout.write(JSON.stringify({ ok: false, error: String(err?.message || err) }) + '\n');
        } else {
          clack.log.error(err?.message || String(err));
          process.exitCode = 1;
        }
      }
    });
}
