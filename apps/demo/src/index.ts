import { createEngine } from '@xskynet/core';

async function main() {
  const engine = createEngine?.({});
  console.log('[demo] X-Skynet demo app booted', { engine: !!engine });
}

main().catch((err) => {
  console.error('[demo] fatal', err);
  process.exit(1);
});
