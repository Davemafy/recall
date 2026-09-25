# Firecrawl fallback

Firecrawl is optional extraction infrastructure.

It is never the legal source of truth.

## When it runs

Only when:
1. CourtListener has identified a candidate public filing;
2. the RECAP document detail does not provide usable `plain_text`;
3. a known allowlisted public source URL exists;
4. `FIRECRAWL_API_KEY` is configured.

## Endpoint

RECALL uses Firecrawl v2:
`POST https://api.firecrawl.dev/v2/scrape`

with markdown extraction.

## Allowlist

Firecrawl may receive only HTTPS URLs on:
- courtlistener.com
- www.courtlistener.com
- storage.courtlistener.com

URLs extracted from legal text are never fetched.

## Provenance

If Firecrawl returns text:
- source type = `FIRECRAWL_PUBLIC_SOURCE`
- original CourtListener / RECAP URL remains the surfaced legal source
- extracted text is hashed
- deterministic RECALL classification runs after extraction

If Firecrawl fails, the candidate remains unconfirmed unless another deterministic evidence source succeeds.
