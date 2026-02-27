// ESLint Flat config for the whole monorepo
// - TypeScript-first, Node 20+
// - Integrates Prettier via eslint-config-prettier
// - Keeps rules lightweight to avoid false positives across packages

import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import importPlugin from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";
import configPrettier from "eslint-config-prettier";

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  // Global ignores (apply to all files)
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "coverage/**",
      "website/build/**",
      "**/.next/**",
      "**/.turbo/**",
      "**/out/**",
      "**/*.min.*",
      "**/generated/**",
      "pnpm-lock.yaml",
      "CHANGELOG.md",
    ],
  },

  // Base language options
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
  },

  // JS recommended
  js.configs.recommended,

  // TS recommended (no type-checking by default to keep it fast and config-free)
  ...tseslint.configs.recommended,

  // Common rules and plugins
  {
    plugins: {
      import: importPlugin,
      "unused-imports": unusedImports,
    },
    rules: {
      // General hygiene
      "no-console": "off",
      "no-debugger": "error",

      // Import ordering
      "import/order": [
        "warn",
        {
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
          groups: [["builtin", "external"], "internal", ["parent", "sibling", "index"], "object", "type"],
        },
      ],

      // Unused imports/vars
      "unused-imports/no-unused-imports": "warn",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },

  // Test files (Jest globals)
  {
    files: ["**/*.test.{ts,tsx,js,jsx}", "**/*.spec.{ts,tsx,js,jsx}", "tests/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      "no-undef": "off",
    },
  },

  // Let Prettier handle formatting concerns
  configPrettier,
];
