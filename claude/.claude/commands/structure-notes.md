Read `notes.txt` in the repo root, parse every `part N` section into a structured entry, and write the result to `docs/notes.json`. The notes are study notes for the Claude Certified Architect exam. The `docs/` location is what GitHub Pages serves for the study-quiz site (`docs/index.html` fetches `./notes.json`).

# Output schema

```json
{
  "source": {
    "title": "Claude Certified Architect — study notes",
    "playlist_url": "https://www.youtube.com/playlist?list=PLFz7SvAnfqLpjPCPJBkUy077BC5ecuE8c",
    "study_guide_url": "https://claudecertifications.com/claude-certified-architect/study-guide",
    "generated_from": "notes.txt"
  },
  "domains": [
    { "id": 1, "name": "Agent design & orchestration" },
    { "id": 2, "name": "Tool design & MCP integration" },
    { "id": 3, "name": "Configuration & workflows" },
    { "id": 4, "name": "Prompt engineering for production" }
  ],
  "parts": [
    {
      "part": 2,
      "domain": 1,
      "task": null,
      "topic": "agentic loops",
      "anti_patterns": [
        { "name": "...", "explanation": "..." }
      ],
      "things_to_know": ["...", "..."]
    }
  ]
}
```

# Source structure

`notes.txt` is tab-indented:
- `part N` headers start at column 0 (zero tabs).
- Subtopics are at 1-tab indent, prefixed with `- `.
- Items inside a subtopic are at 2-tab indent.
- Deeper nesting is sub-detail and should be ignored for this conversion.

Header formats seen in the wild: `part 2 - agentic loops`, `part - 6` (no topic), `part 13` (no topic, no dash).

# Parsing rules

- **One entry per `part N`** in `parts[]`. **Skip part 1** — it's exam meta, no domain, no anti-patterns, no recap.
- **`part`** — the integer from the header.
- **`topic`** — prefer the header tail (`part 2 - agentic loops` → `"agentic loops"`). If the header has no tail, take the topic from the first 1-tab body line matching `domain N - task X.Y - <topic>` or, failing that, `domain N - <topic>`.
- **`domain`** — prefer an explicit `domain N - task X.Y` line in the body. Fallback by part number: parts 2–8 → 1, 9–13 → 2, 14–19 → 3, 20–25 → 4. Anything outside that range needs a judgement call — flag it in the user-facing summary.
- **`task`** — capture `X.Y` from any `task X.Y` reference at 1-tab indent in the body (parts 6 and later have these; earlier parts use `null`).
- **`anti_patterns`** — locate the 1-tab section whose stripped text matches `\d*\s*anti-?patterns?(\s+to\s+avoid)?` (count is optional — part 23 uses just `anti-patterns`). Each immediate child at 2-tab indent is one entry. Split that child's text on the **first** ` - ` to fill `name` / `explanation`; if there's no separator, the whole string is `name` and `explanation` is `""`.
- **`things_to_know`** — locate the 1-tab section whose stripped text matches `\d*\s*(things|thinks)\s+to\s+know` (note: part 5 has the typo `thinks to know`). Each 2-tab child becomes one verbatim string in the array.

# Output formatting

- File: `./docs/notes.json` (overwrite if it exists). Create `docs/` if it does not exist.
- JSON: 2-space indent, UTF-8, no escaping of unicode (em-dashes etc. stay literal), single trailing newline.
- `parts[]` sorted by `part` ascending.
- **Do not pre-format strings.** A PostToolUse hook (`.claude/hooks/normalize_notes.py`) fires after this command's Write and applies whitespace trimming, acronym/proper-noun fix-ups (mcp→MCP, api→API, claude→Claude, etc.), and smart first-letter capitalization to all `topic`, `anti_patterns[].name`, `anti_patterns[].explanation`, and `things_to_know[]` strings. The hook also lints the file and prints any issues to stderr. Your job is faithful transcription — leave casing/whitespace exactly as it appears in `notes.txt` and let the hook handle it.

# Verification (run after writing)

```sh
jq '.parts | length' docs/notes.json
jq '[.parts[].domain] | unique' docs/notes.json          # expect [1,2,3,4]
jq '[.parts[] | select(.domain == 1) | .part]' docs/notes.json  # repeat for 2/3/4
jq '[.parts[] | select((.anti_patterns | length) == 0) | .part]' docs/notes.json
jq '[.parts[] | select((.things_to_know | length) == 0) | .part]' docs/notes.json
```

# Reporting back to the user

In one short message, report:
- How many parts were written.
- Any parts missing an `anti_patterns` or `things_to_know` section (these usually mean a source-level typo — surface them so the user can fix `notes.txt`).
- Remind the user to refresh the quiz site (or re-run a local preview) so it picks up the new `docs/notes.json`.
- Any anti-patterns that ended up with an empty `explanation` (likely a missing ` - ` separator in the source).
- Anything else suspicious (header that didn't parse, domain fallback used, etc.).

Don't summarize the JSON content itself — the file is the deliverable.
