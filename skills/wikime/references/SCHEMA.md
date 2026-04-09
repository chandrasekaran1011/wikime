# wikime — Full Operating Schema

Read this file fully before performing any wiki operation. Follow every workflow exactly — consistency is what makes the wiki useful over time.

---

## Naming Conventions

- **Source slugs**: `kebab-case` matching source filename — e.g. `attention-is-all-you-need`
- **Entity pages**: `TitleCase.md` — e.g. `OpenAI.md`, `SamAltman.md`
- **Concept pages**: `TitleCase.md` — e.g. `RetrievalAugmentedGeneration.md`
- **Synthesis slugs**: `kebab-case` from the question — e.g. `main-approaches-to-hallucination.md`
- **Wikilinks**: `[[PageName]]` — no `.md` extension

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

Source pages add: `format`, `source_file`, `source_md`
Concept pages add: `aliases`, `related`

---

## Document Conversion (Pass 0)

Check tool availability in this order. Use the first that works.

### PDF
```bash
markitdown raw/file.pdf -o raw/file.md
marker_single raw/file.pdf --output_dir raw/
pdftotext -layout raw/file.pdf - > raw/file.md
python3 -c "import pdfminer.high_level as pm; print(pm.extract_text('raw/file.pdf'))" > raw/file.md
```

### DOCX
```bash
markitdown raw/file.docx -o raw/file.md
pandoc raw/file.docx -t markdown -o raw/file.md
python3 -c "
from docx import Document
doc = Document('raw/file.docx')
for p in doc.paragraphs:
    if p.style.name.startswith('Heading'):
        print(f\"{'#'*int(p.style.name[-1])} {p.text}\")
    elif p.text.strip(): print(p.text)
    else: print()
" > raw/file.md
```

### PPTX
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

### XLSX / CSV
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

### Images
Send image to vision model with this prompt:
```
Describe this image for a knowledge wiki. Include:
- What type of document or visual this is
- All visible text (transcribe exactly)
- Key concepts illustrated
- Any data, charts, or diagrams explained in full
```
Write to `raw/<image-name>.md`.

**Image inline limitation**: Read markdown text first, then open image files separately for visual context.

### Skip logic
- Skip if `<filename>.md` already exists and source is unchanged
- Skip `.md`, `.txt`, `.log`, `.vtt`, `.srt` files

---

## Ingest Workflow

1. **Convert** — detect format, check tools, convert to `raw/<slug>.md`
2. **Read source** — read `.md` fully; open images separately; chunk if >8000 words
3. **Read context** — read `wiki/index.md`, `wiki/overview.md`, relevant existing pages
4. **Write source page** → `wiki/sources/<slug>.md`
5. **Update index** — add entry under `## Sources` in `wiki/index.md`
6. **Update overview** — revise `wiki/overview.md` if warranted; keep to ~500 words
7. **Update entity pages** — create or update `wiki/entities/<EntityName>.md`
8. **Update concept pages** — create or update `wiki/concepts/<ConceptName>.md`
   **If page exists: read it first, then expand** — this is the compounding mechanism
9. **Flag contradictions** — note conflicts in source page and concept/entity pages
10. **Append to log** — `## [YYYY-MM-DD] ingest | <Title> (<format>)`

---

## Query Workflow

1. Read `wiki/index.md` — identify relevant pages
2. Read up to ~12 most relevant pages
3. Determine output format: markdown (default) | comparison table | Marp slides | chart
4. Synthesize answer with `[[WikiLink]]` citations; add `## Sources` section
5. Offer to save as `wiki/syntheses/<slug>.md` — good answers compound the wiki
6. Append to log: `## [YYYY-MM-DD] query | <question>`

---

## Lint Workflow

**Structural (grep/glob):**
- Orphan pages — no inbound `[[wikilinks]]`
- Broken links — `[[WikiLinks]]` to non-existent pages
- Missing pages — referenced 3+ times but no page exists

**Semantic (read and reason):**
- Contradictions between pages (name exact pages and claims)
- Stale content — not updated after newer contradicting sources
- Data gaps — questions wiki can't answer; suggest specific sources
- Thin pages — frequently referenced but lacking depth

Output structured lint report. Ask if user wants it saved to `wiki/lint-report.md`.
Append to log: `## [YYYY-MM-DD] lint | Wiki health check`

---

## Graph Workflow

**Pass 1 — Extracted (deterministic):**
1. Grep all `[[wikilinks]]` across `wiki/`
2. Build nodes (id, label, type, path) + edges (EXTRACTED, confidence 1.0)

**Pass 2 — Inferred (LLM):**
3. Identify implicit relationships → tag INFERRED (≥0.7) or AMBIGUOUS (<0.7)

**Pass 3 — Output:**
4. Write `graph/graph.json`: `{ nodes, edges, built }`
5. Write `graph/graph.html` — self-contained vis.js (colors by type, dashes by confidence)
6. Summarize node count, edge count, top hub nodes
7. Append to log: `## [YYYY-MM-DD] graph | N nodes, N edges`

---

## Page Formats

### Source (`wiki/sources/<slug>.md`)
```markdown
---
title: "Title"
type: source
format: pdf
source_file: raw/file.pdf
source_md: raw/file.md
date: YYYY-MM-DD
tags: []
---

## Summary
## Key Claims
## Key Quotes
## Connections
- [[EntityName]] — relation
## Contradictions
- Contradicts [[Page]] on: claim
```

### Concept (`wiki/concepts/ConceptName.md`)
```markdown
---
title: "Concept Name"
type: concept
aliases: [Alias]
sources: [slug1]
related: [Related]
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

### Entity (`wiki/entities/EntityName.md`)
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
```

### Synthesis (`wiki/syntheses/<slug>.md`)
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
- [Title](sources/slug.md) — summary | format: pdf | YYYY-MM-DD

## Concepts
- [Name](concepts/Name.md) — description

## Entities
- [Name](entities/Name.md) — description

## Syntheses
- [Title](syntheses/slug.md) — question answered
```

## Log Format
```
## [YYYY-MM-DD] ingest | Title (format)
## [YYYY-MM-DD] query | Question
## [YYYY-MM-DD] lint | Wiki health check
## [YYYY-MM-DD] graph | N nodes, N edges
```
Newest at top. `grep "^## \[" wiki/log.md | tail -10`
