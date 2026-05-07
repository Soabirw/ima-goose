---
name: "mcp-sequential-thinking"
description: "Sequential Thinking MCP — use for debugging, root cause analysis, trade-off evaluation, architectural decisions, and any multi-step problem where the approach may need revision mid-stream. Triggers on: think through, step by step, debug this, figure out why, what's causing, root cause, troubleshoot, analyze, trade-offs, pros and cons, why is this failing, complex problem, design decision, how should we approach. Prevents expensive trial-and-error by structuring reasoning before acting."
---

# Sequential Thinking MCP - Structured Reasoning

Use for: debugging, root cause analysis, trade-off evaluation, architectural decisions, multi-step problems requiring mid-stream revision.

Skip for: simple tasks, obvious answers, single-step operations.

## Tool

| Tool | Purpose |
|------|---------|
| `mcp__sequential-thinking__sequentialThinking` | Execute one thought in a reasoning chain |

## Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `thought` | Yes | Current thinking step |
| `nextThoughtNeeded` | Yes | `true` to continue, `false` when done |
| `thoughtNumber` | Yes | Current step (1, 2, 3...) |
| `totalThoughts` | Yes | Estimated total — adjust freely |
| `isRevision` | No | `true` if revising a previous thought |
| `revisesThought` | No | Which thought number being revised |
| `branchFromThought` | No | Branch point thought number |
| `branchId` | No | Branch identifier |

## Usage Patterns

### Start chain
```
mcp__sequential-thinking__sequentialThinking
  thought: "The bug report says form submits but data isn't saved. Failure points: frontend validation, AJAX request, backend handler, DB write."
  nextThoughtNeeded: true
  thoughtNumber: 1
  totalThoughts: 5
```

### Continue
```
mcp__sequential-thinking__sequentialThinking
  thought: "Based on step 1, checking AJAX request first..."
  nextThoughtNeeded: true
  thoughtNumber: 2
  totalThoughts: 5
```

### Revise
```
mcp__sequential-thinking__sequentialThinking
  thought: "My assumption in thought 2 was wrong. Reconsidering..."
  nextThoughtNeeded: true
  thoughtNumber: 3
  totalThoughts: 6
  isRevision: true
  revisesThought: 2
```

### Branch for alternatives
```
mcp__sequential-thinking__sequentialThinking
  thought: "Exploring alternative approach from step 2..."
  nextThoughtNeeded: true
  thoughtNumber: 4
  totalThoughts: 7
  branchFromThought: 2
  branchId: "alternative-approach"
```

### Conclude
```
mcp__sequential-thinking__sequentialThinking
  thought: "Root cause: field name mismatch — frontend sends 'user_email', backend expects 'email'."
  nextThoughtNeeded: false
  thoughtNumber: 5
  totalThoughts: 5
```

## Best Practices

- Adjust `totalThoughts` freely — it's an estimate
- Express uncertainty inline: "I'm not sure, but..."
- Revise with `isRevision` when understanding changes
- Keep `nextThoughtNeeded: true` until confident
- Branch to compare approaches, not just to explore

## Setup

**goose automatically enables extensions when needed**, but you can also add it manually:

### Method 1: Using `goose configure`

```bash
goose configure
# Select "Add Extension" → "Command-line Extension"
# Name: Sequential Thinking
# Command: npx
# Args: -y @modelcontextprotocol/server-sequential-thinking@latest
# Timeout: 300
```

### Method 2: Using Deeplink

```bash
goose://extension?cmd=npx&arg=-y&arg=@modelcontextprotocol/server-sequential-thinking@latest&timeout=300&id=sequential-thinking&name=Sequential%20Thinking&description=Structured%20reasoning%20for%20complex%20problems
```

### Method 3: Direct Config Edit

Add to `~/.config/goose/config.yaml`:

```yaml
extensions:
  sequential-thinking:
    enabled: true
    name: sequential-thinking
    type: stdio
    cmd: npx
    args: ["-y", "@modelcontextprotocol/server-sequential-thinking@latest"]
    timeout: 300
```

## Verification

After setup, verify the extension is working:

```bash
# Check if extension is loaded
goose info -v | grep sequential

# Test by asking goose to use sequential thinking
goose "Use sequential thinking to analyze why a form submit might fail"
```

If the extension is properly configured, goose should automatically detect when sequential thinking is needed based on your prompt.
