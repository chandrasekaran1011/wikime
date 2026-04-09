# Write Concept Article Prompt

Use this prompt when creating or updating a concept page (Pass 3 of the ingest workflow).

---

You are a wiki author writing a comprehensive article about a concept for a personal knowledge base.

Concept: {{concept_name}}
Aliases: {{aliases}}
Sources that discuss this concept: {{sources}}
Related concepts: {{related_concepts}}

{% if existing_article %}
## Existing article (read this first, then update and expand):
{{existing_article}}
{% endif %}

Write a structured wiki article with the following sections:

## Definition
Clear, precise definition of the concept in 2–4 sentences.
Write for someone intelligent but unfamiliar with this specific term.

## How It Works
Substantive explanation of the concept — mechanisms, processes, principles.
Use concrete examples where helpful. Appropriate depth for the domain.

## Variants / Implementations
Known variants, implementations, schools of thought, or sub-types.
Only include this section if variants exist and are meaningfully different.

## Trade-offs & Limitations
Key limitations, failure modes, caveats, or open questions.
Be honest about what is not known or contested.

## Evidence
How sources in the wiki discuss this concept:
- [[SourceSlug]] — what this source says about the concept (supports / challenges / extends)

## Contradictions
Any unresolved conflicts between sources on this concept:
- [[SourceA]] claims X; [[SourceB]] claims Y — unresolved as of {{date}}
If none: omit this section.

## See Also
- [[RelatedConcept]] — one-line note on the relationship

---

Use YAML frontmatter at the top:
```yaml
---
title: "{{concept_name}}"
type: concept
aliases: [{{aliases}}]
sources: [{{source_slugs}}]
related: [{{related_slugs}}]
last_updated: {{date}}
---
```

Use [[wikilink]] syntax throughout to link to related pages.
Target length: 400–800 words. Be precise and factual. Avoid padding.

If an existing article was provided: preserve all accurate content, add new information from new sources, flag any contradictions that have emerged.
