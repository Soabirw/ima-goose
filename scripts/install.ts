// ima-goose developer setup
// Run: node scripts/install.ts [--profile <name>] [--dest <recipe-dir>] [--validate]
// Profiles: openai (default), hybrid, anthropic, claude-acp
// Requires: Node 24+ (native TypeScript support)

import { execFileSync, execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Eta } from "eta";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

// ── CLI args ──────────────────────────────────────────────────────────────────

type CliArgs = {
  dest: string;
  profile: string;
  validate: boolean;
};

type Profile = {
  name: string;
  tiers: Record<string, string>;
  providers: Record<string, string>;
};

type RecipeTemplate = {
  outputName: string;
  relativePath: string;
  sourcePath: string;
};

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const parsed = {
    dest: path.join(os.homedir(), ".config", "goose", "recipes"),
    profile: "openai",
    validate: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--profile" && args[i + 1]) {
      parsed.profile = args[i + 1];
      i++;
    } else if (args[i] === "--dest" && args[i + 1]) {
      parsed.dest = path.resolve(args[i + 1].replace(/^~(?=$|\/)/, os.homedir()));
      i++;
    } else if (args[i] === "--validate") {
      parsed.validate = true;
    } else {
      console.error(`\n[ERROR] Unknown or incomplete argument: ${args[i]}`);
      console.error("        Usage: node scripts/install.ts [--profile <name>] [--dest <recipe-dir>] [--validate]");
      process.exit(1);
    }
  }

  return parsed;
}

// ── Profile loading ───────────────────────────────────────────────────────────

// Minimal YAML parser for our constrained profile schema:
//   tiers:
//     high: <id>
//     mid: <id>
//     low: <id>
//   providers:
//     high: <provider>
//     mid: <provider>
//     low: <provider>
function parseProfileYaml(content: string): {
  tiers: Record<string, string>;
  providers: Record<string, string>;
} {
  const result = {
    tiers: {} as Record<string, string>,
    providers: {} as Record<string, string>,
  };
  let section: "tiers" | "providers" | null = null;

  for (const rawLine of content.split("\n")) {
    const line = rawLine.replace(/#.*$/, "").replace(/\s+$/, "");
    if (!line.trim()) continue;

    const sectionMatch = line.match(/^(tiers|providers):\s*$/);
    if (sectionMatch) {
      section = sectionMatch[1] as "tiers" | "providers";
      continue;
    }

    const kvMatch = line.match(/^\s+([a-zA-Z0-9_.-]+):\s*(.+)$/);
    if (kvMatch && section) {
      const [, key, rawValue] = kvMatch;
      const value = rawValue.trim().replace(/^["']|["']$/g, "");
      result[section][key] = value;
    }
  }

  return result;
}

function requireProfileKeys(profile: Profile): void {
  const required = ["high", "mid", "low"];
  const missingTiers = required.filter((key) => !profile.tiers[key]);
  const missingProviders = required.filter((key) => !profile.providers[key]);

  if (missingTiers.length > 0 || missingProviders.length > 0) {
    console.error(`\n[ERROR] Profile '${profile.name}' must define tiers/providers for: high, mid, low`);
    if (missingTiers.length > 0) console.error(`        Missing tiers: ${missingTiers.join(", ")}`);
    if (missingProviders.length > 0) console.error(`        Missing providers: ${missingProviders.join(", ")}`);
    process.exit(1);
  }
}

function loadProfile(name: string): Profile {
  const profilePath = path.resolve(repoRoot, "profiles", `${name}.yaml`);
  if (!fs.existsSync(profilePath)) {
    const available = fs.existsSync(path.dirname(profilePath))
      ? fs.readdirSync(path.dirname(profilePath))
          .filter((f) => f.endsWith(".yaml"))
          .map((f) => f.replace(/\.yaml$/, ""))
          .join(", ")
      : "(none)";
    console.error(`\n[ERROR] Profile '${name}' not found at ${profilePath}`);
    console.error(`        Available profiles: ${available}`);
    process.exit(1);
  }
  const parsed = parseProfileYaml(fs.readFileSync(profilePath, "utf8"));
  const loaded = { name, ...parsed };
  requireProfileKeys(loaded);
  return loaded;
}

// ── Header ────────────────────────────────────────────────────────────────────

const cliArgs = parseArgs();
const profile = loadProfile(cliArgs.profile);

console.log("\nima-goose developer setup");
console.log("=".repeat(40));
console.log(`Profile: ${profile.name}`);
const tierSummary = Object.entries(profile.tiers)
  .map(([k, v]) => (k === v ? k : `${k}→${v}`))
  .join(", ");
console.log(`  Tiers:    ${tierSummary}`);
const providerSummary = Object.entries(profile.providers)
  .map(([k, v]) => `${k}→${v}`)
  .join(", ");
if (providerSummary) {
  console.log(`  Providers: ${providerSummary}`);
}

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
  const skillsSrc = path.resolve(repoRoot, "skills");
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

// ── Render and install recipes ────────────────────────────────────────────────

const generatedWarning =
  "# Generated by ima-goose. Edit source files under recipes/ and shared/, then rerun scripts/install.ts.\n";

function walkFiles(dir: string, predicate: (file: string) => boolean): string[] {
  if (!fs.existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath, predicate));
    } else if (predicate(fullPath)) {
      files.push(fullPath);
    }
  }
  return files;
}

