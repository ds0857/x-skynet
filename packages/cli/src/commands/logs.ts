import { Command } from 'commander';
import fs from 'node:fs';
import path from 'node:path';

export function registerLogsCommand(program: Command) {
  program
    .command('logs')
    .argument('[agent-id]', 'agent id to tail logs for')
    .option('-f, --follow', 'follow log output', false)
    .description('View logs for a running/local agent')
    .action(async (agentId: string | undefined, opts: { follow: boolean }) => {
      const isJson = !!process.env.XSKYNET_JSON;
      const logDir = path.resolve(process.cwd(), '.xskynet/logs');
      const file = agentId ? path.join(logDir, `${agentId}.log`) : path.join(logDir, 'xskynet.log');

      try {
        if (!fs.existsSync(file)) {
          const msg = `Log file not found: ${file}`;
          if (isJson) process.stdout.write(JSON.stringify({ ok: false, error: 'not_found', path: file }) + '\n');
          else console.error(msg);
          return;
        }

        if (isJson) {
          const content = fs.readFileSync(file, 'utf8');
          process.stdout.write(JSON.stringify({ ok: true, path: file, length: content.length }) + '\n');
          return;
        }

        // Non-JSON: stream or tail
        const readStream = fs.createReadStream(file, { encoding: 'utf8' });
        readStream.pipe(process.stdout);

        await new Promise<void>((resolve) => {
          readStream.on('end', () => resolve());
        });

        if (opts.follow) {
          fs.watchFile(file, { interval: 500 }, () => {
            const tail = fs.readFileSync(file, 'utf8');
            // naive follow: print full file on change
            process.stdout.write('\n' + tail);
          });
        }
      } catch (err: any) {
        if (isJson) process.stdout.write(JSON.stringify({ ok: false, error: String(err?.message || err) }) + '\n');
        else console.error(err?.message || err);
      }
    });
}
