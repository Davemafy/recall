# CourtListener / RECAP integration

Base API:

`https://www.courtlistener.com/api/rest/v4/`

Authentication:

```http
Authorization: Token <COURTLISTENER_TOKEN>
```

## Current v4 search contract

RECALL follows CourtListener's current v4 distinction:

- `type=r` — federal dockets with up to three nested matching documents.
- `type=rd` — flat federal filing documents from PACER / RECAP, without full docket metadata.
- `type=d` — docket-only search.
- `type=o` — case-law opinion clusters.

The product uses `rd` as the primary filing-candidate stream and `r` as docket/nested-document context.

## Search passes

For a canonical citation:

1. exact phrase, e.g. `"598 U.S. 508"`;
2. keyword variant, e.g. `598 U.S. 508`;
3. case-name + reporter-volume using documented `AND` syntax only when a resolved case name exists.

For quotation traces, RECALL searches a bounded exact phrase fragment.

No undocumented operator is generated.

## Authority lookup

Citation lookup returns per-citation `status` values. RECALL only treats a row with `status: 200` and at least one cluster as resolved.

A row-level 404 means **UNRESOLVED**, not fabricated. A 300 multiple-choice response is also left unresolved in the hackathon resolver rather than selecting a case silently.

## Filing hydration

A search hit is not proof.

For each unique `rd` candidate, RECALL attempts to retrieve:

`/api/rest/v4/recap-documents/{id}/`

using field selection for:
- `plain_text`
- document description/number
- `filepath_local`
- availability/OCR metadata

`plain_text` is preferred for deterministic confirmation. If it is unavailable, the candidate may be checked from the CourtListener search snippet, and the evidence record states that confirmation source explicitly.

Docket metadata is hydrated from the corresponding docket result or docket detail API when necessary.

## Pagination and bounds

RECALL follows CourtListener `next` links only while they remain on an allowlisted CourtListener host. The prototype stops at the configured unique-candidate bound.

The UI reports:
> N confirmed in M filing candidates checked

It never says “all filings” when the search was bounded.

## Search count caveat

CourtListener documents that `type=r` and `type=d` use approximate cardinality counts for large result sets. RECALL emphasizes checked candidate count rather than treating the reported total as exact.

## Errors

- HTTP 401 / 403 → `AUTH_ERROR`
- HTTP 429 → `RATE_LIMITED`
- timeout / 5xx → `SOURCE_UNAVAILABLE`
- empty search → honest zero
- no checkable text → `CANDIDATE_UNCONFIRMED`

None of these states becomes a factual conclusion about the authority.

## Source URL policy

Only HTTPS URLs on:
- `www.courtlistener.com`
- `courtlistener.com`
- `storage.courtlistener.com`

are surfaced. The app never performs server-side fetches of arbitrary URLs extracted from a filing.
