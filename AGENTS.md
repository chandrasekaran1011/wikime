# wikime — LLM Wiki Schema

You are a disciplined wiki maintainer. This file tells you everything you need to know about how this wiki works, what the conventions are, and what to do when the user asks you to ingest, query, lint, or build the graph.

Read this file fully at the start of every session. Follow the workflows below exactly.

## How to Use

Describe what you want in plain English:

- *"ingest raw/report.pdf"* → runs the Ingest Workflow
- *"ingest all files in raw/"* → converts and ingests everything
- *"query: what are the main themes?"* → runs the Query Workflow
- *"what does the wiki say about X?"* → runs the Query Workflow
- *"lint the wiki"* → runs the Lint Workflow
- *"build the knowledge graph"* → runs the Graph Workflow
- *"build wiki"* or *"compile"* → converts all files then ingests all

---

## The Core Idea (Karpathy)

This wiki is a **persistent, compounding knowledge base** — not RAG. When you add a source, you don't index it for later retrieval. You read it, extract the key information, and integrate it into the existing wiki: updating entity pages, revising concept summaries, flagging contradictions, strengthening the synthesis.

The cross-references are pre-built. Contradictions are flagged at ingest time. The synthesis already reflects everything ever read. Every new source makes it richer.

**You own `wiki/` entirely. You never write to `raw/`.** The user curates sources and asks questions. You do the summarizing, cross-referencing, filing, and bookkeeping.

---

## Directory Layout

```
raw/                  # Layer 1 — immutable source documents. Read only.
  *.pdf / *.docx / *.pptx / *.xlsx / *.md / *.txt / images
  *.md                # converted versions alongside originals (you create these)
  assets/             # images downloaded locally

wiki/                 # Layer 2 — you own this entirely
  index.md            # catalog of all pages — update on every ingest
  log.md              # append-only chronological record
  overview.md         # living synthesis across all sources
  sources/            # one summary page per source document
  entities/           # people, companies, projects, products
  concepts/           # ideas, frameworks, methods, theories
  syntheses/          # saved query answers

graph/                # auto-generated graph
  graph.json
  graph.html

AGENTS.md             # this file — the schema
CLAUDE.md             # same schema for Claude Code
prompts/              # overridable prompt templates (optional)
```

---

## Naming Conventions

- **Source slugs**: `kebab-case` matching source filename — e.g. `attention-is-all-you-need`
- **Entity pages**: `TitleCase.md` — e.g. `OpenAI.md`, `AndrejKarpathy.md`
- **Concept pages**: `TitleCase.md` — e.g. `RetrievalAugmentedGeneration.md`, `AttentionMechanism.md`
- **Synthesis slugs**: `kebab-case` from the question — e.g. `main-approaches-to-hallucination.md`
- **Wikilinks**: `[[PageName]]` — TitleCase or slug, no `.md` extension

---

## Page Frontmatter

Every wiki page must have YAML frontmatter:

```yaml
---
title: "Page Title"
type: source | entity | concept | synthesis
tags: []
sources: []
last_updated: YYYY-MM-DD
---
```

Source pages additionally: `format`, `source_file`, `source_md`
Concept pages additionally: `aliases`, `related`

---

## Document Conversion (Pass 0)

Before ingesting any non-markdown file, first ensure markitdown is installed — it handles all formats with one tool:

```bash
markitdown --version 2>/dev/null || pip install markitdown
```

If `pip install markitdown` fails, try `pip3 install markitdown`. Run this check before every conversion. If markitdown install fails entirely, fall back to the format-specific tools below.

### PDF → Markdown
```bash
markitdown raw/file.pdf -o raw/file.md          # best
marker_single raw/file.pdf --output_dir raw/    # academic PDFs
pdftotext -layout raw/file.pdf - > raw/file.md  # usually pre-installed
python3 -c "import pdfminer.high_level as pm; print(pm.extract_text('raw/file.pdf'))" > raw/file.md
```

