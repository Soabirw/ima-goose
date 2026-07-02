import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cycleScript = path.join(repoRoot, "scripts", "cycle.ts");

function writeExecutable(file, content) {
  fs.writeFileSync(file, content);
  fs.chmodSync(file, 0o755);
}

function makeHarness(tasks) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ima-goose-cycle-test-"));
  const cwd = path.join(root, "work");
  const bin = path.join(root, "bin");
  const gooseLog = path.join(root, "goose.log");

  fs.mkdirSync(path.join(cwd, ".git"), { recursive: true });
  fs.mkdirSync(bin, { recursive: true });

  writeExecutable(
    path.join(bin, "task"),
    `#!/usr/bin/env node
const tasks = ${JSON.stringify(tasks)};
const args = process.argv.slice(2);
let result = tasks;
const projectArg = args.find((arg) => arg.startsWith("project:"));
if (projectArg) {
  const project = projectArg.slice("project:".length);
  result = result.filter((task) => task.project === project);
}
if (args.includes("+PENDING")) {
  result = result.filter((task) => task.status === "pending");
}
if (args.includes("+READY")) {
  result = result.filter((task) => task.status === "pending" && !(task.tags ?? []).includes("BLOCKED"));
}
if (!projectArg) {
  const directRef = args.find((arg) => !arg.startsWith("rc.") && arg !== "export" && !arg.startsWith("+"));
  if (directRef) {
    result = result.filter((task) => String(task.id ?? "") === directRef || task.uuid === directRef || (task.uuid ?? "").startsWith(directRef) || (task.description ?? "").includes(directRef));
  }
}
process.stdout.write(JSON.stringify(result) + "\\n");
`,
  );
  writeExecutable(
    path.join(bin, "goose"),
    `#!/usr/bin/env bash
printf '%s\\n' "$*" >> ${JSON.stringify(gooseLog)}
`,
  );

  return { root, cwd, bin, gooseLog };
}

function runCycle(harness, args) {
  return spawnSync(process.execPath, [cycleScript, ...args], {
    cwd: harness.cwd,
    env: {
      ...process.env,
      PATH: `${harness.bin}${path.delimiter}${process.env.PATH ?? ""}`,
    },
    encoding: "utf8",
  });
}

test("start --dry-run selects the ready task and prints the full recipe sequence", () => {
  const harness = makeHarness([
    {
      id: 7,
      uuid: "11111111-2222-3333-4444-555555555555",
      description: "S01 implement goose-cycle helper",
      project: "ima-mcp-gateway",
      status: "pending",
      tags: ["READY"],
    },
  ]);

  const result = runCycle(harness, [
    "start",
    "--task-project",
    "ima-mcp-gateway",
    "--mode",
    "autonomous",
    "--max-review-cycles",
    "0",
    "--dry-run",
  ]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Selected task: 7\/11111111 S01 implement goose-cycle helper/);
  assert.match(result.stdout, /write \.goose-cycle\/active\.json/);
  assert.match(result.stdout, /goose run --recipe cycle-start .*--params mode=autonomous .*--params task_project=ima-mcp-gateway .*--params task=11111111-2222-3333-4444-555555555555/s);
  assert.match(result.stdout, /goose run --recipe plan .*goose run --recipe implement .*goose run --recipe test-writer .*goose run --recipe code-review/s);
  assert.match(result.stdout, /Dry run: skipping review-state inspection and learn\/resolve loop\./);
  assert.equal(fs.existsSync(path.join(harness.cwd, ".goose-cycle", "active.json")), false);
  assert.equal(fs.existsSync(harness.gooseLog), false);
});

test("manual test phase wires the Vestige lifecycle handoff into test-writer", () => {
  const harness = makeHarness([
    {
      id: 12,
      uuid: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      description: "S02 add cycle tests",
      project: "ima-goose",
      status: "pending",
    },
  ]);

  const result = runCycle(harness, [
    "test",
    "--task-project",
    "ima-goose",
    "--task",
    "S02",
    "--dry-run",
  ]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /goose run --recipe test-writer/);
  assert.match(result.stdout, /--params task_project=ima-goose/);
  assert.match(result.stdout, /--params task=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/);
  assert.match(result.stdout, /--params 'test_source=Vestige lifecycle thread for Taskwarrior project ima-goose, task aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'/);
  assert.equal(fs.existsSync(path.join(harness.cwd, ".goose-cycle", "active.json")), false);
});

