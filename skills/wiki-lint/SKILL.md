---
name: wiki-lint
description: Health-check the LLM wiki for structural issues (orphan pages, broken wikilinks, missing pages) and semantic issues (contradictions, stale content, data gaps, thin pages). Use periodically to keep the wiki healthy as it grows.
license: MIT
metadata:
  author: wikime
  version: "1.0"
---

# wiki-lint

Health-check the wiki for structural and semantic issues.

**Claude Code**: `/wiki-lint`
**Codex / any agent**: `lint the wiki`

Add `--save` to automatically save the report to `wiki/lint-report.md`.

---

## Structural checks (use Grep + Glob — no LLM needed)

**Orphan pages** — wiki pages with zero inbound `[[wikilinks]]` from other pages.
Exclude `index.md`, `log.md`, `overview.md`, `lint-report.md` from orphan check.

**Broken links** — `[[WikiLinks]]` pointing to pages that don't exist.
Check `wiki/entities/`, `wiki/concepts/`, `wiki/sources/`, `wiki/syntheses/` for each link target.

**Missing pages** — names referenced 3+ times but no dedicated page exists.
Count occurrences of each `[[Name]]` across all wiki pages; flag those with no matching file.

---

## Semantic checks (read and reason)

**Contradictions** — claims that directly conflict between pages.
Be specific: name the exact pages and the exact claims that conflict.

**Stale content** — summaries not updated after newer sources changed the picture.
Compare `last_updated` dates in frontmatter vs. log.md ingest history.

**Data gaps** — important questions the wiki cannot yet answer.
Suggest specific sources, papers, or web searches to fill each gap.

**Thin pages** — concepts mentioned frequently across many sources but page lacks depth.
These are candidates for a dedicated research or query session.

---

## Output format

```markdown
# Wiki Lint Report — YYYY-MM-DD

Scanned N pages.

## Structural Issues

### Orphan Pages
- `wiki/path/page.md`

### Broken Wikilinks
- `wiki/page.md` links to [[Name]] — no matching page

### Missing Pages (referenced 3+ times, no page)
- [[Name]] — referenced N times

## Semantic Issues

### Contradictions
- `wiki/concepts/A.md` claims X; `wiki/sources/B.md` claims Y

### Stale Content
- `wiki/concepts/X.md` — newer source Z contradicts claim W

### Data Gaps & Suggested Sources
- Gap: no coverage of topic X → suggest: search for "..." or read "..."

### Thin Pages
- [[ConceptName]] — mentioned in N sources, page has only N words
```

Ask if user wants it saved to `wiki/lint-report.md`. If `--save`: save automatically.

Append to `wiki/log.md`:
```
## [YYYY-MM-DD] lint | Wiki health check
N orphans, N broken links, N contradictions, N gaps.
```
