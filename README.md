# RECALL

> **One hallucination. Find every filing it touched.**

RECALL is legal incident-response software for bad authorities. Citation checkers tell you that one citation is wrong; RECALL computes where that dependency now matters across briefs, memos, templates, versions, and filings.

## Product law

RECALL never invents provenance.

- **CONFIRMED_CITATION_DEPENDENCY** — deterministic canonical citation match.
- **CONFIRMED_QUOTE_REUSE** — conservative normalized quotation overlap.
- **POSSIBLE_DERIVED_CLAIM** — lexical/semantic review candidate only.
- **NOT_RELATED** — no supported relationship.

Semantic similarity never becomes confirmed lineage.

## What is implemented

- Arbitrary local corpus import for PDF, TXT, MD, and DOCX.
- Deterministic U.S. reporter citation parsing and pin-cite canonicalization.
- Quote fingerprinting and conservative quote-reuse detection.
- Review-only proposition matching.
- Incident blast-radius traversal with explicit document/matter metadata.
- Evidence on every graph edge.
- Remediation priority derived from explicit document status + dependency type.
- 30-document deterministic demo corpus with negatives.
- 50-case relationship benchmark and corpus-level blast-radius benchmark.
- Optional CourtListener citation-lookup route.
- No API keys required for `/demo`.

## Run

```bash
npm install
npm run dev
```

Routes:
- `/` — product landing
- `/demo` — deterministic incident demo
- `/app` — arbitrary corpus import

## Environment

```bash
COURTLISTENER_TOKEN=
```

CourtListener is optional. RECALL can begin from a manually flagged authority, so incident response never depends on external API availability.

## Tests and benchmark

```bash
npm test
npm run bench
npm run build
```

Benchmark output is written to `bench/results.md`.

## Privacy

The hackathon corpus-import flow parses files in the browser. RECALL does not intentionally upload corpus text through its application API. PDF and DOCX parsing dependencies are loaded with the application bundle. No analytics capture document text.

## Important limitation

**RECALL does not infer historical copying or causation from semantic similarity. Confirmed relationships require deterministic evidence. Semantic matches are surfaced only as review candidates.**

A document containing a bad authority in order to criticize or invalidate it is not automatically treated as dependent work. Unknown filing status remains `UNKNOWN`; matters and chronology are not inferred from filenames.

## External source integration

The optional CourtListener route uses the current v4 citation lookup endpoint. A zero-result or failed lookup remains unresolved; it does not automatically mean a citation is fabricated.

## Prior art

RECALL sits downstream of citation-verification tools. The core workflow is incident response: invalidate one dependency, traverse the affected work, inspect evidence, and remediate.
