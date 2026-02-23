import { Command } from 'commander';
import ora from 'ora';
import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

export function registerRunCommand(program: Command) {
  program
    .command('run')
    .argument('<agent-file>', 'agent source file to run')
    .description('Run a local agent from a source file')
    .option('--timeout <ms>', 'exit after given milliseconds')
    .action(async (agentFile: string, options: { timeout?: string }) => {
      const isJson = !!process.env.XSKYNET_JSON;

      try {
        const abs = path.resolve(process.cwd(), agentFile);
        if (!fs.existsSync(abs)) {
          const msg = `File not found: ${abs}`;
          if (isJson) {
            process.stdout.write(JSON.stringify({ ok: false, error: 'not_found', path: abs }) + '\n');
          } else {
            console.error(msg);
          }
          process.exitCode = 1;
          return;
        }

        const ext = path.extname(abs).toLowerCase();
        const spinner = isJson ? null : ora(`Starting agent: ${agentFile}`).start();

        let cmd = 'node';
        let args: string[] = [abs];
        let cwd = path.dirname(abs);

        if (ext === '.ts' || ext === '.tsx') {
          // Prefer project-local ts-node via pnpm exec
          cmd = 'pnpm';
          args = ['exec', 'ts-node', abs];
        }

        const child = spawn(cmd, args, { cwd, env: process.env, stdio: isJson ? ['ignore', 'pipe', 'pipe'] : 'inherit' });

        let timer: NodeJS.Timeout | undefined;
        if (options.timeout) {
          const ms = Number(options.timeout);
          if (!Number.isNaN(ms) && ms > 0) {
            timer = setTimeout(() => {
              child.kill('SIGTERM');
            }, ms);
          }
        }

        let out = '';
        let err = '';
        if (isJson) {
          child.stdout?.on('data', (d) => (out += String(d)));
          child.stderr?.on('data', (d) => (err += String(d)));
        }

        const code: number = await new Promise((resolve, reject) => {
          child.on('error', reject);
          child.on('close', (c) => resolve(c ?? 0));
        });
        if (timer) clearTimeout(timer);

        if (isJson) {
          process.stdout.write(JSON.stringify({ ok: code === 0, code, stdout: out, stderr: err }) + '\n');
        } else {
          if (code === 0) spinner!.succeed('Agent exit 0');
          else spinner!.fail(`Agent exited with code ${code}`);
        }

        if (code !== 0) process.exitCode = code;
      } catch (err: any) {
        if (isJson) {
          process.stdout.write(JSON.stringify({ ok: false, error: String(err?.message || err) }) + '\n');
        } else {
          ora().fail('Run failed');
          console.error(err?.stack || err?.message || err);
          process.exitCode = 1;
        }
      }
    });
}
