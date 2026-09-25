# Live trace

`/trace` is the first-class RECALL workflow.

## Flow

1. Parse citation or accept quotation review input.
2. Resolve authority metadata when CourtListener can do so.
3. Search `type=r` for federal dockets/nested filing hits.
4. Search `type=rd` for filing-document candidates.
5. Deduplicate candidates.
6. Independently inspect returned text/snippets.
7. Classify each candidate.
8. Group confirmed occurrences by source docket.
9. Report bounded coverage.

## Classes

`CONFIRMED_CITATION_DEPENDENCY`
: deterministic canonical citation match in available filing text.

`CONFIRMED_QUOTE_REUSE`
: conservative normalized quotation overlap.

`POSSIBLE_DERIVED_CLAIM`
: review-only lexical/semantic match.

`CANDIDATE_UNCONFIRMED`
: search surfaced the filing but the available text did not independently establish the dependency.

## Honest zero

A valid live result may contain zero confirmed dependencies. The product says so directly. It does not fall back to synthetic data.

## Live vs cached vs recorded

- `LIVE PUBLIC SOURCE` — API response fetched in the current trace.
- `CACHED PUBLIC SOURCE` — a recent cached public response; retrieval time preserved.
- `RECORDED PUBLIC TRACE` — development-time capture of actual public RECAP source documents. No live network request is implied.
