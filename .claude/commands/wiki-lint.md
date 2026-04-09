Health-check the wiki for structural and semantic issues.

Usage: /wiki-lint

Optional: /wiki-lint --save  (automatically saves report to wiki/lint-report.md)

---

Follow the Lint Workflow defined in CLAUDE.md exactly:

**Check 1 — Orphan pages (use Glob + Grep)**
Find all wiki pages that have zero inbound [[wikilinks]] from other pages.
Method:
1. Glob all .md files in wiki/ (excluding index.md, log.md, overview.md, lint-report.md)
2. For each page, search all other pages for [[PageName]] or [[page-name]] references
3. Pages with zero inbound links = orphans

**Check 2 — Broken links (use Grep)**
Find all [[WikiLinks]] across wiki/ that point to pages that don't exist.
Method:
1. Grep all [[...]] patterns across wiki/
2. For each, check if wiki/entities/<name>.md or wiki/concepts/<name>.md or wiki/sources/<name>.md exists
3. Non-existent targets = broken links

**Check 3 — Missing pages (use Grep)**
Find names referenced 3+ times across wiki pages but with no dedicated page.
Method:
1. Grep all [[...]] patterns, count occurrences per name
2. Names with count >= 3 that have no matching file = missing pages

**Check 4 — Contradictions (read and reason)**
Read all source pages and concept pages (sample up to 20 if wiki is large).
Identify claims that directly conflict between pages.
Be specific: name the exact pages, the exact claims that conflict.

**Check 5 — Stale content (read and reason)**
Identify pages that haven't been updated after newer sources changed the picture.
Look at last_updated dates in frontmatter vs. log.md ingest history.

**Check 6 — Data gaps (read and reason)**
What important questions can the wiki NOT yet answer?
Suggest specific sources, papers, or web searches that would fill each gap.

**Check 7 — Thin pages (read and reason)**
Identify concepts mentioned frequently across many sources but whose page lacks depth.
These are candidates for a dedicated research session.

---

**Output format:**

# Wiki Lint Report — YYYY-MM-DD

Scanned N pages.

## Structural Issues

### Orphan Pages (no inbound links)
- `wiki/path/page.md`

### Broken Wikilinks
- `wiki/page.md` links to [[Name]] — no matching page found

### Missing Pages (referenced 3+ times, no page)
- [[Name]] — referenced N times

## Semantic Issues

### Contradictions
- `wiki/concepts/A.md` claims X; `wiki/sources/B.md` claims Y

### Stale Content
- `wiki/concepts/X.md` — last updated YYYY-MM-DD; newer source Z contradicts claim W

### Data Gaps & Suggested Sources
- Gap: no coverage of topic X → suggest: search for "..." or read paper "..."

### Thin Pages
- [[ConceptName]] — mentioned in N sources but page has only N words

---

Ask the user if they want the report saved to wiki/lint-report.md.
If --save was passed: save automatically without asking.

Append to wiki/log.md:
## [today's date] lint | Wiki health check
N orphans, N broken links, N contradictions, N gaps identified.
