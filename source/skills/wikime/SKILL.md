---
name: wikime
description: Build and maintain a persistent, interlinked knowledge wiki from documents (PDF, DOCX, PPTX, XLSX, MD, images). Implements Karpathy's LLM Wiki pattern — incrementally compiles sources into structured markdown pages that compound over time. Use when the user wants to ingest documents, query a knowledge base, build a wiki from a folder of files, or maintain a persistent knowledge base.
license: MIT
compatibility: Works with Claude Code, Codex CLI, OpenCode, Gemini CLI, and any agent that reads AGENTS.md or CLAUDE.md. Document conversion requires one of: markitdown, pandoc, or standard Python libraries (pdfminer, python-docx, python-pptx, openpyxl).
metadata:
  author: wikime
  version: "1.0"
---

# wikime — LLM Wiki

Build a persistent, compounding knowledge wiki from any folder of documents.

## When to use this skill

Use this skill when the user wants to:
- Ingest documents (PDF, DOCX, PPTX, XLSX, images) into a knowledge base
- Query a wiki they've built from their documents
- Build a wiki from a folder of files
- Maintain a persistent, interlinked knowledge base over time
- Follow Karpathy's LLM Wiki / LLM Brain pattern

## What this skill does

This skill teaches you to be a disciplined wiki maintainer. You:
- Convert any document format to markdown (PDF, DOCX, PPTX, XLSX, images)
- Summarize each source into structured wiki pages
- Extract concepts and maintain cross-referenced concept articles
- Update a living overview synthesis as new sources arrive
- Flag contradictions between sources at ingest time
- Build an interactive knowledge graph from wikilinks

The wiki is a **persistent, compounding artifact** — every new source makes it richer. Cross-references are pre-built. Contradictions are flagged at ingest time, not rediscovered at query time.

## Quick start

```
ingest raw/report.pdf              → convert + add to wiki
ingest all files in raw/           → bulk ingest everything
query: what are the main themes?   → synthesize answer from wiki
lint the wiki                      → health check
build the knowledge graph          → generate graph.html
```

In Claude Code, use slash commands:
```
/wiki-ingest raw/report.pdf
/wiki-query "what are the main themes?"
/wiki-lint
/wiki-graph
```

## Full schema

The complete schema — directory layout, page formats, naming conventions, conversion commands, and step-by-step workflows — is in:

- [references/SCHEMA.md](references/SCHEMA.md) — full operating manual

Read SCHEMA.md before performing any wiki operation.

## Directory layout

```
raw/          → immutable source documents (you never write here)
wiki/         → you own this entirely
  index.md    → catalog of all pages — update on every ingest
  log.md      → append-only chronological record
  overview.md → living synthesis across all sources
  sources/    → one summary page per source
  entities/   → people, companies, projects
  concepts/   → ideas, frameworks, methods
  syntheses/  → saved query answers
graph/        → auto-generated graph.json + graph.html
```

## Three operations (Karpathy)

**Ingest** — drop a file in raw/ and run ingest. You read it, extract key info, update entity and concept pages, flag contradictions, update the synthesis. A single source touches 10–15 wiki pages.

**Query** — ask a question. You read the index, find relevant pages, synthesize an answer with [[wikilink]] citations. Good answers get filed back as synthesis pages — explorations compound just like sources.

**Lint** — periodic health check. Find orphans, broken links, contradictions, stale content, data gaps.

## Two special files (Karpathy)

**index.md** — content-oriented catalog. Every page listed with a link and one-line summary. You update it on every ingest. You read it first on every query to find relevant pages.

**log.md** — append-only chronological record. Every operation logged with a grep-parseable prefix:
```
## [YYYY-MM-DD] ingest | Title (format)
## [YYYY-MM-DD] query | Question asked
grep "^## \[" wiki/log.md | tail -10
```
