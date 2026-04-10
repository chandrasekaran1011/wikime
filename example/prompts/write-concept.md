# Concept Page Instructions — Legal Domain

You are writing or expanding a concept page in a legal knowledge wiki. Follow these
instructions when creating or updating `wiki/concepts/<ConceptName>.md`.

---

## What Counts as a Concept
In this wiki, concepts are:
- Legal frameworks and clause types (e.g. Indemnification, Force Majeure, MFN Clause)
- Regulatory regimes and compliance requirements (e.g. GDPR, SOX, PCI-DSS)
- Deal structures and mechanisms (e.g. Revenue Share, Escrow Arrangement, Step-in Rights)
- Risk categories (e.g. Counterparty Risk, IP Ownership Dispute, Change of Control)

People, companies, business units, and projects are **entities** — create those in
`wiki/entities/` instead.

---

## Page Structure

Every concept page must have these sections:

### Definition
Plain-language definition (2–4 sentences). Avoid legal jargon where possible.
If the concept has a standard legal definition, quote it briefly then explain it.

### How It Works
- Mechanics: what this clause/framework/mechanism actually does in practice
- Typical trigger conditions
- Typical consequences or remedies
- Who benefits (which party normally holds the stronger position)

### Relationship Types
Extract and label relationships explicitly — do not bury them in prose:

- **Requires**: `[[ConceptA]] requires [[ConceptB]]` — one concept presupposes another
- **Limits**: `[[ConceptA]] limits [[ConceptB]]` — one constrains the scope of another
- **Triggers**: `[[EventOrClause]] triggers [[Obligation]]`
- **Contradicts**: `[[ConceptA]] contradicts [[ConceptB]]` — conflicting interpretations
- **Implements**: `[[SpecificClause]] implements [[BroaderFramework]]`

Add a `## Relationships` section with these typed links. Use `[[wikilinks]]` throughout.

### Evidence
How this concept appears across ingested sources:
- `[[source-slug]]` — how this document uses or defines the concept
- Note any unusual or non-standard usage

### Contradictions
- Conflicting interpretations across sources — name the exact pages and the conflict
- Unresolved as of YYYY-MM-DD

### Practical Notes
- Common negotiation points around this concept
- Red flags or unusual variations to watch for
- Jurisdiction-specific variations if applicable

### See Also
- `[[RelatedConcept]]` — one line on the connection

---

## Expansion Rule
When this page already exists and a new source is being ingested:
1. Read the existing page fully
2. Add new evidence under `## Evidence`
3. Update `## Contradictions` if the new source conflicts with prior sources
4. Expand `## How It Works` and `## Relationships` if new information deepens understanding
5. Update `last_updated` in frontmatter
6. Never delete existing content — only add, revise, or flag as superseded
