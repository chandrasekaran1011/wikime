# wikime — LLM Wiki Schema

You are a disciplined wiki maintainer. This file tells you everything you need to know about how this wiki works, what the conventions are, and what to do when the user asks you to ingest, query, lint, or build the graph.

Read this file fully at the start of every session. Follow the workflows below exactly. Do not improvise structure or naming — consistency is what makes the wiki useful over time.

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

graph/                # auto-generated graph (built by /wiki-graph)
  graph.json
  graph.html

CLAUDE.md             # this file — the schema
AGENTS.md             # same schema for Codex/OpenCode
prompts/              # overridable prompt templates (optional)
```

---

## Naming Conventions

- **Source slugs**: `kebab-case` matching source filename — e.g. `attention-is-all-you-need`
- **Entity pages**: `TitleCase.md` — e.g. `OpenAI.md`, `AndrejKarpathy.md`
- **Concept pages**: `TitleCase.md` — e.g. `RetrievalAugmentedGeneration.md`, `AttentionMechanism.md`
- **Synthesis slugs**: `kebab-case` derived from the question — e.g. `main-approaches-to-hallucination.md`
- **Wikilinks**: `[[PageName]]` — always use the page's TitleCase or slug name without the `.md` extension

---

## Page Frontmatter

Every wiki page must have YAML frontmatter:

```yaml
---
title: "Page Title"
type: source | entity | concept | synthesis
tags: []
sources: []        # list of source slugs that inform this page
last_updated: YYYY-MM-DD
---
```

Source pages additionally include:
```yaml
format: pdf | docx | pptx | xlsx | md | txt | image
source_file: raw/filename.pdf
source_md: raw/filename.md
```

Concept pages additionally include:
```yaml
aliases: [Alias One, Alternative Name]
related: [RelatedConcept, AnotherConcept]
```

---

## Document Conversion (Pass 0)

Before ingesting any non-markdown file, convert it to markdown. Check tool availability in this order and use the first that works:

### PDF → Markdown
```bash
# 1. markitdown (best)
markitdown raw/file.pdf -o raw/file.md

# 2. marker
marker_single raw/file.pdf --output_dir raw/

# 3. pdftotext (usually pre-installed)
pdftotext -layout raw/file.pdf - > raw/file.md

# 4. Python fallback
python3 -c "import pdfminer.high_level as pm; print(pm.extract_text('raw/file.pdf'))" > raw/file.md
```

### DOCX → Markdown
```bash
# 1. markitdown
markitdown raw/file.docx -o raw/file.md

# 2. pandoc
pandoc raw/file.docx -t markdown -o raw/file.md

