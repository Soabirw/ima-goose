#!/usr/bin/env node
// Thin HITL conductor for the IMA Goose per-task software cycle.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

type LifecycleCommandName = "start" | "next" | "status" | "close";

type ManualPhaseName =
  | "plan"
  | "implement"
  | "test"
  | "review"
  | "learn"
  | "resolve-review"
  | "rereview";

type CommandName = LifecycleCommandName | ManualPhaseName;

type CycleStatus =
  | "selected"
  | "started"
  | "planned"
  | "implemented"
  | "tested"
  | "reviewed"
  | "needs-fix"
  | "resolve-review"
  | "review-resolved"
  | "rereviewed"
  | "approved"
  | "learn"
  | "learned"
  | "closing"
  | "closed"
  | "blocked"
  | "review-unknown";

type ReviewState = "approved" | "needs-fix" | "blocked" | "unknown";
type VestigeSaveType = "plan" | "implementation" | "test" | "review" | "resolution" | "rereview" | "decision" | "closeout";
type PhaseReceipt = { ok: true; command: "vestige.save"; data: { type: VestigeSaveType; stored: true; memoryId?: string } };

type CliArgs = {
  command: CommandName;
  taskProject: string;
  task: string;
  mode: "guided" | "autonomous";
  dryRun: boolean;
  commit: boolean;
  maxReviewCycles: number;
};

type TaskwarriorTask = {
  id?: number;
  uuid?: string;
  description?: string;
  project?: string;
  status?: string;
  tags?: string[];
  annotations?: Array<{ entry?: string; description?: string }>;
  urgency?: number;
};

type ActiveState = {
  taskProject: string;
  task: string;
  taskwarriorUuid?: string;
  status: CycleStatus | string;
  updatedAt: string;
};

const lifecycleTags = [
  "planned",
  "implemented",
  "tested",
  "reviewed",
  "needs-fix",
  "approved",
  "learned",
  "blocked",
];

const manualPhaseNames = new Set<string>([
  "plan",
  "implement",
  "test",
  "review",
  "learn",
  "resolve-review",
  "rereview",
]);

function isManualPhase(command: CommandName): command is ManualPhaseName {
  return manualPhaseNames.has(command);
}

function usage(): never {
  console.error(`Usage:
  goose-cycle start --task-project <taskwarrior-project> [--task <task-key-or-uuid>] [--dry-run]
  goose-cycle next --task-project <taskwarrior-project> [--dry-run]
  goose-cycle status --task-project <taskwarrior-project> [--task <task-key-or-uuid>]
  goose-cycle close --task-project <taskwarrior-project> [--task <task-key-or-uuid>] [--commit] [--dry-run]

Manual phases:
  goose-cycle plan|implement|test|review|learn|resolve-review|rereview --task-project <taskwarrior-project> --task <task> [--dry-run]

Options:
  --mode guided|autonomous
  --max-review-cycles <n>`);
  process.exit(2);
}

function parseArgs(): CliArgs {
  const raw = process.argv.slice(2);
  const command = raw.shift() as CommandName | undefined;
  const commands = new Set<string>([
    "start",
    "next",
    "status",
    "close",
    ...manualPhaseNames,
  ]);

  if (!command || !commands.has(command)) usage();

  const parsed: CliArgs = {
    command,
    taskProject: "",
    task: "",
    mode: "guided",
    dryRun: false,
    commit: false,
    maxReviewCycles: 2,
  };

  for (let i = 0; i < raw.length; i++) {
    const arg = raw[i];
    if (arg === "--project" || arg.startsWith("--project=")) {
      throw new Error(
        "--project is no longer accepted by goose-cycle.\n" +
          "Use --task-project <taskwarrior-project> for Taskwarrior project scoping.\n" +
          "Serena project selection is automatic and must not be supplied as a recipe parameter.",
      );
    } else if (arg === "--task-project" && raw[i + 1]) {
      parsed.taskProject = raw[++i];
    } else if (arg === "--task" && raw[i + 1]) {
      parsed.task = raw[++i];
    } else if (arg === "--mode" && raw[i + 1]) {
      const mode = raw[++i];
      if (mode !== "guided" && mode !== "autonomous") usage();
      parsed.mode = mode;
    } else if (arg === "--max-review-cycles" && raw[i + 1]) {
      const value = Number(raw[++i]);
      if (!Number.isInteger(value) || value < 0 || value > 10) usage();
      parsed.maxReviewCycles = value;
    } else if (arg === "--dry-run") {
      parsed.dryRun = true;
    } else if (arg === "--commit") {
      parsed.commit = true;
    } else {
      usage();
    }
  }

  if (!parsed.taskProject) usage();
  if (isManualPhase(command) && !parsed.task) usage();
  return parsed;
}

