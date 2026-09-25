# CourtListener / RECAP adapter

Base:
`https://www.courtlistener.com/api/rest/v4/`

Authentication:
`Authorization: Token <COURTLISTENER_TOKEN>`

## Search strategy

RECALL uses:
- `type=rd` for flat federal filing-document candidates;
- `type=r` only as docket / nested-document context;
- citation lookup for optional authority resolution.

The trace starts with the exact canonical citation. Formatting / broader variants are fallback passes, not automatic fan-out.

## Candidate confirmation

A search hit is retrieval only.

RECALL first inspects the returned source snippet locally. If it already contains deterministic evidence, no RECAP detail request is required.

Only promising unconfirmed candidates are hydrated, capped at three per pass in the hackathon build.

## Concurrency

CourtListener hydration concurrency: **2**.

A regression test asserts a simple successful exact trace stays within eight CourtListener requests and never exceeds two simultaneous requests.

## Rate limits

429 responses preserve `Retry-After`.

- short server-requested waits (<= 2.5 seconds) are honored once;
- larger waits return immediately as `RATE_LIMITED`;
- the UI keeps incident state and communicates the retry window.

5xx / timeout states retry once with bounded exponential backoff and then fail conservatively.

## Docket counts

Only known docket IDs / numbers are counted as unique dockets. Confirmed filings with unavailable docket metadata are reported separately.

## Coverage

The UI says:
> Searches public federal filing data available through CourtListener / RECAP.

It never claims to search every U.S. filing.
