# RECALL

> **One hallucination. Find every filing it touched.**

RECALL is **legal incident response**. It starts after an authority or quotation is put under review and asks the operational question: **where else does this dependency appear?**

It is not a citation checker, fake-case detector, legal chatbot, seeded graph demo, or semantic-search verdict engine.

## Search result → candidate → confirmed dependency

RECALL deliberately separates retrieval from proof.

1. **Search result** — CourtListener / RECAP returned a public filing because a query matched.
2. **CANDIDATE_UNCONFIRMED** — RECALL preserved source metadata but could not independently establish the dependency from available filing text.
3. **CONFIRMED_CITATION_DEPENDENCY** — RECALL's deterministic parser found the same canonical reporter / volume / first-page authority in available filing text.
4. **CONFIRMED_QUOTE_REUSE** — normalized quotation overlap crossed the conservative deterministic threshold.
5. **POSSIBLE_DERIVED_CLAIM** — lexical/semantic resemblance only. Human review required.
6. **NOT_RELATED** — evidence does not support dependency, including explicit critical discussion of the incident authority.

A CourtListener ranking or search hit is never enough to create a confirmed edge.

## Real CourtListener / RECAP mode

`/trace` is the primary product path.

For a citation such as `598 U.S. 508`, the server:

1. parses and canonicalizes the authority;
2. optionally resolves authority metadata with CourtListener v4 citation lookup;
3. builds documented keyword/phrase searches;
4. uses `type=rd` as the flat federal filing-document search and `type=r` as docket/nested-document metadata context;
5. follows CourtListener pagination only within a bounded candidate limit;
6. hydrates RECAP candidates through `/api/rest/v4/recap-documents/{id}/` and requests `plain_text` where available;
7. independently re-runs the shared citation / quotation dependency engine over the hydrated text;
8. groups confirmed occurrences by actual docket metadata;
9. preserves search query, retrieval timestamp, source URL, source mode, and SHA-256 content hash;
10. reports exactly how many filing candidates were checked.

CourtListener / RECAP coverage is **not every U.S. court filing**. RECALL always describes this as “public federal filing data available through CourtListener / RECAP.”

The hackathon live trace begins with 25 unique candidates and can expand to 50. It never claims “all filings” unless the returned result set was actually exhausted.

## Recorded public demo

`/demo` is a deterministic replay of **real public RECAP source material captured during development**.

The recorded trace uses the real authority `598 U.S. 508` and source-backed excerpts from three federal filings:

- Thomson Reuters Enterprise Centre GmbH v. Ross Intelligence Inc., D. Del., Document 770, filed 2025-02-11
- Kadrey et al. v. Meta Platforms, Inc., N.D. Cal., Document 598, filed 2025-06-25
- Bartz et al. v. Anthropic PBC, N.D. Cal., Document 231, filed 2025-06-23

The first two also contain the short Warhol quotation **“further purpose or different character”**, allowing RECALL to demonstrate confirmed quotation reuse without inventing a synthetic public filing.

The replay preserves the real RECAP source URL, capture date, exact verbatim source excerpts, page / capture-time extracted-text line provenance, and SHA-256 hashes for both each stored excerpt and each evidence span. An original-file SHA-256 is stored only when the PDF itself was downloaded during capture; the current recorded fixtures explicitly mark that no original file hash was captured. It is visibly labeled **RECORDED PUBLIC TRACE** and never presented as live.

RECALL does **not** claim that `598 U.S. 508` is invalid. The recorded route demonstrates downstream dependency mechanics with a real authority and real public filings.

## Trace my corpus

`/corpus` processes user-selected PDF, TXT, MD, and DOCX files in the browser.

The same deterministic citation parser, authority normalizer, quote matcher, proposition matcher, dependency classifier, and blast-radius logic powers both imported corpora and public-source confirmation. Unknown document status, matter, and chronology stay unknown unless explicitly supplied.

## Architecture

```text
public citation / quotation
        │
        ├── CourtListener v4 search (rd filing candidates + r docket context)
        │       │
        │       └── RECAP document detail → plain_text where available
        │
        └── imported local corpus
                │
                ▼
       shared dependency engine
   citation → quote → possible claim
                │
                ▼
   confirmed / candidate / review-only
                │
                ▼
     docket or matter blast radius
```

Server-only CourtListener credentials never enter the client bundle. Outbound API calls are hardcoded to CourtListener. Public source links are allowlisted to CourtListener and CourtListener storage hosts. RECALL never follows arbitrary URLs extracted from legal text.

## Dependency law

- Pin cites do not create new authorities.
- Same case name or surname is never enough to merge authorities.
- Semantic similarity can never create a confirmed dependency.
- A public filing that only criticizes or invalidates the incident authority is excluded from confirmed dependency counts.
- API failure and “not found” remain source states, not conclusions about an authority.
- Every confirmed relationship preserves the exact evidence and rule that created it.

## Benchmark

`npm run bench` runs the deterministic labeled benchmark and the 30-document negative-control corpus.

`npm run bench:live` runs a bounded current CourtListener trace over five real authorities **only when `COURTLISTENER_TOKEN` is configured**. Without the credential it prints an explicit SKIPPED state; it never substitutes fixture data and calls it live.

The primary safety metric is **FALSE CONFIRMED DEPENDENCIES**.

See `bench/PUBLIC_SAMPLE.md` for the source-backed public sample.

## Environment

```bash
COURTLISTENER_TOKEN=
```

The token is required only for current CourtListener API calls. The recorded public demo and imported-corpus mode require no external key.

## Local development

```bash
npm install
npm run dev
```

Routes:
- `/` — real-trace entry
- `/trace` — current CourtListener / RECAP trace
- `/demo` — recorded real public-source replay
- `/corpus` — imported corpus mode
- `/app` — legacy redirect to `/corpus`

## Verification

```bash
npm test
npm run bench
npm run bench:live
npm run typecheck
npm run lint
npm run build
npm run e2e
```

## Failure handling

- 401 / 403 → authentication/configuration error
- 429 → rate limited
- timeout / 5xx → source unavailable
- zero matches → zero matches
- search hit without deterministic evidence → candidate, not confirmed
- citation-lookup row status 404 → authority unresolved, never “fake”

## Privacy and security

- Imported corpus files are parsed in-browser in the hackathon build.
- RECALL does not intentionally upload imported corpus text to its own API.
- No analytics capture corpus text.
- CourtListener token is server-only.
- User input and file sizes are bounded.
- Public source URLs are restricted to CourtListener / storage.courtlistener.com.
- No arbitrary URL found inside a filing is fetched.
- Raw corpus text is not logged by application code.

## Known limitations

- CourtListener / RECAP is incomplete relative to all U.S. filings.
- RECAP documents without extracted text can remain unconfirmed even when search surfaced them.
- OCR is not included in the imported-corpus path.
- Case-name-only identity is not sufficient to merge authorities.
- The recorded demo is a deliberately small public-source capture, not a claim about exhaustive history.
- Historical copying or causation is not inferred.

## No-lineage-overclaim rule

**RECALL does not infer historical copying or causation from semantic similarity. Confirmed relationships require deterministic evidence. Semantic matches are surfaced only as review candidates.**

Use “appears in,” “confirmed occurrence,” or “also found in” unless actual provenance establishes more.
