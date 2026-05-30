#!/usr/bin/env python3
"""PostToolUse hook: normalize + validate docs/notes.json after each write.

Reads the Claude Code hook payload from stdin, extracts the file path, and
short-circuits if it's not notes.json. Otherwise: trims/collapses whitespace,
upgrades known acronyms and the proper noun 'Claude', capitalizes the first
letter when it's clearly prose (not a code identifier, path, or CLI flag),
and writes the file back. Lint findings go to stderr, exit is always 0.
"""

import json
import re
import sys
from pathlib import Path

ACRONYMS = {
    "mcp": "MCP", "api": "API", "sdk": "SDK", "json": "JSON",
    "http": "HTTP", "https": "HTTPS", "llm": "LLM", "llms": "LLMs",
    "url": "URL", "urls": "URLs", "js": "JS", "html": "HTML",
    "css": "CSS", "yaml": "YAML", "qa": "QA", "id": "ID", "ids": "IDs",
}
PROPER_NOUNS = {"claude": "Claude"}

CODE_TOKEN_RE = re.compile(r"[_/\\]")


def _is_code_token(token: str) -> bool:
    if not token:
        return False
    if token.startswith(("-", "`", "$")):
        return True
    return bool(CODE_TOKEN_RE.search(token))


def collapse_whitespace(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def fix_tokens(s: str) -> str:
    s = re.sub(r"\bci/cd\b", "CI/CD", s, flags=re.IGNORECASE)

    def replace(match):
        word = match.group(0)
        key = word.lower()
        if key in ACRONYMS:
            return ACRONYMS[key]
        if key in PROPER_NOUNS:
            return PROPER_NOUNS[key]
        return word

    return re.sub(r"\b[A-Za-z]+\b", replace, s)


def capitalize_first(s: str) -> str:
    for i, ch in enumerate(s):
        if not ch.isalpha() or not ch.isascii():
            continue
        if ch.isupper():
            return s
        left = i
        while left > 0 and not s[left - 1].isspace():
            left -= 1
        right = i
        while right < len(s) and not s[right].isspace():
            right += 1
        if _is_code_token(s[left:right]):
            return s
        return s[:i] + ch.upper() + s[i + 1:]
    return s


def normalize_string(s: str) -> str:
    if not isinstance(s, str) or not s:
        return s
    s = collapse_whitespace(s)
    s = fix_tokens(s)
    s = capitalize_first(s)
    return s


def normalize_data(data):
    for part in data.get("parts", []):
        if "topic" in part:
            part["topic"] = normalize_string(part["topic"])
        for ap in part.get("anti_patterns", []):
            if "name" in ap:
                ap["name"] = normalize_string(ap["name"])
            if ap.get("explanation"):
                ap["explanation"] = normalize_string(ap["explanation"])
        part["things_to_know"] = [
            normalize_string(t) for t in part.get("things_to_know", [])
        ]
    return data


def validate(data):
    issues = []
    parts = data.get("parts", [])
    if len(parts) != 24:
        issues.append(f"expected 24 parts, found {len(parts)}")
    seen_part_nums = {}
    seen_tasks = {}
    domains = set()
    for p in parts:
        n = p.get("part")
        if n in seen_part_nums:
            issues.append(f"duplicate part number: {n}")
        seen_part_nums[n] = True
        t = p.get("task")
        if t is not None:
            if t in seen_tasks:
                issues.append(f"duplicate task value '{t}' on parts {seen_tasks[t]} & {n}")
            else:
                seen_tasks[t] = n
        if p.get("domain") is not None:
            domains.add(p["domain"])
        if not p.get("anti_patterns"):
            issues.append(f"part {n} has empty anti_patterns")
        if not p.get("things_to_know"):
            issues.append(f"part {n} has empty things_to_know")
        for ap in p.get("anti_patterns", []):
            if not ap.get("explanation"):
                issues.append(f"part {n} anti-pattern '{ap.get('name', '?')}' has empty explanation")
    if domains and domains != {1, 2, 3, 4}:
        issues.append(f"unexpected domain set: {sorted(domains)}")
    return issues


def read_payload_path() -> str:
    if not sys.stdin.isatty():
        raw = sys.stdin.read()
        if raw.strip():
            try:
                payload = json.loads(raw)
                return (payload.get("tool_input") or {}).get("file_path", "")
            except json.JSONDecodeError:
                pass
    if len(sys.argv) > 1:
        return sys.argv[1]
    return ""


def main() -> int:
    path_str = read_payload_path()
    if not path_str:
        return 0
    path = Path(path_str)
    if path.name != "notes.json":
        return 0
    if not path.exists():
        return 0

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        print(f"normalize_notes: cannot parse {path}: {exc}", file=sys.stderr)
        return 0

    normalize_data(data)
    issues = validate(data)

    path.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    if issues:
        print(f"normalize_notes: {len(issues)} validation issue(s) in {path}:", file=sys.stderr)
        for issue in issues:
            print(f"  - {issue}", file=sys.stderr)
    else:
        print(f"normalize_notes: {path} normalized & validated cleanly", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
