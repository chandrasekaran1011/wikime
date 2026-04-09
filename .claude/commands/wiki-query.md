Query the wiki and synthesize an answer.

Usage: /wiki-query $ARGUMENTS

$ARGUMENTS is the question, e.g.:
  /wiki-query What are the main themes across all sources?
  /wiki-query How does X relate to Y?
  /wiki-query Summarize everything about Z as a comparison table
  /wiki-query What are the key findings? --save

Add --save at the end to automatically file the answer back into the wiki.

If no argument is given, ask the user what they want to know.

---

Follow the Query Workflow defined in CLAUDE.md exactly:

**Step 1 — Check wiki state**
If wiki/index.md is empty or doesn't exist: tell the user to run /wiki-ingest first.

**Step 2 — Read the index**
Read wiki/index.md in full. Identify the most relevant pages by their titles and one-line summaries.

**Step 3 — Read relevant pages**
Read up to ~12 most relevant pages.
If the index doesn't clearly surface candidates, reason about which pages likely contain the answer and read those.
Always include wiki/overview.md if the question is broad.

**Step 4 — Determine output format**
Default: well-structured markdown with headers and bullets.
If the user specifies a format, use it:
- "as a comparison table" → markdown table (rows = entities/sources, cols = dimensions)
- "as Marp slides" → prefix with `---\nmarp: true\n---`, use `---` as slide breaks
- "as a chart" → describe the chart + provide Python matplotlib code to render it
- "as a canvas" → Obsidian Canvas JSON format

**Step 5 — Synthesize**
Write a thorough answer in the requested format.
Use [[WikiLink]] wikilink syntax to cite sources throughout.
End with a ## Sources section listing every page drawn from and what it contributed.

**Step 6 — Offer to save**
If --save was passed: automatically save as wiki/syntheses/<slug>.md.
Otherwise: ask the user if they want to file this answer back into the wiki.

If saving:
- Write wiki/syntheses/<slug>.md with proper frontmatter (type: synthesis)
- Update wiki/index.md — add entry under ## Syntheses
- Remind the user: good answers compound the knowledge base just like sources do

**Step 7 — Log**
Append to wiki/log.md:
## [today's date] query | <question (truncated to 80 chars)>
Synthesized from N pages. [Saved to syntheses/<slug>.md]
