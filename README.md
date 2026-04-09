# wikime

An LLM Wiki skill for Claude Code, Codex, OpenCode, and Gemini CLI. Drop documents into `raw/`, run one command, get a persistent interlinked knowledge base that compounds over time.

Implements [Andrej Karpathy's LLM Wiki pattern](https://x.com/karpathy/status/2039805659525644595).

## Install

### Option 1 — npx skills add (recommended)

```bash
# Install all four skills (ingest, query, lint, graph):
npx skills add https://github.com/chandrasekaran1011/wikime --skill wikime

# Or install individual skills:
npx skills add https://github.com/chandrasekaran1011/wikime --skill wiki-ingest
npx skills add https://github.com/chandrasekaran1011/wikime --skill wiki-query
npx skills add https://github.com/chandrasekaran1011/wikime --skill wiki-lint
npx skills add https://github.com/chandrasekaran1011/wikime --skill wiki-graph
```

Skills are installed to `.agents/skills/` (cross-client) or `.<client>/skills/` and auto-loaded by any [Agent Skills](https://agentskills.io)-compatible client.

### Option 2 — init.js (Claude Code + Codex)

Copies `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, and slash commands into your project:

```bash
node /path/to/wikime/skill/init.js

# With editable prompt templates:
node /path/to/wikime/skill/init.js --prompts
```

## Usage

### Claude Code
```
/wiki-ingest raw/report.pdf          # ingest a file
/wiki-ingest raw/deck.pptx           # converts PPTX → md, then ingests
/wiki-query "what are the main themes?"
/wiki-query "compare X and Y" --save  # save answer back to wiki
/wiki-lint                            # health check
/wiki-lint --save                     # save lint report to wiki/lint-report.md
/wiki-graph                           # build interactive knowledge graph
/wiki-graph --no-infer --open         # skip LLM inference, open in browser
```

### Codex / OpenCode / Gemini CLI
```
ingest raw/report.pdf
query: what are the main themes?
what does the wiki say about X?
lint the wiki
build the knowledge graph
```

## Supported Formats

| Format | Extension | Conversion |
|--------|-----------|------------|
| Markdown | `.md` | native |
| PDF | `.pdf` | markitdown / pdftotext / pdfminer |
| Word | `.docx` | markitdown / pandoc / python-docx |
| PowerPoint | `.pptx` | markitdown / python-pptx / pandoc |
| Excel | `.xlsx` | markitdown / openpyxl / pandas |
| CSV | `.csv` | built-in python |
| Images | `.png .jpg .webp .gif` | vision model (two-pass) |
| Plain text | `.txt .log .vtt .srt` | native |

**Recommended:** `pip install markitdown` — handles all formats with one tool.

## How It Works

The wiki has three layers:

```
raw/            # Layer 1 — your source documents (immutable, you own this)
wiki/           # Layer 2 — LLM-generated knowledge base (LLM owns this)
  index.md      #   catalog of all pages
  log.md        #   append-only operation log
  overview.md   #   living synthesis across all sources
  sources/      #   one page per ingested document
  entities/     #   people, companies, projects, products
  concepts/     #   ideas, frameworks, methods, theories
  syntheses/    #   saved query answers
graph/          # Layer 3 — auto-generated graph
  graph.json    #   node/edge data
  graph.html    #   interactive vis.js visualization (self-contained)
```

On every ingest, concept and entity pages are **read then expanded** — not replaced. The wiki gets richer with every document added.

## Structure (after init)

```
CLAUDE.md               # schema auto-read by Claude Code
AGENTS.md               # schema auto-read by Codex / OpenCode
GEMINI.md               # schema for Gemini CLI
.claude/commands/
  wiki-ingest.md        # /wiki-ingest slash command
  wiki-query.md         # /wiki-query slash command
  wiki-lint.md          # /wiki-lint slash command
  wiki-graph.md         # /wiki-graph slash command
prompts/                # optional — override default prompt templates
  summarize.md
  write-concept.md
  caption-image.md
```

## Skills Structure (for npx skills add)

```
source/skills/
  wikime/               # meta-skill (all four operations)
  wiki-ingest/          # ingest skill
  wiki-query/           # query skill
  wiki-lint/            # lint skill
  wiki-graph/           # graph skill (includes vis.js HTML template)
```

## Tips

- Open as an **Obsidian vault** — `[[wikilinks]]`, graph view, and Dataview all work natively
- Use **Obsidian Web Clipper** to clip web articles directly to `raw/`
- **File query answers back**: `/wiki-query "question" --save` — explorations compound the wiki just like sources do
- **Lint regularly**: `/wiki-lint` catches orphans, broken links, contradictions, and knowledge gaps
- **Co-evolve the schema**: edit `CLAUDE.md` / `AGENTS.md` to add domain-specific conventions
- The wiki is a **git repo** — version history for free, and LLM agents can `git blame` their own edits
- **Image two-pass rule**: the LLM reads markdown text first, then opens image files separately

## License

MIT
