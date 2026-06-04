---
name: mcp-taskwarrior
description: "Taskwarrior CLI skill for managing local tasks with the `task` command. Use when the user asks to list, add, modify, complete, delete, export, import, search, tag, prioritize, schedule, inspect, or automate Taskwarrior tasks; when working with `.taskrc`, `TASKRC`, `TASKDATA`, Taskwarrior hooks, reports, contexts, recurrence, due/wait/scheduled dates, or JSON task data."
---

# Taskwarrior CLI

Use the local `task` command to inspect and manage the user's Taskwarrior database. Prefer structured Taskwarrior commands over editing data files directly.

## First Checks

Run these before assuming Taskwarrior is usable:

```bash
task --version
task diagnostics
```

If `task diagnostics` says `Cannot proceed without rc file`, Taskwarrior is installed but not initialized for the default user environment. In non-Serena sessions, ask whether to create/configure `~/.taskrc`, or use an isolated temp setup for testing:

```bash
tmp="$(mktemp -d)"
printf 'data.location=%s/data\nconfirmation=off\n' "$tmp" > "$tmp/taskrc"
mkdir -p "$tmp/data"
TASKRC="$tmp/taskrc" TASKDATA="$tmp/data" task add "Test task"
```

In Serena-enabled sessions, do not ask for `TASKRC`/`TASKDATA` immediately when
the default environment has no rc file. First complete Serena
`initial_instructions` and read standard memories, especially
`suggested_commands`, `conventions`, and `core`. Look there for project-local
Taskwarrior setup, wrapper commands, aliases, environment variables, task IDs,
or notes such as where the real task database lives. Only ask the user for
config after checking project memory and reporting what was missing.

For command experiments, always use temporary `TASKRC` and `TASKDATA` like the example above so you do not pollute the user's real task list.

## Safety Rules

- Read before write: run `task next`, `task list`, `task <filter> info`, or `task <filter> export` before changing tasks.
- Task IDs can change after reports. Use the ID from the latest displayed report, or prefer UUIDs for scripts.
- Do not run broad write commands such as `task modify ...`, `task delete`, or `task purge` without a filter or explicit user confirmation.
- Never run `purge` unless the user explicitly asks for permanent deletion. `delete` marks tasks deleted; `purge` removes deleted tasks permanently and is not reversible.
- Use `task undo` only for the most recent Taskwarrior action, and only when the user asks to reverse it or you just made an incorrect change.
- Avoid `task edit` for automation; it opens an editor and is easy to misuse. Use `modify`.
- For scripting/parsing, use `export`, `_get`, `_unique`, `ids`, or `uuids`, not table output.

## Output For Agents

Taskwarrior reports are human-readable tables. For reliable parsing:

```bash
task <filter> export
task <filter> uuids
task <filter> ids
task _get <id-or-uuid>.description
task +PENDING _unique project
task +PENDING _unique tags
```

Taskwarrior 3.x `export` returns a JSON array. Older documentation and hooks may discuss one JSON object per line, especially for hook input/output. Check the installed version when automation depends on exact format.

To reduce extra messages in scripts, use runtime overrides:

```bash
task rc.verbose=nothing <filter> export
task rc.confirmation=off <safe-specific-write-command>
```

Do not use `rc.confirmation=off` to bypass uncertainty. Use it only when the command is already specific and intended.

## Common Commands

```bash
task next
task list
task all
task completed
task waiting
task projects
task tags
task reports
task show
task show report.next
```

Add tasks:

```bash
task add "Call the bank"
task add "Finish quarterly report" project:Work +urgent priority:H due:friday
task add "Pay rent" project:Bills recur:monthly due:eom
task log "Already finished this"
```

Modify tasks:

```bash
task 5 modify priority:H
task 5 modify +important -oldtag
task 5 modify project:Work.Q4 due:tomorrow
task 5 modify due:
task 5 annotate "Waiting on vendor reply"
task 5 denotate "Waiting on vendor reply"
task 5 append "extra description words"
task 5 prepend "prefix words"
task 5 modify /old/new/
task 5 modify /old/new/g
```

Complete, delete, and undo:

```bash
task 5 done
task 5 delete
task undo
```

Start/stop active work:

```bash
task 5 start
task 5 stop
task active
```

Dependencies:

```bash
task 8 modify depends:5
task +BLOCKED list
task +UNBLOCKED list
task blocking
task blocked
```

## Filters

Filters come before the command. Multiple filter terms are usually combined with implicit `and`.

