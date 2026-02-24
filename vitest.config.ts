import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "coverage",
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
      include: ["src/**/*", "packages/**/*", "apps/**/*"],
      exclude: [
        "**/*.d.ts",
        "**/dist/**",
        "**/build/**",
        "**/node_modules/**",
        "**/scripts/**",
        "examples/**",
        // Exclude non-core packages/apps from coverage until tests exist
        "apps/**",
        "packages/cli/**",
        "packages/contracts/**",
        "packages/eslint-config/**",
        "packages/sdk-js/**",
        "packages/viewer/**",
      ],
    },
  },
});
