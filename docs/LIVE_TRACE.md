# Live trace

`/trace` is RECALL's first-class workflow.

## Flow

1. Parse a citation or accept a quotation/text query.
2. Resolve authority metadata when CourtListener can do so without ambiguity.
3. Search `type=rd` for filing-document candidates.
4. Search `type=r` for docket/nested-document metadata context.
5. Follow documented pagination up to the candidate bound.
6. Hydrate each RECAP candidate with extracted `plain_text` where available.
7. Re-run RECALL's shared dependency engine over the hydrated text.
8. Preserve all supported relationships per filing: citation and quotation reuse can coexist.
9. Keep proposition similarity review-only.
10. Group confirmed occurrences by actual docket metadata.
11. Report bounded coverage and source mode.

## Relationship classes

`CONFIRMED_CITATION_DEPENDENCY`
: deterministic canonical reporter / volume / first-page occurrence in available filing text.

`CONFIRMED_QUOTE_REUSE`
: conservative normalized quotation overlap.

`POSSIBLE_DERIVED_CLAIM`
: review-only lexical/semantic match.

`CANDIDATE_UNCONFIRMED`
: search surfaced the filing, but available text did not independently establish the incident dependency.

`NOT_RELATED`
: evidence actively supports exclusion, such as a citation appearing only in explicit invalidity/critical discussion.

## Quote-only traces

If the primary input is not a supported canonical citation but contains substantial quotation text, RECALL treats it as a quotation trace and searches the public filing corpus without inventing an authority identity.

## Honest zero

A valid live trace may return zero confirmed dependencies:

> RECALL found no confirmed filing dependencies in the checked public-source candidates.

No fixture fallback is inserted into a live result.

## Live vs cached vs recorded

- **LIVE PUBLIC SOURCE** — fetched during this trace.
- **CACHED PUBLIC SOURCE — checked <date>** — recent cached result; original retrieval timestamp retained.
- **RECORDED PUBLIC TRACE** — source-backed development capture replayed without network access.

These states are intentionally visually distinct.
