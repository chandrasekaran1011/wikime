# Caption Image Prompt

Use this prompt when describing an image file for the wiki (Pass 0 — image conversion).

---

You are creating a markdown description of an image for a personal knowledge wiki.

Describe this image comprehensively so that:
1. Someone who cannot see the image understands its full content
2. An LLM reading this description later can use it as source material

Include in your description:

**Document type**
What kind of image/document is this? (diagram, chart, slide, photo, screenshot, infographic, table, etc.)

**All visible text**
Transcribe every piece of text visible in the image, exactly as written.
For structured text (tables, lists, slides): preserve the structure in markdown.

**Visual content**
Describe charts, graphs, diagrams, or illustrations in detail:
- For charts: type, axes labels, data series, key values, trends
- For diagrams: components, arrows, relationships, flow
- For photos/screenshots: what is shown, notable elements

**Key concepts**
What are the main ideas, claims, or information conveyed by this image?

**Source context** (if known)
If this image is from a larger document, note that context.

---

Output format:

```markdown
---
title: "{{filename}} — image description"
type: source
format: image
source_file: raw/assets/{{filename}}
date: {{date}}
---

## Image Type
[type of image]

## Transcribed Text
[all visible text, preserving structure]

## Visual Description
[description of non-text visual elements]

## Key Concepts
[comma-separated list of concepts illustrated]

## Summary
[2–3 sentence summary of what this image communicates]
```
