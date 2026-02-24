/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: false,
  env: { node: true, es2022: true, browser: true },
  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: "latest", sourceType: "module", project: false },
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/consistent-type-imports": ["warn", { prefer: "type-imports" }],
  },
  ignorePatterns: ["dist/", "node_modules/", "**/*.config.*", "**/*.d.ts"],
};
