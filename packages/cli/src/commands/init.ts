import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';

export function registerInitCommand(program: Command) {
  program
    .command('init')
    .argument('[name]', 'project name')
    .description('Initialize a new X-Skynet project from template')
    .action(async (name: string | undefined) => {
      const isJson = !!process.env.XSKYNET_JSON;
      if (isJson) {
        process.stdout.write(JSON.stringify({ ts: Date.now(), level: 'info', scope: 'init', event: 'todo', msg: 'Initialize project', data: { name } }) + '\n');
        return;
      }
      const spinner = ora('TODO: Initialize project from template').start();
      try {
        await new Promise((r) => setTimeout(r, 200));
        spinner.succeed(chalk.green(`TODO complete. Project ${name ?? '(no name)'} initialized.`));
      } catch (err) {
        spinner.fail('Initialization failed');
        throw err;
      }
    });
}