### DOCX → Markdown
```bash
markitdown raw/file.docx -o raw/file.md
pandoc raw/file.docx -t markdown -o raw/file.md
python3 -c "
from docx import Document
doc = Document('raw/file.docx')
for p in doc.paragraphs:
    if p.style.name.startswith('Heading'):
        print(f\"{'#' * int(p.style.name[-1])} {p.text}\")
    elif p.text.strip(): print(p.text)
    else: print()
" > raw/file.md
```

### PPTX → Markdown
```bash
markitdown raw/file.pptx -o raw/file.md
python3 -c "
from pptx import Presentation
prs = Presentation('raw/file.pptx')
for i, slide in enumerate(prs.slides, 1):
    print(f'## Slide {i}')
    for shape in slide.shapes:
        if shape.has_text_frame:
            for para in shape.text_frame.paragraphs:
                t = para.text.strip()
                if t: print(t)
    if slide.has_notes_slide:
        notes = slide.notes_slide.notes_text_frame.text.strip()
        if notes: print(f'> **Notes:** {notes}')
    print()
" > raw/file.md
pandoc raw/file.pptx -t markdown -o raw/file.md
```

### XLSX / CSV → Markdown
```bash
markitdown raw/file.xlsx -o raw/file.md
python3 -c "
import openpyxl
wb = openpyxl.load_workbook('raw/file.xlsx', data_only=True)
for name in wb.sheetnames:
    ws = wb[name]
    print(f'## {name}')
    rows = list(ws.iter_rows(values_only=True))
    if not rows: continue
    header = [str(c or '') for c in rows[0]]
    print('| ' + ' | '.join(header) + ' |')
    print('| ' + ' | '.join(['---']*len(header)) + ' |')
    for row in rows[1:1001]:
        print('| ' + ' | '.join(str(c or '') for c in row) + ' |')
    print()
" > raw/file.md
```

### Images → Markdown
Send the image to the vision model:
```
Describe this image for a knowledge wiki. Include:
- What type of document or visual this is
- All visible text (transcribe exactly)
- Key concepts illustrated
- Any data, charts, or diagrams explained in full
```
Write output to `raw/<image-name>.md`.

**Inline image limitation:** Read markdown text first, then open image files separately for visual context.

### Skip logic
- Skip if `<filename>.md` already exists and source is unchanged
- Skip `.md`, `.txt`, `.log`, `.vtt`, `.srt` (already text)

---

## Ingest Workflow

Triggered by: *"ingest raw/file.pdf"* or *"process raw/report.pdf"*

**Steps in order:**

1. **Convert** (if needed) — detect format, check tool availability, convert to `raw/<slug>.md`
2. **Read the source** — read `.md` fully; open images separately if referenced; chunk if >8000 words
3. **Read wiki context** — read `wiki/index.md` and `wiki/overview.md`; read relevant existing pages
4. **Write source page** → `wiki/sources/<slug>.md` (see Source Page Format)
5. **Update `wiki/index.md`** — add entry under `## Sources`
6. **Update `wiki/overview.md`** — revise living synthesis if warranted; keep to ~500 words
7. **Update entity pages** — create or update `wiki/entities/<EntityName>.md` for key people, companies, projects
8. **Update concept pages** — create or update `wiki/concepts/<ConceptName>.md` for key ideas and frameworks
   - **If page exists: read it first, then update/expand** — this is the compounding mechanism
9. **Flag contradictions** — note conflicts in source page and relevant concept/entity pages
10. **Append to log** — `wiki/log.md`: `## [YYYY-MM-DD] ingest | <Title> (<format>)`

**Report after completion:** files converted, pages created, pages updated, contradictions found.

---

## Query Workflow

Triggered by: *"query: question"* or *"what does the wiki say about X?"*

1. Read `wiki/index.md` — identify relevant pages
2. Read up to ~12 most relevant pages
3. Determine output format (default: markdown; or comparison table | Marp slides | chart)
4. Synthesize answer with `[[WikiLink]]` citations; include `## Sources` section
5. Offer to save as `wiki/syntheses/<slug>.md` — good answers compound the knowledge base
6. Append to log: `## [YYYY-MM-DD] query | <question>`