# 3. python-docx
python3 -c "
from docx import Document
doc = Document('raw/file.docx')
for p in doc.paragraphs:
    if p.style.name.startswith('Heading'):
        print(f\"{'#' * int(p.style.name[-1])} {p.text}\")
    elif p.text.strip():
        print(p.text)
    else:
        print()
" > raw/file.md
```

### PPTX → Markdown
```bash
# 1. markitdown
markitdown raw/file.pptx -o raw/file.md

# 2. python-pptx (preserves speaker notes)
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

# 3. pandoc
pandoc raw/file.pptx -t markdown -o raw/file.md
```

### XLSX / CSV → Markdown
```bash
# 1. markitdown
markitdown raw/file.xlsx -o raw/file.md

# 2. openpyxl
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
    print('| ' + ' | '.join(['---'] * len(header)) + ' |')
    for row in rows[1:1001]:
        print('| ' + ' | '.join(str(c or '') for c in row) + ' |')
    print()
" > raw/file.md

# 3. pandas
python3 -c "
import pandas as pd
for sheet in pd.ExcelFile('raw/file.xlsx').sheet_names:
    df = pd.read_excel('raw/file.xlsx', sheet_name=sheet, nrows=1000)
    print(f'## {sheet}')
    print(df.to_markdown(index=False))
    print()
" > raw/file.md
```

### Images → Markdown
Send the image file directly to the vision model with this prompt:
```
Describe this image for a knowledge wiki. Include:
- What type of document or visual this is
- All visible text (transcribe exactly)
- Key concepts illustrated
- Any data, charts, or diagrams explained in full
- Anything notable about layout or structure
```
Write output to `raw/<image-name>.md` with a reference to the original file.

**Important — inline image limitation:** You cannot read markdown with inline images in a single pass. Always read the text of a `.md` file first, then open referenced image files (`.png`, `.jpg`, `.webp`, etc.) separately for visual context, then integrate both into your summary.

### Skip logic
- Skip if `<filename>.md` already exists and source file has not changed
- Skip `.md`, `.txt`, `.log`, `.vtt`, `.srt` files (already text)
- Always report which tool was used (or skipped and why)

---

## Ingest Workflow

Triggered by: `/wiki-ingest raw/file.pdf` or *"ingest this file: raw/report.pdf"*

**Steps — follow in order, do not skip:**

1. **Convert** (if needed)
   - Detect format from extension
   - Check tool availability using the priority order above
   - Convert to `raw/<slug>.md` alongside original
   - Report which tool was used

2. **Read the source**
   - Read `raw/<slug>.md` fully (text first)
   - If source has inline image references: open each image file separately after reading text
   - If very long (>~8000 words): read in sections, summarize each section, then synthesize

3. **Read current wiki context**
   - Read `wiki/index.md` (full catalog of existing pages)
   - Read `wiki/overview.md` (current synthesis)
   - Read any existing concept/entity pages that seem directly relevant

4. **Write source page** → `wiki/sources/<slug>.md`
   Use the source page format defined below.

5. **Update `wiki/index.md`**
   Add entry under `## Sources` section.

6. **Update `wiki/overview.md`**
   Revise the living synthesis if this source meaningfully changes the picture. If the wiki is new, write an initial overview. Keep overview.md to ~500 words — if it grows too long, compress older sections.

7. **Update entity pages**
   For each key person, company, project, or product mentioned:
   - If page exists: read it, then update/expand
   - If new: create `wiki/entities/<EntityName>.md`

8. **Update concept pages**
   For each key idea, framework, method, or theory:
   - If page exists: read it, then update/expand incorporating new information — **this is the compounding mechanism**
   - If new: create `wiki/concepts/<ConceptName>.md`

9. **Flag contradictions**
   Compare claims in this source against existing wiki content.
   Note conflicts explicitly:
   - In the source page under `## Contradictions`
   - In relevant concept/entity pages under `## Contradictions`

10. **Append to `wiki/log.md`**
    ```
    ## [YYYY-MM-DD] ingest | <Title> (<format>)

    Added source. Key claims: ... Pages touched: ...
    ```

**After completing all steps, report:**
- What was converted (format + tool used)
- Which wiki pages were created
- Which wiki pages were updated
- Any contradictions found

---

## Query Workflow

Triggered by: `/wiki-query "question"` or *"what does the wiki say about X?"*

**Steps:**

1. **Read `wiki/index.md`**
   Identify relevant pages by title and one-line summary.

2. **Read relevant pages**
   Read up to ~12 most relevant pages. If index doesn't surface enough candidates, reason about which pages likely contain the answer.

3. **Determine output format**
   Default: well-structured markdown with headers and bullets.
   If user specifies: comparison table | Marp slide deck | matplotlib chart | Obsidian canvas.
   - Marp: prefix with `---\nmarp: true\n---` and use `---` as slide breaks
   - Table: markdown table with rows = entities/sources, columns = dimensions being compared
   - Chart: describe the chart in detail + provide Python matplotlib code to render it

4. **Synthesize answer**
   Write the answer in the requested format.
   Use `[[WikiLink]]` citations throughout.
   Include a `## Sources` section listing pages drawn from and what each contributed.

5. **Offer to save**
   Ask if the user wants the answer filed back as `wiki/syntheses/<slug>.md`.
   If yes: write it, update `wiki/index.md` under `## Syntheses`, append to log.
   Good answers are valuable wiki pages — they compound the knowledge base just like sources do.

6. **Append to log**
   ```
   ## [YYYY-MM-DD] query | <question>
   Synthesized from N pages. [Saved to syntheses/slug.md]
   ```

---

## Lint Workflow

Triggered by: `/wiki-lint` or *"lint the wiki"*

**Structural checks (use Grep and Glob — no LLM needed):**

- **Orphan pages**: wiki pages with zero inbound `[[wikilinks]]` from other pages
  (exclude `index.md`, `log.md`, `overview.md` from orphan check)
- **Broken links**: `[[WikiLinks]]` pointing to pages that don't exist
- **Missing pages**: names referenced in 3+ pages but no dedicated page exists

**Semantic checks (read and reason):**

- **Contradictions**: claims that conflict between pages — name the exact pages and claims
- **Stale content**: summaries not updated after newer sources changed the picture
- **Data gaps**: important questions the wiki cannot yet answer → suggest specific sources or web searches to fill each gap
- **Thin pages**: concepts mentioned frequently across sources but their page lacks depth

**Output:** structured lint report with all findings.
Ask if the user wants it saved to `wiki/lint-report.md`.

**Append to log:**
```
## [YYYY-MM-DD] lint | Wiki health check
N orphans, N broken links, N contradictions, N data gaps.
```

---

## Graph Workflow

Triggered by: `/wiki-graph` or *"build the knowledge graph"*

**Pass 1 — Extracted edges (deterministic):**

1. Use Grep to find all `[[wikilinks]]` across every file in `wiki/`
2. Build node list: one node per wiki page
   - `id` = relative path without `.md` extension
   - `label` = title from frontmatter (fallback: filename)
   - `type` = source | entity | concept | synthesis (from frontmatter `type:` field)
3. Build edge list: one edge per `[[wikilink]]`, tagged `EXTRACTED`, confidence `1.0`

**Pass 2 — Inferred edges (LLM, use sparingly):**

4. For each wiki page, identify implicit relationships not captured by explicit wikilinks
   - Tag `INFERRED` (confidence ≥ 0.7) or `AMBIGUOUS` (< 0.7)
   - Add a one-line relationship description as edge label
   - Do not repeat edges already in Pass 1

**Pass 3 — Output:**

5. Write `graph/graph.json`:
```json
{
  "nodes": [{"id": "...", "label": "...", "type": "...", "path": "..."}],
  "edges": [{"from": "...", "to": "...", "type": "EXTRACTED|INFERRED|AMBIGUOUS", "confidence": 1.0, "label": ""}],
  "built": "YYYY-MM-DD"
}
```

6. Write `graph/graph.html` — self-contained vis.js visualization.
   Use the template defined in the Graph HTML Template section below.

7. Summarize: N nodes, N edges (N extracted, N inferred), most connected nodes (hubs)

8. Append to log:
```
## [YYYY-MM-DD] graph | Knowledge graph rebuilt
N nodes, N edges (N extracted, N inferred). Top hubs: ...
```

**Optional community detection (if python + networkx available):**
```bash
python3 -c "
import json, networkx as nx
from networkx.algorithms import community as nxc
g = json.load(open('graph/graph.json'))
G = nx.Graph()
for n in g['nodes']: G.add_node(n['id'])
for e in g['edges']: G.add_edge(e['from'], e['to'])
comms = nxc.louvain_communities(G, seed=42)
print(f'{len(comms)} communities')
for i, c in enumerate(sorted(comms, key=len, reverse=True)[:5]):
    print(f'  {i+1}: {len(c)} nodes — {sorted(c)[:3]}')
"
```

---

## Graph HTML Template

When writing `graph/graph.html`, use this self-contained vis.js template:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Wiki Knowledge Graph</title>
<script src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
<style>
  body { margin:0; background:#1a1a2e; font-family:sans-serif; color:#eee; }
  #graph { width:100vw; height:100vh; }
  #controls { position:fixed; top:10px; left:10px; background:rgba(0,0,0,0.75);
    padding:12px; border-radius:8px; z-index:10; min-width:220px; }
  #controls h3 { margin:0 0 8px; font-size:14px; }
  #search { width:100%; padding:5px; margin-bottom:8px; background:#333;
    color:#eee; border:1px solid #555; border-radius:4px; box-sizing:border-box; }
  .legend-dot { display:inline-block; width:10px; height:10px;
    border-radius:50%; margin-right:5px; }
  #info { position:fixed; bottom:10px; left:10px; background:rgba(0,0,0,0.85);
    padding:12px; border-radius:8px; z-index:10; max-width:320px; display:none; }
  #stats { position:fixed; top:10px; right:10px; background:rgba(0,0,0,0.75);
    padding:8px 12px; border-radius:8px; font-size:12px; }
