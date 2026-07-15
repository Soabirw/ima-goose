import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const planRecipe = fs.readFileSync(path.join(repoRoot, "recipes", "plan", "recipe.yaml.eta"), "utf8");

test("plan recipe prioritizes goose-cycle task source before spec and open planning", () => {
  const taskBranch = planRecipe.indexOf("{% if task_project and task %}");
  const specBranch = planRecipe.indexOf("{% elif spec %}", taskBranch);
  const openBranch = planRecipe.indexOf("Open planning mode", specBranch);

  assert.notEqual(taskBranch, -1);
  assert.notEqual(specBranch, -1);
  assert.notEqual(openBranch, -1);
  assert.ok(taskBranch < specBranch);
  assert.ok(specBranch < openBranch);
});

test("plan recipe task branch treats Taskwarrior task as concrete source material", () => {
  assert.match(planRecipe, /The supplied Taskwarrior task is concrete planning source material/);
  assert.match(planRecipe, /Do not ask what to plan or where the source lives/);
});

test("plan recipe keeps open-planning wait language in the final fallback", () => {
  const openBranch = planRecipe.indexOf("Open planning mode");
  const finalEnd = planRecipe.indexOf("{% endif %}", openBranch);
  const waitLanguage = planRecipe.indexOf("wait for their input first", openBranch);

  assert.ok(openBranch > -1);
  assert.ok(finalEnd > openBranch);
  assert.ok(waitLanguage > openBranch && waitLanguage < finalEnd);
});

test("plan recipe keeps the detailed artifact but delegates concise handoffs to the shared contract", () => {
  assert.match(planRecipe, /implementation handoff to Vestige as a `plan`/);
  assert.match(planRecipe, /automatic\s+Serena-then-`docs\/` fallback/is);
  assert.match(planRecipe, /shared pointer-only handoff format/);
  assert.match(planRecipe, /Do not\s+add recipe-local execution guidance or duplicate the saved plan in the prompt/is);
  assert.doesNotMatch(planRecipe, /Ask clarifying questions before implementing the plan/);
  assert.doesNotMatch(planRecipe, /Use this plan as the source: <saved-reference>/);
});