```bash
task project:Home list
task +urgent list
task due.before:eow list
task project:Work +urgent due.before:friday list
task /quarterly/ list
task '( project:Home or project:Garden )' list
task status:completed all
task +OVERDUE list
task +TODAY list
task 1,3,5-8 info
task <uuid> info
```

Common attributes:

- `project:<name>`
- `+tag` / `-tag`
- `priority:H|M|L` or `priority:` to clear
- `status:pending|completed|deleted|waiting|recurring`
- `due:<date>` / `due:` to clear
- `wait:<date>` hides a task until the date
- `scheduled:<date>` marks when work can begin
- `until:<date>` expires the task
- `recur:<duration>` creates recurrence
- `depends:<id-or-uuid>`

Virtual tags are filters computed from metadata. Useful examples include `+ACTIVE`, `+ANNOTATED`, `+BLOCKED`, `+COMPLETED`, `+DELETED`, `+DUE`, `+OVERDUE`, `+PENDING`, `+PROJECT`, `+READY`, `+SCHEDULED`, `+TAGGED`, `+TODAY`, `+TOMORROW`, `+WAITING`, and `+WEEK`. Do not try to add or remove virtual tags.

## Dates

Taskwarrior accepts ISO dates and named dates. Use explicit ISO dates when precision matters; named dates are fine for user-facing convenience.

```bash
task add "Submit invoice" due:2026-06-30
task add "Daily review" scheduled:today
task add "Follow up" wait:tomorrow
task calc eom
task calc now + 3d
```

Useful named dates include `today`, `tomorrow`, `yesterday`, weekday names, `eod`, `eow`, `eom`, `soy`, `eoy`, `soww`, and `eoww`. The default date input format is commonly `Y-M-D`, but `rc.dateformat` can change display and parsing. ISO-8601 dates work independently of `rc.dateformat`.

## Configuration

Taskwarrior normally reads `~/.taskrc`, with a required `data.location` such as:

```text
data.location=~/.task
```

Use `task show` to inspect effective settings. Use runtime overrides for one command:

```bash
task rc.regex=off /literal[brackets]/ list
task rc.data.location=/alternate/path list
```

Use environment variables for alternate config/data:

```bash
TASKRC=/path/to/taskrc TASKDATA=/path/to/data task list
```

Permanent config changes use `task config`, which edits `.taskrc` and may prompt:

```bash
task config regex off
task config report.next.limit 20
task config name
```

## Contexts

Contexts apply persistent filters.

```bash
task context list
task context define work project:Work
task context work
task context show
task context none
task context delete work
```

Remember that context affects many read and write commands. If results seem missing, run `task context show`.

## Import And Export

Use JSON export for backups, integration, and structured inspection:

```bash
task export > tasks.json
task project:Work export > work-tasks.json
task status:completed export > completed.json
task import tasks.json
task import -
```

`import` identifies tasks by UUID, so it can add new tasks or update existing ones. Be cautious with automated recurrence imports; inspect relevant recurrence configuration first.

## Hooks

Hooks are executable scripts in the hooks directory under `data.location`, usually `~/.task/hooks`. Names begin with the event:

```text
on-launch
on-exit
on-add
on-modify
on-add.01
on-add-require-project
```

Supported events:

- `on-launch`: before processing, can prevent launch.
- `on-exit`: after processing and before output, cannot modify tasks.
- `on-add`: receives the new task as JSON, can approve, deny, or modify before save.
- `on-modify`: receives original and modified task JSON, can approve, deny, or modify before save. Completion and deletion are modifications.

Hook scripts are enabled by executable permission and disabled by removing execute permission, renaming, or moving them. Use `task diagnostics` and `task rc.debug.hooks=1 ...` or `task rc.debug.hooks=2 ...` when debugging hooks. Treat hooks like executable software: inspect before installing.

## Troubleshooting

- `Cannot proceed without rc file`: no default `.taskrc`; configure one or use `TASKRC`/`TASKDATA`.
- Unexpected extra output: use `rc.verbose=nothing` for scripts.
- A task ID no longer targets the expected task: rerun a report or use UUID.
- Hidden tasks: check `wait`, `scheduled`, status, context, and reports such as `waiting`, `all`, `+READY`, `+PENDING`.
- Shell syntax issues: quote descriptions and filters containing spaces, parentheses, regexes, or special shell characters.
- Need help from the installed version: use `task help`, `task commands`, `task reports`, `man task`, `man taskrc`, and `task diagnostics`.
