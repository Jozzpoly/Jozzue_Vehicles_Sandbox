import { execFileSync } from "node:child_process";
import { readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

rmSync(new URL("../.e1-test-build", import.meta.url), {
  recursive: true,
  force: true,
});

const tsc = new URL("../node_modules/typescript/bin/tsc", import.meta.url);
const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
execFileSync(process.execPath, [fileURLToPath(tsc), "-p", "tsconfig.tests.json"], {
  cwd: repositoryRoot,
  stdio: "inherit",
});

const testsDirectory = join(repositoryRoot, ".e1-test-build", "tests", "e1");
const testFiles = readdirSync(testsDirectory)
  .filter((name) => name.endsWith(".test.js"))
  .map((name) => join(testsDirectory, name));

execFileSync(process.execPath, ["--test", ...testFiles], {
  cwd: repositoryRoot,
  stdio: "inherit",
});
