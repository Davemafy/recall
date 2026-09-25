# RECALL

> **One hallucination. Find every filing it touched.**

RECALL is legal incident-response software. It starts after a legal authority or quotation is put under review and asks the operational question: **where else does this dependency appear?**

It is not a citation checker, fake-case detector, legal chatbot, or semantic-search verdict engine.

## Search result → candidate → confirmed dependency

RECALL deliberately separates retrieval from proof.

1. **Search result** — CourtListener / RECAP returned a public filing because a query matched.
2. **Candidate dependency** — RECALL preserved the filing metadata, source, query, and available text, but has not found deterministic incident evidence.
3. **CONFIRMED_CITATION_DEPENDENCY** — the shared parser independently found the incident authority's canonical reporter / volume / first-page identity in available filing text.
4. **CONFIRMED_QUOTE_REUSE** — deterministic normalized quotation overlap crossed a conservative threshold.
5. **POSSIBLE_DERIVED_CLAIM** — lexical/semantic resemblance only. Human review required.

A search hit is never promoted to a confirmed dependency merely because CourtListener ranked it highly.

## Real CourtListener / RECAP mode

`/trace` is the primary product path.

For a citation such as `598 U.S. 508`, the server:

1. parses and canonicalizes the citation;
2. optionally resolves authority metadata using CourtListener v4 citation lookup;
3. performs documented keyword searches against CourtListener v4 search;
4. uses `type=r` for federal docket + nested filing discovery and `type=rd` for filing-document candidates;
5. preserves the query, source URL, retrieval timestamp, docket metadata, available snippet/text, and a content hash;
6. independently confirms citation or quotation evidence with RECALL's shared dependency engine;
7. groups confirmed occurrences by actual docket metadata;
8. reports exactly how many unique filing candidates were checked.

CourtListener / RECAP coverage is **not every U.S. court filing**. RECALL says “public federal filing data available through CourtListener / RECAP,” never “all filings.”

Search responses are bounded to a maximum of 50 unique candidates per trace in the hackathon build. If the source indicates additional results, the UI labels the trace as bounded.

## Recorded public demo

`/demo` is a deterministic replay of **real public RECAP source material captured during development**.

It traces `598 U.S. 508` through three source-backed federal filings:

- Thomson Reuters Enterprise Centre GmbH v. Ross Intelligence Inc., D. Del., Document 770, filed 2025-02-11
- Kadrey et al. v. Meta Platforms, Inc., N.D. Cal., Document 598, filed 2025-06-25
- Bartz et al. v. Anthropic PBC, N.D. Cal., Document 231, filed 2025-06-23

The replay stores only a short citation-bearing capture for deterministic offline confirmation, plus the real public source URL, capture timestamp, and SHA-256 hash. It is visibly labeled **RECORDED PUBLIC TRACE** and never presented as live.

RECALL does **not** assert that `598 U.S. 508` is invalid. The recorded trace demonstrates downstream dependency mechanics using a real, verifiable authority and real filings.

## Trace my corpus

`/corpus` processes user-selected PDF, TXT, MD, and DOCX files in the browser.

The same citation parser, authority normalizer, quote matcher, proposition matcher, dependency classifier, and blast-radius logic used by the public-source workflow powers imported corpora. Unknown document status, matter, and chronology remain unknown unless supplied.

## Architecture

```text
                         ┌──────────────────────────────┐
                         │ shared dependency engine     │
                         │ citation → quote → possible  │
                         └──────────────┬───────────────┘
                                        │
            ┌───────────────────────────┴───────────────────────────┐
            │                                                       │
CourtListener / RECAP                                      local corpus
type=r + type=rd                                           PDF/TXT/MD/DOCX
            │                                                       │
candidate public filings                                  imported documents
            └───────────────────────────┬───────────────────────────┘
                                        │
                              evidence classification
                                        │
                               blast-radius grouping
```

