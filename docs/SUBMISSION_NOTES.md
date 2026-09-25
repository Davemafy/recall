# Submission notes

**PROJECT:** RECALL

**ONE-SENTENCE PITCH:** RECALL traces a bad legal authority or quotation through real filings and shows every downstream document that now deserves review.

**CORE LINE:** One hallucination. Find every filing it touched.

**CATEGORY:** Legal incident response.

**DIFFERENTIATOR:** Citation checkers tell you whether one citation is wrong. RECALL starts after that discovery and finds public filings or private work that contain independently confirmed dependencies.

**TECHNICAL DIFFERENTIATOR:** CourtListener search is retrieval only. RECALL independently canonicalizes citations and deterministically compares quotations before creating confirmed edges. Semantic/lexical matches are isolated as review candidates and excluded from confirmed counts.

**REAL-WORLD PROOF:** The recorded demo uses source-backed RECAP filings with preserved public URLs, capture timestamps, and content hashes. Live mode uses CourtListener REST v4 when the server token is configured.

**COVERAGE CLAIM:** Searches public federal filing data available through CourtListener / RECAP. It does not claim to search every U.S. filing.
