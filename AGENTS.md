## ADOS Project Skills

Before implementing code changes, read `.claude/skills/coding-discipline/SKILL.md` and apply it together with the matching project and framework skills below.

Before changing this project, load the skill that matches the task:

| Context | Skill |
| --- | --- |
| ADOS app code, docs, env vars, local Docker, Drizzle, MinIO, Playwright | `~/.codex/skills/ados-website/SKILL.md` |
| GitHub Actions, GHCR, Dokploy, branch protection, deploys, hotfixes, backports | `~/.codex/skills/ados-ci-dokploy/SKILL.md` |

Framework skills still apply when the touched area needs them:

| Context | Skill |
| --- | --- |
| Next.js App Router | `~/.codex/skills/nextjs-15/SKILL.md` |
| React components and hooks | `~/.codex/skills/react-19/SKILL.md` |
| TypeScript types and contracts | `~/.codex/skills/typescript/SKILL.md` |
| Tailwind CSS 4 styling | `~/.codex/skills/tailwind-4/SKILL.md` |
| Zustand 5 state management | `~/.claude/skills/zustand-5/SKILL.md` |
| Zod 4 schema validation | `~/.agents/skills/zod-4/SKILL.md` |
| Playwright E2E tests | `~/.claude/skills/playwright/SKILL.md` |

UI/UX skills for design and audit work:

| Context | Skill |
| --- | --- |
| Frontend UI/UX audit, responsive design, accessibility | `~/.config/opencode/skill/frontend-audit/SKILL.md` |
| QA user flow testing, UX friction, edge cases | `~/.config/opencode/skill/qa-user-audit/SKILL.md` |

Use `bat`, `rg`, `fd`, `sd`, and `eza` for local inspection. Do not use `cat`, `grep`, `find`, `sed`, or `ls` in this repository.

<!-- CODEGRAPH_START -->
## CodeGraph

This project has a CodeGraph MCP server (`codegraph_*` tools) configured. CodeGraph is a tree-sitter-parsed knowledge graph of every symbol, edge, and file. Reads are sub-millisecond and return structural information plain text search cannot.

### When to prefer codegraph over native search

Use codegraph for **structural** questions — what calls what, what would break, where is X defined, what is X's signature. Use native literal search/read only for **literal text** queries (string contents, comments, log messages) or after you already have a specific file open.

| Question | Tool |
|---|---|
| "Where is X defined?" / "Find symbol named X" | `codegraph_search` |
| "What calls function Y?" | `codegraph_callers` |
| "What does Y call?" | `codegraph_callees` |
| "What would break if I changed Z?" | `codegraph_impact` |
| "Show me Y's signature / source / docstring" | `codegraph_node` |
| "Give me focused context for a task/area" | `codegraph_context` |
| "Survey an unfamiliar module/topic" | `codegraph_explore` |
| "What files exist under path/" | `codegraph_files` |
| "Is the index healthy?" | `codegraph_status` |

### Rules of thumb

- **Trust codegraph results.** They come from a full AST parse. Do NOT re-verify them with a broad text search — that's slower, less accurate, and wastes context.
- **Don't literal-search first** when looking up a symbol by name. `codegraph_search` is faster and returns kind + location + signature in one call.
- **Don't chain `codegraph_search` + `codegraph_node`** when you just want context — `codegraph_context` is one call.
- **`codegraph_explore` is the heavy hitter** for unfamiliar areas — it returns full source from all relevant files in one call, but is token-heavy. If your harness supports parallel subagents (e.g., Claude Code's Task tool), spawn one for explore-class questions to keep main session context clean.
- **Index lag**: the file watcher debounces ~500ms behind writes; don't re-query immediately after editing a file in the same turn.

### If `.codegraph/` doesn't exist

The MCP server returns "not initialized." Ask the user: *"I notice this project doesn't have CodeGraph initialized. Want me to run `codegraph init -i` to build the index?"*
<!-- CODEGRAPH_END -->
