# CourtListener / RECAP integration

Base API: `https://www.courtlistener.com/api/rest/v4/`

Authentication:

```
Authorization: Token <COURTLISTENER_TOKEN>
```

RECALL uses documented keyword search behavior only.

## Search types

- `type=r` — federal dockets with up to three nested matching filing documents.
- `type=rd` — federal filing documents without docket metadata.
- `type=d` — docket-only search when needed for metadata work.
- `type=o` — case-law opinions; not the primary filing blast-radius search.

The live trace pairs `r` docket metadata with `rd` filing candidates where IDs permit.

## Search passes

For a canonical citation the adapter uses:
1. exact phrase, e.g. `"598 U.S. 508"`;
2. ordinary keyword variant, e.g. `598 U.S. 508`;
3. case-name + reporter-volume only when an authority name is available.

For quotation traces it searches a bounded exact phrase fragment.

No undocumented query operator is generated.

## Confirmation

Search is retrieval, not proof.

A result is `CANDIDATE_UNCONFIRMED` until available source text independently satisfies a deterministic dependency rule. A snippet that merely discusses the same topic is excluded from confirmed counts.

## Errors

- 401 / 403: `AUTH_ERROR`
- 429: `RATE_LIMITED`
- 5xx / timeout: `SOURCE_UNAVAILABLE`

These are source states, never authority verdicts.

## Source URLs

Only HTTPS URLs on:
- `www.courtlistener.com`
- `courtlistener.com`
- `storage.courtlistener.com`

are surfaced as public source links.

## Result-count caveat

CourtListener documents that `type=r` / `type=d` result counts can be approximate for large sets. RECALL therefore emphasizes the number of unique filing candidates actually checked.
