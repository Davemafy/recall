# RECALL

> **One hallucination. Find every filing it touched.**

RECALL is legal incident response.

Citation checking is incident detection. RECALL begins after a court, lawyer, reviewer, citator, or verification system has identified a legal dependency that deserves review. It turns that finding into an incident and answers the operational question:

**Where else does this exact dependency appear?**

RECALL does not infer copying, causation, or legal invalidity. Every confirmed relationship is backed by deterministic source evidence.

## Flagship flow

```text
incident source
  → disputed dependencies
  → trace impact
  → confirmed affected filings
  → docket / document topology
  → exact evidence
```

The default recorded incident is **Johnson v. Dunn**, No. 2:21-cv-01701-AMM (N.D. Ala.). The public sanctions order identified five problematic citations across two motions. RECALL stores the exact order language for each disputed dependency and maps the five court-recorded occurrences to Documents 174 and 182.

The recorded incident never claims that RECALL independently downloaded those two original motions when it did not. Their occurrences are labeled as **court-order record of filing** evidence. The sanctions order itself is the supporting public source.

## Product surfaces

- `/` — incident-first product landing
- `/incident` — open an incident
- `/incident/demo` — deterministic recorded public incident
- `/demo` — alias of the recorded incident
- `/trace` — Quick Trace for a citation / quotation
- `/corpus` — trace imported PDF/TXT/MD/DOCX work

## Incident model

An incident stores:

- incident type and source type
- public source metadata
- exact source excerpt + SHA-256
- one or many disputed dependencies
- exact incident-source evidence for each dependency
- trace status

A dependency can be an authority, quotation, or proposition. Source-backed dependencies preserve exact source language and provenance.

## Relationship law

RECALL centralizes relationship states in `lib/domain.mjs`.

- **CONFIRMED_CITATION_DEPENDENCY** — deterministic authority / exact incident-dependency occurrence.
- **CONFIRMED_QUOTE_REUSE** — conservative deterministic quotation overlap.
- **POSSIBLE_RELATED_PROPOSITION** — review-only similarity.
- **CANDIDATE_UNCONFIRMED** — retrieval surfaced the document, but evidence was insufficient.
- **NOT_RELATED** — available evidence supports exclusion.

Search result ≠ confirmed dependency.

Semantic similarity can never create a confirmed relationship.

## CourtListener / RECAP pipeline

Live tracing is source-first:

1. optional citation lookup;
2. exact `type=rd` federal filing search;
3. local confirmation from returned source snippets;
4. hydrate only promising unconfirmed candidates;
5. use RECAP `plain_text` where available;
6. use docket context only when needed;
7. use broader search only when the exact pass is insufficient;
8. preserve source URL, retrieval timestamp, content hash, and confirmation source.

The default CourtListener concurrency is **2**. A simple exact-citation trace has a regression test enforcing a request budget of no more than eight CourtListener requests.

CourtListener / RECAP is not every U.S. filing. RECALL reports the number of candidate filings actually checked.

## Firecrawl fallback

If `FIRECRAWL_API_KEY` is configured, RECALL may use Firecrawl v2 `/scrape` **only** when CourtListener identifies a public filing but RECAP text is unavailable.

Firecrawl is extraction infrastructure, not the legal source of truth.

The surfaced source remains the original CourtListener / RECAP URL. Firecrawl is restricted to allowlisted CourtListener hosts. If Firecrawl fails, RECALL falls back conservatively rather than fabricating confirmation.

## Request control

Live trace diagnostics record:

- trace ID
- duration
- CourtListener requests
- Firecrawl requests
- cache hits
- candidates found
- documents hydrated
- search passes used
- confirmed / possible / unconfirmed relationships

The application never logs raw private document contents.

## Caching

Short-lived in-process caches cover:

- authority resolution
- filing search
- RECAP document hydration
- docket metadata
- extracted public text
- whole trace results

Cached responses keep their original retrieval timestamp and are labeled **CACHED PUBLIC SOURCE**.

## Imported corpus

`/corpus` parses local files in the browser and sends the resulting text through the same dependency engine. Missing status, matter, version, and chronology stay unknown unless explicitly supplied.

## Recorded provenance

Recorded public evidence stores exact source text, public source URL, page / capture provenance when available, and SHA-256 over the exact stored span. Explanatory product language lives separately in derived metadata.

An original-file hash is stored only if the original file was actually downloaded during capture.

## Benchmarks

```bash
npm test
npm run bench
npm run bench:live
npm run typecheck
npm run lint
npm run build
npm run e2e
```

The deterministic benchmark reports citation parser precision/recall, confirmed citation precision, confirmed quote precision, negative-control accuracy, and **FALSE CONFIRMED DEPENDENCIES**.

The real-incident benchmark reports only the captured Johnson incident:
- court-identified dependencies
- dependencies normalized / traced
- confirmed affected filings
- confirmed citation relationships
- unconfirmed candidates
- unique dockets

It does not claim global recall.

## Environment

```bash
COURTLISTENER_TOKEN=
FIRECRAWL_API_KEY=
```

CourtListener is required for current live public traces. Firecrawl is optional.

## No-lineage-overclaim rule

**RECALL does not infer historical copying or causation from semantic similarity.**

Use “appears in,” “confirmed occurrence,” and “also found in” unless provenance establishes more.

## Known limitations

- CourtListener / RECAP coverage is incomplete.
- Some public filing records lack extracted text or complete docket metadata.
- The Johnson recorded incident uses the sanctions order as the evidentiary record for occurrences in Documents 174 and 182; it does not pretend to have direct original-file text for those motions.
- Firecrawl is an optional fallback and is never treated as an authoritative legal database.
- OCR is not implemented for imported scanned PDFs.