function quoteArg(arg: string): string {
  if (/^[A-Za-z0-9_./:=@+-]+$/.test(arg)) return arg;
  return `'${arg.replace(/'/g, "'\\''")}'`;
}

function formatCommand(cmd: string, args: string[]): string {
  return [cmd, ...args].map(quoteArg).join(" ");
}

function run(cmd: string, args: string[], options: { dryRun?: boolean; capture?: boolean } = {}): string {
  console.log(formatCommand(cmd, args));
  if (options.dryRun) return "";

  const result = spawnSync(cmd, args, {
    encoding: "utf8",
    stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    const stderr = options.capture ? result.stderr.trim() : "";
    throw new Error(`${cmd} exited with ${result.status}${stderr ? `: ${stderr}` : ""}`);
  }

  return options.capture ? result.stdout : "";
}

function taskExport(filters: string[]): TaskwarriorTask[] {
  const output = run("task", ["rc.verbose=nothing", ...filters, "export"], { capture: true });
  try {
    const parsed = JSON.parse(output) as unknown;
    return Array.isArray(parsed) ? (parsed as TaskwarriorTask[]) : [];
  } catch (error) {
    throw new Error(`Could not parse Taskwarrior JSON export: ${(error as Error).message}`);
  }
}

function taskIdentity(task: TaskwarriorTask): string {
  return task.uuid ?? (task.id === undefined ? task.description ?? "" : String(task.id));
}

function taskLabel(task: TaskwarriorTask): string {
  const id = task.id === undefined ? "-" : String(task.id);
  const uuid = task.uuid ? task.uuid.slice(0, 8) : "no-uuid";
  return `${id}/${uuid} ${task.description ?? "(no description)"}`;
}

function findEligibleTask(taskProject: string): TaskwarriorTask {
  const tasks = taskExport([`project:${taskProject}`, "+PENDING", "+READY"]);
  if (tasks.length === 0) {
    throw new Error(`No pending ready Taskwarrior tasks found for project:${taskProject}.`);
  }
  return tasks[0];
}

function resolveTask(taskProject: string, taskRef: string): TaskwarriorTask {
  const projectTasks = taskExport([`project:${taskProject}`, "+PENDING"]);

  const exactMatches = projectTasks.filter((task) => {
    const id = task.id === undefined ? "" : String(task.id);
    const uuid = task.uuid ?? "";
    return id === taskRef || uuid === taskRef;
  });
  if (exactMatches.length === 1) return exactMatches[0];
  if (exactMatches.length > 1) {
    throw new Error(`Task reference '${taskRef}' matched multiple exact tasks. Use a UUID.`);
  }

  const fuzzyMatches = projectTasks.filter((task) => {
    const uuid = task.uuid ?? "";
    const description = task.description ?? "";
    return uuid.startsWith(taskRef) || description.includes(taskRef);
  });
  if (fuzzyMatches.length === 1) return fuzzyMatches[0];
  if (fuzzyMatches.length > 1) {
    const matches = fuzzyMatches.map(taskLabel).join("; ");
    throw new Error(`Task reference '${taskRef}' is ambiguous in project:${taskProject}: ${matches}. Use a UUID.`);
  }

  throw new Error(`Could not resolve task '${taskRef}' in project:${taskProject}.`);
}

function projectRoot(start = process.cwd()): string {
  let current = path.resolve(start);
  while (true) {
    if (
      fs.existsSync(path.join(current, ".git")) ||
      fs.existsSync(path.join(current, ".serena", "project.yml"))
    ) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) return path.resolve(start);
    current = parent;
  }
}

