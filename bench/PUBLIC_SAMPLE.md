# Public-corpus benchmark sample

This source-backed sample is separate from the synthetic labeled benchmark. It is intentionally small and does **not** claim recall over CourtListener / RECAP as a whole.

Five real authorities were selected after independently confirming at least one occurrence in a public RECAP filing:

| Authority | Captured public filing | Source |
| --- | --- | --- |
| 598 U.S. 508 — Andy Warhol Foundation v. Goldsmith | Kadrey et al. v. Meta Platforms, Document 598, N.D. Cal., filed 2025-06-25 | https://storage.courtlistener.com/recap/gov.uscourts.cand.415175/gov.uscourts.cand.415175.598.0.pdf |
| 593 U.S. 1 — Google LLC v. Oracle America | Same bounded filing sample | https://storage.courtlistener.com/recap/gov.uscourts.cand.415175/gov.uscourts.cand.415175.598.0.pdf |
| 510 U.S. 569 — Campbell v. Acuff-Rose Music | Same bounded filing sample | https://storage.courtlistener.com/recap/gov.uscourts.cand.415175/gov.uscourts.cand.415175.598.0.pdf |
| 471 U.S. 539 — Harper & Row v. Nation Enterprises | Same bounded filing sample | https://storage.courtlistener.com/recap/gov.uscourts.cand.415175/gov.uscourts.cand.415175.598.0.pdf |
| 464 U.S. 417 — Sony Corp. v. Universal City Studios | Same bounded filing sample | https://storage.courtlistener.com/recap/gov.uscourts.cand.415175/gov.uscourts.cand.415175.598.0.pdf |

The repository's `npm run bench:live` command runs a bounded current CourtListener v4 trace for all five authorities when `COURTLISTENER_TOKEN` exists. It writes `bench/live-results.json`. Without the credential it exits successfully with an explicit **SKIPPED** state; no fixture is substituted and no live metrics are fabricated.

The recorded `/demo` trace uses a different three-filing source sample for 598 U.S. 508, with source URLs and captured-content hashes preserved.
