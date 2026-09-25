# Architecture

RECALL has two execution paths that share one dependency engine.

1. `/demo` loads the bundled 30-document corpus and a user-flagged fictional authority.
2. `/app` parses user-selected documents in-browser, then runs the same parser, canonicalizer, quote matcher, proposition matcher, graph traversal, and remediation engine.

`lib/recall-core.mjs` is intentionally dependency-free so the exact logic used by the product can also run in Node's built-in test runner and benchmark harness.

The dependency stack is:

`file -> text -> citation/quote/proposition occurrences -> deterministic/possible edges -> incident traversal -> affected work -> remediation`

No semantic match can promote itself into a confirmed edge.
