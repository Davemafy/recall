# UI anti-slop audit

This pass was intentionally done before the visual reset.

## Patterns explicitly removed

The 2026 product-design / AI-UI discussion repeatedly flags the same defaults:

- Inter/Geist used without an intentional type system
- purple/blue gradient as the default "AI" palette
- centered hero + three feature cards
- rounded card shells around every concept
- gray-on-white Shadcn/Radix dashboard composition
- equal-weight sidebars/panels
- KPI card rows
- badges/pills as the primary hierarchy
- soft shadows and floating glass used as decoration
- one dashboard skeleton reused for unrelated products
- explanatory copy compensating for weak interaction design

Research references:
- Reddit / r/ClaudeAI: "unslop-ui" discussion, June 2026
- Reddit / r/UXDesign: "What are the top AI slop design patterns?", March 2026
- UntilNow: "AI UX Design: Why Everything Looks the Same, and How to Fix It", August 2026
- SaaS UI Design: "Why Your SaaS UI Looks AI-Generated", June 2026

## Visual references studied

The reset deliberately ignored "legal tech" as an aesthetic category and studied stronger product categories:

- Ronas IT — dark SaaS / mobile dashboard work: mineral-black base, warm red-orange signal color, very controlled neutral typography
- Kolo fintech dashboard — deep black, blue-green and copper accents
- Tubik fintech dashboard — strong data hierarchy and restrained lavender/indigo data colors
- current Dribbble workspace / finance products — full-bleed product surfaces instead of rounded white shells floating on gray backgrounds

## RECALL reset

### Removed
- outer rounded application card
- light gray dashboard shell
- three-equal-panel matter-inbox layout
- Inter-first typography
- serif-as-legal shorthand
- generic evidence inspector column
- metric cards
- decorative pills
- rounded-everything treatment
- duplicate CTA language

### Replaced with
- full-bleed mineral-black application surface
- warm porcelain investigation canvas
- signal vermilion (#ff5a36)
- restrained ice-lilac (#aeb8ff) for secondary technical state
- system-variable sans stack instead of Inter/Geist default
- asymmetric incident rail + working stage
- matrix as the primary incident artifact
- evidence presented as a dark/light source comparison spread
- integrated affected-document strip
- no decorative graph
- no provider/internal implementation details on the default surface

## Product-specific rule

A screenshot with the RECALL wordmark hidden should still be identifiable as:

incident source → disputed dependency → affected filing → exact evidence

If the composition could be relabeled as CRM, analytics, support tickets, or project management without structural change, it fails this audit.