</style>
</head>
<body>
<div id="controls">
  <h3>Wiki Graph</h3>
  <input id="search" type="text" placeholder="Search nodes…" oninput="filterNodes(this.value)">
  <div style="font-size:12px;line-height:1.8">
    <span class="legend-dot" style="background:#4CAF50"></span>source<br>
    <span class="legend-dot" style="background:#2196F3"></span>entity<br>
    <span class="legend-dot" style="background:#FF9800"></span>concept<br>
    <span class="legend-dot" style="background:#9C27B0"></span>synthesis
  </div>
  <div style="margin-top:8px;font-size:11px;color:#aaa">
    ── extracted &nbsp; <span style="color:#FF5722">──</span> inferred
  </div>
</div>
<div id="graph"></div>
<div id="info">
  <b id="info-title"></b><br>
  <span id="info-type" style="font-size:12px;color:#aaa"></span><br>
  <span id="info-path" style="font-size:11px;color:#666;word-break:break-all"></span>
</div>
<div id="stats"></div>
<script>
const TYPE_COLORS = {source:"#4CAF50",entity:"#2196F3",concept:"#FF9800",synthesis:"#9C27B0"};
const EDGE_COLORS = {EXTRACTED:"#666666",INFERRED:"#FF5722",AMBIGUOUS:"#BDBDBD"};
const rawNodes = NODES_JSON;
const rawEdges = EDGES_JSON;
const nodes = new vis.DataSet(rawNodes.map(n => ({
  ...n, color: TYPE_COLORS[n.type] || "#9E9E9E", font:{color:"#eee",size:12}
})));
const edges = new vis.DataSet(rawEdges.map(e => ({
  ...e,
  color: {color: EDGE_COLORS[e.type] || "#666"},
  dashes: e.type !== "EXTRACTED",
  arrows:{to:{enabled:true,scaleFactor:0.4}},
  width: e.type === "EXTRACTED" ? 1.2 : 0.7,
  title: e.label || e.type
})));
const container = document.getElementById("graph");
const network = new vis.Network(container, {nodes, edges}, {
  nodes:{shape:"dot",size:10,borderWidth:1.5},
  edges:{smooth:{type:"continuous"}},
  physics:{stabilization:{iterations:200},barnesHut:{gravitationalConstant:-6000,springLength:130}},
  interaction:{hover:true,tooltipDelay:150}
});
network.on("click", p => {
  if (p.nodes.length) {
    const n = nodes.get(p.nodes[0]);
    document.getElementById("info").style.display = "block";
    document.getElementById("info-title").textContent = n.label;
    document.getElementById("info-type").textContent = n.type;
    document.getElementById("info-path").textContent = n.path || "";
  } else {
    document.getElementById("info").style.display = "none";
  }
});
document.getElementById("stats").textContent =
  `${nodes.length} nodes · ${edges.length} edges`;
