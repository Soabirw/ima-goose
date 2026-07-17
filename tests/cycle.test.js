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

function makeHarness(tasks, receipt = "") {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ima-goose-cycle-test-"));
  const cwd = path.join(root, "work");
  const bin = path.join(root, "bin");
  const gooseLog = path.join(root, "goose.log");
  const tasksPath = path.join(root, "tasks.json");
  const receiptPath = path.join(cwd, ".goose-cycle", "phase-receipt.json");

  fs.writeFileSync(tasksPath, JSON.stringify(tasks));
  fs.mkdirSync(path.join(cwd, ".git"), { recursive: true });
  fs.mkdirSync(bin, { recursive: true });

  writeExecutable(
    path.join(bin, "task"),
    `#!/usr/bin/env node
const fs = require("node:fs");
const tasks = JSON.parse(fs.readFileSync(${JSON.stringify(tasksPath)}, "utf8"));
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
    `#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(gooseLog)}, args.join(" ") + "\\n");
const receiptParam = args.find((arg) => arg.startsWith("cycle_receipt_path="));
const recipe = args[args.indexOf("--recipe") + 1];
const receipts = process.env.GOOSE_TEST_RECEIPTS ? JSON.parse(process.env.GOOSE_TEST_RECEIPTS) : {};
const cyclePhase = args.find((arg) => arg.startsWith("cycle_phase="));
const receiptKey = recipe === "implement" && cyclePhase === "cycle_phase=resolve-review" ? "resolve-review" : recipe;
const receipt = receipts[receiptKey] ?? process.env.GOOSE_TEST_RECEIPT;
if (receipt && receiptParam) {
  const target = receiptParam.slice("cycle_receipt_path=".length);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, receipt);
}
if (process.env.GOOSE_TEST_BLOCK_RESOLUTION === "true" && recipe === "implement" && args.includes("cycle_phase=resolve-review")) {
  const tasks = JSON.parse(fs.readFileSync(${JSON.stringify(tasksPath)}, "utf8"));
  tasks[0] = {
    ...tasks[0],
    tags: ["blocked"],
    annotations: [{ entry: "20260717T163700Z", description: "blocked review resolution preflight" }],
  };
  fs.writeFileSync(${JSON.stringify(tasksPath)}, JSON.stringify(tasks));
}
if (process.env.GOOSE_TEST_NEEDS_FIX_REVIEW === "true" && recipe === "code-review" && !args.includes("cycle_phase=rereview")) {
  const tasks = JSON.parse(fs.readFileSync(${JSON.stringify(tasksPath)}, "utf8"));
  tasks[0] = {
    ...tasks[0],
    tags: ["needs-fix"],
    annotations: [{ entry: "20260717T163600Z", description: "changes requested" }],
  };
  fs.writeFileSync(${JSON.stringify(tasksPath)}, JSON.stringify(tasks));
}
`,
  );

  return { root, cwd, bin, gooseLog, tasksPath, receipt, receipts: {}, receiptPath, blockResolution: false, needsFixReview: false };
}

function runCycle(harness, args) {
  return spawnSync(process.execPath, [cycleScript, ...args], {
    cwd: harness.cwd,
    env: {
      ...process.env,
      PATH: `${harness.bin}${path.delimiter}${process.env.PATH ?? ""}`,
      ...(harness.receipt ? { GOOSE_TEST_RECEIPT: harness.receipt } : {}),
      ...(Object.keys(harness.receipts).length ? { GOOSE_TEST_RECEIPTS: JSON.stringify(harness.receipts) } : {}),
      ...(harness.blockResolution ? { GOOSE_TEST_BLOCK_RESOLUTION: "true" } : {}),
      ...(harness.needsFixReview ? { GOOSE_TEST_NEEDS_FIX_REVIEW: "true" } : {}),
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

function writeActive(cwd, state) {
  const stateDir = path.join(cwd, ".goose-cycle");
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(path.join(stateDir, "active.json"), `${JSON.stringify(state, null, 2)}\n`);
}

function readActive(cwd) {
  return JSON.parse(fs.readFileSync(path.join(cwd, ".goose-cycle", "active.json"), "utf8"));
}

function readGooseLog(harness) {
  return fs.existsSync(harness.gooseLog) ? fs.readFileSync(harness.gooseLog, "utf8") : "";
}

test("manual review and learn phases write completed active statuses after matching receipts", () => {
  const task = {
    id: 41,
    uuid: "41414141-2222-3333-4444-555555555555",
    description: "S41 manual statuses",
    project: "ima-goose",
    status: "pending",
  };

  const reviewHarness = makeHarness([task], JSON.stringify({
    ok: true,
    command: "vestige.save",
    data: { type: "review", stored: true },
  }));
  const reviewResult = runCycle(reviewHarness, ["review", "--task-project", "ima-goose", "--task", "S41"]);

  assert.equal(reviewResult.status, 0, reviewResult.stderr);
  assert.equal(readActive(reviewHarness.cwd).status, "reviewed");

  const learnHarness = makeHarness([task], JSON.stringify({
    ok: true,
    command: "vestige.save",
    data: { type: "closeout", stored: true },
  }));
  const learnResult = runCycle(learnHarness, ["learn", "--task-project", "ima-goose", "--task", "S41"]);

  assert.equal(learnResult.status, 0, learnResult.stderr);
  assert.equal(readActive(learnHarness.cwd).status, "learned");
});

test("next from reviewed with latest approved annotation runs learn and close only", () => {
  const harness = makeHarness([
    {
      id: 42,
      uuid: "42424242-2222-3333-4444-555555555555",
      description: "S42 approved review",
      project: "ima-goose",
      status: "pending",
      tags: ["needs-fix", "approved"],
      annotations: [
        { entry: "20260709T150000Z", description: "changes requested before fix" },
        { entry: "20260709T160000Z", description: "approved after rereview" },
      ],
    },
  ], JSON.stringify({
    ok: true,
    command: "vestige.save",
    data: { type: "closeout", stored: true },
  }));
  writeActive(harness.cwd, {
    taskProject: "ima-goose",
    task: "42424242-2222-3333-4444-555555555555",
    taskwarriorUuid: "42424242-2222-3333-4444-555555555555",
    status: "reviewed",
    updatedAt: "2026-07-09T16:00:00.000Z",
  });

  const result = runCycle(harness, ["next", "--task-project", "ima-goose"]);

  assert.equal(result.status, 0, result.stderr);
  const log = readGooseLog(harness);
  assert.match(log, /run --recipe document-learn/);
  assert.match(log, /run --recipe cycle-close/);
  assert.doesNotMatch(log, /run --recipe implement/);
  assert.doesNotMatch(log, /run --recipe code-review/);
  assert.equal(readActive(harness.cwd).status, "closed");
});

test("receipt validation rejects missing, malformed, failed, and wrong-type artifacts without advancing state", () => {
  const task = {
    id: 47,
    uuid: "47474747-2222-3333-4444-555555555555",
    description: "S47 receipt failures",
    project: "ima-goose",
    status: "pending",
  };
  const receipts = [
    ["missing", "", /receipt is missing/],
    ["malformed", "not json", /receipt is malformed/],
    ["failed", JSON.stringify({ ok: false, command: "vestige.save", data: { type: "plan", stored: false } }), /receipt is invalid/],
    ["wrong type", JSON.stringify({ ok: true, command: "vestige.save", data: { type: "review", stored: true } }), /receipt is invalid/],
  ];

  for (const [label, receipt, expectedError] of receipts) {
    const harness = makeHarness([task], receipt);
    const result = runCycle(harness, ["plan", "--task-project", "ima-goose", "--task", "S47"]);

    assert.equal(result.status, 1, label);
    assert.match(result.stderr, expectedError, label);
    assert.equal(fs.existsSync(path.join(harness.cwd, ".goose-cycle", "active.json")), false, label);
    assert.match(readGooseLog(harness), /run --recipe plan/, label);
  }
});

test("a fresh matching receipt advances the phase and replaces stale receipts", () => {
  const task = {
    id: 48,
    uuid: "48484848-2222-3333-4444-555555555555",
    description: "S48 receipt success",
    project: "ima-goose",
    status: "pending",
  };
  const harness = makeHarness([task], JSON.stringify({
    ok: true,
    command: "vestige.save",
    data: { type: "implementation", stored: true, memoryId: "implementation-memory" },
  }));
  fs.mkdirSync(path.dirname(harness.receiptPath), { recursive: true });
  fs.writeFileSync(harness.receiptPath, JSON.stringify({
    ok: true,
    command: "vestige.save",
    data: { type: "review", stored: true },
  }));

  const result = runCycle(harness, ["implement", "--task-project", "ima-goose", "--task", "S48"]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(readActive(harness.cwd).status, "implemented");
  assert.equal(JSON.parse(fs.readFileSync(harness.receiptPath, "utf8")).data.type, "implementation");
  assert.match(readGooseLog(harness), new RegExp(`cycle_receipt_path=${harness.receiptPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
});

