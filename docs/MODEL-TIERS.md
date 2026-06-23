# Model Profiles

Recipes use provider-neutral model tiers:

| Tier | Role | Typical recipes |
|---|---|---|
| `HIGH` | Deep reasoning and high-stakes judgment | brainstorm, plan, task-planner, code-review, review-verify, scorecard, design-to-code, research, orchestration |
| `MID` | Implementation and operational workflows | implement, wp-developer, js-developer, test-writer, document-learn, goose-ship-it |
| `LOW` | Cheap targeted lookup | explore |

Source recipes render their whole Goose `settings:` block from profile tier settings:

```yaml
settings:
<%~ it.profileSettings("high") %>
```

The profile renderer can include provider-specific recipe settings only where they
are supported, and omit settings such as `temperature` for providers that reject
them.

The old `opus` / `sonnet` / `haiku` source-tier vocabulary is deprecated.
Profiles must define `high`, `mid`, and `low`; the installer no longer falls
back to the old names.

## Default Profile: ChatGPT Codex

`node scripts/install.ts` defaults to `--profile chatgpt_codex`.

### ChatGPT Codex

| Tier | Provider | Model |
|---|---|---|
| `HIGH` | `chatgpt_codex` | `gpt-5.5` |
| `MID` | `chatgpt_codex` | `gpt-5.5` |
| `LOW` | `chatgpt_codex` | `gpt-5.5` |

Use as the default when Goose is configured with the native `chatgpt_codex` provider. Recipes
keep the base model ID because reasoning effort is runtime environment, not a
recipe model suffix. The profile declares per-tier `GOOSE_THINKING_EFFORT`
values for shell aliases: HIGH→`high`, MID→`medium`, LOW→`low`. Copy or merge
`.goose-aliases.example` to `~/.goose-aliases` after changing those profile env
values.

### OpenAI codex-acp fallback

| Tier | Provider | Model |
|---|---|---|
| `HIGH` | `codex-acp` | `gpt-5.5/high` |
| `MID` | `codex-acp` | `gpt-5.5/medium` |
| `LOW` | `codex-acp` | `gpt-5.5/low` |

Use `--profile openai` when the native `chatgpt_codex` provider is unavailable and the codex-acp path is configured locally.

### Hybrid

| Tier | Provider | Model |
|---|---|---|
| `HIGH` | `codex-acp` | `gpt-5.5/high` |
| `MID` | `claude-acp` | `sonnet` |
| `LOW` | `claude-acp` | `haiku` |

Use only when Claude ACP access is working locally.

### Anthropic Direct

| Tier | Provider | Model |
|---|---|---|
| `HIGH` | `anthropic` | `claude-opus-4-7` |
| `MID` | `anthropic` | `claude-sonnet-4-6` |
| `LOW` | `anthropic` | `claude-haiku-4-5` |

### Claude ACP

| Tier | Provider | Model |
|---|---|---|
| `HIGH` | `claude-acp` | `opus` |
| `MID` | `claude-acp` | `sonnet` |
| `LOW` | `claude-acp` | `haiku` |

Kept for users with working Claude ACP access. It is no longer the default.

## Recipe Assignments

| Recipe | Tier |
|---|---|
| `brainstorm` | HIGH |
| `plan` | HIGH |
| `software-development-cycle` | HIGH |
| `task-planner` | HIGH |
| `code-review` | HIGH |
| `review-verify` | HIGH |
| `scorecard` | HIGH |
| `adversarial-review` | HIGH |
| `ui-ux-designer` | HIGH |
| `design-to-code` | HIGH |
| `instructor` | HIGH |
| `ima-researcher` | HIGH |
| `patristic-researcher` | HIGH |
| `implement` | MID |
| `wp-developer` | MID |
| `js-developer` | MID |
| `test-writer` | MID |
| `document-learn` | MID |
| `goose-ship-it` | MID |
| `mcp-migration` | MID |
| `explore` | LOW |

Current-session slash commands, such as `/architect`, `/prompt-starter`,
`/serena-bootstrap`, and `/serena-memorize`, do not set a profile tier. They run
inside the current session provider/model.

## Explicit Adversarial Children

The adversarial child recipes intentionally bypass the profile tiers:

| Recipe | Provider | Model |
|---|---|---|
| `adversarial-review-claude` | `anthropic` | `claude-opus-4-7` |
| `adversarial-review-openai` | `codex-acp` | `gpt-5.5/high` |
| `vision-handoff` | `codex-acp` | `gpt-5.5/medium` |

This keeps model diversity for the experimental adversarial review workflow. `vision-handoff` is deliberately pinned even when the parent provider supports vision because the child hand-off saves context, standardizes output, and avoids provider-specific branching.
The Claude side requires direct Anthropic API access because Claude ACP access
has been unreliable for this use case.

## Switching Profiles

```bash
node ~/IMA/dev/ima-goose/scripts/install.ts --profile openai
node ~/IMA/dev/ima-goose/scripts/install.ts --profile chatgpt_codex
node ~/IMA/dev/ima-goose/scripts/install.ts --profile hybrid
node ~/IMA/dev/ima-goose/scripts/install.ts --profile anthropic
node ~/IMA/dev/ima-goose/scripts/install.ts --profile claude-acp
```

Switching profiles renders recipes into `~/.config/goose/recipes/*.yaml` with
the selected provider/model values. It does not update your global
`~/.config/goose/config.yaml` credentials; configure the matching provider there
as well.
