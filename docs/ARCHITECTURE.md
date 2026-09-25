# Architecture

RECALL has one epistemic core and multiple source adapters.

```text
incident source
   │
   ├─ recorded public incident
   ├─ manual incident
   └─ imported corpus
          │
          ▼
 incident dependencies
          │
          ▼
     trace engine
          │
   ┌──────┴──────────┐
   │                 │
CourtListener      local corpus
   │
 RECAP text
   │
 Firecrawl fallback
   │
   ▼
shared deterministic classifier
   │
   ▼
confirmed / possible / unconfirmed
   │
   ▼
incident matrix + affected work + evidence
```

## Boundaries

### Domain
`lib/domain.mjs` owns relationship, incident, dependency, source, and review states.

### Incident
`lib/recorded-incident.mjs` contains the source-backed Johnson demo incident.
`lib/incident-trace.mjs` aggregates multiple incident dependencies without mixing provider response formats into product components.

### Source adapters
`lib/courtlistener.mjs` performs legal discovery / RECAP hydration.
`lib/firecrawl.mjs` is an allowlisted extraction fallback only.

### Engine
`lib/recall-core.mjs` owns citation parsing, canonicalization, quote matching, review-only proposition matching, and local blast-radius logic.

React components consume typed-ish product outputs; they do not decide whether legal evidence is confirmed.

## Request architecture

A common exact-citation trace is:

1. optional authority resolution;
2. one exact `rd` search;
3. one docket-context query;
4. local confirmation from snippets;
5. at most three promising candidate hydrations;
6. broader search only if exact retrieval is insufficient.

Candidate hydration uses a bounded queue with concurrency 2.

429 responses preserve `Retry-After`. Short retry windows are honored once; long retry windows return immediately to the user as a rate-limit state.

## Cache layers

In-process TTL caches:
- resolution
- search
- RECAP document detail
- docket detail
- extraction
- trace result

A cached result retains its original retrieval time and is never labeled live.

## Trust boundary

Provider data is validated conservatively at the adapter boundary. Malformed responses fail closed. External URLs are allowlisted. Secrets remain server-side. Private corpus text is not logged.
