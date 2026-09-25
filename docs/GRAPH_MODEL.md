# Graph model

Node classes: AUTHORITY, QUOTE, PROPOSITION, DOCUMENT, MATTER.

Edge classes:
- `CONFIRMED_CITATION_DEPENDENCY` — reporter/volume/first-page identity.
- `CONFIRMED_QUOTE_REUSE` — conservative normalized overlap above threshold.
- `POSSIBLE_DERIVED_CLAIM` — review-only lexical/semantic similarity.
- `MATTER_LINK` — explicit imported metadata only.

Each dependency edge carries the evidence and rule that created it. Matter edges require explicit matter metadata. Version chronology is only described when parent metadata exists.
