/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^@xskynet/contracts$': '<rootDir>/packages/contracts/src/index.ts',
    '^@xskynet/core$': '<rootDir>/packages/core/src/index.ts',
    '^@xskynet/cli$': '<rootDir>/packages/cli/src/index.ts',
    '^@x-skynet/plugin-interface$': '<rootDir>/packages/plugin-interface/src/index.ts',
    '^@xskynet/plugin-shell$': '<rootDir>/packages/plugin-shell/src/index.ts',
    '^@xskynet/plugin-memory$': '<rootDir>/packages/plugin-memory/src/index.ts',
    '^@xskynet/plugin-http$': '<rootDir>/packages/plugin-http/src/index.ts',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: './tsconfig.test.json',
      },
    ],
  },
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  collectCoverageFrom: [
    'packages/**/src/**/*.ts',
    '!packages/**/src/**/*.d.ts',
    '!packages/**/src/__tests__/**',
    // Exclude packages without unit tests yet (tested via e2e or Phase 3 backlog)
    '!packages/dag-viewer/src/**',
    '!packages/logger/src/**',
    '!packages/plugin-claude/src/**',
    '!packages/plugin-http/src/**',
    '!packages/plugin-telegram/src/**',
    '!packages/sdk-js/src/**',
    '!packages/cli/src/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 50,   // branch coverage is lower due to defensive error-handling code
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/examples/',
    '/tests/',
    // Server entry point — starts HTTP server at module level; not unit-testable
    'packages/web-ui/src/index\\.ts',
  ],
  setupFilesAfterEnv: [],
  verbose: true,
};
