# UI source of truth — Figma cockpit reset

## Authority

The visual source of truth is the user-designed Figma frame:

- File: `vvhEh4DFpbuuXexBtnpWQx`
- Node: `33:1617` — “Security dashboard scene”
- Natural frame: 1770 × 1328
- Dashboard shell: 1690 × 1096

The previous RECALL frontend has no design authority after this reset.

## What is preserved

Only product/engine truth survives the reset:

- recorded Johnson v. Dunn incident data
- provenance hashes and source excerpts
- dependency and relationship engine
- CourtListener / RECAP integration
- Firecrawl fallback
- request-budget logic, caching and error states
- corpus ingestion
- benchmarks and automated tests

## Figma grammar carried into RECALL

- #171717 outer scene
- #0a0b0b hardware-like application shell
- 5px #242525 frame edge
- 40px outer radius
- 106px icon rail
- 22px / 42px top hierarchy
- four 145px summary cards
- dominant 373px incident timeline with narrow vertical grid
- three 340px lower operational panels
- #151616 cards and #202121 dense row surfaces
- #ff4b2b incident signal
- purple evidence stream
- metallic selected controls
- bottom-right orange/red atmospheric spill
- Inter typography exactly because the source design uses Inter

## Content translation

Security-specific labels from the visual concept are replaced by RECALL facts without changing the composition:

- affected asset → disputed dependencies / affected filings
- MITRE / source IP / confidence → relationship and docket counts
- security timeline → court source / filing / trace timeline
- AI suggested actions → disputed dependency list
- login attempts → affected filing relationship map
- threat detection → exact evidence trace

No security claim, risk score, confidence score, or invented legal fact is retained.

## Removed from the prior frontend

- Swiss editorial landing page
- mineral/lime command-surface theme
- prior navigation/header hierarchy
- paper-colored evidence rail
- previous dependency matrix styling
- previous marketing hero and footer
- Clash Display / Satoshi visual system

The Figma frame, not the previous production UI, is the implementation target.
