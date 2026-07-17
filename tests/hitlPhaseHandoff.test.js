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

test("shared contract defines lifecycle types, pointer-only handoffs, and receipt-gated fallback", () => {
  const contract = read("shared/instructions/hitl-phase-handoff.md");

  assert.match(contract, /plan\|implementation\|test\|review\|resolution\|rereview\|decision\|closeout/);
  assert.match(contract, /cycle-start uses `decision`; plan uses `plan`; normal implementation uses `implementation`; test uses `test`; normal review uses `review`; resolve-review uses `resolution`; rereview uses `rereview`; document\/learn uses `closeout`/);
  assert.match(contract, /## Artifact vs\. Prompt/);
  assert.match(contract, /persisted phase artifact is the detailed source of truth/i);
  assert.match(contract, /handoff prompt is a compact pointer/i);
  assert.match(contract, /next recipe alias[\s\S]*one-line task title or outcome[\s\S]*lifecycle key[\s\S]*artifact reference[\s\S]*`REVIEW-NNN` IDs/s);
  assert.match(contract, /Do not restate acceptance criteria, detailed scope\/non-goals, changed or expected files, implementation strategy/i);
  assert.match(contract, /Do not give procedural instructions that tell the destination recipe how to plan, implement, test, review, resolve, or document/i);
  assert.match(contract, /Never embed the complete artifact in a handoff prompt/i);
  assert.match(contract, /When a completed phase recommends a concrete next phase, automatically emit/i);
  assert.match(contract, /Vestige is the primary lifecycle store/i);
  assert.match(contract, /task-scoped Serena memory[\s\S]*Markdown under `docs\//s);
  assert.match(contract, /only where the current phase's own write boundary permits each destination/i);
  assert.match(contract, /Phase-local safety boundaries take precedence over this fallback order/i);
  assert.match(contract, /When no permitted persistence destination succeeds, report the failed Vestige save and block the handoff/i);
  assert.match(contract, /On a cycle save failure[\s\S]*does not produce a valid Vestige receipt[\s\S]*advance conductor state/s);
  assert.match(contract, /Cycle mode exists exactly when `task_project && task`/);
  assert.match(contract, /`cycle_receipt_path` is required/);
  assert.match(contract, /ok: true.*command: "vestige\.save".*data\.stored: true/s);
  assert.match(contract, /Save before status: prepare artifact, save it and produce the receipt, then—and only then—write a narrow successful Taskwarrior annotation\/tag/);
  assert.match(contract, /Manual mode is every other case/);
  assert.match(contract, /Never mention `goose-cycle` in the manual handoff/);
  assert.match(contract, /conductor owns normal progression/i);
  assert.match(contract, /only as interrupted-cycle recovery guidance/i);
  assert.match(contract, /implementation-grade,\s+reviewer-decided remediation/i);
  assert.match(contract, /No resolution handoff is\s+permitted while product, architecture, security, API, data-flow, error-handling,\s+or test decisions remain unresolved/is);
  assert.match(contract, /`REQUEST CHANGES` means remediation is ready\s+to execute/i);
  assert.match(contract, /Resolution agents reject incomplete\s+remediation rather than infer missing decisions/i);
});

test("phase templates provide the expected lifecycle save semantics", () => {
  assert.match(recipe("cycle-start"), /Save normalized lifecycle-root artifact as `decision`.*before adding any Taskwarrior pointer/s);
  const planTemplate = recipe("plan");
  assert.match(planTemplate, /automatically save the complete\s+implementation handoff to Vestige as a `plan`; do not ask whether or where to\s+save it/s);
  assert.match(planTemplate, /After successful Vestige persistence, optionally offer user-requested copies:/);
  assert.match(planTemplate, /On a manual Vestige failure, follow the shared contract's automatic\s+Serena-then-`docs\/` fallback/is);
  assert.doesNotMatch(planTemplate, /Save this plan to Serena memory or to a file/);
  assert.match(recipe("test-writer"), /Update Vestige with test summary, commands\/results, coverage gaps, and any production defects/i);
  assert.match(recipe("code-review"), /Normal review saves `review`; rereview saves `rereview`/);
  assert.match(recipe("document-learn"), /Save a `closeout` artifact with all IDs, acceptance outcome, docs\/memory updates, verification, risk, follow-ups, and final state/);
});

test("document-learn defaults to a flexible human-readable closeout", () => {
  const template = recipe("document-learn");

  assert.match(template, /default to concise, natural Markdown or prose/i);
  assert.match(template, /adapt it to\s+the user's request and the destinations actually updated/is);
  assert.match(template, /human or invoking automation explicitly requests it or supplies\s+that schema/is);
  assert.match(template, /wiki|Confluence|third-party/i);
  assert.doesNotMatch(template, /Return YAML in this shape/i);
  assert.doesNotMatch(template, /docs_changed:/);
  assert.doesNotMatch(template, /handoff_summary:/);
});

test("review instructions require implementation-grade verified remediation before resolution", () => {
  const template = recipe("code-review");
  const verifier = recipe("review-verify");

  assert.match(template, /version: "2\.3\.8"/);
  assert.match(template, /lower-capability implementation agent/i);
  assert.match(template, /`Fix: <proposed fix>` is insufficient/);
  assert.match(template, /“Consider,” “possibly,” “improve,”[\s\S]*“refactor as\s+needed” are invalid/is);
  assert.match(template, /Evidence and root cause[\s\S]*Required outcome[\s\S]*Decided solution[\s\S]*Error and boundary behavior[\s\S]*Constraints and non-goals[\s\S]*Acceptance checks[\s\S]*Verifier/s);
  assert.match(template, /exact files and symbols, signatures, control flow, data flow, error and\s+boundary behavior, tests, acceptance checks/i);
  assert.match(template, /Resolution order and dependencies/);
  assert.match(template, /For EVERY Critical and Warning finding, issue a `verify` sub-recipe tool call/);
  assert.match(template, /Independent verify calls MUST be issued in parallel/);
  assert.match(template, /FINDING_VERDICT: CONFIRMED[\s\S]*REMEDIATION_VERDICT: SUFFICIENT/s);
  assert.match(template, /`REQUEST CHANGES` is valid only when every retained Critical\/Warning/i);
  assert.match(template, /Do not save an implementation-bound request,\s+add `needs-fix`, or emit a resolution handoff until this gate passes/i);
  assert.match(template, /In guided mode, stop in review and ask 2–3 focused questions/i);
  assert.match(template, /In autonomous\/cycle mode,[\s\S]*blocked review artifact[\s\S]*do not add `needs-fix`/s);
  assert.match(template, /Suggestions remain nonblocking/i);
  assert.match(template, /retained findings get stable `REVIEW-NNN` IDs only after a `CONFIRMED \+ SUFFICIENT` verifier result/);
  assert.match(template, /Run scorecard only for explicit score, grade, health, or trend requests/);
  assert.match(template, /Save before Taskwarrior verdict tags/);

  assert.match(verifier, /version: "2\.0\.6"/);
  assert.match(verifier, /candidate severity, finding statement, exact evidence[\s\S]*complete decided solution,[\s\S]*acceptance\s+checks/is);
  assert.match(verifier, /FINDING_VERDICT: <CONFIRMED\|WITHDRAWN\|PARTIAL>/);
  assert.match(verifier, /REMEDIATION_VERDICT: <SUFFICIENT\|REVISE\|NOT_APPLICABLE>/);
  assert.match(verifier, /Do not choose a replacement remediation/i);
  assert.match(verifier, /Read beyond the exact evidence\/remediation files and permitted one-hop callers\/contracts/i);
  assert.doesNotMatch(verifier, /Read files outside the named range/);
  assert.match(verifier, /No broad exploration/i);
  assert.match(verifier, /Surface adjacent issues/i);
  assert.match(verifier, /parent reviewer owns remediation/i);
  assert.match(template, /obtains one final independent verification[\s\S]*not[\s\S]*`CONFIRMED \+ SUFFICIENT`, remain blocked/i);
});

test("resolution consumers fail closed before editing review findings", () => {
  for (const phase of implementationPhases) {
    const template = recipe(phase);
    assert.match(template, /Review-resolution preflight/);
    assert.match(template, /`cycle_phase=resolve-review` or a manual source\s+requests resolution of one or more `REVIEW-NNN` IDs/is);
    assert.match(template, /Before editing,[\s\S]*retained and not withdrawn[\s\S]*mandatory remediation sections[\s\S]*`CONFIRMED \+ SUFFICIENT`[\s\S]*named files and symbols[\s\S]*ordering\/dependencies/s);
    assert.match(template, /On any failed check, do not edit/i);
    assert.match(template, /return the finding to `goose-review`/i);
    assert.match(template, /Never compensate by independently researching or\s+selecting\s+a\s+solution/is);
    assert.match(template, /Do not substitute architecture or\s+broaden scope/is);
    assert.match(template, /Repository contradiction[\s\S]*returns to review/i);
    assert.match(template, /`resolved`, `blocked`, or `not attempted`/);
  }
});

test("installer preserves rendered implementation-grade review and resolution contracts", () => {
  const destination = fs.mkdtempSync(path.join(os.tmpdir(), "ima-goose-rendered-remediation-"));
  try {
    const result = spawnSync(process.execPath, ["scripts/install.ts", "--dest", destination], {
      cwd: root,
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);

    const renderedRecipe = (phase) => fs.readFileSync(path.join(destination, `${phase}.yaml`), "utf8");
    const review = renderedRecipe("code-review");
    const verifier = renderedRecipe("review-verify");

    assert.match(review, /implementation-grade,\s+reviewer-decided remediation/i);
    assert.match(review, /`REQUEST CHANGES` is valid only when every retained Critical\/Warning/i);
    assert.match(review, /Do not save an implementation-bound request,\s+add `needs-fix`, or emit a resolution handoff until this gate passes/i);
    assert.match(verifier, /FINDING_VERDICT: <CONFIRMED\|WITHDRAWN\|PARTIAL>/);
    assert.match(verifier, /REMEDIATION_VERDICT: <SUFFICIENT\|REVISE\|NOT_APPLICABLE>/);
    assert.match(verifier, /Read beyond the exact evidence\/remediation files and permitted one-hop callers\/contracts/i);
    assert.doesNotMatch(verifier, /Read files outside the named range/);

    for (const phase of implementationPhases) {
      const consumer = renderedRecipe(phase);
      assert.match(consumer, /Review-resolution preflight/);
      assert.match(consumer, /On any failed check, do not edit/i);
      assert.match(consumer, /Never compensate by independently researching or\s+selecting\s+a\s+solution/is);
    }
  } finally {
    fs.rmSync(destination, { recursive: true, force: true });
  }
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

    const rendered = new Map(fs.readdirSync(destination)
      .filter((file) => file.endsWith(".yaml"))
      .map((file) => [file, fs.readFileSync(path.join(destination, file), "utf8")]));
    const lifecycleRecipes = [...rendered.values()]
      .filter((content) => content.includes("# HITL Phase Handoff Contract"));

    assert.equal(lifecycleRecipes.length, phases.length);
    for (const content of lifecycleRecipes) {
      assert.match(content, /key: cycle_receipt_path/);
      assert.match(content, /## Artifact vs\. Prompt/);
      assert.match(content, /handoff prompt is a compact pointer/i);
      assert.match(content, /task-scoped Serena memory[\s\S]*Markdown under `docs\//s);
      assert.match(content, /implementation-grade,\s+reviewer-decided remediation/i);
      assert.match(content, /No resolution handoff is\s+permitted while product, architecture, security, API, data-flow, error-handling,\s+or test decisions remain unresolved/is);
      assert.match(content, /`REQUEST CHANGES` means remediation is ready\s+to execute/i);
      assert.match(content, /Resolution agents reject incomplete\s+remediation rather than infer missing decisions/i);
      assert.doesNotMatch(content, /<%/);
    }

    const codeReview = rendered.get("code-review.yaml");
    assert.ok(codeReview, "renders code-review recipe");
    assert.match(codeReview, /Vestige save protocol only; it must not use Serena-memory or `docs\/` fallback\s+persistence/i);
    assert.match(codeReview, /If the Vestige save fails, report the failure and block the\s+handoff rather than modifying a fallback destination/is);
  } finally {
    fs.rmSync(destination, { recursive: true, force: true });
  }
});
