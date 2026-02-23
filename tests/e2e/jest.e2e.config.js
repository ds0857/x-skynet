/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  displayName: 'E2E Tests',
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  rootDir: '../../',
  moduleNameMapper: {
    '^@xskynet/contracts$': '<rootDir>/packages/contracts/src/index.ts',
    '^@xskynet/core$': '<rootDir>/packages/core/src/index.ts',
    '^@xskynet/cli$': '<rootDir>/packages/cli/src/index.ts',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: '<rootDir>/tsconfig.test.json',
      },
    ],
  },
  // Only run E2E tests
  testMatch: ['<rootDir>/tests/e2e/**/*.e2e.test.ts'],
  // E2E tests can take longer — default per-test timeout: 30 s
  testTimeout: 30000,
  verbose: true,
  // Don't collect coverage for E2E (it's integration, not unit coverage)
  collectCoverage: false,
  // Show test file names clearly
  reporters: ['default'],
};
