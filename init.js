#!/usr/bin/env node
/**
 * wikime init
 *
 * Scaffolds a new LLM Wiki project in the current directory.
 * Copies CLAUDE.md, AGENTS.md, slash commands, prompts, and wiki scaffold.
 *
 * Usage:
 *   node init.js                 # scaffold in current directory
 *   node init.js ./my-wiki       # scaffold in a new directory
 *   node init.js --prompts       # also scaffold editable prompts/ directory
 *   node init.js --help
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
wikime init — scaffold a new LLM Wiki project

Usage:
  node init.js [target-dir] [options]

Options:
  --prompts   Also create editable prompts/ directory
  --help      Show this help

Examples:
  node init.js                    # init in current directory
  node init.js my-research-wiki   # init in new directory
  node init.js . --prompts        # init here with editable prompts
`);
  process.exit(0);
}

const withPrompts = args.includes('--prompts');
const targetArg = args.find(a => !a.startsWith('--'));
const targetDir = targetArg ? path.resolve(targetArg) : process.cwd();
const skillDir = path.dirname(path.resolve(__filename)); // directory of this script

// ── helpers ──────────────────────────────────────────────────────────────────

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  mkdirp(path.dirname(dest));
  if (fs.existsSync(dest)) {
    console.log(`  skip  ${path.relative(targetDir, dest)}  (already exists)`);
    return;
  }
  fs.copyFileSync(src, dest);
  console.log(`  create ${path.relative(targetDir, dest)}`);
}

function writeFile(dest, content) {
  mkdirp(path.dirname(dest));
  if (fs.existsSync(dest)) {
    console.log(`  skip  ${path.relative(targetDir, dest)}  (already exists)`);
    return;
  }
  fs.writeFileSync(dest, content, 'utf8');
  console.log(`  create ${path.relative(targetDir, dest)}`);
}

function touch(dest) {
  mkdirp(path.dirname(dest));
  if (!fs.existsSync(dest)) {
    fs.writeFileSync(dest, '', 'utf8');
    console.log(`  create ${path.relative(targetDir, dest)}`);
  }
}

// ── run ───────────────────────────────────────────────────────────────────────

console.log(`\nwikime init → ${targetDir}\n`);
mkdirp(targetDir);

// Schema files
copyFile(path.join(skillDir, 'CLAUDE.md'),  path.join(targetDir, 'CLAUDE.md'));
copyFile(path.join(skillDir, 'AGENTS.md'),  path.join(targetDir, 'AGENTS.md'));
copyFile(path.join(skillDir, 'GEMINI.md'),  path.join(targetDir, 'GEMINI.md'));

// Claude Code slash commands
const commands = ['wiki-ingest', 'wiki-query', 'wiki-lint', 'wiki-graph'];
for (const cmd of commands) {
  copyFile(
    path.join(skillDir, '.claude', 'commands', `${cmd}.md`),
    path.join(targetDir, '.claude', 'commands', `${cmd}.md`)
  );
}

// Prompts (optional)
if (withPrompts) {
  const promptFiles = ['summarize.md', 'write-concept.md', 'caption-image.md'];
  for (const p of promptFiles) {
    copyFile(
      path.join(skillDir, 'prompts', p),
      path.join(targetDir, 'prompts', p)
    );
  }
}

// Wiki scaffold
writeFile(path.join(targetDir, 'wiki', 'index.md'), `# Wiki Index

> This file is maintained by the LLM. Updated on every ingest. Do not edit manually.

Last updated: — | Sources: 0 | Concepts: 0 | Entities: 0

## Overview
- [Overview](overview.md) — living synthesis across all sources

## Sources

## Concepts

## Entities

## Syntheses
`);

writeFile(path.join(targetDir, 'wiki', 'log.md'), `# Wiki Log

> Append-only chronological record. Newest entries at the top.
> Grep: \`grep "^## \\[" wiki/log.md | tail -10\`

<!-- entries appended below this line -->
`);

writeFile(path.join(targetDir, 'wiki', 'overview.md'), `# Overview

> Living synthesis across all sources. Maintained by the LLM — updated on every ingest.
> Target length: ~500 words. Compress older sections as the wiki grows.

*No sources ingested yet. Run \`/wiki-ingest raw/<file>\` to begin.*
`);

// Directory placeholders
touch(path.join(targetDir, 'wiki', 'sources', '.gitkeep'));
touch(path.join(targetDir, 'wiki', 'entities', '.gitkeep'));
touch(path.join(targetDir, 'wiki', 'concepts', '.gitkeep'));
touch(path.join(targetDir, 'wiki', 'syntheses', '.gitkeep'));
touch(path.join(targetDir, 'raw', 'assets', '.gitkeep'));
touch(path.join(targetDir, 'graph', '.gitkeep'));

// .gitignore
writeFile(path.join(targetDir, '.gitignore'), `# wikime
graph/.cache.json
.wikime/
`);

// Done
console.log(`
Done! Your wiki is ready.

Next steps:
  1. Drop source documents into raw/
     Supported: .pdf .docx .pptx .xlsx .md .txt images

  2. Open this folder in Claude Code or Codex:
     claude         → reads CLAUDE.md + .claude/commands/ automatically
     codex / opencode → reads AGENTS.md automatically

  3. Ingest your first source:
     Claude Code:  /wiki-ingest raw/your-file.pdf
     Codex:        "ingest raw/your-file.pdf"

  4. Query:
     Claude Code:  /wiki-query "what are the main themes?"
     Codex:        "query: what are the main themes?"

  5. Browse in Obsidian (optional):
     Open this folder as an Obsidian vault.
     Install: Obsidian Web Clipper, Dataview, Marp

Tips:
  • markitdown handles all formats: pip install markitdown
  • File good query answers back: /wiki-query "question" --save
  • Lint regularly: /wiki-lint
  • Build the graph: /wiki-graph

Docs: https://github.com/chandrasekaran1011/wikime
`);
