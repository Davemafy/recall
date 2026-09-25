# Benchmark

RECALL maintains two benchmark layers.

## A. Deterministic labeled benchmark

`npm run bench`

50 labeled relationships cover:
- exact citations
- formatting / pin-cite variants
- exact quotation reuse
- punctuation/ellipsis quotation reuse
- semantic-review positives
- case-name negatives
- surname negatives
- different-reporter negatives
- same-topic negatives
- critical-discussion negatives
- unrelated controls

A separate 30-document synthetic corpus measures document-level blast-radius precision and recall.

Primary metric: **FALSE CONFIRMED DEPENDENCIES**.

## B. Public-source sample

`bench/PUBLIC_SAMPLE.md` records five real, resolvable U.S. authorities selected after verifying actual occurrences in a public RECAP filing.

`npm run bench:live` runs a bounded current CourtListener trace for those five authorities when `COURTLISTENER_TOKEN` is available.

Without the token, the live benchmark prints an explicit SKIPPED state and records no invented metrics.

The public sample does not claim ground-truth recall over all CourtListener / RECAP data.

## Recorded public trace

The deterministic `/demo` capture independently confirms three real RECAP filings containing `598 U.S. 508`. This provides source-backed offline replay but is not presented as a current live-corpus benchmark.
