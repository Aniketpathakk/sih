# Domain & Regulatory Context — India

**Purpose:** Give the product, policy and engineering team a shared understanding of the Indian higher-education ecosystem and the regulatory decisions the platform must not guess.

**Research baseline:** 30 October 2026. Always re-check the official source and any later amendment before converting a rule into production configuration.

## 1. Problem framing

AICTE's problem statement describes uneven student-level data availability across institution types and seeks an APAAR-linked mechanism for institutional uploads, validation, monitoring, authorised verification, reporting and certificate display support.

The platform should address five distinct questions:

1. **Institution validity:** Is this institution/campus approved for the relevant period?
2. **Programme validity:** Is this programme/course approved at this campus for the relevant academic year?
3. **Academic identity:** Has the submitted academic identity reference been associated with the student through an authorised process?
4. **Admission validity:** What admission event occurred, under which route and category, and what source supports it?
5. **Capacity and consistency:** Does the admission count comply with the correct policy version and approval conditions, and do other source records reconcile?

A successful APAAR match does not itself prove that the institution or course is approved, that the student's admission is valid, or that a seat is within an authorised limit.

## 2. Indian higher-education ecosystem

| Actor/system | Principal role | APAAR-SHIELD integration role |
|---|---|---|
| AICTE | Approval/regulatory functions for technical institutions/programmes in its remit | Approval snapshot, policy rules, monitoring and regulatory case workflow |
| Institution | Conducts admissions and maintains student records | Primary source for actual admission and status submission |
| State/national counselling body | Publishes seat matrices, allotments and counselling-round results where applicable | Reconciliation source, subject to interface/data agreement |
| Affiliating university | University enrolment, examinations, progression and academic records | Reconciliation source for university registration/status |
| APAAR/ABC | Academic identity and credit ecosystem | Identity association/verification through authorised interface |
| DigiLocker | Digital document access and issuer/requester ecosystem | Authorised document/credential integration where applicable |
| NAD | Digital academic awards/records ecosystem | Award/credential source integration where applicable |
| UGC | Higher-education regulatory framework and academic guidelines within its remit | Context for concurrent programmes and other applicable policy |
| AISHE | Higher-education statistics and institutional reporting | Aggregate reporting interoperability; not a substitute for student-level admission truth |
| NIC/state IT bodies | Government IT and counselling platforms | Potential integration/platform partners |

Do not assume one national source contains every admission event. Admission routes differ across states, programmes, institutions and rounds.

## 3. Identity concepts

### APAAR

APAAR (Automated Permanent Academic Account Registry) is presented by the official portal as a unique 12-digit academic identity intended to support academic records and mobility and is linked with ABC and DigiLocker-related functionality.

**Important caution:** the public APAAR FAQ currently describes a school-oriented generation process involving UDISE+, PEN, demographic matching and parental consent for minors. That page must not be treated as the complete higher-education operating procedure or proof of an unrestricted college-side verification API. Higher-education collection, association and verification procedures must be confirmed from the relevant official higher-education/API documentation and authorised partner onboarding.

### ABC

Academic Bank of Credits concerns academic credit accumulation, transfer and redemption. It is related to APAAR but is not identical to AICTE approval, admission status or the institution's ERP.

### DigiLocker and NAD

DigiLocker supports digital documents and issuer/requester integrations. NAD concerns academic awards/records deposited by eligible institutions. The system should complement these services and distinguish:

- identity association;
- admission/enrolment verification;
- academic credit access;
- degree/award verification.

Do not say that a valid APAAR ID by itself is proof of a degree, a current admission or a regulatory-compliant seat.

## 4. Admission process domain

### Common lifecycle

`Application → Selection / Counselling / Admission Route → Seat Allotment (where relevant) → Reporting → Document Checks → Fee / Admission Completion → Institution Admission Record → University Enrolment → Academic Progression`

Possible subsequent events:

- withdrawal;
- cancellation;
- transfer;
- change of branch/programme;
- lateral entry;
- readmission/restoration where allowed;
- correction to demographic or category information;
- university enrolment mismatch;
- examination registration and academic progression.

### Admission routes to represent

- state counselling;
- national counselling where applicable;
- institute-level admission;
- management-category admission where legally permitted;
- spot/vacancy round;
- lateral entry;
- NRI category;
- FN/OCI or other eligible international route;
- transfer/other approved pathway.

