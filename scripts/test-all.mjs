import { execFileSync } from "node:child_process";
import { readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const buildRoot = join(repositoryRoot, ".e1-test-build");

rmSync(buildRoot, { recursive: true, force: true });
execFileSync(
  process.execPath,
  [
    fileURLToPath(new URL("../node_modules/typescript/bin/tsc", import.meta.url)),
    "-p",
    "tsconfig.tests.json",
  ],
  { cwd: repositoryRoot, stdio: "inherit" },
);

const testFiles = ["e1", "v0"].flatMap((suite) => {
  const directory = join(buildRoot, "tests", suite);
  return readdirSync(directory)
    .filter((name) => name.endsWith(".test.js"))
    .map((name) => join(directory, name));
});

execFileSync(process.execPath, ["--test", ...testFiles], {
  cwd: repositoryRoot,
  stdio: "inherit",
});
