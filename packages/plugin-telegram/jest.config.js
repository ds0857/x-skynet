/**
 * Jest configuration for @xskynet/plugin-telegram
 * Inherits root monorepo settings, scoped to this package.
 */

import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../..');

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  rootDir: repoRoot,
  roots: [`${repoRoot}/packages/plugin-telegram/tests`],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@xskynet/contracts$': `${repoRoot}/packages/contracts/src/index.ts`,
    '^@xskynet/core$': `${repoRoot}/packages/core/src/index.ts`,
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: `${repoRoot}/tsconfig.test.json`,
      },
    ],
  },
  verbose: true,
};