Not every route applies to every programme or institution. Store route, source reference and evidence separately from seat category.

### Identifiers in the Indian education journey

One student may have multiple references:

- APAAR ID;
- institution admission number;
- college roll number;
- state counselling registration number;
- state DTE registration/merit reference;
- university enrolment number;
- examination roll number;
- DigiLocker/ABC-related references.

These identifiers are not interchangeable. Use an internal immutable UUID and a typed `student_identifiers` table with source, validity and verification status.

## 5. AICTE approval and intake concepts

The AICTE Approval Process Handbook 2024–2027 is the starting source for the academic years it covers. It describes Extension of Approval and changes such as increase in intake, additional courses, continuation/introduction of NRI seats and specified supernumerary provisions. It defines supernumerary seats as intake over and above Approved Intake and lists categories including TFW, OCI/FN/children of Indian workers in Gulf countries, lateral entry, PwBD, Kashmiri Migrants, PM-USPY and working professionals.

### Core definitions for the platform

- **Institution:** AICTE-regulated entity/technical institution as recognised in the source approval data.
- **Campus:** specific approved location/campus; multi-campus handling must follow source approval structure.
- **Programme/course:** specific approved course/branch/level at a campus.
- **Academic year:** the cohort/approval period to which intake and admission records relate.
- **Approved Intake:** the approved intake for the relevant programme and year, using the definition in the applicable handbook.
- **Within-intake category:** a category counted within Approved Intake where the applicable rule says so.
- **Supernumerary category:** a distinct permission over and above Approved Intake, subject to relevant conditions/approval.
- **Actual enrolment/admissions:** distinguish newly admitted cohort counts from current active population across multiple programme years.

### Starting rule matrix — must be reviewed before production use

| Category/provision | Baseline interpretation to model | Engineering requirement |
|---|---|---|
| Ordinary seats | Count within Approved Intake | Count by programme, campus and academic year, with source-defined status/cut-off |
| NRI | APH 2024–27 describes up to 5% within Approved Intake, subject to conditions | Separate category and within-intake counting basis; verify applicable programme/institution conditions and later notices |
| FN/OCI/children of Indian workers in Gulf countries | APH 2024–27 describes a separate supernumerary provision up to 15% above Approved Intake, subject to conditions; specified one-third sub-allocation for children of Indian workers in Gulf countries | Separate permission, eligibility evidence, subcategory allocation and effective-year rule |
| TFW | A distinct supernumerary provision with separate conditions | Do not infer availability/limit from the generic supernumerary definition; configure from applicable rule/approval |
| Lateral entry | Distinct entry route/cohort and relevant special provision | Separate cohort; no universal percentage hard-coded |
| PwBD, Kashmiri Migrants, PM-USPY, working professionals | Distinct provisions identified by APH; conditions differ | Model each individually, with rule source and institution/programme applicability |
| OCI vs FN | Status/category distinctions must be preserved | Do not combine nationality, OCI possession and admission category into one boolean |

This table is a product-design starting point, not an operational legal determination. Do not enable a production rule without reading the full applicable clause, subsequent AICTE notices, institution EoA/approval conditions and any relevant statutory-council/state directions.

### Capacity calculations

Never use `total_active_students <= approved_intake`. Approved Intake generally relates to an admission cohort/programme/year, not every active student in a multi-year course.

Maintain separate measures:

1. approved intake for each approved programme/campus/academic year;
2. confirmed admissions within intake for that admission cohort;
3. category-specific counts within intake;
4. category-specific supernumerary counts and permissions;
5. lateral-entry cohort and any separate applicable provision;
6. current active programme population across all cohorts;
7. withdrawals/cancellations as lifecycle facts, with reporting cut-off semantics;
8. counselling allotments/vacancies vs actual institutional admissions.

A later withdrawal should not erase the historical fact that an admission occurred. Regulatory reports need explicit definitions for admission count, active count, cut-off date and cancellation treatment.

## 6. Concurrent academic programmes and duplicate handling

The UGC's simultaneous-programme guidelines allow specified combinations of academic programmes, subject to conditions. A repeated APAAR reference is therefore not automatically a prohibited duplicate.

Recommended classification:

- `EXACT_DUPLICATE_SUBMISSION`: same source admission/source event has been resubmitted;
- `POSSIBLE_CONCURRENT_ENROLMENT`: one academic identity is linked to overlapping programme periods requiring contextual review;
- `HISTORICAL_PROGRESSION_OR_TRANSFER`: records appear consistent with prior study, progression or transfer;
- `UNRESOLVED_IDENTITY_MATCH`: provider/source evidence is insufficient.

