# Submission notes

**Project:** RECALL  
**Category:** Legal incident response

**One sentence:** RECALL turns a source-backed bad legal dependency into an incident and traces every supported occurrence across public filings and imported legal work.

**Core line:** One hallucination. Find every filing it touched.

## Problem

Citation verification stops at discovery:

> This citation is wrong.

Legal teams still need to know what to inspect next:

> Where else does this dependency appear?

RECALL is the incident-response layer between those two questions.

## Flagship demo

The recorded demo uses **Johnson v. Dunn**, No. 2:21-cv-01701-AMM (N.D. Ala.).

The public sanctions order identifies five problematic citations across two filed motions. RECALL preserves the exact sanctions-order language for each disputed dependency and renders the incident as a dependency × filing matrix:

- four dependencies documented in Document 174;
- one dependency documented in Document 182.

The recorded fixture does **not** pretend that RECALL independently downloaded the original two motions. Those relationships are explicitly sourced to the sanctions order, which records the citation and filing/page where it appeared.

## Technical execution

- deterministic citation canonicalization;
- conservative quotation matching;
- semantic / lexical similarity held to review-only;
- live CourtListener / RECAP federal filing search;
- RECAP extracted-text confirmation;
- optional allowlisted Firecrawl content extraction fallback;
- exact-first request strategy;
- bounded CourtListener concurrency of 2;
- Retry-After preservation and bounded retry;
- authority/search/document/docket/extraction caches;
- multi-dependency incident trace aggregation;
- exact recorded-source hashes and provenance;
- local imported-corpus mode;
- request-budget regression tests.

## Product moment

Open a real incident → see exactly what the court flagged → **Trace impact** → see which dependencies affect which filed motions → click a matrix cell → inspect the incident-source evidence and downstream occurrence together.

## Truth boundary

- search hit ≠ confirmed dependency;
- semantic similarity ≠ confirmed lineage;
- source failure ≠ factual conclusion;
- unresolved authority ≠ fabricated authority;
- public filing status is never invented;
- docket totals count only known docket identifiers;
- recorded evidence never claims direct-file provenance that was not captured.

## Coverage

Live mode searches public federal filing data available through CourtListener / RECAP. It is not a representation of every U.S. court filing.

## AI / external services disclosure

CourtListener / RECAP is used for public legal discovery and source metadata. Firecrawl, when configured, is used only as a content-extraction fallback for an already known allowlisted public filing URL. RECALL's confirmed dependency decision is deterministic and does not depend on an LLM verdict.
