---
name: "mcp-chrome-devtools"
description: "Chrome DevTools MCP — inspect and debug browser pages through Chrome DevTools. Use for frontend debugging, console/network inspection, DOM checks, screenshots, and performance investigations."
---

# Chrome DevTools MCP

Use Chrome DevTools when a task needs live browser inspection rather than static file analysis.

## Common Uses

- Inspect console errors and network failures.
- Verify DOM state, layout, screenshots, and interactive behavior.
- Debug local web apps running on localhost.
- Investigate performance, page load, and client-side runtime behavior.

## Goose Extension

```yaml
extensions:
  chrome-devtools:
    enabled: true
    name: chrome-devtools
    type: stdio
    cmd: npx
    args: ["-y", "chrome-devtools-mcp@latest"]
    timeout: 60
```

## Usage Pattern

1. Start or identify the web app URL.
2. Open or attach to the target page with Chrome DevTools tools.
3. Check console, network, DOM, and screenshots as needed.
4. Fix the code, then re-check the browser behavior.

## Verification

```text
Use Chrome DevTools to inspect http://localhost:3000 for console errors.
```
