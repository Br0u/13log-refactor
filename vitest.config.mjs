import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    extensions: [".mjs", ".jsx", ".js", ".mts", ".ts", ".tsx", ".json"],
  },
  test: {
    exclude: [
      "**/.git/**",
      "**/.next/**",
      "**/.next-local/**",
      "**/.next-dev-*/**",
      "**/.playwright-cli/**",
      "**/.superpowers/**",
      "**/.worktrees/**",
      "**/node_modules/**",
    ],
  },
});
