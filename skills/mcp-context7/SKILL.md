---
name: mcp-context7
description: "Context7 MCP — use for official library documentation, framework APIs, code examples, and migration guides. Triggers on: library/framework questions, 'how to use [library]', '[library] docs', '[library] API', '[library] example', import statements in code, package.json library lookups, framework names (React, Vue, Quasar, Next.js, Nuxt, Express, Fastify, Nest.js, Prisma, tRPC, Zod, Tailwind, Bootstrap, Jest, Vitest, Playwright). Provides 70-80% token savings over web searching for library docs."
---

# Context7 MCP - Library Documentation

Use Context7 for official library docs instead of web searching or guessing APIs. Two-step operation: resolve the library ID first, then query docs.

## Tools

| Direct/native tool | Goose SDK wrapper | Purpose |
|------|------|---------|
| `mcp__context7__resolve-library-id` | `Context7.resolveLibraryId` | Resolve a library name to a Context7-compatible ID |
| `mcp__context7__query-docs` | `Context7.queryDocs` | Query documentation using a resolved library ID |

## Goose TypeScript SDK

Use the `Context7` namespace when the Goose typed SDK is available. Both calls return `Promise<any>`.

```ts
const resolved = await Context7.resolveLibraryId({
  libraryName: "Quasar",
  query: "QDialog component props and events",
});

const docs = await Context7.queryDocs({
  libraryId: "/quasarframework/quasar",
  query: "QDialog props and emitted events",
});
```

| Function | Required input | Optional input | Return |
|---|---|---|---|
| `Context7.resolveLibraryId` | `libraryName: string`, `query: string` | — | `Promise<any>` with matching library IDs and metadata |
| `Context7.queryDocs` | `libraryId: string`, `query: string` | — | `Promise<any>` with documentation answer/snippets |

Important: the Goose SDK wrapper does **not** expose a `tokens` parameter. Do not include unsupported fields.

## Two-Step Pattern

**Step 1: Resolve the library ID**

```ts
await Context7.resolveLibraryId({
  libraryName: "quasar",
  query: "QDialog props and events",
});
```

Returns a `libraryId` like `/quasarframework/quasar`.

**Step 2: Query docs with that ID**

```ts
await Context7.queryDocs({
  libraryId: "/quasarframework/quasar",
  query: "QDialog props and events",
});
```

| Parameter | Required | Notes |
|-----------|----------|-------|
| `libraryName` | Yes (step 1) | Official library/package name |
| `query` | Yes (both steps) | What you need help with |
| `libraryId` | Yes (step 2) | Output from step 1 or user-provided `/org/project[/version]` ID |

## Examples

| Request | Step 1 | Step 2 Query |
|---------|--------|--------------|
| "QDialog in Quasar" | `libraryName: "quasar"` | `"QDialog props events"` |
| "React useEffect cleanup" | `libraryName: "react"` | `"useEffect cleanup return"` |
| "Prisma findMany where" | `libraryName: "prisma"` | `"findMany where clause syntax"` |
| "Express middleware order" | `libraryName: "express"` | `"middleware error handling order"` |
| "Zod schema validation" | `libraryName: "zod"` | `"schema validation string number"` |

## Decision Logic

```
IF specific library/framework API question → Context7 (two-step)
IF import detected AND user asks about that library → Context7
IF library not found in step 1 → fallback to Tavily
IF "latest" / post-cutoff features (2025+) → Tavily instead
IF general programming concept (closures, async) → native knowledge
IF debugging business logic (no library APIs) → native or Sequential Thinking
```

## Query Optimization

Include component/function name + what you want + context. Be specific.

| Good | Avoid |
|------|-------|
| "Quasar QDialog props and events" | "How does Quasar work?" |
| "React useEffect cleanup function" | "React hooks" |
| "Prisma findMany where clause syntax" | "Prisma queries" |

If initial results insufficient, narrow: "Quasar form validation" → "Quasar QForm rules API ref"

## Supported Libraries

**Frontend**: React, Vue, Quasar, Next.js, Nuxt, Svelte, Angular, Tailwind, Bootstrap
**Backend**: Express, Fastify, Nest.js, tRPC, Prisma, Sequelize, TypeORM
**Utilities**: Zod, Yup, Joi, Lodash, date-fns
**Build/Test**: Vite, Webpack, Jest, Vitest, Playwright, Cypress

## Setup

### Method 1: Using `goose configure`

```bash
goose configure
# Select "Add Extension" → "Command-line Extension"
# Name: context7
# Command: npx
# Args: -y @upstash/context7-mcp@latest
# Timeout: 60
```

### Method 2: Using Deeplink

```
goose://extension?cmd=npx&arg=-y&arg=@upstash/context7-mcp@latest&timeout=60&id=context7&name=Context7&description=Library%20documentation%20lookup
```

### Method 3: Direct Config Edit

Add to `~/.config/goose/config.yaml`:

```yaml
extensions:
  context7:
    enabled: true
    name: context7
    type: stdio
    cmd: npx
    args: ["-y", "@upstash/context7-mcp@latest"]
    timeout: 60
```

No API key required.
