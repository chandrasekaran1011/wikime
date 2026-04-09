Build the knowledge graph from all wiki pages.

Usage: /wiki-graph
       /wiki-graph --no-infer   (skip LLM inference pass, faster)
       /wiki-graph --open       (open graph.html in browser after building)

---

Follow the Graph Workflow defined in CLAUDE.md exactly:

**Pass 1 — Extracted edges (deterministic)**

1. Use Grep to find all [[wikilinks]] across every .md file in wiki/
   (exclude index.md, log.md, lint-report.md from node list — include them in link scanning)

2. Build the node list — one node per wiki page:
   - id: relative path without .md (e.g. "concepts/AttentionMechanism")
   - label: title from YAML frontmatter, or filename if no frontmatter
   - type: value of `type:` field in frontmatter (source|entity|concept|synthesis|unknown)
   - path: relative file path including .md

3. Build the extracted edge list — one edge per [[wikilink]]:
   - from: id of the page containing the link
   - to: id of the linked page (resolve by matching stem name case-insensitively)
   - type: "EXTRACTED"
   - confidence: 1.0
   - label: "" (no label for extracted edges)
   - Skip self-links and links to non-existent pages

**Pass 2 — Inferred edges (LLM)**
Skip this pass if --no-infer is set.

4. For each wiki page (concepts and entities primarily), identify implicit semantic relationships
   not already captured by explicit [[wikilinks]].
   For each implicit relationship found:
   - to: id of the related page
   - type: "INFERRED" if confidence >= 0.7, "AMBIGUOUS" if < 0.7
   - confidence: 0.0–1.0
   - label: one-line description of the relationship (e.g. "prerequisite for", "contrasts with")
   Do not repeat edges already in Pass 1.
   Process pages in batches to avoid context overflow.

**Pass 3 — Write output**

5. Write graph/graph.json:
```json
{
  "nodes": [
    {"id": "concepts/AttentionMechanism", "label": "Attention Mechanism", "type": "concept", "path": "wiki/concepts/AttentionMechanism.md"}
  ],
  "edges": [
    {"from": "sources/attention-paper", "to": "concepts/AttentionMechanism", "type": "EXTRACTED", "confidence": 1.0, "label": ""}
  ],
  "built": "YYYY-MM-DD",
  "stats": {"nodes": N, "edges": N, "extracted": N, "inferred": N}
}
```

6. Write graph/graph.html — self-contained vis.js visualization using the template in CLAUDE.md.
   Replace NODES_JSON with the nodes array and EDGES_JSON with the edges array.
   The file must open in any browser with no server required.

7. If python + networkx is available, run community detection:
```bash
python3 -c "
import json, networkx as nx
from networkx.algorithms import community as nxc
g = json.load(open('graph/graph.json'))
G = nx.Graph()
for n in g['nodes']: G.add_node(n['id'])
for e in g['edges']: G.add_edge(e['from'], e['to'])
if G.number_of_edges() == 0:
    print('No edges — skipping community detection')
else:
    comms = nxc.louvain_communities(G, seed=42)
    print(f'{len(comms)} communities detected')
    for i, c in enumerate(sorted(comms, key=len, reverse=True)[:5]):
        print(f'  Community {i+1} ({len(c)} nodes): {sorted(c)[:4]}')
"
```

8. Identify hub nodes — top 5 most-connected (highest degree):
   Count inbound + outbound edges per node, list the top 5.

9. If --open is set, open graph/graph.html in the default browser:
```bash
open graph/graph.html        # macOS
xdg-open graph/graph.html   # Linux
start graph/graph.html       # Windows
```

**Step 4 — Summary and log**

Report:
- Total nodes (breakdown by type: N sources, N entities, N concepts, N syntheses)
- Total edges (N extracted, N inferred, N ambiguous)
- Top 5 hub nodes (most connections)
- Path to graph.html

Append to wiki/log.md:
## [today's date] graph | Knowledge graph rebuilt
N nodes (N sources, N entities, N concepts), N edges (N extracted, N inferred).
Top hubs: [[Node1]], [[Node2]], [[Node3]].
