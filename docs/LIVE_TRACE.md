# Live trace

`/trace` is Quick Trace, not the flagship product.

It remains useful for validating the source-confirmation engine and manually opened incidents.

## Exact-citation flow

1. Parse / normalize citation.
2. Optionally resolve authority.
3. Search exact citation in CourtListener federal filing documents.
4. Confirm candidates locally from snippets.
5. Hydrate only promising unconfirmed candidates.
6. Use RECAP extracted text where available.
7. Use Firecrawl only as an allowlisted extraction fallback.
8. Use one broader pass only when the exact pass is insufficient.
9. Return confirmed / possible / unconfirmed separately.

## Cancellation

Starting another client trace aborts the obsolete request. Server adapters also receive the request abort signal where supported.

## Diagnostics

Each live result records request count, cache hits, hydration count, search passes, duration, and relationship totals without logging legal-document contents.

## Failure states

- authentication/configuration error
- rate limited + retry window
- source unavailable
- unresolved authority
- zero confirmed results

Recorded demo data is never silently substituted into a live trace.
