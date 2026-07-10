import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const phases = ["cycle-start", "plan", "implement", "js-developer", "wp-developer", "test-writer", "code-review", "document-learn"];
const implementationPhases = ["implement", "js-developer", "wp-developer"];

function recipe(phase) {
  return read(`recipes/${phase}/recipe.yaml.eta`);
}

function subRecipeBlock(template) {
  return template.slice(0, template.indexOf("instructions: |"));
}

test("every lifecycle phase includes the shared contract after cycle context and exposes the receipt parameter", () => {
  for (const phase of phases) {
    const template = recipe(phase);
    const cycleContext = template.indexOf("instructions/cycle-task-context.md");
    const handoff = template.indexOf("instructions/hitl-phase-handoff.md");

    assert.ok(cycleContext >= 0, `${phase} includes cycle task context`);
    assert.ok(handoff > cycleContext, `${phase} includes handoff after cycle task context`);
    assert.match(template, /key: cycle_receipt_path\n    input_type: string\n    requirement: optional\n    default: ""/);
    assert.match(template, /Cycle receipt path: \{\{ cycle_receipt_path \}\}/);
  }
});

test("terminal implementation recipes retain only bounded visual delegation and immediate verification", () => {
  for (const phase of implementationPhases) {
    const template = recipe(phase);
    const children = subRecipeBlock(template);

    assert.match(children, /name: vision_handoff/);
    assert.doesNotMatch(children, /name: write_tests/);
    assert.doesNotMatch(children, /name: code_review/);
    assert.match(template, /instructions\/vision-handoff\.md/);
    assert.match(template, /terminal implementation phase/i);
    assert.match(template, /run immediate existing verification/i);
    assert.match(template, /inspect the resulting diff/i);
    assert.match(template, /Normal work saves `implementation`; `cycle_phase=resolve-review`\s+saves `resolution`/s);
    assert.match(template, /preserves every original `REVIEW-NNN` finding ID/i);
  }
});

test("shared contract defines all lifecycle types, receipt requirements, and safe handoff behavior", () => {
  const contract = read("shared/instructions/hitl-phase-handoff.md");

  assert.match(contract, /plan\|implementation\|test\|review\|resolution\|rereview\|decision\|closeout/);
  assert.match(contract, /cycle-start uses `decision`; plan uses `plan`; normal implementation uses `implementation`; test uses `test`; normal review uses `review`; resolve-review uses `resolution`; rereview uses `rereview`; document\/learn uses `closeout`/);
  assert.match(contract, /Cycle mode exists exactly when `task_project && task`/);
  assert.match(contract, /`cycle_receipt_path` is required/);
  assert.match(contract, /ok: true.*command: "vestige\.save".*data\.stored: true/s);
  assert.match(contract, /Save before status: prepare artifact, save it and produce the receipt, then—and only then—write a narrow successful Taskwarrior annotation\/tag/);
  assert.match(contract, /NOT SAVED TO VESTIGE/);
  assert.match(contract, /complete unsaved Markdown artifact/i);
  assert.match(contract, /Manual mode is every other case/);
  assert.match(contract, /Never mention `goose-cycle` in the manual handoff/);
  assert.match(contract, /conductor owns normal progression/i);
  assert.match(contract, /only as interrupted-cycle recovery guidance/i);
});

test("phase templates provide the expected lifecycle save semantics", () => {
  assert.match(recipe("cycle-start"), /Save normalized lifecycle-root artifact as `decision`.*before adding any Taskwarrior pointer/s);
  const planTemplate = recipe("plan");
  assert.match(planTemplate, /automatically save the complete\s+implementation handoff to Vestige as a `plan`; do not ask whether or where to\s+save it/s);
  assert.match(planTemplate, /Only after successful Vestige persistence, ask whether the user also wants:/);
  assert.doesNotMatch(planTemplate, /Save this plan to Serena memory or to a file/);
  assert.match(recipe("test-writer"), /Update Vestige with test summary, commands\/results, coverage gaps, and any production defects/i);
  assert.match(recipe("code-review"), /Normal review saves `review`; rereview saves `rereview`/);
  assert.match(recipe("document-learn"), /Save a `closeout` artifact with all IDs, acceptance outcome, docs\/memory updates, verification, risk, follow-ups, and final state/);
});

test("review instructions preserve independent verification, stable identity, and explicit-only scorecards", () => {
  const template = recipe("code-review");

  assert.match(template, /For EVERY Critical and Warning finding, issue a `verify` sub-recipe tool call/);
  assert.match(template, /Independent verify calls MUST be issued in parallel/);
  assert.match(template, /VERDICT: CONFIRMED \| WITHDRAWN \| PARTIAL/);
  assert.match(template, /WITHDRAWN → remove from report/);
  assert.match(template, /retained findings get stable `REVIEW-NNN` IDs/);
  assert.match(template, /Preserve original IDs through resolution\/rereview; new regressions get next unused ID/);
  assert.match(template, /Run scorecard only for explicit score, grade, health, or trend requests/);
  assert.match(template, /Save before Taskwarrior verdict tags/);
});

test("shared cycle task instructions keep Vestige persistence before Taskwarrior success state", () => {
  const instructions = read("shared/instructions/cycle-task-context.md");
  const normalized = instructions.toLowerCase();
  const prepare = normalized.indexOf("prepare the complete phase artifact");
  const save = normalized.indexOf("save it to vestige and produce the receipt");
  const taskwarrior = normalized.indexOf("only after save success, update narrow taskwarrior success annotations/tags");
  const failure = normalized.indexOf("on save failure, do not add success state");

  assert.ok(prepare >= 0 && prepare < save && save < taskwarrior && taskwarrior < failure);
});

test("installer renders all lifecycle recipes with the handoff and receipt prompt contract", () => {
  const destination = fs.mkdtempSync(path.join(os.tmpdir(), "ima-goose-rendered-recipes-"));
  try {
    const result = spawnSync(process.execPath, ["scripts/install.ts", "--dest", destination], {
      cwd: root,
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);

    const rendered = fs.readdirSync(destination)
      .filter((file) => file.endsWith(".yaml"))
      .map((file) => fs.readFileSync(path.join(destination, file), "utf8"));
    assert.equal(rendered.filter((content) => content.includes("# HITL Phase Handoff Contract")).length, phases.length);
    for (const content of rendered.filter((content) => content.includes("# HITL Phase Handoff Contract"))) {
      assert.match(content, /key: cycle_receipt_path/);
      assert.doesNotMatch(content, /<%/);
    }
  } finally {
    fs.rmSync(destination, { recursive: true, force: true });
  }
});