function deriveRecipeOutputName(relativePath: string): string {
  const parts = relativePath.split(path.sep);
  const filename = parts.at(-1) ?? "";

  if (filename === "recipe.yaml.eta" && parts.length >= 2) {
    return `${parts.at(-2)}.yaml`;
  }

  const stem = relativePath
    .replace(/\.ya?ml\.eta$/, "")
    .split(path.sep)
    .filter(Boolean)
    .join("-");
  return `${stem}.yaml`;
}

function discoverRecipeTemplates(): RecipeTemplate[] {
  const recipesRoot = path.resolve(repoRoot, "recipes");
  const sourcePaths = walkFiles(recipesRoot, (file) => file.endsWith(".yaml.eta")).sort();
  return sourcePaths.map((sourcePath) => {
    const relativePath = path.relative(recipesRoot, sourcePath);
    return {
      outputName: deriveRecipeOutputName(relativePath),
      relativePath,
      sourcePath,
    };
  });
}

function indentMultiline(value: string, spaces: number): string {
  const prefix = " ".repeat(spaces);
  return value
    .replace(/\s+$/, "")
    .split("\n")
    .map((line) => (line.length > 0 ? `${prefix}${line}` : line))
    .join("\n");
}

function resolveIncludePath(requestedPath: string): string {
  if (path.isAbsolute(requestedPath)) {
    throw new Error(`Include path must be relative: ${requestedPath}`);
  }

  const normalized = path.normalize(requestedPath);
  if (normalized.startsWith("..")) {
    throw new Error(`Include path cannot escape the allowed roots: ${requestedPath}`);
  }

  const sharedRelative = normalized.startsWith(`shared${path.sep}`)
    ? normalized.replace(new RegExp(`^shared\\${path.sep}`), "")
    : normalized;
  const sharedCandidate = path.resolve(repoRoot, "shared", sharedRelative);
  const recipesCandidate = path.resolve(repoRoot, "recipes", normalized);

  for (const candidate of [sharedCandidate, recipesCandidate]) {
    const relativeToRoot = path.relative(repoRoot, candidate);
    if (!relativeToRoot.startsWith("..") && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(`Include not found: ${requestedPath}`);
}

function yamlScalar(value: unknown): string {
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null || value === undefined) return "null";
  return JSON.stringify(String(value));
}

function yaml(value: unknown, indent = 0): string {
  const emit = (input: unknown, depth: number): string => {
    const pad = " ".repeat(depth);
    if (Array.isArray(input)) {
      if (input.length === 0) return "[]";
      return input
        .map((item) => {
          if (item && typeof item === "object") {
            return `${pad}- ${emit(item, depth + 2).trimStart()}`;
          }
          return `${pad}- ${yamlScalar(item)}`;
        })
        .join("\n");
    }
    if (input && typeof input === "object") {
      const entries = Object.entries(input as Record<string, unknown>);
      if (entries.length === 0) return "{}";
      return entries
        .map(([key, item]) => {
          if (item && typeof item === "object") {
            return `${pad}${key}:\n${emit(item, depth + 2)}`;
          }
          return `${pad}${key}: ${yamlScalar(item)}`;
        })
        .join("\n");
    }
    return `${pad}${yamlScalar(input)}`;
  };

  return emit(value, indent);
}

function renderTemplate(template: RecipeTemplate): string {
  const eta = new Eta();
  const templateContent = fs.readFileSync(template.sourcePath, "utf8");
  const settings = {
    profile: profile.name,
    tiers: profile.tiers,
    providers: profile.providers,
  };

  return eta.renderString(templateContent, {
    profile,
    settings,
    PROFILE_MODEL_HIGH: profile.tiers.high,
    PROFILE_MODEL_MID: profile.tiers.mid,
    PROFILE_MODEL_LOW: profile.tiers.low,
    PROFILE_PROVIDER_HIGH: profile.providers.high,
    PROFILE_PROVIDER_MID: profile.providers.mid,
    PROFILE_PROVIDER_LOW: profile.providers.low,
    include: (requestedPath: string, indent = 0): string => {
      const included = fs.readFileSync(resolveIncludePath(requestedPath), "utf8");
      const rendered = indent > 0 ? indentMultiline(included, indent) : included.replace(/\s+$/, "");
      return `${rendered}\n\n`;
    },
    indent: indentMultiline,
    json: (value: unknown) => JSON.stringify(value, null, 2),
    yaml,
  });
}

function rewriteSubRecipePaths(content: string, template: RecipeTemplate, outputBySource: Map<string, string>): string {
  const templateDir = path.dirname(template.relativePath);

  const resolveRenderedPath = (rawPath: string): string | null => {
    const sourceRelative = path
      .normalize(path.join(templateDir, rawPath))
      .replace(/\\/g, "/");
    return outputBySource.get(sourceRelative) ?? null;
  };

  const blockStyle = content.replace(
    /^(\s*path:\s*)(["']?)([^"'\n#]+\.ya?ml(?:\.eta)?)(["']?)(\s*(?:#.*)?)$/gm,
    (match, prefix, quote, rawPath, closingQuote, suffix) => {
      const outputName = resolveRenderedPath(rawPath);
      if (!outputName) return match;
      return `${prefix}${quote}${outputName}${closingQuote}${suffix}`;
    },
  );

  return blockStyle.replace(
    /(path:\s*)(["']?)([^"',}\]\s#]+\.ya?ml(?:\.eta)?)(["']?)/g,
    (match, prefix, quote, rawPath, closingQuote) => {
      const outputName = resolveRenderedPath(rawPath);
      if (!outputName) return match;
      return `${prefix}${quote}${outputName}${closingQuote}`;
    },
  );
}

function validateRecipe(recipePath: string): void {
  execFileSync("goose", ["recipe", "validate", recipePath], { stdio: "pipe" });
}

function installRecipes(): void {
  const recipesDest = cliArgs.dest;
  const templates = discoverRecipeTemplates();

  if (templates.length === 0) {
    console.error("\n[ERROR] No recipe templates found under recipes/**/*.yaml.eta.");
    process.exit(1);
  }

  const outputBySource = new Map(
    templates.map((template) => [template.relativePath.replace(/\\/g, "/"), template.outputName]),
  );
  const outputs = new Set<string>();

  fs.mkdirSync(recipesDest, { recursive: true });
  console.log(`\nRendering recipes to ${recipesDest}/`);

  for (const template of templates) {
    if (outputs.has(template.outputName)) {
      console.error(`\n[ERROR] Duplicate rendered recipe output: ${template.outputName}`);
      process.exit(1);
    }
    outputs.add(template.outputName);

    const dest = path.join(recipesDest, template.outputName);
    let content = renderTemplate(template);
    content = rewriteSubRecipePaths(content, template, outputBySource);
    content = `${generatedWarning}${content.replace(/^\s+/, "").replace(/\s*$/, "\n")}`;
    fs.writeFileSync(dest, content);

    if (cliArgs.validate) {
      validateRecipe(dest);
      console.log(`  rendered ${template.relativePath} → ${template.outputName} (valid)`);
    } else {
      console.log(`  rendered ${template.relativePath} → ${template.outputName}`);
    }
  }
}

// ── Install slash commands ───────────────────────────────────────────────────

const slashCommands = [
  {
    command: "architect",
    recipe: "architect.yaml",
  },
  {
    command: "prompt-starter",
    recipe: "prompt-starter.yaml",
  },
  {
    command: "serena-bootstrap",
    recipe: "serena-bootstrap.yaml",
  },
  {
    command: "serena-memorize",
    recipe: "serena-memorize.yaml",
  },
];

function ensureSlashCommand(): void {
  const configPath = path.join(os.homedir(), ".config", "goose", "config.yaml");

  if (!fs.existsSync(configPath)) {
    console.log("\nSlash commands: config.yaml not found; skipping custom slash command registration.");
    return;
  }

  let content = fs.readFileSync(configPath, "utf8");
  const registered: string[] = [];
  const existing: string[] = [];

  for (const slashCommand of slashCommands) {
    const recipePath = path.join(cliArgs.dest, slashCommand.recipe);
    const commandBlock = `  - command: "${slashCommand.command}"\n    recipe_path: "${recipePath}"`;

    if (new RegExp(`command:\\s*["']?${slashCommand.command}["']?`).test(content)) {
      existing.push(`/${slashCommand.command}`);
      continue;
    }

    if (/^slash_commands:\s*$/m.test(content)) {
      content = content.replace(/^slash_commands:\s*$/m, `slash_commands:\n${commandBlock}`);
    } else {
      content = `${content.replace(/\s*$/, "\n\n")}slash_commands:\n${commandBlock}\n`;
    }
    registered.push(`/${slashCommand.command}`);
  }

  fs.writeFileSync(configPath, content);
  if (registered.length > 0) {
    console.log(`\nSlash commands: registered ${registered.join(", ")}.`);
  }
  if (existing.length > 0) {
    console.log(`\nSlash commands: already registered ${existing.join(", ")}.`);
  }
}

// ── Check env vars ────────────────────────────────────────────────────────────

function checkEnvVars(): void {
  console.log("\nChecking environment variables:");

  const required = [
    { key: "TAVILY_API_KEY", note: "Required for Tavily web search — https://tavily.com" },
  ];
  const optional = [
    { key: "ATLASSIAN_BEARER_TOKEN", note: "Optional — Jira/Confluence API integration, preferred for app/service accounts" },
    { key: "ATLASSIAN_CLOUD_ID", note: "Optional — Jira/Confluence API integration with Bearer auth" },
    { key: "ATLASSIAN_DOMAIN", note: "Optional — Jira/Confluence API integration (e.g. your-org.atlassian.net)" },
    { key: "ATLASSIAN_API_TOKEN", note: "Optional — Jira/Confluence Basic auth fallback" },
    { key: "ATLASSIAN_EMAIL", note: "Optional — Jira/Confluence Basic auth fallback" },
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
  console.log("  3. Copy .goose-aliases.example to ~/.goose-aliases and source it:");
  console.log('       cp .goose-aliases.example ~/.goose-aliases');
  console.log('       echo \'[ -f "$HOME/.goose-aliases" ] && source "$HOME/.goose-aliases"\' >> ~/.bashrc');
  console.log("  4. Optional: enable the Practitioner persona via MOIM (see ~/.goose-aliases)");
  console.log("  5. Switch model profile any time:");
  console.log("       node scripts/install.ts --profile openai     # Default — GPT via codex-acp");
  console.log("       node scripts/install.ts --profile hybrid     # GPT high, Claude mid/low");
  console.log("       node scripts/install.ts --profile anthropic  # Direct Anthropic API");
  console.log("       node scripts/install.ts --profile claude-acp # Claude friendly shortnames");
  console.log('  6. Run: goose-wp, goose-ui, goose-explore, goose-implement, etc.');
  console.log('     Inside a session, run /architect for architecture guidance.');
  console.log('     Run /prompt-starter to build a prompt for a dedicated recipe session.');
  console.log('     Run /serena-bootstrap to reload project memory.');
  console.log('     Use /serena-memorize <note> to update standard Serena memories.');
  console.log("");
}

// ── Main ──────────────────────────────────────────────────────────────────────

checkGoose();
checkNodeVersion();
installSkills();
installRecipes();
ensureSlashCommand();
checkEnvVars();
printNextSteps();
