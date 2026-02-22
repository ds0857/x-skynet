import { Command } from 'commander';
import ora from 'ora';

export function registerDevCommand(program: Command) {
  program
    .command('dev')
    .description('Start development mode with hot-reload')
    .action(async () => {
      const isJson = !!process.env.XSKYNET_JSON;
      if (isJson) {
        process.stdout.write(JSON.stringify({ ts: Date.now(), level: 'info', scope: 'dev', event: 'todo', msg: 'Start dev mode' }) + '\n');
        return;
      }
      const spinner = ora('TODO: Start dev mode (watch + restart)').start();
      try {
        await new Promise((r) => setTimeout(r, 200));
        spinner.succeed('TODO complete. Dev mode started.');
      } catch (err) {
        spinner.fail('Dev mode failed');
        throw err;
      }
    });
}