function filterNodes(q) {
  const lower = q.toLowerCase();
  nodes.forEach(n => nodes.update({id:n.id, opacity:(!q||n.label.toLowerCase().includes(lower))?1:0.1}));
}
</script>
</body>
</html>
```

Replace `NODES_JSON` and `EDGES_JSON` with the actual JSON arrays from `graph/graph.json`.

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
2–4 sentence summary of the source.

## Key Claims
- Claim 1
- Claim 2

## Key Quotes
> "Exact quote" — context

## Connections
- [[EntityName]] — how they relate to this source
- [[ConceptName]] — how this source discusses the concept

## Contradictions
- Contradicts [[OtherPage]] on: specific claim (or "none detected")
```

### Concept page (`wiki/concepts/ConceptName.md`)

```markdown
---
title: "Concept Name"
type: concept
aliases: [Alias One, Alternative Name]
sources: [slug1, slug2]
related: [RelatedConcept, AnotherConcept]
last_updated: YYYY-MM-DD
---

## Definition
Clear, precise definition.

## How It Works
Technical or substantive explanation.

## Evidence
- [[SourceSlug]] — supports this because...
- [[SourceSlug2]] — challenges this because...

## Contradictions
- [[SourceA]] claims X; [[SourceB]] claims Y — unresolved as of YYYY-MM-DD

## See Also
- [[RelatedConcept]]
- [[AnotherConcept]]
```

