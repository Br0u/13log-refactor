import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const checkJsConfigPath = path.join(projectRoot, "tsconfig.checkjs.json");
const expectedEntryPoints = [
  "app/admin/actions.js",
  "app/api/admin/**/*.js",
  "lib/session.js",
  "lib/admin-session.js",
  "lib/auth.js",
  "lib/env.js",
];

describe("JavaScript type-check entry points", () => {
  it("starts checkJs from the admin and authentication boundaries", () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"),
    );
    const config = JSON.parse(fs.readFileSync(checkJsConfigPath, "utf8"));
    const typecheckCommands = packageJson.scripts.typecheck
      .split("&&")
      .map((command) => command.trim());

    expect(new Set(typecheckCommands)).toEqual(
      new Set([
        "tsc -p tsconfig.json",
        "tsc -p tsconfig.checkjs.json",
      ]),
    );
    expect(typecheckCommands).toHaveLength(2);
    expect(config).toMatchObject({
      extends: "./tsconfig.json",
      compilerOptions: {
        allowJs: true,
        checkJs: true,
        incremental: false,
      },
    });

    // These are root entry points. TypeScript also checks their imported dependency graph.
    expect(new Set(config.include)).toEqual(new Set(expectedEntryPoints));
    expect(config.include).toHaveLength(expectedEntryPoints.length);

    const configuredEntryPoints = config.include.join("\n");

    for (const broadOrUnrelatedEntryPoint of [
      "tests/",
      "components/",
      "public/",
      "scripts/",
      "app/**/*.js",
      "lib/**/*.js",
    ]) {
      expect(configuredEntryPoints).not.toContain(broadOrUnrelatedEntryPoint);
    }
  });
});
