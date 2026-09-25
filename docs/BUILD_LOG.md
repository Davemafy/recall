# Build log

## M1 — Dependency engine
Implemented deterministic citation parsing/canonicalization, quotation normalization, conservative quote reuse, review-only proposition matching, graph traversal, and remediation priority.

## M2 — Corpus + benchmark
Added a 30-document fixture corpus with positive and negative controls. Added 50 relationship cases and corpus-level blast-radius metrics.

## M3 — Product surface
Added editorial incident workspace, staged dependency graph, document evidence drawer, remediation queue, and browser corpus import.

## M4 — Optional source integration
Added an optional CourtListener v4 citation-lookup route. External resolution never decides that an unresolved authority is fabricated.


## M5 — Public-source trace foundation
Promoted CourtListener / RECAP to a first-class trace path. Added bounded `type=r` + `type=rd` search, authority resolution, candidate-vs-confirmed classification, source allowlisting, conservative caching, source-first UI, recorded public RECAP replay, and shared-engine corpus parity.

Verification checkpoint:
- unit/API tests: 21/21 passed
- deterministic benchmark: 0 false confirmed dependencies
- typecheck: passed
- lint: passed
- production build: passed
- Playwright: 5/5 passed


## M6 — Benchmark, API-contract and hardening pass
Verified CourtListener v4 search / RECAP document hydration against current official API documentation, added a five-authority public-source benchmark set and credential-gated live benchmark, tightened citation lookup status handling, added quote-only/unresolved trace behavior, and expanded benchmark reporting.

Verification checkpoint:
- unit/API/security tests: 23/23 passed
- citation parser precision / recall: 100.0% / 100.0% on labeled parser set
- confirmed citation / quote precision: 100.0% / 100.0%
- false confirmed dependencies: 0
- recorded public sample: 3/3 independently confirmed
- live benchmark: correctly SKIPPED because COURTLISTENER_TOKEN is absent in CI
- typecheck: passed
- lint: passed
- production build: passed
- Playwright: 5/5 passed