Server-only CourtListener credentials never enter the client bundle. Public-source URLs are allowlisted to CourtListener hosts. The application never follows arbitrary URLs extracted from filings.

## Citation parser

The deterministic parser normalizes common U.S. reporters including U.S., S. Ct., F./F.2d/F.3d/F.4th, Fed. Appx., and several regional reporter families.

Pin cites do not create separate authorities:

```text
598 U.S. 508
598 U.S. 508, 526
Warhol, 598 U.S. at 526   (only when case-name context makes the short form resolvable)
```

all refer to the same underlying authority when the short form is sufficiently anchored.

## Quote fingerprinting

Quotes are normalized for Unicode quote marks, whitespace, punctuation, and ellipsis forms. Confirmation uses conservative deterministic overlap. A loose paraphrase never becomes quote reuse.

## Semantic review layer

Proposition matching is intentionally review-only:

> **Possible related proposition — human review required.**

Semantic or lexical similarity cannot create a confirmed citation or quotation dependency.

## Graph / evidence model

Public nodes represent real source entities: AUTHORITY, FILING, DOCKET, QUOTE, PROPOSITION. Imported-corpus nodes represent explicit imported documents and supplied matters.

Every confirmed edge carries:
- raw matched text;
- normalization / matching rule;
- canonical authority identity where applicable;
- source metadata;
- source URL for public records.

## Benchmark

`npm run bench` runs the deterministic 50-relationship labeled benchmark and the 30-document negative-control corpus.

`npm run bench:live` runs a bounded current CourtListener trace over five real authorities **only when `COURTLISTENER_TOKEN` is configured**. Without the credential it prints an explicit SKIPPED state and exits successfully; no fixture is substituted.

The primary safety metric is **FALSE CONFIRMED DEPENDENCIES**.

See `bench/PUBLIC_SAMPLE.md` for the independently source-checked public sample used to choose the five live benchmark authorities.

## Environment

```bash
COURTLISTENER_TOKEN=
```

The token is required only for current live CourtListener API calls. The recorded public demo and local corpus mode require no external key.

## Local development

```bash
npm install
npm run dev
```

Routes:
- `/` — real-trace entry
- `/trace` — current CourtListener / RECAP trace
- `/demo` — recorded real public-source replay
- `/corpus` — imported corpus mode
- `/app` — legacy redirect to `/corpus`

## Verification

```bash
npm test
npm run bench
npm run bench:live
npm run typecheck
npm run lint
npm run build
npm run e2e
```

## Failure handling

- 401 / 403 → authentication/configuration error
- 429 → rate limited
- timeout / 5xx → source unavailable
- zero matches → zero matches
- search hit without independently checkable occurrence → candidate, not confirmed

An API failure never becomes a factual conclusion about an authority.

## Privacy and security

- Imported corpus files are parsed in-browser in the hackathon build.
- RECALL does not intentionally upload imported corpus text to its own API.
- No analytics capture corpus text.
- CourtListener token is server-only.
- User input is length-bounded.
- Public source URLs are restricted to CourtListener / CourtListener storage hosts.
- No uploaded content is executed.
- No arbitrary URL found inside a filing is fetched.
- Raw corpus text is not logged by application code.

## Known limitations

- CourtListener / RECAP is incomplete relative to all U.S. filings.
- The live product verifies only text/snippet content returned in the bounded search path; a result without checkable text remains unconfirmed.
- OCR is not included.
- Case-name-only identity is not sufficient to merge authorities.
- Recorded demo data is a deliberately small public-source capture, not a claim about exhaustive history.
- Historical copying or causation is not inferred.

## No-lineage-overclaim rule

**RECALL does not infer historical copying or causation from semantic similarity. Confirmed relationships require deterministic evidence. Semantic matches are surfaced only as review candidates.**

Use “appears in,” “confirmed occurrence,” or “also found in” unless actual provenance establishes more.
