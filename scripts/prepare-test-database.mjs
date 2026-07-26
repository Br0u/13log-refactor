import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveTestDatabaseEnv } from "./lib/test-database-guard.mjs";

export function resolvePrismaExecutable(platform = process.platform) {
  const executable = platform === "win32" ? "prisma.cmd" : "prisma";
  return fileURLToPath(
    new URL(`../node_modules/.bin/${executable}`, import.meta.url)
  );
}

const prismaExecutable = resolvePrismaExecutable();

export function main({ env = process.env, runCommand = spawnSync } = {}) {
  const testDatabaseUrl = resolveTestDatabaseEnv(env);
  const result = runCommand(prismaExecutable, ["migrate", "deploy"], {
    env: {
      ...env,
      DATABASE_URL: testDatabaseUrl,
      DIRECT_URL: testDatabaseUrl,
    },
    shell: false,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  return result;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const result = main();
  process.exitCode = result.status ?? 1;
}
