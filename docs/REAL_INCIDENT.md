# Real incident — Johnson v. Dunn

Case: **Johnson v. Dunn**
Court: U.S. District Court for the Northern District of Alabama
Docket: **2:21-cv-01701-AMM**
Sanctions order: Document 204, filed July 23, 2025.

Public sanctions-order source:
`https://storage.courtlistener.com/recap/gov.uscourts.alnd.179677/gov.uscourts.alnd.179677.204.0.pdf`

The order states that there were **five problematic citations across two motions**.

## Disputed dependencies

Document 174:
1. United States v. Baker, 539 F.App'x 937, 943 (11th Cir 2013)
2. Kelley v. City of Birmingham, 2021 WL 1118031, *2 (N.D. Ala. Mar. 24, 2021)
3. Greer v. Warden, FCC Coleman I, 2020 WL 3060362, at *2 (M.D. Fla. June 9, 2020)
4. Wilson v. Jackson, 2006 WL 8438651, at *2 (N.D. Ala. Feb. 27, 2006)

Document 182:
5. Williams v. Asplundh Tree Expert Co., No. 3:05-cv-479, 2006 WL 3343787, at *4 (M.D. Fla. Nov. 17, 2006)

## Provenance discipline

Each dependency stores exact sanctions-order language, page number, public source URL, and SHA-256 over the exact stored source span.

For the recorded impact matrix, occurrence evidence is labeled `COURT_ORDER_RECORD_OF_FILING`. This is deliberate: the sanctions order records which filing/page contained each citation, but the recorded fixture does not pretend the original motion PDFs were independently downloaded when they were not.

The primary demo therefore proves:
- the incident is real;
- the disputed dependencies are source-backed;
- the two affected filed motions are identified by the court;
- the relationship topology is deterministic.

Live CourtListener tracing remains available separately for current public-corpus discovery.
