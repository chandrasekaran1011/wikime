// graph-template.js — Full HTML template for the wiki-graph skill
// Replace NODES_JSON and EDGES_JSON with actual JSON arrays before writing graph.html
//
// Usage in wiki-graph SKILL.md:
//   Read this file, replace NODES_JSON and EDGES_JSON, write to graph/graph.html

const TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wiki Knowledge Graph</title>
  <script src="https://unpkg.com/vis-network@9.1.9/standalone/umd/vis-network.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #1a1a2e; color: #eee; height: 100vh; display: flex; flex-direction: column; }
    #toolbar { display: flex; align-items: center; gap: 10px; padding: 10px 16px; background: #16213e; border-bottom: 1px solid #0f3460; flex-shrink: 0; }
    #toolbar h1 { font-size: 15px; font-weight: 600; color: #e0e0ff; margin-right: 8px; }
    #search { padding: 5px 10px; border-radius: 6px; border: 1px solid #0f3460; background: #1a1a2e; color: #eee; font-size: 13px; width: 200px; }
    #search::placeholder { color: #666; }
    .btn { padding: 5px 12px; border-radius: 6px; border: 1px solid #0f3460; background: #0f3460; color: #eee; font-size: 12px; cursor: pointer; }
    .btn:hover { background: #1a5276; }
    #stats { font-size: 12px; color: #888; margin-left: auto; }
    #main { display: flex; flex: 1; overflow: hidden; }
    #graph { flex: 1; }
    #panel { width: 280px; background: #16213e; border-left: 1px solid #0f3460; padding: 16px; overflow-y: auto; display: none; flex-direction: column; gap: 10px; }
    #panel.open { display: flex; }
    #panel h2 { font-size: 14px; color: #e0e0ff; }
    #panel .meta { font-size: 12px; color: #888; }
    #panel .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
    #panel ul { font-size: 12px; color: #bbb; padding-left: 16px; }
    #panel li { margin: 3px 0; }
    #close-panel { align-self: flex-end; background: none; border: none; color: #888; cursor: pointer; font-size: 18px; line-height: 1; }
    #legend { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    .legend-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #aaa; }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; }
    .legend-line { width: 18px; height: 2px; }
    .legend-dashed { width: 18px; height: 0; border-top: 2px dashed #aaa; }
    .legend-dotted { width: 18px; height: 0; border-top: 2px dotted #aaa; }
  </style>
</head>
<body>
<div id="toolbar">
  <h1>Wiki Graph</h1>
  <input id="search" type="text" placeholder="Search nodes…">
  <button class="btn" onclick="resetView()">Reset view</button>
  <div id="legend">
    <div class="legend-item"><div class="legend-dot" style="background:#4CAF50"></div>source</div>
    <div class="legend-item"><div class="legend-dot" style="background:#2196F3"></div>entity</div>
    <div class="legend-item"><div class="legend-dot" style="background:#FF9800"></div>concept</div>
    <div class="legend-item"><div class="legend-dot" style="background:#9C27B0"></div>synthesis</div>
    <div class="legend-item"><div class="legend-line" style="background:#aaa"></div>extracted</div>
    <div class="legend-item"><div class="legend-dashed"></div>inferred</div>
    <div class="legend-item"><div class="legend-dotted"></div>ambiguous</div>
  </div>
  <div id="stats"></div>
</div>
<div id="main">
  <div id="graph"></div>
  <div id="panel">
    <button id="close-panel" onclick="closePanel()">×</button>
    <h2 id="panel-title"></h2>
    <span id="panel-badge" class="badge"></span>
    <div id="panel-path" class="meta"></div>
    <div id="panel-connections"></div>
  </div>
</div>
<script>
const TYPE_COLORS = { source: '#4CAF50', entity: '#2196F3', concept: '#FF9800', synthesis: '#9C27B0', unknown: '#607D8B' };
const EDGE_COLORS = { EXTRACTED: { color: '#778899', dashes: false }, INFERRED: { color: '#556677', dashes: [6,3] }, AMBIGUOUS: { color: '#445566', dashes: [2,4] } };

const rawNodes = NODES_JSON;
const rawEdges = EDGES_JSON;

const nodes = new vis.DataSet(rawNodes.map(n => ({
  id: n.id, label: n.label, title: n.path || n.id,
  color: { background: TYPE_COLORS[n.type] || TYPE_COLORS.unknown, border: '#fff', highlight: { background: '#fff', border: TYPE_COLORS[n.type] || TYPE_COLORS.unknown } },
  font: { color: '#fff', size: 12 },
  shape: 'dot', size: 12, _type: n.type, _path: n.path
})));

const edges = new vis.DataSet(rawEdges.map((e, i) => {
  const style = EDGE_COLORS[e.type] || EDGE_COLORS.EXTRACTED;
  return { id: i, from: e.from, to: e.to, title: e.label || e.type, label: '', dashes: style.dashes, color: { color: style.color, highlight: '#aaa' }, smooth: { type: 'dynamic' } };
}));

const container = document.getElementById('graph');
const network = new vis.Network(container, { nodes, edges }, {
  physics: { stabilization: { iterations: 150 }, barnesHut: { gravitationalConstant: -8000, springLength: 120, damping: 0.15 } },
  interaction: { hover: true, tooltipDelay: 200 },
  edges: { arrows: { to: { enabled: true, scaleFactor: 0.5 } } }
});

document.getElementById('stats').textContent = \`\${rawNodes.length} nodes · \${rawEdges.length} edges\`;

network.on('click', params => {
  if (params.nodes.length === 0) { closePanel(); return; }
  const id = params.nodes[0];
  const node = nodes.get(id);
  const connected = network.getConnectedNodes(id);
  const connEdges = network.getConnectedEdges(id);
  const panel = document.getElementById('panel');
  document.getElementById('panel-title').textContent = node.label;
  const badge = document.getElementById('panel-badge');
  badge.textContent = node._type || 'unknown';
  badge.style.background = TYPE_COLORS[node._type] || TYPE_COLORS.unknown;
  document.getElementById('panel-path').textContent = node._path || '';
  const ul = document.createElement('ul');
  connected.forEach(cid => {
    const cn = nodes.get(cid);
    const li = document.createElement('li');
    li.textContent = cn ? cn.label : cid;
    ul.appendChild(li);
  });
  const connDiv = document.getElementById('panel-connections');
  connDiv.innerHTML = \`<strong style="font-size:12px;color:#aaa">Connections (\${connected.length})</strong>\`;
  if (connected.length) connDiv.appendChild(ul);
  panel.classList.add('open');
});

function closePanel() { document.getElementById('panel').classList.remove('open'); }
function resetView() { network.fit({ animation: true }); }

document.getElementById('search').addEventListener('input', e => {
  const q = e.target.value.toLowerCase().trim();
  if (!q) { nodes.forEach(n => nodes.update({ id: n.id, opacity: 1, size: 12 })); return; }
  nodes.forEach(n => {
    const match = n.label.toLowerCase().includes(q);
    nodes.update({ id: n.id, opacity: match ? 1 : 0.15, size: match ? 18 : 8 });
  });
});
</script>
</body>
</html>`;

// When writing graph.html, replace these placeholders:
//   NODES_JSON → JSON.stringify(nodesArray)
//   EDGES_JSON → JSON.stringify(edgesArray)
module.exports = { TEMPLATE };
