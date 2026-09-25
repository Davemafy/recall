# Dependency rules

## Confirmed citation

A relationship is confirmed only when deterministic evidence ties the target document to the incident dependency.

Supported confirmation paths include:
- reporter / volume / first-page canonical identity;
- conservative short-form authority matching;
- normalized exact incident-dependency text for non-standard identifiers such as a Westlaw citation.

## Confirmed quote

A quotation relationship requires deterministic normalized phrase / quote overlap above the conservative threshold.

Paraphrase is not quote reuse.

## Possible proposition

Lexical / semantic similarity can only produce `POSSIBLE_RELATED_PROPOSITION`.

Possible relationships are excluded from confirmed impact counts.

## Exclusions

The engine must not create confirmed dependency merely from:
- same case name;
- same surname;
- same topic;
- chronological order;
- provider ranking;
- a search result;
- critical discussion saying an authority is invalid.

## Unknowns

Unavailable source text → candidate unconfirmed.
API error → source state.
Unresolved authority → unresolved.
Missing docket metadata → disclosed unknown.

None becomes a factual conclusion.