The reviewer must consider programme mode, academic dates, timetable conditions where relevant, applicable UGC/professional-council rules, withdrawal dates and institution evidence. Never let a similarity score alone make a legal conclusion.

## 7. Indian ground-level research checklist

Interview and map the actual workflows of:

- college principal/director or registrar;
- admission office;
- ERP/SIS administrator;
- examination cell;
- affiliating university enrolment office;
- DTE/counselling body representative or public process;
- students using APAAR/ABC/DigiLocker.

Ask:

1. When and by whom is APAAR collected/associated?
2. What is the institution's authoritative admission register?
3. Which admission routes and rounds are used?
4. How is Approved Intake obtained and updated after EoA changes?
5. How are NRI/FN/OCI/TFW/lateral-entry and other categories recorded?
6. What system exports the university enrolment number?
7. How are withdrawals and cancellations sent to the university?
8. What are the top five upload errors?
9. Who certifies a student-data submission?
10. What system interfaces or files can be shared lawfully?

Request only blank forms, public seat matrices, synthetic examples or anonymised templates. Do not request real APAAR IDs, Aadhaar numbers, passports, phone numbers or unredacted student lists for a hackathon.

## 8. Madhya Pradesh and Chhattisgarh research approach

For the initial field study, investigate one institution in Madhya Pradesh and one in Chhattisgarh, plus the relevant state admission/counselling documentation and an affiliating university process. Chhattisgarh DTE public material can provide examples of round-specific and lateral-entry seat matrices. These examples demonstrate data variability; they do not establish a universal admission model for all states.

For each state, record:

- authority and official portal;
- counselling rounds and dates;
- seat-matrix format and version;
- course/branch nomenclature;
- institution code/PID mapping;
- allotment reference format;
- spot/vacancy round behaviour;
- lateral-entry process;
- withdrawal/cancellation process;
- university enrolment fields and timing.

Do not hard-code a state-specific process into the national core. Implement a state/admission-route adapter.

## 9. Legal and standards context

### DPDP Act and Rules

The 13 November 2025 commencement notification uses a phased schedule:

- the notification date itself commenced specified definitions, institutional and other listed provisions;
- one year after publication (13 November 2026) is scheduled for the specified provisions of Section 6(9), Section 27(1)(d) and DPDP Rule 4;
- eighteen months after publication (13 May 2027) is scheduled for Sections 3–5, the main provisions of Sections 6–17 and other listed provisions, plus most operational rules.

As at 30 October 2026, the platform is just before the one-year milestone. Verify the exact statutory transition, applicable amendments, rules and legal role allocation with counsel. Design now for the complete regime: notice, purpose, minimisation, lawful processing basis, rights/correction, retention/deletion, processor contracts, security safeguards and breach handling.

### CERT-In

The CERT-In directions dated 28 April 2022 include a six-hour reporting requirement for specified cyber incidents and rolling 180-day retention of ICT logs within Indian jurisdiction for covered entities. Confirm applicability to the actual system owner/operators and implement a compliant incident runbook.

### Accessibility and security engineering

Use WCAG 2.2 AA as a design target. Use OWASP ASVS 5.0 as a proposed application assurance baseline, OWASP API Security Top 10:2023 for API threat review, and NIST SP 800-207 as a reference for zero-trust access design. These are engineering baselines, not a claim that AICTE has formally mandated each one for this SIH proposal.

## 10. Unresolved policy questions — do not guess

- Which exact higher-education APAAR verification/association APIs are available to the AICTE platform and under what authorisation?
- Which student-level fields are mandatory for each institution/programme category and reporting event?
- What is the official definition/cut-off for actual enrolment in each AICTE reporting workflow?
- Which later AICTE notices modify APH 2024–27 provisions for the relevant academic year?
- How should course changes, branch migration, transfers, readmission and withdrawal dates affect each report?
- Which professional/statutory council rules interact with AICTE seat provisions for particular programmes?
- What legal basis and roles apply to each data flow among AICTE, institution, university, APAAR/ABC and verifier?
- What certificate format and identifier-display requirements are formally prescribed by the awarding body?

Record answers as policy decisions with sources, not assumptions in code.
