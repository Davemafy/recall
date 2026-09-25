# Benchmark

RECALL has three benchmark layers.

## 1. Labeled relationship benchmark

At least 50 relationships covering:
- exact citations
- pin cites
- quote reuse
- formatting variants
- semantic-only cases
- same-name negatives
- same-topic negatives
- critical discussion
- unrelated controls

Primary safety metric:
**FALSE CONFIRMED DEPENDENCIES**

## 2. Corpus blast-radius benchmark

The 30-document deterministic corpus reports:
- affected-document precision
- affected-document recall
- confirmed citation / quote edges
- possible relationships

## 3. Real incident benchmark

The recorded Johnson incident reports only the captured incident facts:
- court-identified dependencies
- dependencies normalized
- dependencies traced
- confirmed affected filings
- confirmed citation relationships
- quote reuse
- unconfirmed candidates
- unique dockets

No global public-corpus recall claim is made.

## Live benchmark

`npm run bench:live` traces five resolvable real authorities only when `COURTLISTENER_TOKEN` exists.

Each result now records:
- CourtListener requests
- Firecrawl requests
- cache hits
- documents hydrated
- search passes used

Without credentials it prints an explicit SKIPPED state.
