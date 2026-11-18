import {readFile, writeFile, mkdir, rm} from "node:fs/promises";
import {dirname} from "node:path";
import {spawn} from "node:child_process";

// vinext and Next currently share generated type paths. Restore Next's files
// after packaging so switching deployment targets does not break TypeScript.
const paths = ["next-env.d.ts", ".next/types/routes.d.ts"];
const originals = await Promise.all(paths.map(async path => {
  try { return await readFile(path); }
  catch (error) { if (error.code === "ENOENT") return null; throw error; }
}));
try {
  process.exitCode = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["node_modules/cf/bin/cf", "deploy", "--dry-run"], {
      stdio: "inherit", env: process.env,
    });
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });
} finally {
  await Promise.all(paths.map(async (path, index) => {
    if (originals[index] === null) await rm(path, {force: true});
    else { await mkdir(dirname(path), {recursive: true}); await writeFile(path, originals[index]); }
  }));
}
