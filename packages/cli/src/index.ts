#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { registerInitCommand } from './commands/init.js';
import { registerRunCommand } from './commands/run.js';
import { registerDevCommand } from './commands/dev.js';
import { registerLogsCommand } from './commands/logs.js';
import { registerAgentsCommand } from './commands/agents.js';
import { registerStatusCommand } from './commands/status.js';
import { registerServeCommand } from './commands/serve.js';
import { registerDoctorCommand } from './commands/doctor.js';
import { registerCompletionCommand } from './commands/completion.js';
import pkg from "../package.json" with { type: "json" };

// ─── Friendly error messages ─────────────────────────────────────────────────

const ERROR_MAP: Record<string, string> = {
  ENOENT:       '文件不存在',
  EACCES:       '权限不足，无法访问文件',
  EPERM:        '操作不被允许（权限问题）',
  ECONNREFUSED: '网络连接失败，请检查服务是否运行',
  ECONNRESET:   '网络连接被重置',
  ENOTFOUND:    '域名解析失败，请检查网络连接',
  ETIMEDOUT:    '连接超时，请稍后再试',
  EADDRINUSE:   '端口被占用，请更换端口',
  MODULE_NOT_FOUND: '模块未找到，请运行 pnpm install',
};

function getFriendlyMessage(err: any): string {
  const code: string | undefined = err?.code;
  if (code && ERROR_MAP[code]) {
    return `${ERROR_MAP[code]} (${code})`;
  }
  // ERR_MODULE_NOT_FOUND
  if (err?.code === 'ERR_MODULE_NOT_FOUND') {
    return ERROR_MAP['MODULE_NOT_FOUND'];
  }
  return err?.message || String(err);
}

function handleFatalError(err: any): void {
  const isJson = !!process.env.XSKYNET_JSON;
  if (isJson) {
    process.stdout.write(
      JSON.stringify({ ok: false, error: getFriendlyMessage(err), code: err?.code }) + '\n',
    );
  } else {
    const msg = getFriendlyMessage(err);
    console.error('\n' + chalk.red('✖ 发生错误：') + msg);
    if (process.env.XSKYNET_VERBOSE) {
      console.error(chalk.dim(err?.stack || ''));
    } else {
      console.error(chalk.dim('  运行时添加 --verbose 查看详细错误信息'));
    }
  }
  process.exitCode = 1;
}

// Catch unhandled promise rejections and uncaught exceptions globally
process.on('unhandledRejection', (reason: any) => {
  handleFatalError(reason);
});

process.on('uncaughtException', (err: any) => {
  handleFatalError(err);
});

// ─── Program setup ────────────────────────────────────────────────────────────

const program = new Command();

program
  .name('xskynet')
  .description('X-Skynet CLI — build, run, and manage local agents')
  .version(pkg.version)
  .option('-c, --config <path>', 'path to config file')
  .option('--verbose', 'enable verbose logging', false)
  .option('--json', 'output JSON lines (machine-readable)', false)
  .option('--no-color', 'disable colored output');

// Configure output before actions
program.hook('preAction', (thisCommand) => {
  const opts = thisCommand.opts();
  if (opts.color === false || process.env.NO_COLOR) {
    process.env.NO_COLOR = '1';
  }
  if (opts.json) {
    // In JSON mode, avoid spinners/ANSI output in commands
    process.env.XSKYNET_JSON = '1';
  }
  if (opts.verbose) {
    process.env.XSKYNET_VERBOSE = '1';
  }
});

registerInitCommand(program);
registerRunCommand(program);
registerDevCommand(program);
registerLogsCommand(program);
registerAgentsCommand(program);
registerStatusCommand(program);
registerServeCommand(program);
registerDoctorCommand(program);
registerCompletionCommand(program);

program
  .command('version')
  .description('Print version information')
  .action(() => {
    const version = pkg.version;
    const info = { version, node: process.version, platform: `${process.platform}-${process.arch}` };
    if (process.env.XSKYNET_JSON) {
      process.stdout.write(JSON.stringify(info) + '\n');
    } else {
      console.log(`${chalk.cyan('xskynet')} ${version}`);
      console.log(`node ${info.node}`);
      console.log(info.platform);
    }
  });

program.parseAsync(process.argv);
