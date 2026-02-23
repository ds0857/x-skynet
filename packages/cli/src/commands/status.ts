import { Command } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import ora from 'ora';
import chalk from 'chalk';

export function registerStatusCommand(program: Command) {
  program
    .command('status')
    .description('Show local X-Skynet runtime status')
    .action(async () => {
      const isJson = !!process.env.XSKYNET_JSON;
      const statePath = path.resolve(process.cwd(), '.xskynet/state.json');

      try {
        if (isJson) {
          // JSON mode: structured output or empty
          if (fs.existsSync(statePath)) {
            const raw = fs.readFileSync(statePath, 'utf8');
            const state = JSON.parse(raw);
            process.stdout.write(JSON.stringify({ ok: true, path: statePath, state }) + '\n');
          } else {
            process.stdout.write(JSON.stringify({ ok: true, path: statePath, state: null }) + '\n');
          }
          return;
        }

        const spinner = ora('Reading local runtime state').start();
        await new Promise((r) => setTimeout(r, 50));

        if (!fs.existsSync(statePath)) {
          spinner.stop();
          console.log(chalk.yellow('No local runtime state found.'));
          console.log(`Create ${chalk.cyan('.xskynet/state.json')} to track local agents.`);
          return;
        }

        const raw = fs.readFileSync(statePath, 'utf8');
        const state = JSON.parse(raw);
        const running = Array.isArray(state.agents) ? state.agents.filter((a: any) => a?.status === 'running').length : 0;

        spinner.succeed('Status loaded');
        console.log(`${chalk.cyan('Agents running')}: ${running}`);
        if (Array.isArray(state.agents) && state.agents.length) {
          for (const a of state.agents) {
            console.log(`- ${a.id ?? 'unknown'}: ${a.status ?? 'unknown'}`);
          }
        }
      } catch (err: any) {
        if (isJson) {
          process.stdout.write(JSON.stringify({ ok: false, error: String(err?.message || err) }) + '\n');
        } else {
          console.error(chalk.red('Failed to read status:'), err?.message || err);
          process.exitCode = 1;
        }
      }
    });
}
