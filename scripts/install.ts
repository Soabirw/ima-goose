// ima-goose developer setup
// Run: node scripts/install.ts
// Requires: Node 24+ (native TypeScript support)

import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Header ────────────────────────────────────────────────────────────────────

console.log("\nima-goose developer setup");
console.log("=".repeat(40));

// ── Check Goose ───────────────────────────────────────────────────────────────

function checkGoose(): void {
  try {
    const version = execSync("goose --version", { stdio: "pipe" }).toString().trim();
    console.log(`\nGoose: ${version}`);
  } catch {
    console.warn("\n[WARN] goose not found in PATH.");
    console.warn("       Install: https://block.github.io/goose/docs/getting-started/installation");
  }
}

// ── Check Node version ────────────────────────────────────────────────────────

function checkNodeVersion(): void {
  const [major] = process.versions.node.split(".").map(Number);
  const version = process.versions.node;
  if (major < 24) {
    console.warn(`\n[WARN] Node ${version} detected. Node 24+ recommended for native TypeScript support.`);
  } else {
    console.log(`Node: v${version}`);
  }
}

// ── Copy skills ───────────────────────────────────────────────────────────────

function copyDirRecursive(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function installSkills(): void {
  const skillsSrc = path.resolve(__dirname, "..", "skills");
  const skillsDest = path.join(os.homedir(), ".agents", "skills");

  if (!fs.existsSync(skillsSrc)) {
    console.error("\n[ERROR] skills/ directory not found. Run from ima-goose repo root.");
    process.exit(1);
  }

  fs.mkdirSync(skillsDest, { recursive: true });
  console.log(`\nInstalling skills to ${skillsDest}/`);

  const skills = fs.readdirSync(skillsSrc, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  if (skills.length === 0) {
    console.warn("  [WARN] No skill directories found in skills/");
    return;
  }

  for (const skill of skills) {
    const src = path.join(skillsSrc, skill);
    const dest = path.join(skillsDest, skill);
    copyDirRecursive(src, dest);
    console.log(`  installed ${skill}`);
  }
}

// ── Check env vars ────────────────────────────────────────────────────────────

function checkEnvVars(): void {
  console.log("\nChecking environment variables:");

  const required = [
    { key: "TAVILY_API_KEY", note: "Required for Tavily web search — https://tavily.com" },
  ];
  const optional = [
    { key: "ATLASSIAN_API_TOKEN", note: "Optional — Jira/Confluence integration" },
    { key: "ATLASSIAN_EMAIL", note: "Optional — Jira/Confluence integration" },
    { key: "ATLASSIAN_SITE_URL", note: "Optional — Jira/Confluence integration (e.g. your-org.atlassian.net)" },
  ];

  for (const { key, note } of required) {
    if (process.env[key]) {
      console.log(`  ${key}: set`);
    } else {
      console.warn(`  [WARN] ${key}: not set — ${note}`);
    }
  }

  for (const { key, note } of optional) {
    if (!process.env[key]) {
      console.log(`  ${key}: not set (${note})`);
    }
  }
}

// ── Next steps ────────────────────────────────────────────────────────────────

function printNextSteps(): void {
  console.log("\n" + "=".repeat(40));
  console.log("Next steps:");
  console.log("  1. Copy config-template.yaml to ~/.config/goose/config.yaml");
  console.log("  2. Set TAVILY_API_KEY in your shell profile (~/.bashrc or ~/.zshrc)");
  console.log('  3. Run: goose session → "What skills are available?"');
  console.log("");
}

// ── Main ──────────────────────────────────────────────────────────────────────

checkGoose();
checkNodeVersion();
installSkills();
checkEnvVars();
printNextSteps();