test("manual phase aliases map to the concrete Goose recipes", () => {
  const expectedRecipes = [
    ["plan", "plan"],
    ["implement", "implement"],
    ["test", "test-writer"],
    ["review", "code-review"],
    ["learn", "document-learn"],
    ["resolve-review", "implement"],
    ["rereview", "code-review"],
  ];

  for (const [phase, recipe] of expectedRecipes) {
    const harness = makeHarness([
      {
        id: 13,
        uuid: "bbbbbbbb-cccc-dddd-eeee-ffffffffffff",
        description: "S03 verify manual mapping",
        project: "ima-goose",
        status: "pending",
      },
    ]);

    const result = runCycle(harness, [phase, "--task-project", "ima-goose", "--task", "S03", "--dry-run"]);

    assert.equal(result.status, 0, `${phase}: ${result.stderr}`);
    assert.match(result.stdout, new RegExp(`goose run --recipe ${recipe}`), phase);
    assert.match(result.stdout, new RegExp(`--name ${recipe}-\\d{12}`), phase);
    assert.match(result.stdout, /--params task=bbbbbbbb-cccc-dddd-eeee-ffffffffffff/, phase);
    assert.equal(fs.existsSync(path.join(harness.cwd, ".goose-cycle", "active.json")), false, phase);
  }
});