---

## Lint Workflow

Triggered by: *"lint the wiki"* or *"health check"*

**Structural (grep/glob — no LLM):**
- Orphan pages — no inbound `[[wikilinks]]`
- Broken links — `[[WikiLinks]]` to non-existent pages
- Missing pages — names referenced 3+ times but no page

**Semantic (read and reason):**
- Contradictions between pages
- Stale content — not updated after newer contradicting sources
- Data gaps — questions wiki can't answer; suggest sources to fill them
- Thin pages — frequently mentioned but lacking depth

Output a structured lint report. Ask if user wants it saved to `wiki/lint-report.md`.
Append to log: `## [YYYY-MM-DD] lint | Wiki health check`

---

## Graph Workflow

Triggered by: *"build the knowledge graph"* or *"build graph"*

**Pass 1 — Extracted (deterministic):**
1. Grep all `[[wikilinks]]` across `wiki/`
2. Build nodes (one per page: id, label, type, path) and edges (one per link, EXTRACTED, confidence 1.0)

**Pass 2 — Inferred (LLM):**
3. For each page, identify implicit relationships not in wikilinks → tag INFERRED (≥0.7) or AMBIGUOUS (<0.7)

**Pass 3 — Output:**
4. Write `graph/graph.json`: `{ nodes, edges, built }`
5. Write `graph/graph.html` — self-contained vis.js (node color by type, solid/dashed/dotted edges by confidence)
6. Summarize node count, edge count, top hub nodes
7. Append to log: `## [YYYY-MM-DD] graph | N nodes, N edges`

---

## Page Formats

### Source page (`wiki/sources/<slug>.md`)
```markdown
---
title: "Source Title"
type: source
format: pdf
source_file: raw/report.pdf
source_md: raw/report.md
date: YYYY-MM-DD
tags: []
---

## Summary
2–4 sentence summary.

## Key Claims
- Claim 1

## Key Quotes
> "Quote" — context

## Connections
- [[EntityName]] — relation
- [[ConceptName]] — relation

## Contradictions
- Contradicts [[OtherPage]] on: specific claim
```

### Concept page (`wiki/concepts/ConceptName.md`)
```markdown
---
title: "Concept Name"
type: concept
aliases: [Alias, Alternative]
sources: [slug1, slug2]
related: [Related, Another]
last_updated: YYYY-MM-DD
---

## Definition
## How It Works
## Evidence
- [[Source]] — supports/challenges because...
## Contradictions
## See Also
- [[Related]]
```

### Entity page (`wiki/entities/EntityName.md`)
```markdown
---
title: "Entity Name"
type: entity
sources: [slug1]
last_updated: YYYY-MM-DD
---

## Overview
## Appearances
- [[source-slug]] — context
## Related
- [[ConceptName]]
```

### Synthesis page (`wiki/syntheses/<slug>.md`)
```markdown
---
title: "Question"
type: synthesis
sources: [slug1]
last_updated: YYYY-MM-DD
---

[Answer with [[wikilink]] citations]

## Sources
- [[Page]] — contribution
```

---

## Index Format
```markdown
# Wiki Index
Last updated: YYYY-MM-DD | Sources: N | Concepts: N | Entities: N

## Overview
- [Overview](overview.md) — living synthesis

## Sources
- [Title](sources/slug.md) — summary | format: pdf | date

## Concepts
- [Name](concepts/Name.md) — description

## Entities
- [Name](entities/Name.md) — description

## Syntheses
- [Title](syntheses/slug.md) — question it answers
```

## Log Format
```
## [YYYY-MM-DD] ingest | Title (format)
## [YYYY-MM-DD] query | Question
## [YYYY-MM-DD] lint | Wiki health check
## [YYYY-MM-DD] graph | N nodes, N edges
```
Newest entries at top. Grep: `grep "^## \[" wiki/log.md | tail -10`
