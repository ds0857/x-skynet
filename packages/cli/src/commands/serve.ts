/**
 * serve.ts — xskynet serve
 *
 * Starts an AgentDaemon that keeps the process alive and sends periodic
 * heartbeats to the configured dashboard.  Configuration is read from
 * `.xskynet.json` in the current directory (or a path supplied via
 * --config) with environment variables taking precedence:
 *
 *   AGENT_ID        — overrides agentId
 *   DASHBOARD_URL   — overrides dashboardUrl
 *   API_KEY         — overrides apiKey
 *   HEARTBEAT_MS    — overrides heartbeatIntervalMs (ms)
 */

import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';

import { AgentDaemon, AgentDaemonConfig } from '@xskynet/core';

interface XSkynetJson {
  agentId?: string;
  dashboardUrl?: string;
  apiKey?: string;
  heartbeatIntervalMs?: number;
  plugins?: string[];
}

function loadConfigFile(configPath: string): XSkynetJson {
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(raw) as XSkynetJson;
  } catch {
    return {};
  }
}

export function registerServeCommand(program: Command): void {
  program
    .command('serve')
    .description('Start the agent daemon (heartbeat loop + graceful shutdown)')
    .option('--config <path>', 'path to .xskynet.json config file', '.xskynet.json')
    .option('--agent-id <id>', 'agent identifier (overrides config / env)')
    .option('--dashboard-url <url>', 'dashboard base URL (overrides config / env)')
    .option('--api-key <key>', 'heartbeat API key (overrides config / env)')
    .option('--heartbeat-ms <ms>', 'heartbeat interval in milliseconds')
    .action(async (options: {
      config: string;
      agentId?: string;
      dashboardUrl?: string;
      apiKey?: string;
      heartbeatMs?: string;
    }) => {
      const isJson = !!process.env.XSKYNET_JSON;

      // 1. Load file config (lowest priority)
      const configPath = path.resolve(process.cwd(), options.config);
      const fileConfig = loadConfigFile(configPath);

      // 2. Build final config (CLI flags > env vars > file config)
      const agentId =
        options.agentId ??
        process.env['AGENT_ID'] ??
        fileConfig.agentId;

      if (!agentId) {
        const msg = 'agentId is required. Set AGENT_ID, add agentId to .xskynet.json, or pass --agent-id.';
        if (isJson) {
          process.stdout.write(JSON.stringify({ error: msg }) + '\n');
        } else {
          console.error(chalk.red('✖ ' + msg));
        }
        process.exit(1);
      }

      const daemonConfig: AgentDaemonConfig = {
        agentId,
        dashboardUrl:
          options.dashboardUrl ??
          process.env['DASHBOARD_URL'] ??
          fileConfig.dashboardUrl,
        apiKey:
          options.apiKey ??
          process.env['API_KEY'] ??
          fileConfig.apiKey,
        heartbeatIntervalMs:
          options.heartbeatMs != null
            ? parseInt(options.heartbeatMs, 10)
            : process.env['HEARTBEAT_MS'] != null
            ? parseInt(process.env['HEARTBEAT_MS']!, 10)
            : fileConfig.heartbeatIntervalMs,
        plugins: fileConfig.plugins,
      };

      // 3. Start daemon
      const daemon = new AgentDaemon(daemonConfig);

      daemon.on('heartbeat', (info) => {
        if (isJson) {
          process.stdout.write(JSON.stringify({ event: 'heartbeat', ...info as object }) + '\n');
        } else {
          console.log(chalk.green('♥'), `heartbeat sent [${agentId}]`);
        }
      });

      daemon.on('error', (err) => {
        if (isJson) {
          process.stdout.write(JSON.stringify({ event: 'error', message: String(err) }) + '\n');
        } else {
          console.error(chalk.red('✖ daemon error:'), String(err));
        }
      });

      daemon.on('stop', () => {
        if (isJson) {
          process.stdout.write(JSON.stringify({ event: 'stop', agentId }) + '\n');
        } else {
          console.log(chalk.yellow('⏹'), `daemon stopped [${agentId}]`);
        }
        process.exit(0);
      });

      if (!isJson) {
        console.log(chalk.cyan('▶'), `Starting agent daemon: ${chalk.bold(agentId)}`);
        if (daemonConfig.dashboardUrl) {
          console.log(chalk.gray('  dashboard:'), daemonConfig.dashboardUrl);
        }
        console.log(chalk.gray('  heartbeat:'), `every ${daemonConfig.heartbeatIntervalMs ?? 30_000} ms`);
      }

      // 4. SIGINT / SIGTERM are handled inside AgentDaemon.start()
      await daemon.start();
    });
}
