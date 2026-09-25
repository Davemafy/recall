# Submission notes

**PROJECT:** RECALL

**ONE-SENTENCE PITCH:** RECALL traces a bad legal authority or quotation through real filings and shows every downstream document that now deserves review.

**CORE LINE:** One hallucination. Find every filing it touched.

**CATEGORY:** Legal incident response.

**NOT:** a citation checker, fake-case detector, seeded graph demo, semantic-search toy, or legal chatbot.

## Differentiator

Citation checkers answer:
> Is this citation valid?

RECALL starts after an incident is opened and answers:
> Where else does this legal dependency appear, and which relationships can actually be proven?

CourtListener search is retrieval only. RECALL independently parses the available filing text before creating confirmed citation or quotation relationships. Semantic/lexical similarity remains a separate review category.

## Real-world proof

The flagship product path searches public federal filing data available through CourtListener / RECAP.

The deterministic `/demo` uses source-backed excerpts from three real RECAP filings, preserving:
- real public source URLs;
- capture date;
- source docket/court/date metadata;
- content hashes.

The recorded authority is valid `598 U.S. 508`; the replay exists to prove the dependency-tracing mechanism, not to call that authority erroneous.

## Safety / truth boundary

- Search hit ≠ confirmed dependency.
- Semantic resemblance ≠ lineage.
- “Not found” ≠ fabricated.
- API error ≠ fabricated.
- Critical discussion of an authority is not automatically dependency.
- Confirmed public relationships require deterministic text evidence.
- Coverage is bounded and reported as candidates actually checked.

## Coverage claim

**Searches public federal filing data available through CourtListener / RECAP.**

Never claim:
**Searches every U.S. court filing.**
