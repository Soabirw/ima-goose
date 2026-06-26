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

type CliArgs = {
  command: CommandName;
  project: string;
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
  project: string;
  task: string;
  taskwarriorUuid?: string;
  status: string;
  updatedAt: string;
};

const lifecycleTags = ["planned", "implemented", "tested", "reviewed", "needs-fix", "approved", "learned"];

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
  goose-cycle start --project <project> [--task <task-key-or-uuid>] [--dry-run]
  goose-cycle next --project <project> [--dry-run]
  goose-cycle status --project <project> [--task <task-key-or-uuid>]
  goose-cycle close --project <project> [--task <task-key-or-uuid>] [--commit] [--dry-run]

Manual phases:
  goose-cycle plan|implement|test|review|learn|resolve-review|rereview --project <project> --task <task> [--dry-run]

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
    project: "",
    task: "",
    mode: "guided",
    dryRun: false,
    commit: false,
    maxReviewCycles: 2,
  };

  for (let i = 0; i < raw.length; i++) {
    const arg = raw[i];
    if (arg === "--project" && raw[i + 1]) {
      parsed.project = raw[++i];
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

  if (!parsed.project) usage();
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

function findEligibleTask(project: string): TaskwarriorTask {
  const tasks = taskExport([`project:${project}`, "+PENDING", "+READY"]);
  if (tasks.length === 0) {
    throw new Error(`No pending ready Taskwarrior tasks found for project:${project}.`);
  }
  return tasks[0];
}

function resolveTask(project: string, taskRef: string): TaskwarriorTask {
  const projectTasks = taskExport([`project:${project}`, "+PENDING"]);

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
    throw new Error(`Task reference '${taskRef}' is ambiguous in project:${project}: ${matches}. Use a UUID.`);
  }

  throw new Error(`Could not resolve task '${taskRef}' in project:${project}.`);
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

function readActiveState(): ActiveState | null {
  const file = statePath();
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8")) as ActiveState;
}

function writeActiveState(state: ActiveState, dryRun: boolean): void {
  const file = statePath();
  console.log(`write ${path.relative(process.cwd(), file)}`);
  if (dryRun) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(state, null, 2)}\n`);
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

function annotationText(task: TaskwarriorTask): string {
  return (task.annotations ?? [])
    .map((annotation) => annotation.description ?? "")
    .join("\n")
    .toLowerCase();
}

function reviewState(task: TaskwarriorTask): "approved" | "needs-fix" | "blocked" | "unknown" {
  const tags = new Set(task.tags ?? []);
  const annotations = annotationText(task);
  if (tags.has("blocked") || /\bblocked\b/.test(annotations)) return "blocked";
  if (tags.has("needs-fix") || /needs[- ]fix|request changes|changes requested/.test(annotations)) {
    return "needs-fix";
  }
  const negatedApproval =
    /\bnot approved\b|\bnot approve\b|\bdo not approve\b|\bdo(?:n't| not) approve\b|\bwithout approval\b|\bpending approval\b|\bapproval pending\b/.test(
      annotations,
    );
  if (tags.has("approved") || (!negatedApproval && /\bapproved\b|\bapprove\b/.test(annotations))) {
    return "approved";
  }
  return "unknown";
}

function printStatus(project: string, taskRef: string): void {
  const active = readActiveState();
  const ref = taskRef || active?.task;
  if (!ref) {
    console.log("No --task supplied and no .goose-cycle/active.json found.");
    return;
  }

  const task = resolveTask(project, ref);
  console.log(`Project: ${project}`);
  console.log(`Task: ${taskLabel(task)}`);
  console.log(`Status: ${task.status ?? "unknown"}`);
  console.log(`Lifecycle tags: ${(task.tags ?? []).filter((tag) => lifecycleTags.includes(tag)).join(", ") || "(none)"}`);
  console.log(`Review state: ${reviewState(task)}`);
  if (active) {
    console.log(`Active state: ${active.status} (${active.updatedAt})`);
  }
}

function phaseParams(args: CliArgs, task: TaskwarriorTask, extras: Record<string, string | boolean> = {}): Record<string, string | boolean> {
  return {
    mode: args.mode,
    project: args.project,
    task: taskIdentity(task),
    ...extras,
  };
}

type ManualPhaseSpec = {
  recipe: string;
  status: string;
  params: (args: CliArgs, task: TaskwarriorTask) => Record<string, string | boolean>;
};

const manualPhaseSpecs: Record<ManualPhaseName, ManualPhaseSpec> = {
  plan: {
    recipe: "plan",
    status: "plan",
    params: () => ({}),
  },
  implement: {
    recipe: "implement",
    status: "implement",
    params: (args, task) => ({
      implementation_source: `Vestige lifecycle thread for project ${args.project}, task ${taskIdentity(task)}`,
    }),
  },
  test: {
    recipe: "test-writer",
    status: "test",
    params: (args, task) => ({
      test_source: `Vestige lifecycle thread for project ${args.project}, task ${taskIdentity(task)}`,
    }),
  },
  review: {
    recipe: "code-review",
    status: "review",
    params: (args, task) => ({
      target: `Vestige lifecycle thread for project ${args.project}, task ${taskIdentity(task)}`,
    }),
  },
  learn: {
    recipe: "document-learn",
    status: "learn",
    params: (args, task) => ({
      artifact_bundle: `Vestige lifecycle thread for project ${args.project}, task ${taskIdentity(task)}`,
    }),
  },
  "resolve-review": {
    recipe: "implement",
    status: "resolve-review",
    params: (args, task) => ({
      cycle_phase: "resolve-review",
      implementation_source: `Resolve review findings from Vestige lifecycle thread for project ${args.project}, task ${taskIdentity(task)}`,
    }),
  },
  rereview: {
    recipe: "code-review",
    status: "rereview",
    params: (args, task) => ({
      cycle_phase: "rereview",
      target: `Rereview resolved findings from Vestige lifecycle thread for project ${args.project}, task ${taskIdentity(task)}`,
    }),
  },
};

function runManualPhase(args: CliArgs): void {
  const task = resolveTask(args.project, args.task);
  if (!isManualPhase(args.command)) {
    throw new Error(`Unsupported manual phase '${args.command}'.`);
  }
  const spec = manualPhaseSpecs[args.command];
  runRecipe(spec.recipe, phaseParams(args, task, spec.params(args, task)), args.dryRun);
  writeActiveState({
    project: args.project,
    task: taskIdentity(task),
    taskwarriorUuid: task.uuid,
    status: spec.status,
    updatedAt: new Date().toISOString(),
  }, args.dryRun);
}

function runStart(args: CliArgs): void {
  const task = args.task ? resolveTask(args.project, args.task) : findEligibleTask(args.project);
  console.log(`Selected task: ${taskLabel(task)}`);
  writeActiveState({
    project: args.project,
    task: taskIdentity(task),
    taskwarriorUuid: task.uuid,
    status: "selected",
    updatedAt: new Date().toISOString(),
  }, args.dryRun);

  runRecipe("cycle-start", phaseParams(args, task), args.dryRun);
  runRecipe("plan", phaseParams(args, task), args.dryRun);
  runRecipe("implement", phaseParams(args, task, {
    implementation_source: `Vestige lifecycle thread for project ${args.project}, task ${taskIdentity(task)}`,
  }), args.dryRun);
  runRecipe("test-writer", phaseParams(args, task, {
    test_source: `Vestige lifecycle thread for project ${args.project}, task ${taskIdentity(task)}`,
  }), args.dryRun);
  runRecipe("code-review", phaseParams(args, task, {
    target: `Vestige lifecycle thread for project ${args.project}, task ${taskIdentity(task)}`,
  }), args.dryRun);

  if (args.dryRun) {
    console.log("Dry run: skipping review-state inspection and learn/resolve loop.");
    return;
  }

  for (let cycle = 0; cycle <= args.maxReviewCycles; cycle++) {
    const current = resolveTask(args.project, taskIdentity(task));
    const state = reviewState(current);
    if (state === "approved") {
      runRecipe("document-learn", phaseParams(args, current, {
        artifact_bundle: `Vestige lifecycle thread for project ${args.project}, task ${taskIdentity(current)}`,
      }), false);
      writeActiveState({
        project: args.project,
        task: taskIdentity(current),
        taskwarriorUuid: current.uuid,
        status: "learned",
        updatedAt: new Date().toISOString(),
      }, false);
      console.log("Goose cycle stopped after document/learn. Final human review is required before `goose-cycle close`.");
      return;
    }
    if (state === "blocked" || state === "unknown") {
      console.log(`Review state is ${state}. Stopping before learn so a human can inspect Vestige/Taskwarrior.`);
      return;
    }
    if (cycle === args.maxReviewCycles) {
      console.log(`Reached max review cycles (${args.maxReviewCycles}). Stopping for human inspection.`);
      return;
    }

    runRecipe("implement", phaseParams(args, current, {
      cycle_phase: "resolve-review",
      implementation_source: `Resolve review findings from Vestige lifecycle thread for project ${args.project}, task ${taskIdentity(current)}`,
    }), false);
    runRecipe("code-review", phaseParams(args, current, {
      cycle_phase: "rereview",
      target: `Rereview resolved findings from Vestige lifecycle thread for project ${args.project}, task ${taskIdentity(current)}`,
    }), false);
  }
}

function runClose(args: CliArgs): void {
  const active = readActiveState();
  const taskRef = args.task || active?.task;
  if (!taskRef) {
    throw new Error("close requires --task or an existing .goose-cycle/active.json pointer.");
  }
  const task = resolveTask(args.project, taskRef);
  runRecipe("cycle-close", phaseParams(args, task, { commit: args.commit }), args.dryRun);
}

function main(): void {
  const args = parseArgs();
  try {
    if (args.command === "status") {
      printStatus(args.project, args.task);
    } else if (args.command === "start" || args.command === "next") {
      runStart(args);
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