function statePath(): string {
  return path.join(projectRoot(), ".goose-cycle", "active.json");
}

function phaseReceiptPath(): string {
  return path.join(projectRoot(), ".goose-cycle", "phase-receipt.json");
}

function clearPhaseReceipt(): void {
  fs.rmSync(phaseReceiptPath(), { force: true });
}

function validatePhaseReceipt(expectedType: VestigeSaveType): PhaseReceipt {
  const file = phaseReceiptPath();
  if (!fs.existsSync(file)) throw new Error(`Vestige persistence receipt is missing: ${file}. Retry the same phase after fixing Vestige.`);
  let parsed: unknown;
  try { parsed = JSON.parse(fs.readFileSync(file, "utf8")); } catch { throw new Error(`Vestige persistence receipt is malformed: ${file}. Retry the same phase after fixing Vestige.`); }
  const receipt = parsed as Partial<PhaseReceipt>;
  if (receipt.ok !== true || receipt.command !== "vestige.save" || receipt.data?.stored !== true || receipt.data.type !== expectedType) {
    throw new Error(`Vestige persistence receipt is invalid for '${expectedType}': ${file}. Retry the same phase after fixing Vestige.`);
  }
  return receipt as PhaseReceipt;
}

function readActiveState(): ActiveState | null {
  const file = statePath();
  if (!fs.existsSync(file)) return null;
  const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as ActiveState & { project?: string };
  if (parsed.project && !parsed.taskProject) {
    throw new Error('.goose-cycle/active.json uses legacy field "project". Delete/regenerate the active cycle state or migrate it to "taskProject".');
  }
  return parsed;
}

