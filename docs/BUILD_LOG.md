# Build log

## M1 — Dependency engine
Implemented deterministic citation parsing/canonicalization, quotation normalization, conservative quote reuse, review-only proposition matching, graph traversal, and remediation priority.

## M2 — Corpus + benchmark
Added a 30-document fixture corpus with positive and negative controls. Added 50 relationship cases and corpus-level blast-radius metrics.

## M3 — Product surface
Added editorial incident workspace, staged dependency graph, document evidence drawer, remediation queue, and browser corpus import.

## M4 — Optional source integration
Added an optional CourtListener v4 citation-lookup route. External resolution never decides that an unresolved authority is fabricated.


## M5 — Public-source trace foundation
Promoted CourtListener / RECAP to a first-class trace path. Added bounded `type=r` + `type=rd` search, authority resolution, candidate-vs-confirmed classification, source allowlisting, conservative caching, source-first UI, recorded public RECAP replay, and shared-engine corpus parity.

Verification checkpoint:
- unit/API tests: 21/21 passed
- deterministic benchmark: 0 false confirmed dependencies
- typecheck: passed
- lint: passed
- production build: passed
- Playwright: 5/5 passed


## M6 — Benchmark, API-contract and hardening pass
Verified CourtListener v4 search / RECAP document hydration against current official API documentation, added a five-authority public-source benchmark set and credential-gated live benchmark, tightened citation lookup status handling, added quote-only/unresolved trace behavior, and expanded benchmark reporting.

Verification checkpoint:
- unit/API/security tests: 23/23 passed
- citation parser precision / recall: 100.0% / 100.0% on labeled parser set
- confirmed citation / quote precision: 100.0% / 100.0%
- false confirmed dependencies: 0
- recorded public sample: 3/3 independently confirmed
- live benchmark: correctly SKIPPED because COURTLISTENER_TOKEN is absent in CI
- typecheck: passed
- lint: passed
- production build: passed
- Playwright: 5/5 passed

## M6 — Real-source hardening
Promoted the public filing path from search-snippet discovery to source confirmation. Live traces now use flat `type=rd` filing candidates, `type=r` docket context, bounded pagination, RECAP document-detail hydration, and `plain_text` confirmation where available. Citation lookup honors row-level status codes; 404 remains unresolved. Public filings can preserve both citation and quotation relationships, while critical discussion is excluded from confirmed dependency counts.

The deterministic recorded demo now replays three real RECAP filings for `598 U.S. 508`, including two source-backed occurrences of the short quotation “further purpose or different character.” Real source URLs, capture date, and excerpt hashes are preserved.

Final verification checkpoint on commit `ea5e47488d4d34e17cf0fb0b7c89ce37c411f0c9`:
- unit/API tests: 25/25 passed
- deterministic relationship benchmark: 48/50 exact classification, 0 false confirmed dependencies
- citation parser precision / recall: 100% / 100%
- confirmed citation precision: 100%
- confirmed quote precision: 100%
- synthetic corpus blast-radius precision / recall: 100% / 88.2%
- recorded public sample: 3/3 filings deterministically confirmed
- live CourtListener benchmark: skipped honestly because `COURTLISTENER_TOKEN` is not configured in CI
- typecheck: passed
- lint: passed
- production build: passed (Next.js compiled in 6.3s)
- Playwright: 5/5 passed

Deployment note: the connected Vercel project exists, but the most recent production deployment visible during this checkpoint was the earlier `node:crypto` failure. The client-side crypto dependency has since been removed and CI verifies the production build; a fresh Vercel deployment is still required.


## M7 — Founder-grade incident workspace

Rebuilt the flagship recorded incident around a real case-detail / matter-inbox product geometry instead of the previous editorial demo layout.

Material changes:
- incident shell now uses a three-column operational workspace: dependencies → impact → evidence
- the dependency × filing matrix is the signature interaction
- evidence stays visible in-context instead of opening a full-screen drawer
- incident source, court finding, exact dependency evidence, downstream occurrence, and provenance are progressively disclosed
- metric cards, giant product-screen headlines, graph-first presentation, and decorative UI were removed from the flagship flow
- mobile collapses the same information into a linear incident → dependencies → impact → evidence sequence
- visual system moved to a restrained 2026 neutral product palette with incident red used only for state emphasis

Reference study:
- Pixelnest Solutions — “AI-Powered Matter Inbox for Legal Case Management Dashboard” (Dribbble), used for workspace rhythm, column density, panel hierarchy, row spacing, and evidence-preview interaction
- Sulaimon Adedamola — “Research Library > Case Detail Screen > Citations & References” (Dribbble), used for neutral legal-product palette discipline

No Dribbble branding, product copy, or assets were copied into RECALL; only interaction/layout discipline was translated to RECALL’s own incident model.


## M8 — Anti-slop visual reset

Researched recurring 2026 AI-generated UI tells before touching the product surface, then removed the matching defaults from RECALL.

