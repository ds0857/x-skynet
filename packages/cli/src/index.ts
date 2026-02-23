#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { registerInitCommand } from './commands/init.js';
import { registerRunCommand } from './commands/run.js';
import { registerDevCommand } from './commands/dev.js';
import { registerLogsCommand } from './commands/logs.js';
import { registerAgentsCommand } from './commands/agents.js';
import { registerStatusCommand } from './commands/status.js';
import pkg from "../package.json" with { type: "json" };

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
