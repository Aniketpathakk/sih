# Research Sources & Verification Register

**Research baseline:** 30 October 2026  
**Rule:** Prefer the latest primary source, record publication/effective dates separately, and re-check before production policy activation.

## 1. AICTE approval and regulatory rules

### AICTE Approval Process Handbook 2024–2027

- Official PDF: https://aicte.gov.in/sites/default/files/APH%20Final.pdf
- Alternative official host: https://www.aicte.gov.in/sites/default/files/APH%20Final.pdf
- Use for: Extension of Approval, institution/course changes, Approved Intake, NRI and supernumerary provisions, special categories and definitions.
- Research note: the handbook covers AY 2024–25 through AY 2026–27. Check all later AICTE public notices, amendments, institution EoA conditions and programme-specific provisions before treating a rule as current/operational.
- Search index consulted: https://aicte.gov.in/sites/default/files/APH%20Final.pdf

## 2. APAAR and ABC

### APAAR official portal

- https://apaar.education.gov.in/
- Use for: official description of APAAR and linked academic identity ecosystem.

### APAAR FAQs

- https://apaar.education.gov.in/faqs
- Use for: public descriptions of APAAR, 12-digit identity, ABC/DigiLocker relationship and student-facing process.
- Caution: FAQ content prominently describes UDISE+/PEN school workflow. Do not assume this is the full higher-education institution workflow or unrestricted API specification.

### API Setu — Academic Bank of Credits API collection

- https://directory.apisetu.gov.in/api-collection/abc
- Use for: discovering listed ABC/APAAR-related API products, including student record fetch and verification/linking operations.
- Caution: catalogue listing is not API access approval. Credentials, subscription/partner eligibility, sandbox use, agreement, security review and production approval must be confirmed with the provider.

## 3. DigiLocker and NAD

### DigiLocker

- Main portal: https://www.digilocker.gov.in/
- API/partner portal: https://apisetu.gov.in/digilocker
- Use for: issuer/requester integration discovery and digital document workflows.
- Caution: onboarding and production use are subject to official partner process and permitted scope.

### National Academic Depository

- https://nad.digilocker.gov.in/
- Use for: academic awards and institutional record ecosystem; distinguish award verification from admission verification.

## 4. Indian data protection and privacy

### Digital Personal Data Protection Act, 2023

- MeitY data protection page: https://www.meity.gov.in/data-protection-framework
- India Code: https://www.indiacode.nic.in/

### DPDP Rules, 2025 and commencement notification

- MeitY/Gazette notification (13 November 2025): https://www.meity.gov.in/static/uploads/2025/11/c56ceae6c383460ca69577428d36828b.pdf
- Use for: phased commencement schedule.
- Schedule from notification: specified initial provisions commence on publication; Section 6(9), Section 27(1)(d) and Rule 4 are scheduled one year from publication (13 November 2026); Sections 3–5, most substantive processing provisions and most operational rules are scheduled eighteen months from publication (13 May 2027).
- Caution: verify any subsequent amendment, judicial development, notification and precise applicability with counsel before launch.

## 5. Cybersecurity and technical assurance

### CERT-In directions under Section 70B (28 April 2022)

- Official directions landing page: https://www.cert-in.org.in/Directions70B.jsp
- PDF: https://cert-in.org.in/PDF/CERT-In_Directions_70B_28.04.2022.pdf
- Use for: applicable incident reporting, ICT log retention and operational requirements.
- Caution: confirm the directions' applicability to the actual data centre, service provider, body corporate and government operator; do not rely on a secondary summary.

### OWASP

- ASVS: https://owasp.org/www-project-application-security-verification-standard/
- API Security Top 10: https://owasp.org/API-Security/editions/2023/en/0x00-header/
- Use for: application/API security requirements and testing baseline.

### NIST Zero Trust

- SP 800-207: https://csrc.nist.gov/pubs/sp/800/207/final
- Use for: zero-trust architecture concepts; it is a design reference, not an Indian statutory requirement.

### WCAG

- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Use for: proposed accessibility target.

## 6. University and admission-process sources

### UGC

- Official guideline page: https://www.ugc.gov.in/Guideline
- Use for: simultaneous academic programmes and other applicable higher-education guidelines.
- Caution: retrieve the exact applicable guideline/notification and confirm interaction with relevant statutory/professional-council rules before implementing concurrency logic.

### AISHE

- https://aishe.gov.in/
- Use for: higher education institutional statistics and aggregate reporting context. AISHE is not a substitute for student-level admission records.

### Chhattisgarh DTE / counselling

- https://cgdte.admissions.nic.in/
- Use for: state-specific counselling rounds, seat matrices and vacancy/lateral-entry workflow examples.
- Caution: public seat-matrix examples are state/round/year specific, not universal national rules.

### CSVTU

- https://csvtu.ac.in/
- Use for: university enrolment/examination process research and public documentation.

### NIC e-Counselling

- https://www.nic.gov.in/project/e-counselling-examination-services/
- Use for: national/state counselling technology context.

## 7. Research log template

For every source used to configure the product, record:

| Field | Required content |
|---|---|
| Source ID | Unique internal reference |
| Issuing authority | AICTE / UGC / MeitY / APAAR / CERT-In / state body |
| Document title | Exact published title |
| Publication date | When published |
| Effective date | When the rule applies |
| Academic year | Applicable year(s) |
| Section/clause/page | Precise citation location |
| Rule summary | Plain-language interpretation |
| Scope | Institution type, programme, category and geography |
| Supersedes | Earlier source/version if applicable |
| Reviewer | Named policy reviewer/role |
| Status | Research / reviewed / approved / retired |

## 8. Source-use disclaimer

These references establish research starting points and help explain the proposed architecture. They do not replace legal interpretation, AICTE policy approval, institutional agreements, or official integration credentials. The project must not claim that an external API is live, an institution has supplied verified data, or a rule is legally operative unless the relevant authority/source has been checked and the evidence recorded.