Audit targets removed:
- rounded application shell floating on gray
- Inter/Geist-first default typography
- three-equal-panel dashboard geometry
- centered hero + generic feature-card rhythm
- serif-as-legal shorthand
- muted legal-paper palette
- badge / pill overuse
- generic evidence inspector sidebar
- duplicated CTA language
- metric-card composition

New direction:
- full-bleed mineral-black product shell
- warm porcelain investigation canvas
- signal vermilion (#ff5a36)
- ice-lilac (#aeb8ff) used only for secondary technical/source state
- asymmetric incident rail + working stage
- dependency matrix as the primary product artifact
- incident-source vs downstream-evidence comparison shown as one dark/light spread
- affected filings integrated into the investigation stage instead of another dashboard panel
- same visual system carried through landing, incident creation, Quick Trace, and Corpus surfaces

The UI is intentionally not styled as “legal tech.” Product truth remains legal; visual language is drawn from contemporary fintech/workspace/data-product references.


## M9 — incident command reset / deployment-conserving batch

Rebuilt the visual hierarchy around the supplied #INC-2050 incident-response reference without copying its brand, charts, or security semantics.

Material changes:
- incident identity and court-source facts now lead the flagship experience
- added a horizontal investigation timeline: court finding → dependencies → trace → affected work → exact evidence
- kept the five disputed dependencies visible as an operational rail
- rebuilt the dependency × filing matrix as the central blast-radius surface
- moved exact evidence into a contrasting paper surface so source proof is materially distinct from navigation chrome
- preserved direct side-by-side incident-source / affected-work evidence
- rebuilt landing, incident creation, Quick Trace, Corpus, and imported-corpus incident surfaces into the same command-surface system
- retained deterministic recorded mode and all existing CourtListener / RECAP / Firecrawl semantics
- added intentional mobile ordering instead of shrinking the desktop workspace

Visual references:
- #INC-2050 incident-management dashboard: incident identity, horizontal event rail, dense operational geometry
- Linear 2026 visual refresh: supporting chrome recedes; the task surface owns attention
- Attio / Ramp / Vercel / Mercury / observability tools: quiet chrome, table density, color reserved for state

Workflow change:
- this work is prepared as one coherent batch on a non-production branch
- production remains on the last READY deployment during validation
- GitHub CI / build / Playwright are the validation loop
- Vercel receives one final production deployment only after the branch is green and the deployment cap resets


## M10 — Figma is the frontend source of truth

The previous RECALL frontend was discarded after the user clarified that the authored Figma frame — not the prior production UI and not the Netlify reference — is the actual design source.

Visual source:
- Figma file `vvhEh4DFpbuuXexBtnpWQx`
- node `33:1617` (“Security dashboard scene”)
- natural scene 1770×1328
- dashboard shell 1690×1096

Implementation rule:
- preserve only engine/data contracts
- do not preserve prior RECALL layout, typography, colors, navigation, matrix presentation, landing composition, evidence rail, or CSS because they already exist
- translate RECALL data into the exact Figma composition and visual grammar

Material changes:
- root route is now the real Johnson v. Dunn incident cockpit rather than a marketing landing page
- Figma shell, icon rail, compact header, four summary cards, dominant timeline, and three-panel lower workspace are reproduced in code
- security-specific dummy content is replaced by RECALL facts without importing security claims or risk scores
- disputed dependencies occupy the left lower panel
- affected filing relationships occupy the Figma dot-map position
- exact evidence trace occupies the Figma stream-chart position
- evidence opens in a dense dark drawer while preserving exact incident source, affected filing evidence, and provenance
- manual incident, Quick Trace, Corpus, and corpus-incident states use the same authored cockpit language
- Figma icon/vector nodes were captured to local repository assets; no temporary Figma asset URL is used by the implementation
- Inter is retained because the authored Figma frame itself specifies Inter

Deployment policy:
- this reset stays on a non-production branch until CI and preview validation pass and the user has inspected the Figma-derived preview
- no production merge is implied by passing tests


## M11 — Laptop density pass

After first full-viewport visual review, the authored Figma cockpit was adapted from poster-scale dimensions to a real laptop viewport without changing its visual language.

- removed the exterior presentation/backdrop layer
- made the dashboard itself the browser viewport
- made the sidebar viewport-height/sticky
- tightened top/header and summary-card vertical rhythm
- preserved full metric labels instead of truncating them
- reduced the flagship incident timeline from 23 crushed columns to 12 deliberate columns
- repositioned/resized timeline event blocks for laptop widths
- compressed lower-panel rhythm so more of the working surface enters the first viewport

This commit exists only to refresh the branch preview after Vercel skipped automatic deployment of the validated UI commit. It will be squashed before merge.


Preview refresh: precision pass for the live laptop review (shorter timeline, readable filing matrix, contained evidence stream, quieter dependency actions and theme control).
