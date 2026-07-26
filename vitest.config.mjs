import { defineConfig } from "vitest/config";
import { DATABASE_INTEGRATION_TESTS } from "./vitest.db.config.mjs";

export default defineConfig({
  resolve: {
    extensions: [".mjs", ".jsx", ".js", ".mts", ".ts", ".tsx", ".json"],
  },
  test: {
    exclude: [
      "**/.git/**",
      "**/.next/**",
      "**/.next-local/**",
      "**/.next-prod/**",
      "**/.next-dev-*/**",
      "**/.playwright-cli/**",
      "**/.superpowers/**",
      "**/.worktrees/**",
      "**/node_modules/**",
      ...DATABASE_INTEGRATION_TESTS,
    ],
  },
});
