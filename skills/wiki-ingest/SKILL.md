---
name: wiki-ingest
description: Ingest a source document (PDF, DOCX, PPTX, XLSX, image, or markdown) into the LLM wiki. Converts the file to markdown if needed, summarizes it, updates entity and concept pages, flags contradictions, and updates the index and log. Use when the user wants to add a document to their wiki.
license: MIT
compatibility: Document conversion requires one of markitdown, pandoc, or Python libraries (pdfminer, python-docx, python-pptx, openpyxl).
metadata:
  author: wikime
  version: "1.0"
---

# wiki-ingest

Ingest a source document into the wiki.

**Claude Code**: `/wiki-ingest raw/file.pdf`
**Codex / any agent**: `ingest raw/file.pdf`

---

## Steps — follow in order

**Pass 0 — Convert (if not already markdown)**

Check availability then use the first tool that works:

PDF: `markitdown raw/f.pdf -o raw/f.md` → `pdftotext -layout raw/f.pdf - > raw/f.md` → python pdfminer
DOCX: `markitdown raw/f.docx -o raw/f.md` → `pandoc raw/f.docx -t markdown -o raw/f.md` → python-docx
PPTX: `markitdown raw/f.pptx -o raw/f.md` → python-pptx (with speaker notes) → pandoc
XLSX: `markitdown raw/f.xlsx -o raw/f.md` → python openpyxl → pandas
Image: send to vision model → write description as `raw/<name>.md`

Skip conversion if `<filename>.md` already exists and source is unchanged.
Full conversion commands: see [references/CONVERSION.md](references/CONVERSION.md)

**Pass 1 — Read**

Read `raw/<slug>.md` fully (text first).
If inline image references exist: open each image file separately after reading text — LLMs cannot read markdown + images in one pass.
If very long (>~8000 words): read in sections, summarize each, then synthesize.

**Pass 2 — Read wiki context**

Read `wiki/index.md` (full catalog).
Read `wiki/overview.md` (current synthesis).
Read any existing concept/entity pages that seem directly relevant.

**Pass 3 — Write source page**

Write `wiki/sources/<slug>.md`:
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
2–4 sentences.

## Key Claims
- Claim 1

## Key Quotes
> "Quote" — context

## Connections
- [[EntityName]] — relation
- [[ConceptName]] — relation

## Contradictions
- Contradicts [[Page]] on: claim (or "None detected.")
```

**Pass 4 — Update index and overview**

Update `wiki/index.md` — add entry under `## Sources`.
Update `wiki/overview.md` — revise synthesis if warranted; keep to ~500 words.

**Pass 5 — Entity and concept pages**

For each key person, company, project:
- Read `wiki/entities/<EntityName>.md` if it exists → update/expand
- Or create new `wiki/entities/<EntityName>.md`

For each key idea, framework, method, theory:
- Read `wiki/concepts/<ConceptName>.md` if it exists → update/expand incorporating new info
- Or create new `wiki/concepts/<ConceptName>.md`
- **If page exists: read first, then expand — this is the compounding mechanism**

**Pass 6 — Contradictions**

Compare this source's claims against existing wiki content.
Note conflicts in both the source page (`## Contradictions`) and in affected concept/entity pages.

**Pass 7 — Log**

Append to `wiki/log.md` (newest at top):
```
## [YYYY-MM-DD] ingest | <Title> (<format>)

Source: raw/<file>. Key claims: <brief>. Pages touched: <list>.
```

---

## After completion, report

- File converted: yes/no, which tool used
- Wiki pages created: (list)
- Wiki pages updated: (list)
- Contradictions found: (list or "none")
- Suggested follow-up: related sources to find, questions now answerable
