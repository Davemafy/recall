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

## M6 — Real-source hardening
Promoted the public filing path from search-snippet discovery to source confirmation. Live traces now use flat `type=rd` filing candidates, `type=r` docket context, bounded pagination, RECAP document-detail hydration, and `plain_text` confirmation where available. Citation lookup honors row-level status codes; 404 remains unresolved. Public filings can preserve both citation and quotation relationships, while critical discussion is excluded from confirmed dependency counts.

The deterministic recorded demo now replays three real RECAP filings for `598 U.S. 508`, including two source-backed occurrences of the short quotation “further purpose or different character.” Real source URLs, capture date, and excerpt hashes are preserved.

Final verification checkpoint on commit `ea5e47488d4d34e17cf0fb0b7c89ce37c411f0c9`:
- unit/API tests: 25/25 passed
- deterministic relationship benchmark: 48/50 exact classification, 0 false confirmed dependencies
- citation parser precision / recall: 100% / 100%
- confirmed citation precision: 100%
- confirmed quote precision: 100%
- synthetic corpus blast-radius precision / recall: 100% / 88.2%
- recorded public sample: 3/3 filings deterministically confirmed
- live CourtListener benchmark: skipped honestly because `COURTLISTENER_TOKEN` is not configured in CI
- typecheck: passed
- lint: passed
- production build: passed (Next.js compiled in 6.3s)
- Playwright: 5/5 passed

Deployment note: the connected Vercel project exists, but the most recent production deployment visible during this checkpoint was the earlier `node:crypto` failure. The client-side crypto dependency has since been removed and CI verifies the production build; a fresh Vercel deployment is still required.
