# wikime

An LLM Wiki skill for Claude Code, Codex, OpenCode, and Gemini CLI. Drop documents into `raw/`, run one command, get a persistent interlinked knowledge base that compounds over time.

Implements [Andrej Karpathy's LLM Wiki pattern](https://x.com/karpathy/status/2039805659525644595).

## Install

### Option 1 — Skill (recommended)

Installs the wiki schema globally so any Claude Code session can build and query wikis without any per-project setup.

```bash
# Install all five skills at once:
npx skills add https://github.com/chandrasekaran1011/wikime --all -g

# Or install individually:
npx skills add https://github.com/chandrasekaran1011/wikime --skill wikime -g
npx skills add https://github.com/chandrasekaran1011/wikime --skill wiki-ingest -g
npx skills add https://github.com/chandrasekaran1011/wikime --skill wiki-query -g
npx skills add https://github.com/chandrasekaran1011/wikime --skill wiki-lint -g
npx skills add https://github.com/chandrasekaran1011/wikime --skill wiki-graph -g
```

Once installed, open any project in Claude Code, drop files into `raw/`, and say:

```
ingest raw/report.pdf
ingest all files in raw/
what does the wiki say about X?
lint the wiki
build the knowledge graph
```

### Option 2 — Slash commands (Claude Code)

If you want `/wiki-ingest`, `/wiki-query`, `/wiki-lint`, `/wiki-graph` as slash commands in a specific project, run `init.js` inside that project:

```bash
cd your-project

# Clone or download wikime, then:
node /path/to/wikime/init.js

# Also scaffold editable prompt templates:
node /path/to/wikime/init.js --prompts
```

This copies `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, and `.claude/commands/` into your project. Restart Claude Code and the `/wiki-*` commands will appear.

> **Note:** The skill (Option 1) and slash commands (Option 2) are independent. The skill works globally without any per-project files. The slash commands are just a convenience shortcut — they trigger the same behavior.

## Usage

### With the skill installed (any project)

```
ingest raw/report.pdf
ingest all files in raw/
query: what are the main themes?
what does the wiki say about X?
compare X and Y from the wiki
lint the wiki
build the knowledge graph
```

### With slash commands installed (Claude Code)

```
/wiki-ingest raw/report.pdf
/wiki-ingest raw/deck.pptx
/wiki-query "what are the main themes?"
/wiki-lint
/wiki-graph
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

## Tips

- Open as an **Obsidian vault** — `[[wikilinks]]`, graph view, and Dataview all work natively
- Use **Obsidian Web Clipper** to clip web articles directly to `raw/`
- **File query answers back** — ask "save this answer to the wiki" after a query
- **Lint regularly** — catches orphans, broken links, contradictions, and knowledge gaps
- **Co-evolve the schema** — edit `CLAUDE.md` / `AGENTS.md` to add domain-specific conventions
- The wiki is a **git repo** — version history for free, and LLM agents can `git blame` their own edits
- **Image two-pass rule** — the LLM reads markdown text first, then opens image files separately

## License

MIT
