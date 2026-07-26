import { defineConfig } from "vitest/config";
import { DATABASE_INTEGRATION_TESTS } from "./vitest.db.config.mjs";

const nodeWebStorageFlags = process.allowedNodeEnvironmentFlags.has("--no-experimental-webstorage")
  ? ["--no-experimental-webstorage"]
  : [];

export default defineConfig({
  resolve: {
    extensions: [".mjs", ".jsx", ".js", ".mts", ".ts", ".tsx", ".json"],
  },
  test: {
    poolOptions: {
      forks: {
        execArgv: nodeWebStorageFlags,
      },
      threads: {
        execArgv: nodeWebStorageFlags,
      },
    },
    environmentOptions: {
      jsdom: {
        url: "http://localhost/",
      },
    },
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
