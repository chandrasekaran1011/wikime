---
name: wiki-query
description: Query the LLM wiki and synthesize a cited answer from existing wiki pages. Can output markdown, comparison tables, Marp slides, or charts. Good answers can be filed back into the wiki as synthesis pages. Use when the user asks a question about their knowledge base.
license: MIT
metadata:
  author: wikime
  version: "1.0"
---

# wiki-query

Query the wiki and synthesize an answer with citations.

**Claude Code**: `/wiki-query "what are the main themes?"`
**Codex / any agent**: `query: what are the main themes?`

Add `--save` to automatically file the answer back into the wiki.

---

## Steps

**Step 1 — Check wiki state**
If `wiki/index.md` is empty or missing: tell the user to run `wiki-ingest` first.

**Step 2 — Read the index**
Read `wiki/index.md` in full. Identify the most relevant pages by title and one-line summary. Always include `wiki/overview.md` if the question is broad.

**Step 3 — Read relevant pages**
Read up to ~12 most relevant pages. If the index doesn't clearly surface candidates, reason about which pages likely contain the answer.

**Step 4 — Determine output format**

Default: well-structured markdown with headers and bullets.

If user specifies:
- `"as a comparison table"` → markdown table (rows = entities/sources, cols = dimensions)
- `"as Marp slides"` → prefix with `---\nmarp: true\n---`, use `---` as slide breaks
- `"as a chart"` → describe chart + provide Python matplotlib code
- `"as a canvas"` → Obsidian Canvas JSON format

**Step 5 — Synthesize**
Write the answer in the requested format.
Use `[[WikiLink]]` wikilink syntax to cite sources throughout.
End with a `## Sources` section listing every page used and what it contributed.

**Step 6 — Save (if requested)**

If `--save` or user agrees to save:
- Write `wiki/syntheses/<slug>.md` with frontmatter `type: synthesis`
- Update `wiki/index.md` under `## Syntheses`
- Note: good answers compound the knowledge base just like ingested sources do

**Step 7 — Log**
Append to `wiki/log.md`:
```
## [YYYY-MM-DD] query | <question>
Synthesized from N pages. [Saved to syntheses/<slug>.md]
```
