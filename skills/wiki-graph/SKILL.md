---
name: wiki-graph
description: Build an interactive knowledge graph from the LLM wiki. Extracts wikilinks as edges, infers implicit relationships with LLM, runs community detection, and outputs a self-contained vis.js graph.html viewable in any browser. Use when the user wants to visualize connections in their knowledge base.
license: MIT
compatibility: Optional community detection requires Python + networkx. Graph visualization requires no dependencies — graph.html is self-contained.
metadata:
  author: wikime
  version: "1.0"
---

# wiki-graph

Build the knowledge graph from all wiki pages.

**Claude Code**: `/wiki-graph`
**Codex / any agent**: `build the knowledge graph`

Flags: `--no-infer` (skip LLM inference, faster) | `--open` (open graph.html in browser)

---

## Pass 1 — Extracted edges (deterministic)

1. Grep all `[[wikilinks]]` across every `.md` file in `wiki/`
   (scan all subdirs; include index.md and overview.md for link scanning but exclude from node list)

2. Build node list — one node per wiki page:
   - `id`: relative path without `.md` (e.g. `concepts/AttentionMechanism`)
   - `label`: `title` from YAML frontmatter, or filename if no frontmatter
   - `type`: `source | entity | concept | synthesis | unknown`
   - `path`: relative file path including `.md`

3. Build extracted edge list:
   - `from`: id of page containing the link
   - `to`: id of linked page (match stem name case-insensitively)
   - `type`: `"EXTRACTED"`
   - `confidence`: `1.0`
   - Skip self-links and links to non-existent pages

---

## Pass 2 — Inferred edges (LLM) — skip if `--no-infer`

4. For each wiki page (concepts and entities primarily), identify implicit semantic relationships not already in wikilinks:
   - `to`: id of the related page
   - `type`: `"INFERRED"` if confidence ≥ 0.7, `"AMBIGUOUS"` if < 0.7
   - `confidence`: 0.0–1.0
   - `label`: one-line description (e.g. `"prerequisite for"`, `"contrasts with"`)
   - Do not repeat edges already extracted in Pass 1

---

## Pass 3 — Output

5. Write `graph/graph.json`:
```json
{
  "nodes": [{"id": "...", "label": "...", "type": "...", "path": "..."}],
  "edges": [{"from": "...", "to": "...", "type": "EXTRACTED", "confidence": 1.0, "label": ""}],
  "built": "YYYY-MM-DD",
  "stats": {"nodes": 0, "edges": 0, "extracted": 0, "inferred": 0}
}
```

6. Write `graph/graph.html` — self-contained vis.js visualization.
   See [scripts/graph-template.js](scripts/graph-template.js) for the full HTML template.
   Replace `NODES_JSON` with the nodes array and `EDGES_JSON` with the edges array.
   Node colors: source=#4CAF50, entity=#2196F3, concept=#FF9800, synthesis=#9C27B0
   Edge styles: solid (EXTRACTED), dashed (INFERRED), dotted (AMBIGUOUS)

7. Optional community detection (if python + networkx available):
```bash
python3 -c "
import json, networkx as nx
from networkx.algorithms import community as nxc
g = json.load(open('graph/graph.json'))
G = nx.Graph()
for n in g['nodes']: G.add_node(n['id'])
for e in g['edges']: G.add_edge(e['from'], e['to'])
if G.number_of_edges() == 0:
    print('No edges — skipping')
else:
    comms = nxc.louvain_communities(G, seed=42)
    print(f'{len(comms)} communities')
    for i, c in enumerate(sorted(comms, key=len, reverse=True)[:5]):
        print(f'  {i+1}: {len(c)} nodes — {sorted(c)[:4]}')
"
```

8. If `--open`:
```bash
open graph/graph.html        # macOS
xdg-open graph/graph.html   # Linux
start graph/graph.html       # Windows
```

---

## Report and log

Report:
- Node count (breakdown: N sources, N entities, N concepts, N syntheses)
- Edge count (N extracted, N inferred, N ambiguous)
- Top 5 hub nodes (most connections)
- Path to `graph/graph.html`

Append to `wiki/log.md`:
```
## [YYYY-MM-DD] graph | Knowledge graph rebuilt
N nodes (N sources, N entities, N concepts), N edges (N extracted, N inferred).
Top hubs: [[Node1]], [[Node2]], [[Node3]].
```
