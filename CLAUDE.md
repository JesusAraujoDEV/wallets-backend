@AGENTS.md

This file is intentionally a pointer. **`AGENTS.md` is the canonical agent context for this project** — all rules, stack, architecture, role activation, and quality standards live there, readable by any agent tool (Claude Code via this import; Codex, Cursor, Copilot, Windsurf and others natively). Do not add content here: anything written in this file is invisible to non-Claude tools and will drift. Claude-specific exceptions, if ever needed, must stay under 10 lines and be mirrored as a note in AGENTS.md.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
