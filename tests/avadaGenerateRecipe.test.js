import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const recipePath = path.join(repoRoot, "recipes", "avada-generate", "recipe.yaml.eta");
const recipeCatalogPath = path.join(repoRoot, "docs", "RECIPES-AND-SKILLS.md");
const fusionConverterSkillPath = path.join(repoRoot, "skills", "avada-fusion-converter", "SKILL.md");

function readRecipeSource() {
  return fs.readFileSync(recipePath, "utf8");
}

function readRecipeCatalog() {
  return fs.readFileSync(recipeCatalogPath, "utf8");
}

function renderRecipes() {
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), "ima-goose-avada-generate-test-"));
  const result = spawnSync(process.execPath, ["scripts/install.ts", "--validate", "--dest", dest], {
    cwd: repoRoot,
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  return {
    dest,
    rendered: fs.readFileSync(path.join(dest, "avada-generate.yaml"), "utf8"),
  };
}

test("avada-generate defaults to capture-map-emit and exposes catalog mapping parameters", () => {
  const source = readRecipeSource();

  assert.match(source, /description: "Capture selected Claude Design pages, map sections to the Avada\/Fusion reference catalog, and emit lean\/full Fusion documents\."/);
  assert.match(source, /- key: input\n\s+input_type: string\n\s+requirement: optional\n\s+default: ""\n\s+description: "Claude Design React\/Babel export folder path\. Required for capture-map-emit and capture-only; optional for mode=map-emit when out already contains artifacts\."/);
  assert.match(source, /If mode is capture-map-emit or capture-only and\s+input is empty, stop with the blocker that input is required for capture modes\./);
  assert.match(source, /- key: catalog\n\s+input_type: string\n\s+requirement: optional\n\s+default: ""/);
  assert.match(source, /- key: mode\n\s+input_type: select\n\s+requirement: optional\n\s+default: "capture-map-emit"/);
  assert.match(source, /- capture-map-emit\n\s+- map-emit\n\s+- capture-only/);
  assert.match(source, /In capture-map-emit\s+mode, capture selected pages, delegate screenshots to vision_handoff, map\s+sections to the reference catalog, and emit the requested Fusion variants from\s+one mapping pass\./);
});

test("avada-generate requires brand and packaged Fusion converter skills but forbids Bootstrap", () => {
  const source = readRecipeSource();
  const fusionSkill = fs.readFileSync(fusionConverterSkillPath, "utf8");

  assert.match(source, /Load `ima-brand` before choosing brand copy\/colors or emitting visible IMA copy\./);
  assert.match(source, /Load `avada-fusion-converter` before catalog mapping or lean\/full Fusion emission\./);
  assert.match(fusionSkill, /name: avada-fusion-converter/);
  assert.match(fusionSkill, /Avada\/Fusion converter rules/);
  assert.match(source, /Do \*\*not\*\* load or use `ima-bootstrap`/);
  assert.match(source, /Visible `Honest Medicine` occurrences must become\s+`Honest Medicine™`/);
  assert.doesNotMatch(source, /Fusion generation modes are out of scope/);
  assert.doesNotMatch(source, /capture-only MVP/i);
});

test("avada-generate maps every visible section and reports unmatched sections", () => {
  const source = readRecipeSource();

  assert.match(source, /Create one ordered mapping row for every visible design section:/);
  assert.match(source, /`status` — `matched`, `unmatched`, or `blocked`/);
  assert.match(source, /Prefer a conservative `unmatched` row over a forced poor match\./);
  assert.match(source, /Flag unmatched sections explicitly in a mapping report; never silently drop them\./);
  assert.match(source, /Never present partial output as complete\./);
});

test("avada-generate emits requested Fusion variants from the same mapping pass", () => {
  const source = readRecipeSource();

  assert.match(source, /For each selected page, emit the requested\s+Fusion variants from the same mapping pass/);
  assert.match(source, /`variants=full-only` emit only their\s+named variant\./);
  assert.doesNotMatch(source, /emit BOTH lean and\s+full Fusion variants from the same mapping pass unless `variants=lean-only`/);
  assert.match(source, /Start from the same mapping rows for every requested variant\./);
  assert.match(source, /If `variants` is `ab` or `full-only`, create the \*\*full\*\* variant by copying\s+each matched section's catalog `verbatimBlock`\./);
  assert.match(source, /If `variants` is `ab` or `lean-only`, create the \*\*lean\*\* variant by copying\s+each matched section's catalog `leanBlock`\./);
  assert.match(source, /`<page-slug>-mapping\.json` — complete mapping report, including unmatched rows/);
  assert.match(source, /`<page-slug>-lean\.fusion` — paste-ready lean Fusion document for matched sections when `variants` is `ab` or `lean-only`/);
  assert.match(source, /`<page-slug>-full\.fusion` — paste-ready full-attribute Fusion document for matched sections when `variants` is `ab` or `full-only`/);
});

test("avada-generate documents the A/B validation loop and lean-only toggle", () => {
  const source = readRecipeSource();

  assert.match(source, /- key: variants\n\s+input_type: select\n\s+requirement: optional\n\s+default: "ab"/);
  assert.match(source, /description: "Fusion output variants to emit\. Use lean-only only after lean output has been validated in Avada preview\."/);
  assert.match(source, /- ab\n\s+- lean-only\n\s+- full-only/);
  assert.match(source, /`variants` controls Fusion document emission:\s+- `ab` \(default\): emit both lean and full-attribute Fusion for A\/B validation\.\s+- `lean-only`: emit only lean Fusion after human Avada-preview validation shows\s+lean import is sufficient; do not write or summarize a full-attribute output\.\s+- `full-only`: emit only full-attribute Fusion for fallback\/debug comparison\./);
  assert.match(source, /paste generated Fusion into Avada preview,\s+compare lean vs full import behavior, report the result back in chat/);
  assert.match(source, /Ask the human to report back whether Avada imported the lean tags cleanly,\s+whether it back-filled defaults oddly, and which visible section diverged\./);
  assert.match(source, /If `variants=lean-only`, explicitly state that full-attribute output was\s+intentionally suppressed/);
  assert.match(source, /Use variants=ab for the A\/B lean-vs-full validation loop;\s+use variants=lean-only only after Avada preview validation shows lean output is\s+sufficient\./);
});

test("rendered avada-generate recipe preserves the generation contract", () => {
  const { rendered } = renderRecipes();

  assert.match(rendered, /title: "Avada Generate"/);
  assert.match(rendered, /default: "capture-map-emit"/);
  assert.match(rendered, /default: "ab"/);
  assert.match(rendered, /options:\n\s+- ab\n\s+- lean-only\n\s+- full-only/);
  assert.match(rendered, /Reference library root: `\/home\/eric\/IMA\/dev\/avada-builder\/reference-library`/);
  assert.match(rendered, /sfw npm exec --package=ajv-cli@5 -- ajv --spec=draft2020 validate/);
  assert.match(rendered, /If `variants` is `ab` or `full-only`, create the \*\*full\*\* variant/);
  assert.match(rendered, /If `variants` is `ab` or `lean-only`, create the \*\*lean\*\* variant/);
  assert.match(rendered, /full Fusion path or `suppressed by variants`/);
  assert.match(rendered, /requested variants/);
  assert.match(rendered, /For each selected page, emit the requested\s+Fusion variants from the same mapping pass/);
  assert.match(rendered, /`variants=full-only` emit only their\s+named variant\./);
  assert.match(rendered, /variants=lean-only only after Avada preview validation shows lean output is\s+sufficient/);
  assert.match(rendered, /Flag unmatched sections explicitly in a mapping report; never silently drop them\./);
  assert.doesNotMatch(rendered, /Fusion generation is out of scope/);
});

test("recipe catalog advertises A/B validation and optional lean-only emission", () => {
  const catalog = readRecipeCatalog();

  assert.match(
    catalog,
    /\| `avada-generate` \| Avada\/Fusion generation recipe: selected Claude Design pages -> DOM\/screenshots\/vision context, catalog section mapping, lean\/full A\/B validation, and optional lean-only emission \| HIGH \|/,
  );
});