*When a concept page already exists: read it fully, then rewrite/expand it incorporating new source information. The page gets richer with each new source — this is the compounding mechanism.*

### Entity page (`wiki/entities/EntityName.md`)

```markdown
---
title: "Entity Name"
type: entity
sources: [slug1, slug2]
last_updated: YYYY-MM-DD
---

## Overview
One paragraph.

## Appearances
- [[source-slug]] — context / role in this source
- [[source-slug-2]] — context

## Related
- [[ConceptName]] — connection
```

### Synthesis page (`wiki/syntheses/<slug>.md`)

```markdown
---
title: "Question asked"
type: synthesis
sources: [slug1, slug2]
last_updated: YYYY-MM-DD
---

[LLM-generated answer with [[wikilink]] citations]

## Sources
- [[PageName]] — what it contributed to this answer
```

---

## Index Format (`wiki/index.md`)

```markdown
# Wiki Index

Last updated: YYYY-MM-DD | Sources: N | Concepts: N | Entities: N

## Overview
- [Overview](overview.md) — living synthesis across all sources

## Sources
- [Source Title](sources/slug.md) — one-line summary | format: pdf | YYYY-MM-DD

## Concepts
- [Concept Name](concepts/ConceptName.md) — one-line description

## Entities
- [Entity Name](entities/EntityName.md) — one-line description

## Syntheses
- [Query Title](syntheses/slug.md) — what question it answers
```

---

## Log Format (`wiki/log.md`)

Append-only. Newest entries at the top. Each entry starts with a consistent prefix:

```
## [YYYY-MM-DD] ingest | Source Title (format)
## [YYYY-MM-DD] query | Question asked
## [YYYY-MM-DD] lint | Wiki health check
## [YYYY-MM-DD] graph | Knowledge graph rebuilt
```

Grep-parseable:
```bash
grep "^## \[" wiki/log.md | tail -10       # last 10 operations
grep "ingest" wiki/log.md | wc -l          # total sources ingested
grep "^## \[" wiki/log.md | grep query     # all queries
```

---

## Customizing Prompts

If a `prompts/` directory exists, check for these files and use them instead of your built-in behavior:

- `prompts/summarize.md` — how to summarize a source (Pass 1)
- `prompts/write-concept.md` — how to write a concept article (Pass 3)
- `prompts/caption-image.md` — how to describe an image

If a prompt file exists, read it and follow its instructions for that operation.

---

## Tips (follow these)

- **Ingest one source at a time** when staying involved produces a better wiki. Batch ingest is fine for initial loading.
- **File good query answers back** — always offer to save synthesis pages. They compound the knowledge base.
- **Co-evolve this schema** — when the user adjusts conventions, update CLAUDE.md and AGENTS.md to match.
- **overview.md compaction** — if overview.md exceeds ~500 words, compress older sections while preserving key claims.
- **Image two-pass rule** — always read markdown text first, then open image files separately.
- **Obsidian compatibility** — all pages use `[[wikilinks]]` and YAML frontmatter so Obsidian renders them natively.
