import type { XSkynetPlugin } from '@xskynet/contracts';
import { HttpExecutor } from './executor.js';

export function createHttpPlugin(): XSkynetPlugin {
  return {
    name: '@xskynet/plugin-http',
    version: '0.1.0',
    description: 'HTTP request executor for X-Skynet',
    executors: [new HttpExecutor()],
  };
}

export const httpPlugin = createHttpPlugin();
export default httpPlugin;
