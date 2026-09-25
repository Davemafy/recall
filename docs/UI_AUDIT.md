# UI anti-slop audit — incident command reset

This pass replaces the earlier "premium SaaS" reflex with a product-specific incident-command grammar.

## Primary reference studied

### #INC-2050 — Incident management dashboard
The supplied incident-response reference is treated as a composition reference, not a skin.

What mattered:
- incident identity is visible before analytics
- one horizontal timeline carries the eye across the state change
- the working area is dense, edge-to-edge, and operational
- tiny metadata and large incident facts coexist
- dark chrome recedes while the active investigation owns contrast
- the interface makes "what happened / where are we / what now" legible without a wall of KPI cards

What RECALL does differently:
- no security charts
- no threat score
- no synthetic confidence meter
- no copied icons, branding, or proprietary copy
- the signature object is dependency × filing evidence, not a generic incident dashboard

## 2026 product references

- Linear 2026 visual refresh
  - supporting chrome should not compete for attention it has not earned
  - preserve density while making the task surface dominant
- Attio / Ramp / Vercel / Mercury / modern observability products
  - quiet navigation
  - strong table rhythm
  - color reserved for state
  - progressive disclosure for technical detail
- data-heavy incident and operations interfaces
  - timeline first
  - status conveyed structurally before decorative labels
  - action and evidence stay in the same working context

## AI-generated patterns removed

- centered marketing hero + feature cards
- generic sidebar + card grid
- identical rounded rectangles
- KPI rows
- large decorative empty space
- blue/purple "AI" glow
- glassmorphism
- pill status soup
- legal-paper / law-firm styling
- graph spaghetti
- generic right inspector as the entire evidence model
- identical spacing and radius on every surface

## Current visual system

### Palette
- mineral black: #090b0a
- working black: #0f1210
- exact-evidence paper: #eeeee7
- incident signal: #ff684f
- confirmed/action signal: #d9ff63
- technical secondary: #9fb8ff

Color has a job. Incident red means disputed/flagged state. Lime means active/confirmed/action. The evidence column deliberately flips to a light working surface so exact text feels materially different from navigation chrome.

### Typography
- Clash Display: incident identity, counts, high-level state
- Satoshi: product UI, dense data, prose
- system monospace: citations, docket metadata, hashes

### Flagship composition

The recorded incident is now:

1. incident identity + source facts
2. horizontal investigation timeline
3. court finding band
4. disputed dependency rail
5. dependency × filing blast-radius matrix
6. paired exact evidence on a contrasting evidence surface
7. affected filings
8. provenance on demand

The visual object is still the relationship itself.

## Mobile rule

Mobile does not shrink the desktop command center. It becomes a vertical investigation:

incident → court finding → dependencies → trace → affected work → exact evidence.

The matrix remains horizontally inspectable rather than being crushed into unreadable cells.

## Product-specific kill test

Hide the RECALL wordmark.

A viewer should still see:
court finding → disputed dependency → filed motion → exact evidence.

If the structure can be relabeled as CRM, analytics, project management, or a generic security dashboard without changing the composition, it fails.
