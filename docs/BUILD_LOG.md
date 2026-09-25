# Build log

## M1 — Dependency engine
Implemented deterministic citation parsing/canonicalization, quotation normalization, conservative quote reuse, review-only proposition matching, graph traversal, and remediation priority.

## M2 — Corpus + benchmark
Added a 30-document fixture corpus with positive and negative controls. Added 50 relationship cases and corpus-level blast-radius metrics.

## M3 — Product surface
Added editorial incident workspace, staged dependency graph, document evidence drawer, remediation queue, and browser corpus import.

## M4 — Optional source integration
Added an optional CourtListener v4 citation-lookup route. External resolution never decides that an unresolved authority is fabricated.
