Ingest a source document into the wiki.

Usage: /wiki-ingest $ARGUMENTS

$ARGUMENTS should be a path to a file in raw/, e.g.:
  /wiki-ingest raw/report.pdf
  /wiki-ingest raw/papers/attention-is-all-you-need.md
  /wiki-ingest raw/deck.pptx

If no argument is given, ask the user which file to ingest.

---

Follow the Ingest Workflow defined in CLAUDE.md exactly. Steps in order:

**Pass 0 — Convert (if needed)**
1. Check the file extension
2. If not already markdown (.md, .txt): convert to raw/<slug>.md
   - Check tool availability: markitdown > pandoc > python libraries
   - Use the conversion commands from CLAUDE.md for the detected format
   - Report which tool was used
   - If no tool is available, tell the user what to install

**Pass 1 — Read**
3. Read the converted raw/<slug>.md fully (text first)
4. If the file contains inline image references (![](raw/assets/...)):
   open each referenced image file separately after reading text
5. If very long (>~8000 words): read in sections, summarize each, synthesize

**Pass 2 — Context**
6. Read wiki/index.md (current catalog of all pages)
7. Read wiki/overview.md (current synthesis)
8. Read any existing pages that seem directly relevant to this source

**Pass 3 — Write source page**
9. Write wiki/sources/<slug>.md using the Source Page Format from CLAUDE.md

**Pass 4 — Update index and overview**
10. Update wiki/index.md — add entry under ## Sources
11. Update wiki/overview.md — revise synthesis if warranted; keep to ~500 words

**Pass 5 — Entity and concept pages**
12. For each key person, company, project mentioned:
    - Read existing wiki/entities/<EntityName>.md if it exists
    - Create or update wiki/entities/<EntityName>.md
13. For each key idea, framework, method, theory:
    - Read existing wiki/concepts/<ConceptName>.md if it exists
    - Create or update wiki/concepts/<ConceptName>.md
    - If page exists: expand it with new information from this source
      (this is the compounding mechanism — the page gets richer each time)

**Pass 6 — Contradictions**
14. Compare this source's claims against existing wiki content
15. Note any conflicts in the source page and in relevant concept/entity pages

**Pass 7 — Log**
16. Append to wiki/log.md:
    ## [today's date] ingest | <Title> (<format>)
    
    Source: raw/<filename>. Key claims: <brief>. Pages touched: <list>.

---

After all steps, report:
- What was converted and which tool was used
- Which wiki pages were created (list)
- Which wiki pages were updated (list)
- Any contradictions detected
- Suggested follow-up: related sources to find, questions the wiki can now answer