function writeActiveState(state: ActiveState, dryRun: boolean): void {
  const file = statePath();
  console.log(`write ${path.relative(process.cwd(), file)}`);
  if (dryRun) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(state, null, 2)}\n`);
}

function writePhaseState(args: CliArgs, task: TaskwarriorTask, status: CycleStatus, dryRun: boolean): void {
  writeActiveState({
    taskProject: args.taskProject,
    task: taskIdentity(task),
    taskwarriorUuid: task.uuid,
    status,
    updatedAt: new Date().toISOString(),
  }, dryRun);
}

function recipeArgs(recipe: string, params: Record<string, string | boolean>): string[] {
  const args = ["run", "--recipe", recipe];
  for (const [key, value] of Object.entries(params)) {
    if (value === "" || value === false) continue;
    args.push("--params", `${key}=${String(value)}`);
  }
  args.push("--name", `${recipe}-${new Date().toISOString().replace(/[-:T]/g, "").slice(0, 12)}`, "--interactive");
  return args;
}

function runRecipe(recipe: string, params: Record<string, string | boolean>, dryRun: boolean): void {
  run("goose", recipeArgs(recipe, params), { dryRun });
}

function annotationVerdict(description: string): ReviewState | null {
  const text = description.toLowerCase();

  if (/\bblocked\b/.test(text)) return "blocked";

  const negatedApproval =
    /\bnot approved\b|\bnot approve\b|\bdo not approve\b|\bdo(?:n't| not) approve\b|\bwithout approval\b|\bpending approval\b|\bapproval pending\b/.test(text);

  if (/needs[- ]fix|request changes|changes requested/.test(text)) {
    return "needs-fix";
  }

  if (!negatedApproval && /\bapproved\b|\bapprove\b/.test(text)) {
    return "approved";
  }

  return null;
}

function latestAnnotationVerdict(task: TaskwarriorTask): ReviewState | null {
  return [...(task.annotations ?? [])]
    .sort((a, b) => String(b.entry ?? "").localeCompare(String(a.entry ?? "")))
    .map((annotation) => annotationVerdict(annotation.description ?? ""))
    .find((verdict): verdict is ReviewState => verdict !== null) ?? null;
}

function reviewState(task: TaskwarriorTask): ReviewState {
  const fromAnnotation = latestAnnotationVerdict(task);
  if (fromAnnotation) return fromAnnotation;

  const tags = new Set(task.tags ?? []);
  const hasBlocked = tags.has("blocked");
  const hasApproved = tags.has("approved");
  const hasNeedsFix = tags.has("needs-fix");

  if (hasBlocked && !hasApproved && !hasNeedsFix) return "blocked";
  if (hasApproved && !hasNeedsFix) return "approved";
  if (hasNeedsFix && !hasApproved) return "needs-fix";

  return "unknown";
}

function printStatus(taskProject: string, taskRef: string): void {
  const active = readActiveState();
  const ref = taskRef || active?.task;
  if (!ref) {
    console.log("No --task supplied and no .goose-cycle/active.json found.");
    return;
  }

  const task = resolveTask(taskProject, ref);
  console.log(`Taskwarrior project: ${taskProject}`);
  console.log(`Task: ${taskLabel(task)}`);
  console.log(`Status: ${task.status ?? "unknown"}`);
  console.log(`Lifecycle tags: ${(task.tags ?? []).filter((tag) => lifecycleTags.includes(tag)).join(", ") || "(none)"}`);
  console.log(`Review state: ${reviewState(task)}`);
  if (active) {
    console.log(`Active state: ${active.status} (${active.updatedAt})`);
  }
}

function phaseParams(
  args: CliArgs,
  task: TaskwarriorTask,
  extras: Record<string, string | boolean> = {},
  includeReceipt = true,
): Record<string, string | boolean> {
  return {
    mode: args.mode,
    task_project: args.taskProject,
    task: taskIdentity(task),
    ...(includeReceipt ? { cycle_receipt_path: phaseReceiptPath() } : {}),
    ...extras,
  };
}

type ManualPhaseSpec = {
  recipe: string;
  status: CycleStatus;
  expectedType: VestigeSaveType;
  params: (args: CliArgs, task: TaskwarriorTask) => Record<string, string | boolean>;
};

const manualPhaseSpecs: Record<ManualPhaseName, ManualPhaseSpec> = {
  plan: {
    recipe: "plan",
    status: "planned",
    expectedType: "plan",
    params: () => ({}),
  },
  implement: {
    recipe: "implement",
    status: "implemented",
    expectedType: "implementation",
    params: (args, task) => ({
      implementation_source: `Vestige lifecycle thread for Taskwarrior project ${args.taskProject}, task ${taskIdentity(task)}`,
    }),
  },
  test: {
    recipe: "test-writer",
    status: "tested",
    expectedType: "test",
    params: (args, task) => ({
      test_source: `Vestige lifecycle thread for Taskwarrior project ${args.taskProject}, task ${taskIdentity(task)}`,
    }),
  },
  review: {
    recipe: "code-review",
    status: "reviewed",
    expectedType: "review",
    params: (args, task) => ({
      target: `Vestige lifecycle thread for Taskwarrior project ${args.taskProject}, task ${taskIdentity(task)}`,
    }),
  },
  learn: {
    recipe: "document-learn",
    status: "learned",
    expectedType: "closeout",
    params: (args, task) => ({
      artifact_bundle: `Vestige lifecycle thread for Taskwarrior project ${args.taskProject}, task ${taskIdentity(task)}`,
    }),
  },
  "resolve-review": {
    recipe: "implement",
    status: "review-resolved",
    expectedType: "resolution",
    params: (args, task) => ({
      cycle_phase: "resolve-review",
      implementation_source: `Resolve review findings from Vestige lifecycle thread for Taskwarrior project ${args.taskProject}, task ${taskIdentity(task)}`,
    }),
  },
  rereview: {
    recipe: "code-review",
    status: "rereviewed",
    expectedType: "rereview",
    params: (args, task) => ({
      cycle_phase: "rereview",
      target: `Rereview resolved findings from Vestige lifecycle thread for Taskwarrior project ${args.taskProject}, task ${taskIdentity(task)}`,
    }),
  },
};

function runManualPhase(args: CliArgs): void {
  const task = resolveTask(args.taskProject, args.task);
  if (!isManualPhase(args.command)) {
    throw new Error(`Unsupported manual phase '${args.command}'.`);
  }
  const spec = manualPhaseSpecs[args.command];
  if (!args.dryRun) clearPhaseReceipt();
  runRecipe(spec.recipe, phaseParams(args, task, spec.params(args, task)), args.dryRun);
  if (!args.dryRun) validatePhaseReceipt(spec.expectedType);
  writePhaseState(args, task, spec.status, args.dryRun);
}

function expectedReceiptType(recipe: string, params: Record<string, string | boolean>): VestigeSaveType | undefined {
  if (recipe === "cycle-start") return "decision";
  if (recipe === "plan") return "plan";
  if (recipe === "implement") return params.cycle_phase === "resolve-review" ? "resolution" : "implementation";
  if (recipe === "test-writer") return "test";
  if (recipe === "code-review") return params.cycle_phase === "rereview" ? "rereview" : "review";
  if (recipe === "document-learn") return "closeout";
  return undefined;
}

function runTrackedRecipe(
  args: CliArgs,
  task: TaskwarriorTask,
  recipe: string,
  beforeStatus: CycleStatus,
  afterStatus: CycleStatus,
  params: Record<string, string | boolean>,
  dryRun: boolean,
  expectedType?: VestigeSaveType,
): void {
  const receiptType = expectedType ?? expectedReceiptType(recipe, params);
  writePhaseState(args, task, beforeStatus, dryRun);
  if (!dryRun && receiptType !== undefined) clearPhaseReceipt();
  runRecipe(recipe, phaseParams(args, task, params, receiptType !== undefined), dryRun);
  if (!dryRun && receiptType !== undefined) validatePhaseReceipt(receiptType);
  writePhaseState(args, task, afterStatus, dryRun);
}

function closeCommitRequested(args: CliArgs): boolean {
  return args.commit || args.mode === "autonomous";
}

function runClosePhase(args: CliArgs, task: TaskwarriorTask, dryRun: boolean, commit = closeCommitRequested(args)): void {
  runTrackedRecipe(args, task, "cycle-close", "closing", "closed", { commit }, dryRun);
}

function runLearnAndClose(args: CliArgs, task: TaskwarriorTask, dryRun: boolean): void {
  runTrackedRecipe(args, task, "document-learn", "learn", "learned", {
    artifact_bundle: `Vestige lifecycle thread for Taskwarrior project ${args.taskProject}, task ${taskIdentity(task)}`,
  }, dryRun, "closeout");

  runClosePhase(args, task, dryRun);
}

function handleReviewOutcome(args: CliArgs, task: TaskwarriorTask, dryRun: boolean): void {
  const state = reviewState(task);

  if (state === "approved") {
    writePhaseState(args, task, "approved", dryRun);
    runLearnAndClose(args, task, dryRun);
    return;
  }

  if (state === "needs-fix") {
    writePhaseState(args, task, "needs-fix", dryRun);
    runTrackedRecipe(args, task, "implement", "resolve-review", "review-resolved", {
      cycle_phase: "resolve-review",
      implementation_source: `Resolve review findings from Vestige lifecycle thread for Taskwarrior project ${args.taskProject}, task ${taskIdentity(task)}`,
    }, dryRun, "resolution");
    return;
  }

  if (state === "blocked") {
    writePhaseState(args, task, "blocked", dryRun);
    console.log("Review state is blocked. Stopping for human inspection.");
    return;
  }

  writePhaseState(args, task, "review-unknown", dryRun);
  console.log("Review state is unknown or ambiguous. Stopping for human inspection.");
}

function runReviewLoopAfterReview(args: CliArgs, task: TaskwarriorTask): void {
  let current = resolveTask(args.taskProject, taskIdentity(task));

  for (let cycle = 0; cycle <= args.maxReviewCycles; cycle++) {
    const state = reviewState(current);

    if (state === "approved") {
      writePhaseState(args, current, "approved", false);
      runLearnAndClose(args, current, false);
      return;
    }

    if (state === "blocked") {
      writePhaseState(args, current, "blocked", false);
      console.log("Review state is blocked. Stopping for human inspection.");
      return;
    }

    if (state === "unknown") {
      writePhaseState(args, current, "review-unknown", false);
      console.log("Review state is unknown or ambiguous. Stopping for human inspection.");
      return;
    }

    writePhaseState(args, current, "needs-fix", false);
    if (cycle === args.maxReviewCycles) {
      console.log(`Reached max review cycles (${args.maxReviewCycles}). Stopping for human inspection.`);
      return;
    }

    runTrackedRecipe(args, current, "implement", "resolve-review", "review-resolved", {
      cycle_phase: "resolve-review",
      implementation_source: `Resolve review findings from Vestige lifecycle thread for Taskwarrior project ${args.taskProject}, task ${taskIdentity(current)}`,
    }, false);
    current = resolveTask(args.taskProject, taskIdentity(current));
    runTrackedRecipe(args, current, "code-review", "review-resolved", "rereviewed", {
      cycle_phase: "rereview",
      target: `Rereview resolved findings from Vestige lifecycle thread for Taskwarrior project ${args.taskProject}, task ${taskIdentity(current)}`,
    }, false);
    current = resolveTask(args.taskProject, taskIdentity(current));
  }
}

function runStart(args: CliArgs): void {
  const task = args.task ? resolveTask(args.taskProject, args.task) : findEligibleTask(args.taskProject);
  console.log(`Selected task: ${taskLabel(task)}`);
  writePhaseState(args, task, "selected", args.dryRun);

  runTrackedRecipe(args, task, "cycle-start", "selected", "started", {}, args.dryRun);
  runTrackedRecipe(args, task, "plan", "started", "planned", {}, args.dryRun);
  runTrackedRecipe(args, task, "implement", "planned", "implemented", {
    implementation_source: `Vestige lifecycle thread for Taskwarrior project ${args.taskProject}, task ${taskIdentity(task)}`,
  }, args.dryRun);
  runTrackedRecipe(args, task, "test-writer", "implemented", "tested", {
    test_source: `Vestige lifecycle thread for Taskwarrior project ${args.taskProject}, task ${taskIdentity(task)}`,
  }, args.dryRun);
  runTrackedRecipe(args, task, "code-review", "tested", "reviewed", {
    target: `Vestige lifecycle thread for Taskwarrior project ${args.taskProject}, task ${taskIdentity(task)}`,
  }, args.dryRun);

  if (args.dryRun) {
    console.log("Dry run: skipping review-state inspection and learn/resolve loop.");
    return;
  }

  runReviewLoopAfterReview(args, task);
}

function normalizedStatus(status: string): string {
  const legacyStatusMap: Record<string, CycleStatus> = {
    plan: "planned",
    implement: "implemented",
    test: "tested",
    review: "reviewed",
    rereview: "rereviewed",
  };
  return legacyStatusMap[status] ?? status;
}

function continueFromStatus(args: CliArgs, task: TaskwarriorTask, status: string): void {
  const currentStatus = normalizedStatus(status);

  switch (currentStatus) {
    case "selected":
      runTrackedRecipe(args, task, "cycle-start", "selected", "started", {}, args.dryRun);
      return;
    case "started":
      runTrackedRecipe(args, task, "plan", "started", "planned", {}, args.dryRun);
      return;
    case "planned":
      runTrackedRecipe(args, task, "implement", "planned", "implemented", {
        implementation_source: `Vestige lifecycle thread for Taskwarrior project ${args.taskProject}, task ${taskIdentity(task)}`,
      }, args.dryRun);
      return;
    case "implemented":
      runTrackedRecipe(args, task, "test-writer", "implemented", "tested", {
        test_source: `Vestige lifecycle thread for Taskwarrior project ${args.taskProject}, task ${taskIdentity(task)}`,
      }, args.dryRun);
      return;
    case "tested":
      runTrackedRecipe(args, task, "code-review", "tested", "reviewed", {
        target: `Vestige lifecycle thread for Taskwarrior project ${args.taskProject}, task ${taskIdentity(task)}`,
      }, args.dryRun);
      if (args.dryRun) {
        console.log("Dry run: skipping review-state inspection.");
        return;
      }
      handleReviewOutcome(args, resolveTask(args.taskProject, taskIdentity(task)), false);
      return;
    case "reviewed":
    case "rereviewed":
      handleReviewOutcome(args, task, args.dryRun);
      return;
    case "needs-fix":
    case "resolve-review":
      runTrackedRecipe(args, task, "implement", "resolve-review", "review-resolved", {
        cycle_phase: "resolve-review",
        implementation_source: `Resolve review findings from Vestige lifecycle thread for Taskwarrior project ${args.taskProject}, task ${taskIdentity(task)}`,
      }, args.dryRun);
      return;
    case "review-resolved":
      runTrackedRecipe(args, task, "code-review", "review-resolved", "rereviewed", {
        cycle_phase: "rereview",
        target: `Rereview resolved findings from Vestige lifecycle thread for Taskwarrior project ${args.taskProject}, task ${taskIdentity(task)}`,
      }, args.dryRun);
      return;
    case "approved":
    case "learn":
      runLearnAndClose(args, task, args.dryRun);
      return;
    case "learned":
    case "closing":
      runClosePhase(args, task, args.dryRun);
      return;
    case "blocked":
      console.log("Active cycle is blocked. Stopping for human inspection.");
      return;
    case "review-unknown":
      console.log("Active cycle review state is unknown or ambiguous. Stopping for human inspection.");
      return;
    case "closed":
      console.log(`Goose cycle is already closed for task ${taskIdentity(task)}. No next phase remains.`);
      return;
    default:
      console.log(`Unknown active cycle status '${status}'. Stopping for human inspection.`);
  }
}

function runNext(args: CliArgs): void {
  const active = readActiveState();
  if (!active) {
    runStart(args);
    return;
  }

  if (active.status === "closed") {
    console.log(`Goose cycle is already closed for task ${active.task}. No next phase remains.`);
    return;
  }

  const taskRef = args.task || active.task;
  const task = resolveTask(args.taskProject, taskRef);
  continueFromStatus(args, task, active.status);
}

function runClose(args: CliArgs): void {
  const active = readActiveState();
  const taskRef = args.task || active?.task;
  if (!taskRef) {
    throw new Error("close requires --task or an existing .goose-cycle/active.json pointer.");
  }
  const task = resolveTask(args.taskProject, taskRef);
  runClosePhase(args, task, args.dryRun, args.commit);
}

function main(): void {
  const args = parseArgs();
  try {
    if (args.command === "status") {
      printStatus(args.taskProject, args.task);
    } else if (args.command === "start") {
      runStart(args);
    } else if (args.command === "next") {
      runNext(args);
    } else if (args.command === "close") {
      runClose(args);
    } else {
      runManualPhase(args);
    }
  } catch (error) {
    console.error(`\n[ERROR] ${(error as Error).message}`);
    process.exit(1);
  }
}

main();
