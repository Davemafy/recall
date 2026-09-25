# Architecture

RECALL has one dependency engine and three source adapters.

## 1. Live public source

`/api/trace` uses CourtListener REST v4.

The live path is:

```text
citation / quotation
  → authority normalization
  → CourtListener search
      rd = flat federal filing-document candidates
      r  = docket + nested-document metadata context
  → bounded pagination
  → RECAP document detail hydration
  → plain_text when available
  → shared deterministic dependency engine
  → docket grouping
  → source-first evidence UI
```

A search result is retrieval only. It becomes confirmed only after the shared dependency engine finds deterministic citation or quotation evidence in available filing text.

## 2. Recorded public source

`lib/recorded-public-trace.mjs` contains a small, source-backed development-time capture from real RECAP public documents.

Each record preserves:
- public RECAP source URL;
- capture date;
- captured citation/quotation excerpt;
- SHA-256 hash of that captured excerpt;
- docket/court/date metadata visible in the source document.

The route is labeled **RECORDED PUBLIC TRACE**, never live.

## 3. Imported corpus

The browser extractor converts PDF/TXT/MD/DOCX files into the shared document/text shape. Missing status, matter, version, and chronology remain unknown unless supplied.

## Shared engine

`lib/recall-core.mjs` owns:
- citation parsing;
- reporter normalization;
- authority canonicalization;
- quotation extraction/normalization;
- deterministic quotation comparison;
- proposition extraction;
- review-only lexical matching;
- dependency construction;
- blast-radius traversal;
- remediation ordering for imported documents.

`lib/courtlistener.mjs` is an external-source adapter. It does not maintain a second dependency law.

## Trust boundaries

- CourtListener token: server only.
- Outbound API host: hardcoded CourtListener API.
- Public source links: allowlisted CourtListener / storage.courtlistener.com only.
- Arbitrary filing URLs: never fetched.
- Imported corpus contents: parsed in browser, not sent to `/api/trace`.

## Cache

Current-source trace results are cached in-process for ten minutes. Cached responses retain original `retrievedAt`, queries, source URLs, and content hashes. The UI labels them **CACHED PUBLIC SOURCE — checked <date>**.

## Performance

The live trace is bounded. Default UI depth is 25 unique filing candidates, with an explicit continuation to 50. RECAP hydration runs in bounded batches instead of unbounded concurrency.

## Coverage

CourtListener / RECAP is a public federal filing corpus, not every U.S. filing. RECALL reports the count actually checked and never silently promotes approximate search totals into exhaustive blast-radius claims.
