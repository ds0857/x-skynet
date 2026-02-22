import { Command } from 'commander';
import ora from 'ora';

export function registerRunCommand(program: Command) {
  program
    .command('run')
    .argument('<agent-file>', 'agent source file to run')
    .description('Run a local agent from a source file')
    .option('--timeout <ms>', 'exit after given milliseconds')
    .action(async (agentFile: string, options: { timeout?: string }) => {
      const isJson = !!process.env.XSKYNET_JSON;
      if (isJson) {
        process.stdout.write(JSON.stringify({ ts: Date.now(), level: 'info', scope: 'run', event: 'todo', msg: 'Run agent', data: { agentFile, options } }) + '\n');
        return;
      }
      const spinner = ora(`TODO: Run agent ${agentFile}`).start();
      try {
        await new Promise((r) => setTimeout(r, 200));
        spinner.succeed(`TODO complete. Agent executed: ${agentFile}`);
      } catch (err) {
        spinner.fail('Run failed');
        throw err;
      }
    });
}
