# Incident model

RECALL starts after discovery.

An incident records **why a dependency is under review**, not an independent RECALL verdict that the dependency is legally invalid.

## Incident

Fields include:
- ID / title
- incident type
- source type
- case / court / docket / date
- public source URL
- exact source excerpt
- excerpt SHA-256
- status

## Incident dependency

A single incident may contain many dependencies.

Each dependency contains:
- dependency type: authority / quotation / proposition
- raw source text
- normalized citation where possible
- exact incident-evidence span
- page / provenance
- SHA-256
- source review status
- trace status

## Relationship

An incident dependency can relate to zero, one, or many documents. One document can contain multiple incident dependencies.

That many-to-many structure powers the dependency × document matrix.

## Recorded Johnson incident

The public sanctions order in Johnson v. Dunn identifies five problematic citations across two motions. The fixture keeps those five dependencies separate and maps:
- four dependencies → Document 174
- one dependency → Document 182

The order itself is the evidentiary source for those recorded occurrences. The demo does not claim direct original-file provenance for the two motions.
