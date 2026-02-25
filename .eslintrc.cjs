/* Unified ESLint config for the whole monorepo */
module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2022: true,
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    '.pnpm-store/',
    'website/build/',
    'docs/.vitepress/cache',
    'docs/.vitepress/dist',
    'packages/dag-viewer/dist/',
    'packages/dag-viewer/node_modules/',
    'pnpm-lock.yaml',
  ],
  settings: {
    react: { version: 'detect' },
    'import/resolver': {
      typescript: true,
      node: true,
    },
  },
  overrides: [
    // TypeScript files
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      plugins: ['@typescript-eslint', 'import'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:import/recommended',
        'plugin:import/typescript',
        'prettier',
      ],
      rules: {
        // Prefer sorting/spacing of imports but keep baseline permissive otherwise
        'import/order': [
          'error',
          {
            'newlines-between': 'always',
            alphabetize: { order: 'asc', caseInsensitive: true },
          },
        ],
        // Rely on TS for undefined checks
        'no-undef': 'off',
        // Keep baseline permissive for initial adoption
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        'import/no-unresolved': 'off',
      },
    },
    // React (TSX/JSX)
    {
      files: ['**/*.tsx', '**/*.jsx'],
      plugins: ['react', 'react-hooks'],
      extends: ['plugin:react/recommended', 'plugin:react-hooks/recommended', 'prettier'],
      rules: {
        'react/react-in-jsx-scope': 'off',
        'react/prop-types': 'off',
      },
    },
    // JavaScript files
    {
      files: ['**/*.js', '**/*.jsx'],
      extends: ['eslint:recommended', 'plugin:import/recommended', 'prettier'],
      rules: {
        'no-unused-vars': 'off',
      },
    },
    // Test files
    {
      files: ['**/*.{test,spec}.{ts,tsx,js,jsx}'],
      env: { jest: true, node: true },
      plugins: ['jest'],
      extends: ['plugin:jest/recommended'],
      rules: {
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    // Config files
    {
      files: [
        '**/*.config.{js,ts,mjs,cjs}',
        '**/vite.config.{ts,js,mts,cts}',
        '**/jest.config.{js,ts}',
      ],
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
  ],
};
