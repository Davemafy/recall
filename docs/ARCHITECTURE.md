# Architecture

RECALL has one dependency engine and three source adapters.

## Source adapters

### Live public source
`/api/trace` uses CourtListener REST v4. It resolves a supported citation, searches federal filing data with `type=r` and filing documents with `type=rd`, normalizes returned metadata, and hands available filing text/snippets to the shared engine.

### Recorded public source
`lib/recorded-public-trace.mjs` contains a small source-backed capture from actual RECAP public documents. Every record preserves its public source URL, capture time, and content hash. It is never labeled live.

### Imported corpus
The browser extractor converts PDF/TXT/MD/DOCX input to the same document/text shape. Missing metadata remains unknown.

## Shared engine

`lib/recall-core.mjs` owns:
- citation parsing
- reporter normalization
- authority canonicalization
- quotation extraction and normalization
- quotation comparison
- proposition extraction
- lexical review matching
- dependency construction
- blast-radius traversal
- remediation ordering for private/imported documents

`lib/courtlistener.mjs` is an adapter, not a second dependency engine. A CourtListener search hit becomes a confirmed relationship only after the shared parser or deterministic quotation matcher finds evidence in available text.

## Trust boundaries

The CourtListener token is server-only. Live outbound requests are hardcoded to the CourtListener v4 API. Returned public links are accepted only from CourtListener or storage.courtlistener.com. RECALL never fetches arbitrary URLs extracted from legal text.

## Cache

Current-source responses are cached in-process for ten minutes. Cached records retain query, retrieval time, source URL, and content hash. A cached response is labeled `CACHED PUBLIC SOURCE`, never live.

## Coverage

The live trace is bounded to 50 unique candidates. CourtListener `type=r` may report approximate counts for large result sets; RECALL reports candidates checked rather than claiming exhaustive corpus coverage.
