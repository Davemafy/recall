# UI anti-slop audit

This pass was done specifically to break the generic AI-product look that kept surviving earlier iterations.

## Defaults explicitly rejected

- Inter / Geist / system sans used without a typographic point of view
- centered hero + three feature cards
- rounded white shell floating on gray
- equal-weight left / center / right panels
- KPI card rows
- pill-heavy status language
- purple / blue "AI" gradient
- generic evidence inspector sidebar
- dark dashboard + orange accent as a shortcut to "premium"
- graph-first incident visualization
- one SaaS layout that could be relabeled as CRM, support, analytics, or security

## Research direction

The reset deliberately stopped looking at legal-tech UI as an aesthetic category.

References studied instead:

- Halo Design Studio — **Tetra: Bold Minimalist Crypto Dashboard Interface**
  - massive typography as data
  - Swiss grid discipline
  - borderless composition
  - extreme negative space
  - monochrome surfaces with one restrained signal color
  - palette studied: #E9E9E9 / #6E6E6E / #B6C9B1 / #071107 / #3F483F / #235F24 / #775B3D

- Halo Design Studio — **Tetra: Minimalist Crypto Dashboard, Swap & Trade Flow**
  - transaction-like primary actions
  - data treated like poster typography instead of cards
  - progressive disclosure rather than persistent chrome

- current Dribbble brutalist / Swiss product work
  - strong type and ruled structure instead of component-library decoration
  - full-bleed working surfaces
  - dense data made calm through hierarchy, not boxes

## Typography

The product now uses:

- **Clash Display** — high-impact display / numeric hierarchy
- **Satoshi** — product UI, body text, metadata

Both are loaded from Fontshare.

Why this pairing:
- the display face gives the incident and blast-radius numbers a recognizable voice;
- the UI face stays readable at dense product sizes;
- citations no longer inherit a fake-law serif aesthetic;
- the combination avoids the default Inter / Geist look.

## Current product language

### Palette

Primary:
- deep green-black — #071107
- mineral gray — #E9E9E9
- sage — #B6C9B1
- forest signal — #235F24

Secondary:
- moss — #3F483F
- umber — #775B3D

The previous vermilion / purple AI-dashboard palette has been removed from the new flagship surfaces.

### Flagship composition

The recorded incident is no longer:
sidebar → middle panel → inspector.

It is now:

1. incident identity
2. **05 → 02** as the primary visual fact
3. horizontal dependency rail
4. dependency × filing blast-radius ledger
5. source evidence and affected-work evidence shown as one paired spread
6. affected filing strip
7. provenance only on request

The relationship itself is the visual object.

### Quick Trace

No metric-card dashboard.

It is:
- one large citation input
- one confirmed / checked ratio
- one evidence ledger
- one source-evidence sheet

### Corpus

No dashed upload card floating in whitespace.

It is:
- one full-height local-work intake surface
- document → authority count transition
- one authority ledger

## Product-specific rule

A screenshot with the RECALL wordmark hidden should still communicate:

incident source → disputed dependency → affected filing → exact evidence

If the composition can be relabeled as CRM, support, analytics, or project management without structural change, it fails this audit.
