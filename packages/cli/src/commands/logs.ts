import { Command } from 'commander';

export function registerLogsCommand(program: Command) {
  program
    .command('logs')
    .argument('[agent-id]', 'agent id to tail logs for')
    .option('-f, --follow', 'follow log output', false)
    .description('View logs for a running/local agent')
    .action(async (agentId: string | undefined, opts: { follow: boolean }) => {
      const isJson = !!process.env.XSKYNET_JSON;
      const payload = { ts: Date.now(), level: 'info', scope: 'logs', event: 'todo', msg: 'View logs', data: { agentId, follow: opts.follow } };
      if (isJson) {
        process.stdout.write(JSON.stringify(payload) + '\n');
      } else {
        console.log(`[TODO] logs ${agentId ?? '(select)'}${opts.follow ? ' --follow' : ''}`);
      }
    });
}
