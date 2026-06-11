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

## Goose TypeScript SDK

Use the `ChromeDevtools` namespace when the Goose typed SDK is available. Chrome DevTools wrappers return `Promise<any>`. Element actions require a `uid` from the latest `takeSnapshot` result.

| Purpose | Goose SDK wrapper | Required input | Common optional input |
|---|---|---|---|
| List pages | `ChromeDevtools.listPages` | `{}` | — |
| Select page | `ChromeDevtools.selectPage` | `pageId: number` | `bringToFront?: boolean` |
| New page | `ChromeDevtools.newPage` | `url: string` | `background?: boolean`, `isolatedContext?: string`, `timeout?: number` |
| Navigate/reload | `ChromeDevtools.navigatePage` | — | `type?: "url" \| "back" \| "forward" \| "reload"`, `url?: string`, `timeout?: number` |
| Close page | `ChromeDevtools.closePage` | `pageId: number` | — |
| Snapshot | `ChromeDevtools.takeSnapshot` | — | `verbose?: boolean`, `filePath?: string` |
| Screenshot | `ChromeDevtools.takeScreenshot` | — | `format?: "png" \| "jpeg" \| "webp"`, `uid?: string`, `fullPage?: boolean`, `filePath?: string` |
| Click | `ChromeDevtools.click` | `uid: string` | `dblClick?: boolean`, `includeSnapshot?: boolean` |
| Hover | `ChromeDevtools.hover` | `uid: string` | `includeSnapshot?: boolean` |
| Drag/drop | `ChromeDevtools.drag` | `from_uid: string`, `to_uid: string` | `includeSnapshot?: boolean` |
| Fill one field | `ChromeDevtools.fill` | `uid: string`, `value: string` | `includeSnapshot?: boolean` |
| Fill many fields | `ChromeDevtools.fillForm` | `elements: { uid: string; value: string }[]` | `includeSnapshot?: boolean` |
| Type text | `ChromeDevtools.typeText` | `text: string` | `submitKey?: string` |
| Press key | `ChromeDevtools.pressKey` | `key: string` | `includeSnapshot?: boolean` |
| Upload file | `ChromeDevtools.uploadFile` | `uid: string`, `filePath: string` | `includeSnapshot?: boolean` |
| Wait for text | `ChromeDevtools.waitFor` | `text: string[]` | `timeout?: number` |
| Evaluate script | `ChromeDevtools.evaluateScript` | `function: string` | `args?: string[]`, `filePath?: string`, `dialogAction?: string` |
| Console list/get | `ChromeDevtools.listConsoleMessages`, `ChromeDevtools.getConsoleMessage` | get: `msgid: number` | list: `pageSize?: number`, `pageIdx?: number`, `types?: ...` |
| Network list/get | `ChromeDevtools.listNetworkRequests`, `ChromeDevtools.getNetworkRequest` | get optional `reqid?: number` | file save paths, pagination filters |
| Dialog | `ChromeDevtools.handleDialog` | `action: "accept" \| "dismiss"` | `promptText?: string` |
| Emulation | `ChromeDevtools.emulate` | — | network, CPU, geolocation, UA, color scheme, viewport, headers |
| Resize | `ChromeDevtools.resizePage` | `width: number`, `height: number` | — |
| Lighthouse | `ChromeDevtools.lighthouseAudit` | — | `mode?: "navigation" \| "snapshot"`, `device?: "desktop" \| "mobile"`, `outputDirPath?: string` |
| Performance trace | `ChromeDevtools.performanceStartTrace`, `ChromeDevtools.performanceStopTrace`, `ChromeDevtools.performanceAnalyzeInsight` | analyze: `insightSetId`, `insightName` | trace file paths, reload/autoStop |
| Heap snapshot | `ChromeDevtools.takeHeapsnapshot` | `filePath: string` | — |

Example:

```ts
await ChromeDevtools.newPage({ url: "http://localhost:3000" });
const snapshot = await ChromeDevtools.takeSnapshot({});
const messages = await ChromeDevtools.listConsoleMessages({ pageSize: 20 });
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
