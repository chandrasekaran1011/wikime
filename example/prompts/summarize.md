# Source Summarization Instructions — Legal Domain

You are summarizing legal documents for a knowledge wiki. Follow these instructions
exactly when reading a source during ingest.

---

## What to Extract

### Parties & Roles
- Identify every named party (individuals, companies, business units, verticals)
- Record their role: Licensor / Licensee / Vendor / Client / Regulator / Guarantor etc.
- Note parent-subsidiary or affiliate relationships between parties
- Link each party to their business unit or vertical if mentioned

### Financials
- Extract all monetary values: contract value, fees, penalties, revenue shares
- Note currency and payment schedule (one-time / monthly / milestone-based)
- Flag any caps, floors, or escalation clauses
- Present financials as a markdown table:

  | Item | Amount | Currency | Schedule | Notes |
  |------|--------|----------|----------|-------|

### Dates & Timeline
- Build a `## Timeline` section in chronological order:
  `YYYY-MM-DD — event or obligation (party responsible)`
- Include: effective date, execution date, key milestones, renewal dates, termination date
- Flag any ambiguous or relative dates ("within 30 days of X") explicitly

### Obligations & Rights
- List each party's obligations as bullet points under `## Obligations`
- List each party's rights (IP, usage, exclusivity) under `## Rights`
- Flag conditional clauses: "If X then Y" — note the trigger and the consequence

### Projects & Relationships
- Identify any projects, products, or initiatives referenced
- Map which business unit or vertical owns each project
- Note financial exposure or revenue tied to each project

### Jurisdiction & Governing Law
- Extract jurisdiction, governing law, and dispute resolution mechanism
- Note any regulatory bodies or compliance requirements named

---

## What to Ignore
- Boilerplate recitals and "whereas" clauses unless they contain factual commitments
- Standard limitation of liability language unless the caps are unusual
- Signature blocks (extract names/titles but not formatting)

---

## Entity Identification
At the end of the summary, list all entities found for the wiki to create pages for:

```
## Entities Identified
- [[PartyName]] — role, business unit/vertical if known
- [[ProjectName]] — type, owning entity, financial exposure
- [[RegulatorName]] — jurisdiction, relevance to this document
```

These will become entity pages in `wiki/entities/`. Be thorough — every named
organization, business unit, vertical, and project should be listed here.

---

## Output Sections (in order)
1. `## Summary` — 3–5 sentences capturing the deal/document in plain language
2. `## Key Claims` — most important facts, obligations, and rights
3. `## Timeline` — chronological events
4. `## Financials` — table of monetary items
5. `## Obligations` — per party
6. `## Rights` — per party
7. `## Conditions` — if/then clauses
8. `## Entities Identified` — for wiki entity page creation
9. `## Key Quotes` — verbatim clauses that are legally significant
10. `## Contradictions` — conflicts with existing wiki pages (or "none detected")
