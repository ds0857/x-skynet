import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline/promises';
import { spawn } from 'node:child_process';

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
  // Node >= 18 supports fs.cp recursive
  // @ts-ignore
  if (fs.cp) {
    // @ts-ignore
    await fs.promises.cp(src, dest, { recursive: true });
  } else {
    // Fallback: manual copy
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

export function registerInitCommand(program: Command) {
  program
    .command('init')
    .argument('[name]', 'project name')
    .description('Initialize a new X-Skynet project from template')
    .action(async (name: string | undefined) => {
      const isJson = !!process.env.XSKYNET_JSON;
      try {
        if (!name && isJson) {
          process.stdout.write(JSON.stringify({ ok: false, error: 'name_required' }) + '\n');
          return;
        }

        if (!name) {
          name = await promptName();
        }
        const projName = sanitizeName(name || '');
        const targetDir = path.resolve(process.cwd(), projName);

        if (fs.existsSync(targetDir)) {
          const files = await fs.promises.readdir(targetDir);
          if (files.length > 0) {
            const msg = `Target directory already exists and is not empty: ${targetDir}`;
            if (isJson) {
              process.stdout.write(JSON.stringify({ ok: false, error: 'dir_exists', path: targetDir }) + '\n');
              return;
            }
            console.error(chalk.red(msg));
            process.exitCode = 1;
            return;
          }
        }

        const spinner = isJson ? null : ora('Creating project from template').start();
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

        if (!isJson) spinner!.text = 'Installing dependencies (pnpm install)';
        const install = spawn('pnpm', ['install'], { cwd: targetDir, stdio: isJson ? 'pipe' : 'inherit' });

        let installStdout = '';
        let installStderr = '';
        if (isJson) {
          install.stdout?.on('data', (d) => (installStdout += String(d)));
          install.stderr?.on('data', (d) => (installStderr += String(d)));
        }
        const code: number = await new Promise((resolve, reject) => {
          install.on('error', reject);
          install.on('close', (c) => resolve(c ?? 0));
        });
        if (code !== 0) {
          if (isJson) {
            process.stdout.write(JSON.stringify({ ok: false, step: 'install', code, stdout: installStdout, stderr: installStderr }) + '\n');
          } else {
            spinner!.fail('Dependency installation failed');
          }
          process.exitCode = 1;
          return;
        }

        if (isJson) {
          process.stdout.write(JSON.stringify({ ok: true, path: targetDir }) + '\n');
        } else {
          spinner!.succeed(chalk.green(`Project initialized at ${targetDir}`));
          console.log(`Next steps:\n  cd ${projName}\n  pnpm dev`);
        }
      } catch (err: any) {
        if (isJson) {
          process.stdout.write(JSON.stringify({ ok: false, error: String(err?.message || err) }) + '\n');
        } else {
          ora().fail('Initialization failed');
          console.error(chalk.red(err?.message || err));
          process.exitCode = 1;
        }
      }
    });
}