test("manual implement phase maps to implement with a Vestige implementation source", () => {
  const harness = makeHarness([
    {
      id: 14,
      uuid: "cccccccc-dddd-eeee-ffff-000000000000",
      description: "S04 implement mapping",
      project: "ima-goose",
      status: "pending",
    },
  ]);

  const result = runCycle(harness, ["implement", "--task-project", "ima-goose", "--task", "S04", "--dry-run"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /goose run --recipe implement/);
  assert.match(result.stdout, /--params task_project=ima-goose/);
  assert.match(result.stdout, /--params task=cccccccc-dddd-eeee-ffff-000000000000/);
  assert.match(result.stdout, /--params 'implementation_source=Vestige lifecycle thread for Taskwarrior project ima-goose, task cccccccc-dddd-eeee-ffff-000000000000'/);
  assert.equal(fs.existsSync(path.join(harness.cwd, ".goose-cycle", "active.json")), false);
});

test("manual review phase maps to code-review with a Vestige target", () => {
  const harness = makeHarness([
    {
      id: 15,
      uuid: "dddddddd-eeee-ffff-0000-111111111111",
      description: "S05 review mapping",
      project: "ima-goose",
      status: "pending",
    },
  ]);

  const result = runCycle(harness, ["review", "--task-project", "ima-goose", "--task", "S05", "--dry-run"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /goose run --recipe code-review/);
  assert.doesNotMatch(result.stdout, /goose run --recipe review/);
  assert.match(result.stdout, /--params task_project=ima-goose/);
  assert.match(result.stdout, /--params task=dddddddd-eeee-ffff-0000-111111111111/);
  assert.match(result.stdout, /--params 'target=Vestige lifecycle thread for Taskwarrior project ima-goose, task dddddddd-eeee-ffff-0000-111111111111'/);
  assert.equal(fs.existsSync(path.join(harness.cwd, ".goose-cycle", "active.json")), false);
});

test("manual learn phase maps to document-learn with a Vestige artifact bundle", () => {
  const harness = makeHarness([
    {
      id: 16,
      uuid: "eeeeeeee-ffff-0000-1111-222222222222",
      description: "S06 learn mapping",
      project: "ima-goose",
      status: "pending",
    },
  ]);

  const result = runCycle(harness, ["learn", "--task-project", "ima-goose", "--task", "S06", "--dry-run"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /goose run --recipe document-learn/);
  assert.match(result.stdout, /--params task_project=ima-goose/);
  assert.match(result.stdout, /--params task=eeeeeeee-ffff-0000-1111-222222222222/);
  assert.match(result.stdout, /--params 'artifact_bundle=Vestige lifecycle thread for Taskwarrior project ima-goose, task eeeeeeee-ffff-0000-1111-222222222222'/);
  assert.equal(fs.existsSync(path.join(harness.cwd, ".goose-cycle", "active.json")), false);
});

test("manual rereview phase maps to code-review with rereview parameters", () => {
  const harness = makeHarness([
    {
      id: 17,
      uuid: "ffffffff-0000-1111-2222-333333333333",
      description: "S07 rereview mapping",
      project: "ima-goose",
      status: "pending",
    },
  ]);

  const result = runCycle(harness, ["rereview", "--task-project", "ima-goose", "--task", "S07", "--dry-run"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /goose run --recipe code-review/);
  assert.match(result.stdout, /--params cycle_phase=rereview/);
  assert.match(result.stdout, /--params 'target=Rereview resolved findings from Vestige lifecycle thread for Taskwarrior project ima-goose, task ffffffff-0000-1111-2222-333333333333'/);
  assert.equal(fs.existsSync(path.join(harness.cwd, ".goose-cycle", "active.json")), false);
});

test("manual resolve-review phase maps to implement with resolve parameters", () => {
  const harness = makeHarness([
    {
      id: 18,
      uuid: "00000000-1111-2222-3333-444444444444",
      description: "S08 resolve review mapping",
      project: "ima-goose",
      status: "pending",
    },
  ]);

  const result = runCycle(harness, ["resolve-review", "--task-project", "ima-goose", "--task", "S08", "--dry-run"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /goose run --recipe implement/);
  assert.match(result.stdout, /--params cycle_phase=resolve-review/);
  assert.match(result.stdout, /--params 'implementation_source=Resolve review findings from Vestige lifecycle thread for Taskwarrior project ima-goose, task 00000000-1111-2222-3333-444444444444'/);
  assert.equal(fs.existsSync(path.join(harness.cwd, ".goose-cycle", "active.json")), false);
});

test("ambiguous fuzzy task references fail instead of selecting the first match", () => {
  const harness = makeHarness([
    {
      id: 21,
      uuid: "21111111-2222-3333-4444-555555555555",
      description: "S10 parent task",
      project: "ima-goose",
      status: "pending",
    },
    {
      id: 22,
      uuid: "22111111-2222-3333-4444-555555555555",
      description: "Fix followup referencing S10 behavior",
      project: "ima-goose",
      status: "pending",
    },
  ]);

  const result = runCycle(harness, [
    "test",
    "--task-project",
    "ima-goose",
    "--task",
    "S10",
    "--dry-run",
  ]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Task reference 'S10' is ambiguous in project:ima-goose/);
  assert.match(result.stderr, /S10 parent task/);
  assert.match(result.stderr, /Fix followup referencing S10 behavior/);
  assert.equal(fs.existsSync(path.join(harness.cwd, ".goose-cycle", "active.json")), false);
  assert.equal(fs.existsSync(harness.gooseLog), false);
});

test("task resolution does not fall back to a task from another project", () => {
  const foreignUuid = "33333333-4444-5555-6666-777777777777";
  const harness = makeHarness([
    {
      id: 33,
      uuid: foreignUuid,
      description: "foreign task",
      project: "other-project",
      status: "pending",
    },
  ]);

  const result = runCycle(harness, [
    "status",
    "--task-project",
    "ima-goose",
    "--task",
    foreignUuid,
  ]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Could not resolve task '33333333-4444-5555-6666-777777777777' in project:ima-goose/);
  assert.doesNotMatch(result.stdout, /Task: 33\/33333333 foreign task/);
  assert.equal(fs.existsSync(harness.gooseLog), false);
});

test("status reports lifecycle tags, review state, and active pointer", () => {
  const harness = makeHarness([
    {
      id: 4,
      uuid: "99999999-8888-7777-6666-555555555555",
      description: "S03 ready for close",
      project: "ima-goose",
      status: "pending",
      tags: ["tested", "approved"],
    },
  ]);
  const stateDir = path.join(harness.cwd, ".goose-cycle");
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(
    path.join(stateDir, "active.json"),
    JSON.stringify({
      taskProject: "ima-goose",
      task: "99999999-8888-7777-6666-555555555555",
      taskwarriorUuid: "99999999-8888-7777-6666-555555555555",
      status: "reviewed",
      updatedAt: "2026-06-12T17:28:00.000Z",
    }),
  );

  const result = runCycle(harness, ["status", "--task-project", "ima-goose"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Taskwarrior project: ima-goose/);
  assert.match(result.stdout, /Lifecycle tags: tested, approved/);
  assert.match(result.stdout, /Review state: approved/);
  assert.match(result.stdout, /Active state: reviewed \(2026-06-12T17:28:00\.000Z\)/);
});

test("status does not treat negated approval annotations as approved", () => {
  const harness = makeHarness([
    {
      id: 6,
      uuid: "66666666-7777-8888-9999-000000000000",
      description: "S05 waiting for QA",
      project: "ima-goose",
      status: "pending",
      annotations: [
        {
          entry: "20260612T173000Z",
          description: "reviewed but not approved until manual QA",
        },
      ],
    },
  ]);

  const result = runCycle(harness, ["status", "--task-project", "ima-goose", "--task", "S05"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Review state: unknown/);
  assert.doesNotMatch(result.stdout, /Review state: approved/);
});

test("close --dry-run can use active state and requires explicit commit parameter", () => {
  const harness = makeHarness([
    {
      id: 5,
      uuid: "12345678-1234-1234-1234-123456789abc",
      description: "S04 close cycle task",
      project: "ima-goose",
      status: "pending",
    },
  ]);
  const stateDir = path.join(harness.cwd, ".goose-cycle");
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(
    path.join(stateDir, "active.json"),
    JSON.stringify({
      taskProject: "ima-goose",
      task: "12345678-1234-1234-1234-123456789abc",
      taskwarriorUuid: "12345678-1234-1234-1234-123456789abc",
      status: "learned",
      updatedAt: "2026-06-12T17:28:00.000Z",
    }),
  );

  const result = runCycle(harness, ["close", "--task-project", "ima-goose", "--commit", "--dry-run"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /goose run --recipe cycle-close/);
  assert.match(result.stdout, /--params task_project=ima-goose/);
  assert.match(result.stdout, /--params task=12345678-1234-1234-1234-123456789abc/);
  assert.match(result.stdout, /--params commit=true/);
  assert.equal(fs.existsSync(harness.gooseLog), false);
});


test("rejects legacy --project with a migration error", () => {
  const harness = makeHarness([]);
  const result = runCycle(harness, ["start", "--project", "ima-goose", "--dry-run"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /--project is no longer accepted by goose-cycle/);
  assert.match(result.stderr, /Use --task-project <taskwarrior-project>/);
  assert.match(result.stderr, /Serena project selection is automatic/);
  assert.equal(fs.existsSync(harness.gooseLog), false);
});


test("rejects legacy --project=value with a migration error", () => {
  const harness = makeHarness([]);
  const result = runCycle(harness, ["start", "--project=ima-goose", "--dry-run"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /--project is no longer accepted by goose-cycle/);
  assert.match(result.stderr, /Use --task-project <taskwarrior-project>/);
  assert.match(result.stderr, /Serena project selection is automatic/);
  assert.equal(fs.existsSync(harness.gooseLog), false);
});


test("rejects legacy active state using project without taskProject", () => {
  const harness = makeHarness([]);
  const stateDir = path.join(harness.cwd, ".goose-cycle");
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(
    path.join(stateDir, "active.json"),
    JSON.stringify({
      project: "ima-goose",
      task: "99999999-8888-7777-6666-555555555555",
      status: "reviewed",
      updatedAt: "2026-06-12T17:28:00.000Z",
    }),
  );

  const result = runCycle(harness, ["status", "--task-project", "ima-goose"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /.goose-cycle\/active.json uses legacy field "project"/);
});
