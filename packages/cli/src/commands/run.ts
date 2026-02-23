/**
 * run.ts — xskynet run <file>
 *
 * Supports two execution modes:
 *   1. YAML workflow  (.yaml / .yml)  — loaded, converted to a Plan, and
 *      executed directly by XSkynetRuntime (no sub-process).
 *   2. Script file    (.js / .ts)     — spawned as a child process (legacy).
 */
import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

import { XSkynetRuntime } from '@xskynet/core';
import { shellPlugin } from '@xskynet/plugin-shell';
import { loadWorkflowFile, workflowToPlan } from '../utils/workflow-loader.js';

export function registerRunCommand(program: Command) {
  program
    .command('run')
    .argument('<workflow-file>', 'YAML workflow file or agent script to run')
    .description('Run a workflow file (.yaml/.yml) or a local agent script')
    .option('--timeout <ms>', 'exit after given milliseconds')
    .option('--json', 'output result as JSON')
    .action(async (workflowFile: string, options: { timeout?: string; json?: boolean }) => {
      const isJson = options.json || !!process.env.XSKYNET_JSON;

      try {
        const abs = path.resolve(process.cwd(), workflowFile);

        if (!fs.existsSync(abs)) {
          const msg = `File not found: ${abs}`;
          if (isJson) {
            process.stdout.write(JSON.stringify({ ok: false, error: 'not_found', path: abs }) + '\n');
          } else {
            console.error(chalk.red('✖ ') + msg);
          }
          process.exitCode = 1;
          return;
        }

        const ext = path.extname(abs).toLowerCase();

        // ── YAML workflow mode ───────────────────────────────────────
        if (ext === '.yaml' || ext === '.yml') {
          await runYamlWorkflow(abs, isJson, options.timeout ? Number(options.timeout) : undefined);
          return;
        }

        // ── Legacy script mode ───────────────────────────────────────
        await runScript(abs, isJson, options.timeout ? Number(options.timeout) : undefined);
      } catch (err: any) {
        if (isJson) {
          process.stdout.write(JSON.stringify({ ok: false, error: String(err?.message || err) }) + '\n');
        } else {
          ora().fail('Run failed');
          console.error(chalk.red(err?.stack || err?.message || String(err)));
          process.exitCode = 1;
        }
      }
    });
}

// ────────────────────────────────────────────────────────────────────────────
// YAML workflow execution
// ────────────────────────────────────────────────────────────────────────────

async function runYamlWorkflow(abs: string, isJson: boolean, timeoutMs?: number): Promise<void> {
  const spinner = isJson ? null : ora(`Loading workflow: ${path.basename(abs)}`).start();

  let timer: NodeJS.Timeout | undefined;
  if (timeoutMs && timeoutMs > 0) {
    timer = setTimeout(() => {
      spinner?.fail('Workflow timed out');
      process.exitCode = 1;
      process.exit(1);
    }, timeoutMs);
  }

  try {
    // Parse YAML → WorkflowDefinition → Plan
    const wf = loadWorkflowFile(abs);
    const plan = workflowToPlan(wf);

    if (spinner) spinner.text = `Running workflow: ${chalk.bold(wf.name)}`;

    // Build runtime with shell + echo support
    const runtime = new XSkynetRuntime();
    runtime.use(shellPlugin);

    // Subscribe to events for live progress
    if (!isJson && spinner) {
      const sp = spinner;
      runtime.on('task.started', (e) => {
        const taskId = (e.payload as any)?.taskId ?? e.aggregateId ?? '';
        const task = plan.tasks.find((t) => t.id === taskId);
        if (task) sp.text = `  ${chalk.cyan('▶')} Task: ${task.name}`;
      });
      runtime.on('step.started', (e) => {
        const stepId = (e.payload as any)?.stepId ?? e.aggregateId ?? '';
        for (const task of plan.tasks) {
          const step = task.steps.find((s) => s.id === stepId);
          if (step) {
            sp.text = `    ${chalk.yellow('→')} Step: ${step.name}`;
            break;
          }
        }
      });
    }

    const result = await runtime.execute(plan);

    if (timer) clearTimeout(timer);

    if (isJson) {
      process.stdout.write(JSON.stringify({ ok: result.status === 'succeeded', status: result.status, tasks: result.tasks }) + '\n');
    } else {
      if (result.status === 'succeeded') {
        spinner!.succeed(chalk.green(`Workflow "${wf.name}" completed successfully ✓`));
        // Print task/step summary
        for (const task of result.tasks) {
          const icon = task.status === 'succeeded' ? chalk.green('✓') : chalk.red('✗');
          console.log(`  ${icon} ${task.name}`);
          for (const step of task.steps) {
            const sIcon = step.status === 'succeeded' ? chalk.green('·') : chalk.red('·');
            console.log(`      ${sIcon} ${step.name}`);
          }
        }
      } else {
        spinner!.fail(chalk.red(`Workflow "${wf.name}" failed (${result.status})`));
        if (result.error) console.error(chalk.red(result.error.message));
        process.exitCode = 1;
      }
    }
  } catch (err: any) {
    if (timer) clearTimeout(timer);
    spinner?.fail('Workflow execution failed');
    throw err;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Legacy script execution (spawn child process)
// ────────────────────────────────────────────────────────────────────────────

async function runScript(abs: string, isJson: boolean, timeoutMs?: number): Promise<void> {
  const ext = path.extname(abs).toLowerCase();
  const spinner = isJson ? null : ora(`Starting agent: ${path.basename(abs)}`).start();

  let cmd = 'node';
  let args: string[] = [abs];
  const cwd = path.dirname(abs);

  if (ext === '.ts' || ext === '.tsx') {
    cmd = 'pnpm';
    args = ['exec', 'ts-node', abs];
  }

  const child = spawn(cmd, args, {
    cwd,
    env: process.env,
    stdio: isJson ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });

  let timer: NodeJS.Timeout | undefined;
  if (timeoutMs && timeoutMs > 0) {
    timer = setTimeout(() => child.kill('SIGTERM'), timeoutMs);
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
}
