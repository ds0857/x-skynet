import { Command } from 'commander';

export function registerAgentsCommand(program: Command) {
  const agents = program.command('agents').description('Manage local agent processes');

  agents
    .command('list')
    .description('List running agents')
    .action(async () => {
      const payload = { ts: Date.now(), level: 'info', scope: 'agents', event: 'todo', msg: 'List agents' };
      if (process.env.XSKYNET_JSON) {
        process.stdout.write(JSON.stringify(payload) + '\n');
      } else {
        console.log('[TODO] agents list');
      }
    });

  agents
    .command('status')
    .argument('<agent-id>', 'agent id')
    .description('Show agent status')
    .action(async (agentId: string) => {
      const payload = { ts: Date.now(), level: 'info', scope: 'agents', event: 'todo', msg: 'Agent status', data: { agentId } };
      if (process.env.XSKYNET_JSON) {
        process.stdout.write(JSON.stringify(payload) + '\n');
      } else {
        console.log(`[TODO] agents status ${agentId}`);
      }
    });

  agents
    .command('stop')
    .argument('<agent-id>', 'agent id')
    .description('Stop a running agent')
    .action(async (agentId: string) => {
      const payload = { ts: Date.now(), level: 'info', scope: 'agents', event: 'todo', msg: 'Stop agent', data: { agentId } };
      if (process.env.XSKYNET_JSON) {
        process.stdout.write(JSON.stringify(payload) + '\n');
      } else {
        console.log(`[TODO] agents stop ${agentId}`);
      }
    });
}
