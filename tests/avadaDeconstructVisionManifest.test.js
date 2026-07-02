import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const deconstructRecipePath = path.join(repoRoot, "recipes", "avada-deconstruct", "recipe.yaml.eta");
const visionRecipePath = path.join(repoRoot, "recipes", "vision-handoff", "recipe.yaml.eta");

const read = filePath => fs.readFileSync(filePath, "utf8");

function renderRecipes() {
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), "ima-goose-avada-deconstruct-test-"));
  const result = spawnSync(process.execPath, ["scripts/install.ts", "--validate", "--dest", dest], {
    cwd: repoRoot,
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  return {
    dest,
    deconstruct: read(path.join(dest, "avada-deconstruct.yaml")),
    vision: read(path.join(dest, "vision-handoff.yaml")),
  };
}

test("avada-deconstruct routes visual handoff through a JSON manifest", () => {
  const source = read(deconstructRecipePath);

  assert.match(source, /\.tmp\/<slug>\/vision-handoff-manifest\.json/);
  assert.match(source, /Keep rich instructions in this\s+file instead of passing long\/multiline recipe params/);
  assert.match(source, /`fusionSectionCandidates`: order, adminLabel, opening-tag intent attrs/);
  assert.match(source, /Call `vision_handoff` with only a short manifest reference/);
  assert.match(source, /Do not pass the full brief, section table, or multiline image list through\s+recipe params/);
});

test("vision-handoff accepts a manifest_path parameter", () => {
  const source = read(visionRecipePath);

  assert.match(source, /`manifest_path` that points to a JSON manifest/);
  assert.match(source, /- key: manifest_path\n\s+input_type: string\n\s+requirement: optional\n\s+default: ""/);
  assert.match(source, /Read the JSON visual handoff manifest at this path and use it as the authoritative brief/);
  assert.match(source, /If the manifest or images are inaccessible, return STATUS: BLOCKED/);
});

test("rendered recipes preserve manifest handoff support", () => {
  const { deconstruct, vision } = renderRecipes();

  assert.match(deconstruct, /\.tmp\/<slug>\/vision-handoff-manifest\.json/);
  assert.match(deconstruct, /manifest_path: \/home\/eric\/IMA\/dev\/avada-builder\/\.tmp\/<slug>\/vision-handoff-manifest\.json/);
  assert.match(vision, /- key: manifest_path\n\s+input_type: string\n\s+requirement: optional\n\s+default: ""\n\s+description: "Path to a JSON visual handoff manifest/);
  assert.match(vision, /Read the JSON visual handoff manifest at this path/);
});