test("a stale successful receipt cannot advance a phase when Goose writes no replacement", () => {
  const task = {
    id: 51,
    uuid: "51515151-2222-3333-4444-555555555555",
    description: "S51 stale receipt",
    project: "ima-goose",
    status: "pending",
  };
  const harness = makeHarness([task]);
  fs.mkdirSync(path.dirname(harness.receiptPath), { recursive: true });
  fs.writeFileSync(harness.receiptPath, JSON.stringify({
    ok: true,
    command: "vestige.save",
    data: { type: "plan", stored: true },
  }));

  const result = runCycle(harness, ["plan", "--task-project", "ima-goose", "--task", "S51"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /receipt is missing/);
  assert.equal(fs.existsSync(harness.receiptPath), false);
  assert.equal(fs.existsSync(path.join(harness.cwd, ".goose-cycle", "active.json")), false);
});

test("a receipt failure during start stops before later recipes launch", () => {
  const task = {
    id: 52,
    uuid: "52525252-2222-3333-4444-555555555555",
    description: "S52 start receipt failure",
    project: "ima-goose",
    status: "pending",
    tags: ["READY"],
  };
  const harness = makeHarness([task]);

  const result = runCycle(harness, ["start", "--task-project", "ima-goose"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /receipt is missing/);
  assert.match(readGooseLog(harness), /run --recipe cycle-start/);
  assert.doesNotMatch(readGooseLog(harness), /run --recipe plan|run --recipe implement|run --recipe test-writer|run --recipe code-review/);
  assert.equal(readActive(harness.cwd).status, "selected");
});

test("dry-run propagates the absolute receipt path without writing it", () => {
  const task = {
    id: 49,
    uuid: "49494949-2222-3333-4444-555555555555",
    description: "S49 dry receipt",
    project: "ima-goose",
    status: "pending",
  };
  const harness = makeHarness([task]);
  const result = runCycle(harness, ["plan", "--task-project", "ima-goose", "--task", "S49", "--dry-run"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, new RegExp(`cycle_receipt_path=${harness.receiptPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  assert.equal(fs.existsSync(harness.receiptPath), false);
});

test("successful manual resolve-review resumes with rereview instead of repeating resolution", () => {
  const task = {
    id: 53,
    uuid: "53535353-2222-3333-4444-555555555555",
    description: "S53 resume resolved review",
    project: "ima-goose",
    status: "pending",
  };
  const harness = makeHarness([task], JSON.stringify({
    ok: true,
    command: "vestige.save",
    data: { type: "resolution", stored: true },
  }));

  const resolution = runCycle(harness, ["resolve-review", "--task-project", "ima-goose", "--task", "S53"]);
  assert.equal(resolution.status, 0, resolution.stderr);
  assert.equal(readActive(harness.cwd).status, "review-resolved");

  harness.receipt = JSON.stringify({
    ok: true,
    command: "vestige.save",
    data: { type: "rereview", stored: true },
  });
  const resumed = runCycle(harness, ["next", "--task-project", "ima-goose"]);

  assert.equal(resumed.status, 0, resumed.stderr);
  const log = readGooseLog(harness);
  assert.match(log, /run --recipe code-review/);
  assert.match(log, /cycle_phase=rereview/);
  assert.equal((log.match(/run --recipe implement/g) ?? []).length, 1);
  assert.equal(readActive(harness.cwd).status, "rereviewed");
});


test("manual blocked resolve-review preserves blocked state without rereview", () => {
  const task = {
    id: 55,
    uuid: "55555555-2222-3333-4444-555555555555",
    description: "S55 manual blocked resolution",
    project: "ima-goose",
    status: "pending",
    tags: ["needs-fix"],
  };
  const harness = makeHarness([task], JSON.stringify({
    ok: true,
    command: "vestige.save",
    data: { type: "resolution", stored: true },
  }));
  harness.blockResolution = true;

  const result = runCycle(harness, ["resolve-review", "--task-project", "ima-goose", "--task", "S55"]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(readActive(harness.cwd).status, "blocked");
  const log = readGooseLog(harness);
  assert.equal((log.match(/run --recipe implement/g) ?? []).length, 1);
  assert.doesNotMatch(log, /run --recipe code-review/);
});

test("automatic review loop stops after blocked resolution without rereview", () => {
  const task = {
    id: 56,
    uuid: "56565656-2222-3333-4444-555555555555",
    description: "S56 automatic blocked resolution",
    project: "ima-goose",
    status: "pending",
    tags: ["READY"],
  };
  const harness = makeHarness([task]);
  harness.receipts = {
    "cycle-start": JSON.stringify({ ok: true, command: "vestige.save", data: { type: "decision", stored: true } }),
    plan: JSON.stringify({ ok: true, command: "vestige.save", data: { type: "plan", stored: true } }),
    implement: JSON.stringify({ ok: true, command: "vestige.save", data: { type: "implementation", stored: true } }),
    "resolve-review": JSON.stringify({ ok: true, command: "vestige.save", data: { type: "resolution", stored: true } }),
    "test-writer": JSON.stringify({ ok: true, command: "vestige.save", data: { type: "test", stored: true } }),
    "code-review": JSON.stringify({ ok: true, command: "vestige.save", data: { type: "review", stored: true } }),
  };
  harness.needsFixReview = true;
  harness.blockResolution = true;

  const result = runCycle(harness, ["start", "--task-project", "ima-goose", "--max-review-cycles", "1"]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(readActive(harness.cwd).status, "blocked");
  const log = readGooseLog(harness);
  assert.equal((log.match(/run --recipe code-review/g) ?? []).length, 1);
  assert.equal((log.match(/run --recipe implement/g) ?? []).length, 2);
  assert.match(log, /cycle_phase=resolve-review/);
});

test("blocked resolve-review receipt leaves the cycle blocked and next does not launch another phase", () => {
  const task = {
    id: 54,
    uuid: "54545454-2222-3333-4444-555555555555",
    description: "S54 blocked resolution",
    project: "ima-goose",
    status: "pending",
    tags: ["needs-fix"],
  };
  const harness = makeHarness([task], JSON.stringify({
    ok: true,
    command: "vestige.save",
    data: { type: "resolution", stored: true },
  }));
  harness.blockResolution = true;

  writeActive(harness.cwd, {
    taskProject: "ima-goose",
    task: task.uuid,
    taskwarriorUuid: task.uuid,
    status: "needs-fix",
    updatedAt: "2026-07-17T16:37:00.000Z",
  });

  const resolution = runCycle(harness, ["next", "--task-project", "ima-goose"]);
  assert.equal(resolution.status, 0, resolution.stderr);
  assert.equal(readActive(harness.cwd).status, "blocked");

  const next = runCycle(harness, ["next", "--task-project", "ima-goose"]);
  assert.equal(next.status, 0, next.stderr);
  assert.match(next.stdout, /Active cycle is blocked/);
  const log = readGooseLog(harness);
  assert.equal((log.match(/run --recipe implement/g) ?? []).length, 1);
  assert.doesNotMatch(log, /run --recipe code-review/);
  assert.equal(readActive(harness.cwd).status, "blocked");
});

test("manual phase specs require their expected receipt types", () => {
  const task = {
    id: 50,
    uuid: "50505050-2222-3333-4444-555555555555",
    description: "S50 expected types",
    project: "ima-goose",
    status: "pending",
  };
  const phases = [
    ["plan", "plan"],
    ["implement", "implementation"],
    ["test", "test"],
    ["review", "review"],
    ["learn", "closeout"],
    ["resolve-review", "resolution"],
    ["rereview", "rereview"],
  ];

  for (const [phase, type] of phases) {
    const harness = makeHarness([task], JSON.stringify({ ok: true, command: "vestige.save", data: { type, stored: true } }));
    const result = runCycle(harness, [phase, "--task-project", "ima-goose", "--task", "S50"]);
    assert.equal(result.status, 0, `${phase}: ${result.stderr}`);
  }
});

test("next automatic close commit follows mode and explicit commit flag", () => {
  const task = {
    id: 43,
    uuid: "43434343-2222-3333-4444-555555555555",
    description: "S43 close commit",
    project: "ima-goose",
    status: "pending",
  };

  const guidedHarness = makeHarness([task]);
  writeActive(guidedHarness.cwd, {
    taskProject: "ima-goose",
    task: task.uuid,
    taskwarriorUuid: task.uuid,
    status: "learned",
    updatedAt: "2026-07-09T16:00:00.000Z",
  });
  const guidedResult = runCycle(guidedHarness, ["next", "--task-project", "ima-goose"]);
  assert.equal(guidedResult.status, 0, guidedResult.stderr);
  assert.doesNotMatch(readGooseLog(guidedHarness), /--params commit=true/);

  const autonomousHarness = makeHarness([task]);
  writeActive(autonomousHarness.cwd, {
    taskProject: "ima-goose",
    task: task.uuid,
    taskwarriorUuid: task.uuid,
    status: "learned",
    updatedAt: "2026-07-09T16:00:00.000Z",
  });
  const autonomousResult = runCycle(autonomousHarness, ["next", "--task-project", "ima-goose", "--mode", "autonomous"]);
  assert.equal(autonomousResult.status, 0, autonomousResult.stderr);
  assert.match(readGooseLog(autonomousHarness), /--params commit=true/);

  const commitHarness = makeHarness([task]);
  writeActive(commitHarness.cwd, {
    taskProject: "ima-goose",
    task: task.uuid,
    taskwarriorUuid: task.uuid,
    status: "learned",
    updatedAt: "2026-07-09T16:00:00.000Z",
  });
  const commitResult = runCycle(commitHarness, ["next", "--task-project", "ima-goose", "--commit"]);
  assert.equal(commitResult.status, 0, commitResult.stderr);
  assert.match(readGooseLog(commitHarness), /--params commit=true/);
});

test("next from learned runs close only and marks cycle closed", () => {
  const task = {
    id: 46,
    uuid: "46464646-2222-3333-4444-555555555555",
    description: "S46 learned close",
    project: "ima-goose",
    status: "pending",
  };
  const harness = makeHarness([task]);
  writeActive(harness.cwd, {
    taskProject: "ima-goose",
    task: task.uuid,
    taskwarriorUuid: task.uuid,
    status: "learned",
    updatedAt: "2026-07-09T16:00:00.000Z",
  });

  const result = runCycle(harness, ["next", "--task-project", "ima-goose"]);

  assert.equal(result.status, 0, result.stderr);
  const log = readGooseLog(harness);
  assert.match(log, /run --recipe cycle-close/);
  assert.doesNotMatch(log, /run --recipe document-learn/);
  assert.doesNotMatch(log, /run --recipe implement/);
  assert.doesNotMatch(log, /run --recipe code-review/);
  assert.equal(readActive(harness.cwd).status, "closed");
});

 test("latest needs-fix annotation wins over stale approved tag", () => {
  const harness = makeHarness([
    {
      id: 44,
      uuid: "44444444-2222-3333-4444-555555555555",
      description: "S44 changes requested",
      project: "ima-goose",
      status: "pending",
      tags: ["approved"],
      annotations: [
        { entry: "20260709T150000Z", description: "approved initial review" },
        { entry: "20260709T160000Z", description: "changes requested after regression check" },
      ],
    },
  ], JSON.stringify({
    ok: true,
    command: "vestige.save",
    data: { type: "resolution", stored: true },
  }));
  writeActive(harness.cwd, {
    taskProject: "ima-goose",
    task: "44444444-2222-3333-4444-555555555555",
    taskwarriorUuid: "44444444-2222-3333-4444-555555555555",
    status: "reviewed",
    updatedAt: "2026-07-09T16:00:00.000Z",
  });

  const result = runCycle(harness, ["next", "--task-project", "ima-goose"]);

  assert.equal(result.status, 0, result.stderr);
  const log = readGooseLog(harness);
  assert.match(log, /run --recipe implement/);
  assert.match(log, /cycle_phase=resolve-review/);
  assert.doesNotMatch(log, /run --recipe document-learn/);
  assert.equal(readActive(harness.cwd).status, "review-resolved");
});

test("conflicting review tags without resolving annotation stop as review-unknown", () => {
  const harness = makeHarness([
    {
      id: 45,
      uuid: "45454545-2222-3333-4444-555555555555",
      description: "S45 conflicting tags",
      project: "ima-goose",
      status: "pending",
      tags: ["approved", "needs-fix"],
    },
  ]);
  writeActive(harness.cwd, {
    taskProject: "ima-goose",
    task: "45454545-2222-3333-4444-555555555555",
    taskwarriorUuid: "45454545-2222-3333-4444-555555555555",
    status: "reviewed",
    updatedAt: "2026-07-09T16:00:00.000Z",
  });

  const result = runCycle(harness, ["next", "--task-project", "ima-goose"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Review state is unknown or ambiguous/);
  assert.equal(readGooseLog(harness), "");
  assert.equal(readActive(harness.cwd).status, "review-unknown");
});

test("next from closed is terminal and does not resolve pending task", () => {
  const harness = makeHarness([]);
  writeActive(harness.cwd, {
    taskProject: "ima-goose",
    task: "already-closed-task",
    status: "closed",
    updatedAt: "2026-07-09T16:00:00.000Z",
  });

  const result = runCycle(harness, ["next", "--task-project", "ima-goose"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /already closed/);
  assert.equal(readGooseLog(harness), "");
});
