import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist");
await fs.rm(output, { recursive: true, force: true });
await fs.mkdir(output, { recursive: true });

async function copyTree(source, target, skip = () => false) {
  await fs.mkdir(target, { recursive: true });
  for (const entry of await fs.readdir(source, { withFileTypes: true })) {
    if (skip(entry.name, entry)) continue;
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);
    if (entry.isDirectory()) await copyTree(from, to, skip);
    else if (entry.isFile()) await fs.copyFile(from, to);
  }
}

for (const directory of ["auth", "authentication", "dashboards", "onboarding", "shared", "landingpage"]) {
  const source = path.join(root, directory);
  await copyTree(source, path.join(output, directory), (name) => name === "node_modules" || (directory === "landingpage" && name === "src"));
}

const landing = path.join(root, "landingpage");
for (const entry of await fs.readdir(landing, { withFileTypes: true })) {
  if (entry.isFile()) await fs.copyFile(path.join(landing, entry.name), path.join(output, entry.name));
}
for (const directory of ["images", "icons", "public"]) {
  const source = path.join(landing, directory);
  try { await copyTree(source, path.join(output, directory)); } catch (error) { if (error.code !== "ENOENT") throw error; }
}
console.log("Vercel static site prepared in dist/");