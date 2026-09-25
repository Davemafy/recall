# Benchmark method

`npm run bench` evaluates 50 labeled relationships spanning exact citations, pin cites, exact/normalized quotation reuse, possible proposition matches, same-name negatives, same-surname negatives, different-reporter negatives, critical discussion, and unrelated controls.

The primary safety metric is **false confirmed dependencies**.

The second benchmark compares the full 30-document demo corpus with a labeled affected-document set and reports blast-radius precision and recall. The benchmark intentionally prefers missing a possible relationship over falsely asserting confirmed lineage.
