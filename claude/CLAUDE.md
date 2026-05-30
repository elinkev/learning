# Repo purpose

Study repo for the **Claude Certified Architect** exam (https://claudecertifications.com/claude-certified-architect/study-guide).
Notes are gathered in `notes.txt` from the certification playlist (https://www.youtube.com/playlist?list=PLFz7SvAnfqLpjPCPJBkUy077BC5ecuE8c).
Later: small practice projects built from those notes.

When the user asks you to "explain X", "quiz me on X", or build a practice exercise, treat `notes.txt` as the source of truth and keep terminology consistent with it.

# What the notes cover

Four exam domains, organized as `part N` sections in `notes.txt`.

## Domain 1 — Agent design & orchestration (parts 2–8)
- **Agentic loop (part 2):** `messages.create()` params, `stop_reason` (`end_turn` / `tool_use` / `max_tokens`) as the only control signal, 4-step loop (call → check stop_reason → execute tools → append & loop), model-driven vs scripted automation.
- **Multi-agent coordinator (part 3):** hub-and-spoke, isolated context, coordinator responsibilities (decompose → delegate → aggregate → evaluate → respond), Task tool, parallel vs sequential, dynamic routing, structured handoffs.
- **Subagent config & context (part 4):** raw API vs SDK, `AgentDefinition` 5 fields (name, description, system_prompt, tools, allowed_tools), minimum-tools principle, fork sessions, goal-oriented prompts.
- **Multi-step workflows (part 5):** probabilistic vs deterministic compliance, prerequisite gates, structured escalation handoffs (`action_requested`, `context`, `options`, `recommended_action`), `PreToolUse` / `PostToolUse` hooks.
- **Hooks & data normalization (part 6):** PostToolUse for normalization (unix→iso, numeric→string status), PreToolUse to block policy violations. Hooks deterministic, prompts probabilistic.
- **Prompt chaining vs dynamic decomposition (part 7):** fixed pipeline vs adaptive plan, attention dilution ("lost in the middle"), per-file passes + integration pass.
- **Sessions (part 8):** `--session`, `--resume`, `fork_session`, stale context problem, decision framework (resume / resume-with-caution / start fresh).

## Domain 2 — Tool design & MCP integration (parts 9–13)
- **Tool interfaces (part 9):** tools are descriptions; 5 elements (purpose, input, output, when to use, boundary), system-prompt keyword trap, split generic into specific tools.
- **Structured error responses (part 10):** `isError` flag + 4 categories (transient / validation / business / permission), 5 fields (`errorCategory`, `isRetryable`, `message`, `customerMessage`, `suggestion`), access failures vs valid empty results, local recovery in subagents.
- **Tool distribution (part 11):** 4–5 tools per agent optimum, scoped access, cross-role tools, `tool_choice` (auto / any / forced), constrained alternatives.
- **MCP servers (part 12):** `.mcp.json` (project, committed) vs `~/.claude.json` (user), `${ENV_VAR}` expansion, MCP resources as read-only catalogs, community vs custom servers, enhance descriptions via CLAUDE.md.
- **Built-in tools (part 13):** grep / glob / read / write / edit / bash. Two-phase search (grep → read), edit fallback (read + write), incremental exploration.

## Domain 3 — Configuration & workflows (parts 14–19)
- **CLAUDE.md hierarchy (part 14):** user `~/.claude/CLAUDE.md` < project `./CLAUDE.md` < subdirectory `packages/x/CLAUDE.md`; `@import` syntax, `.claude/rules/` auto-loaded, `/memory` to diagnose.
- **Slash commands & skills (part 15):** `.claude/commands/` (commands), `.claude/skills/` (skills with YAML frontmatter: `context: fork`, `allowed-tools`, `argument-hint`). Commands = shortcuts, skills = plugins; CLAUDE.md always loaded vs skills on-demand.
- **Path-specific rules (part 16):** `paths:` glob field in rules under `.claude/rules/` for cross-cutting concerns; beats subdirectory CLAUDE.md when files are spread across the tree.
- **Plan mode vs direct execution (part 17):** plan mode for architectural / multi-file / multi-approach work; direct execution for single-file, known approaches. Explore subagent isolates investigation output.
- **Iterative refinement (part 18):** concrete input/output examples > prose, test-driven iteration, interview pattern, interacting vs independent issues.
- **CI/CD integration (part 19):** `claude -p` (non-interactive), `--output-format json` + `--json-schema`, CLAUDE.md as CI context, fresh-session reviews, include prior findings to avoid duplicates.

## Domain 4 — Prompt engineering for production (parts 20–25)
- **Explicit criteria (part 20):** categorical definitions > subjective thresholds, severity tiers with concrete code examples, define what to skip as explicitly as what to report.
- **Few-shot prompting (part 21):** 2–4 examples (4–5 for ambiguous), include reasoning, demonstrate null/edge cases, structurally diverse examples.
- **Structured output (part 22):** `tool_use` with JSON schema eliminates syntax errors (not semantic), `tool_choice: "any"` forces a tool call, nullable fields + enum `"unclear"`/`"other"` prevent hallucination.
- **Validation & retry loops (part 23):** retry-with-error-feedback works for format/structural errors, not for absent info; `detected_pattern` tag for trend analysis; `stated_total` vs `calculated_total` + `conflict_detected`; max 1–2 retries then human review.
- **Batch processing (part 24):** synchronous (real-time, full cost) vs Message Batches API (≤24h, 50% cheaper, NO multi-turn tool calling). `custom_id` to correlate, resubmit only failures, refine prompt with synchronous first.
- **Multi-instance review (part 25):** self-review is biased — use fresh sessions; multi-pass architecture (per-file parallel → cross-file integration → confidence verification rating 1–5).

# Working in this repo

- Primary artifact today is `notes.txt`. Keep edits there terse and in the existing nested-bullet style. Do not reformat existing parts.
- If asked to add notes for a new "part N", append at the end and follow the same structure: section header, subtopics, anti-patterns, "N things to know".
- `/structure-notes` (defined at `.claude/commands/structure-notes.md`) converts `notes.txt` into a structured `docs/notes.json` — flat `parts[]` with `domain`, `task`, `topic`, `anti_patterns`, `things_to_know`. Re-run it after appending new parts; the command file itself is the authoritative spec for the JSON schema and parsing rules.
- `docs/` holds the static study-quiz site (`index.html` + `app.js` + `styles.css` + `notes.json`), served by GitHub Pages from `main` branch / `/docs`. Preview locally with `cd docs && python3 -m http.server`. The site fetches `./notes.json`, so re-running `/structure-notes` is enough to refresh quiz content — no code changes needed for new parts.
- When practice projects are added later, they'll likely live in subdirectories — apply Domain 2/3 conventions (scoped tools, path-specific rules) when designing them.
- The user is studying for an exam, so prefer answers that map back to the exam's terminology and the "things to know" lists rather than inventing parallel vocabulary.
