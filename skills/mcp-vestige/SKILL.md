---
name: "mcp-vestige"
description: "Vestige MCP — cognitive memory with semantic search, spaced repetition, codebase awareness, and intentions. Use proactively for preferences, decisions, patterns, bugs, reminders, and prior context."
---

# Vestige MCP

Vestige is the neural memory layer. Use it for knowledge that should strengthen when reused and fade when it stops mattering.

## Session Start Protocol

Before asking avoidable questions:

1. Search for project context.
2. Search for user preferences relevant to the task.
3. Check pending intentions or reminders.

## Store Immediately

- User preferences and corrections.
- Architectural decisions and their rationale.
- Bug root causes worth remembering.
- Reusable codebase patterns.
- Future reminders or intentions.

Do not store credentials, one-off debugging noise, or content that belongs in durable documentation.

## Decision Rule

Use Vestige for fading knowledge: preferences, decisions, patterns, bugs, and intentions.

Use Qdrant for durable reference material: standards, PRDs, architecture docs, research, and reusable examples.

Use Serena for session state and project-scoped task progress.

## Goose Extension

```yaml
extensions:
  vestige:
    enabled: true
    name: vestige
    type: stdio
    cmd: vestige-mcp
    args: []
    timeout: 60
```

## Setup

Ensure `vestige-mcp` is on `PATH`.

Vestige config lives in `~/.config/vestige/` globally or `.vestige/` per project.

## Verification

```text
Search Vestige for preferences related to this project.
```
