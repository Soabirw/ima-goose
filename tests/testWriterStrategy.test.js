import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const source = read("recipes/test-writer/recipe.yaml.eta");
const standardMemory = (name) => read(".serena/memories/" + name + ".md");

function renderTestWriter() {
  const destination = fs.mkdtempSync(path.join(os.tmpdir(), "ima-goose-test-writer-strategy-"));
  const result = spawnSync(process.execPath, ["scripts/install.ts", "--validate", "--dest", destination], {
    cwd: root,
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  return { destination, rendered: fs.readFileSync(path.join(destination, "test-writer.yaml"), "utf8") };
}

function assertStrategyContract(content) {
  const baseline = content.indexOf("Load `unit-testing` before choosing a test level or framework");
  const contract = content.indexOf("Summarize the detected testing contract before editing");
  const domain = content.indexOf("Load the applicable domain testing skill");

  assert.ok(baseline >= 0, "loads unit-testing before strategy selection");
  assert.ok(contract > baseline, "summarizes testing contract after baseline strategy evidence");
  assert.ok(domain > contract, "loads the domain skill before final determination");
  assert.match(content, /all five standard memories as project evidence: `core`, `conventions`, `tech_stack`, `suggested_commands`, and `task_completion`/);
  assert.match(content, /Inspect only bounded repository evidence relevant to the source/);
  assert.match(content, /smallest project-supported test level sufficient to prove the approved behavior/);
  assert.match(content, /Browser-facing behavior does not automatically require Playwright/);
  assert.match(content, /In guided mode, report the exact evidence gap and ask before introducing/);
  assert.match(content, /In autonomous mode, report a blocker unless the approved source explicitly authorizes setup/);
  assert.match(content, /If project testing rules materially conflict, ask for resolution in guided mode; block with the specific conflict in autonomous mode/);
  assert.match(content, /Do not modify production code to make tests pass unless the caller explicitly authorizes that work/);
  assert.match(content, /Automatically save a `test` artifact/);
}

test("test-writer source declares evidence-first testing strategy", () => {
  assert.match(source, /version: "2\.3\.8"/);
  assertStrategyContract(source);
});

test("rendered test-writer recipe preserves evidence-first strategy", () => {
  const { destination, rendered } = renderTestWriter();
  try {
    assertStrategyContract(rendered);
    assert.doesNotMatch(rendered, /<%|%>/);
  } finally {
    fs.rmSync(destination, { recursive: true, force: true });
  }
});

test("migration helper emits testing-contract seeds without writing memory files", () => {
  const emptyRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ima-goose-serena-migration-"));
  try {
    const result = spawnSync("python3", [
      "skills/mcp-serena/scripts/migrate-context-to-serena.py",
      "--root", emptyRoot,
      "--include-org-standards",
    ], { cwd: root, encoding: "utf8" });

    assert.equal(result.status, 0, result.stderr || result.stdout);
    const output = result.stdout;
    for (const memory of ["conventions", "tech_stack", "suggested_commands", "task_completion", "memory_maintenance"]) {
      assert.match(output, new RegExp(`===== Serena memory: ${memory} =====`));
    }
    assert.match(output, /smallest supported level that proves the behavior/);
    assert.match(output, /configured test frameworks, dependency evidence, test configuration paths/);
    assert.match(output, /canonical targeted and broader test commands plus required environment prerequisites/);
    assert.match(output, /mandatory validation gates, expected signals, and unverified-path reporting/);
    assert.match(output, /testing-contract seeds as reusable guidance/);
    assert.deepEqual(fs.readdirSync(emptyRoot), []);
  } finally {
    fs.rmSync(emptyRoot, { recursive: true, force: true });
  }
});

test("shared Serena guidance makes all standard memories testing decision evidence", () => {
  const bootstrap = read("shared/instructions/serena-bootstrap.md");
  const skill = read("skills/mcp-serena/SKILL.md");

  assert.match(bootstrap, /Testing work\s+must read all five standard memories before choosing test level, framework,\s+commands, or infrastructure/);
  assert.match(skill, /Testing agents must consult all five standard memories before selecting strategy/);
  assert.match(skill, /allowed test levels, testing philosophy, and conditions for broader integration\/E2E work/);
  assert.match(skill, /installed test frameworks, configuration files, and available test infrastructure/);
  assert.match(skill, /canonical targeted\/full test commands, required runtime\/environment setup/);
  assert.match(skill, /Required validation gates, expected signals, reporting for unverified paths/);
});

test("tracked Serena memories describe ima-goose's local test contract without imposing it downstream", () => {
  assert.match(standardMemory("core"), /testing contract is defined by.*strategy constraints.*harness\/infrastructure.*canonical commands.*validation gates/s);
  assert.match(standardMemory("conventions"), /Test strategy is evidence-first: choose the smallest repository-supported level sufficient to prove approved behavior/);
  assert.match(standardMemory("tech_stack"), /Node's built-in test runner, with source\/static and rendered-recipe contract coverage/);
  assert.match(standardMemory("tech_stack"), /Playwright is a packaged skill for downstream projects, not an established.*verification framework/);
  assert.match(standardMemory("suggested_commands"), /Canonical testing paths: focused.*node --test tests\/<file>\.test\.js.*full.*npm test.*rendered-recipe validation/);
  assert.match(standardMemory("task_completion"), /focused source and rendered-recipe contract coverage/);
  assert.match(standardMemory("memory_maintenance"), /2026-07-17: refreshed all tracked standard memories so this repository's testing contract is discoverable/);
});
