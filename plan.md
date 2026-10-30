# PLAN — APAAR-SHIELD Product & Implementation Plan

**Version:** 1.0  
**Baseline date:** 30 October 2026  
**SIH:** 26263  
**Team:** 6 members  
**Architecture:** Central regulatory registry + event-driven lifecycle/reconciliation + privacy-preserving identity controls

## 1. Executive objective

Deliver a secure, explainable and interoperable platform for AICTE-approved institutions to submit student-level admission records associated with APAAR, validate those records against applicable approvals and seat rules, reconcile updates from institutional/university/counselling sources, identify duplicates and potential conflicts, and provide authorised dashboards and verification.

The product must distinguish:

- syntactically valid APAAR from official provider-verified identity;
- an institution's submitted claim from a source-authoritative fact;
- approved intake from supernumerary provisions;
- first-year cohort admissions from total active students across all cohorts;
- duplicate submissions from potentially legitimate concurrent academic programmes;
- anomaly signals from proven fraud or a final regulatory determination.

## 2. User groups and jobs to be done

| User | Main job | Product capability |
|---|---|---|
| Institution administrator | Manage institution users and certify submissions | Institution tenancy, role management, batch certification |
| Admission operator | Submit and correct admission records | Upload, validation, correction and lifecycle updates |
| AICTE regulatory officer | Monitor institution/course/year compliance | Approval snapshots, seat evaluation, alerts and reports |
| Policy administrator | Publish reviewed rule versions | Rule authoring, source clause, approval and release controls |
| University officer | Reconcile university enrolment | Limited source upload/API, mismatch review |
| Student | View own information and request correction / optional disclosure | Authenticated own-record interface and request tracking |
| Authorised verifier | Verify a specifically permitted claim | Purpose-limited disclosure and verifiable response |
| Platform operator/security team | Operate and secure the service | Monitoring, incident response, audit and recovery |

## 3. Scope and priorities

### P0 — Minimum complete product

1. OIDC login and server-side role/tenant enforcement.
2. Institution, campus, programme and academic-year approval registry.
3. Student internal identity and protected APAAR reference handling.
4. Admission instance management with source identifiers and status.
5. CSV batch upload, quarantine, schema validation, staging, idempotency and row-level results.
6. Mock APAAR provider behind a replaceable adapter; explicit `MOCK_VERIFIED` status.
7. Versioned policy engine for approved intake and configured category rules.
8. Exact duplicate detection and potential cross-institution conflict detection.
9. Admission events for confirmation, withdrawal, cancellation, transfer and correction.
10. Human-review case workflow and append-only audit events.
11. Institution dashboard and AICTE dashboard.
12. Test suite and repeatable local deployment.

### P1 — Demonstration differentiators

- University/counselling sample-data reconciliation.
- Signed, synthetic verification response / QR reference.
- Downloadable validation report.
- Analytics for pending verification, category use and correction patterns.
- Event outbox and background worker.
- Full API documentation and seed dataset.

### P2 — Production-dependent capabilities

- Official APAAR/ABC verification integration.
- Official AICTE approval data integration.
- Production DigiLocker/NAD issuer/requester integration.
- Live university and counselling system connectors.
- Enterprise IAM, KMS/HSM and government-approved hosting integration.
- Independent penetration test, privacy/legal assessment and operational certification.
- Advanced ML anomaly scoring, only after labelled data and governance approval.

## 4. Functional requirements and acceptance criteria

| ID | Requirement | Acceptance evidence |
|---|---|---|
| FR-01 | Institution can submit individual and bulk student-level admission data | API and UI tests show successful upload and batch status |
| FR-02 | APAAR is used as an academic identity reference | Protected reference is associated with internal student UUID; no raw value in logs |
| FR-03 | Required fields are supported | Data dictionary and schema tests cover approved intake, actual admissions, NRI, OCI, FN and related fields |
| FR-04 | Automated validation | Missing, malformed, mismatched and duplicate records produce specific outcomes |
| FR-05 | Intake and category checks | Rule engine evaluates correct programme/academic-year approval and records calculation evidence |
| FR-06 | Cross-institution conflict monitoring | Matching identity references generate contextual review cases, not automatic guilt decisions |
| FR-07 | Dashboards | Institution-scoped view and AICTE-wide authorised view are tested |
| FR-08 | Authorised verification | Verifier receives only approved fields for a defined purpose and time window |
| FR-09 | Auditability | Admission changes, user actions, policy evaluations and case decisions are traceable |
| FR-10 | System interoperability | CSV and proposed REST adapters share canonical schemas; external integrations are clearly labelled mock or authorised |
| FR-11 | Certificate display support | Template/QR demonstration uses synthetic record and does not claim to issue a degree |
| FR-12 | Security and privacy | Tenant isolation, least privilege, encryption, masking and incident/audit controls have tests |

## 5. Core business workflow

### Institution submission

1. Institution user authenticates through OIDC.
2. Backend resolves institution memberships and permissions from trusted server-side claims/database mappings.
3. User selects academic year, campus and approved programme.
4. File is uploaded to a private quarantine location.
5. File type, size, malware and schema checks run.
6. Rows are parsed into staging tables with source provenance.
7. Institution/programme/approval references are resolved.
8. APAAR format validation and provider verification are requested separately.
9. Duplicate and rule checks run.
10. Institution reviews row errors and warnings.
11. An authorised institution representative certifies the batch.
12. Valid records are committed transactionally with outbox events.
13. Workers reconcile the resulting events and update projections/dashboard counts.

### Human review

1. An alert includes a rule ID, evidence references, source records, policy version and explanation.
2. An authorised reviewer opens the case.
3. Reviewer may request correction, accept an explanation, mark a false positive, confirm a data issue or escalate.
4. Decision requires a reason and evidence reference where appropriate.
5. The decision and changed state are audited; original source submission is preserved.

## 6. Regulatory calculation model

Do not calculate one universal `approved_intake * 1.15` limit.

For each programme approval and academic year, the evaluator must:

1. Load the exact approval snapshot and its status/validity.
2. Load the policy release applicable to the year, programme, institution type and admission category.
3. Determine the policy counting basis: within Approved Intake, supernumerary over and above, separate entry cohort, or other specific basis.
4. Apply eligibility and approval conditions.
5. Apply subcategory allocations and configured rounding rules only where the authoritative policy specifies them.
6. Count confirmed admissions using the relevant reporting cut-off and lifecycle statuses.
7. Produce a reproducible result containing rule ID, policy version, approval ID, inputs, formula, source clause, output and review requirement.

Important starting points from AICTE APH 2024–27: NRI provision is described within Approved Intake; the handbook also describes a separate conditional supernumerary provision for FN/OCI/children of Indian workers in Gulf countries. Other listed special provisions (including TFW, lateral entry, PwBD, Kashmiri Migrants, PM-USPY and working professionals) must be modelled according to their own applicable conditions. Do not generalise category limits across all programmes or years. See `DOMAIN_AND_REGULATORY.md` and `SOURCES.md`.

## 7. Delivery phases

### Phase 0 — Requirements and architecture (first 1–2 weeks)

- Confirm AICTE requirements and exact policy clauses with source references.
- Map authoritative source ownership.
- Define data dictionary and canonical contracts.
- Approve threat model and privacy data-flow map.
- Define batch lifecycle, admission status transitions and alert taxonomy.
- Freeze API contracts and database model.

**Exit gate:** architecture review, field definitions, source matrix and acceptance criteria approved by product/regulatory owner.

### Phase 1 — Core platform MVP (indicative weeks 3–8)

- IAM and institution tenancy.
- Institution/programme/approval registry.
- Student and admission domain.
- Bulk ingestion/staging/reports.
- Mock identity adapter.
- Versioned policy engine.
- Duplicate matching and admission event history.
- Alerts/review console and dashboards.

**Exit gate:** one end-to-end workflow passes automated tests and can be demonstrated from a clean deployment.

### Phase 2 — Pilot integration (indicative weeks 9–14)

- Pilot with a varied group of institutions and an affiliating university.
- Validate actual ERP exports and counselling datasets.
- Test official integrations only after authorisation.
- Establish baseline data-quality metrics and operational support processes.
- Refine categories, edge cases and false-positive rates.

**Exit gate:** pilot report, unresolved risks and signed-off data/process mappings.

### Phase 3 — Production hardening (indicative weeks 15–22)

- HA database, backup and disaster recovery.
- KMS/HSM key operations and identity-vault isolation.
- Security testing against selected OWASP ASVS controls.
- API penetration testing and independent audit.
- Load/performance and resilience testing.
- Incident response, logging, monitoring and support runbooks.
- Privacy/legal review and production governance.

**Exit gate:** production-readiness review and owner acceptance.

### Phase 4 — Scale and optimisation

- More institution connectors.
- More university and counselling integrations.
- Analytics warehouse and aggregate policy reporting.
- ML anomaly prioritisation where evidence supports it.
- Broader state-wise onboarding and operational capacity planning.

## 8. Six-person team ownership

| Member | Role | Owns | Key outputs |
|---|---|---|---|
| 1 | Product/regulatory architect | Requirements, AICTE rules, admission process, policy sources | PRD, rule matrix, acceptance criteria, test fixtures |
| 2 | Backend/database engineer | NestJS domain modules, schema, migrations, APIs | Core API, data model, OpenAPI |
| 3 | Data/integration engineer | Ingestion, APAAR adapter, duplicate resolution, events/workers | Adapters, ingestion pipeline, reconciliation |
| 4 | Institution frontend engineer | Institution portal and upload/correction journey | Institution UI |
| 5 | AICTE frontend/analytics engineer | Command centre, alerts, reports and verifier UI | AICTE dashboard and case UI |
| 6 | Security/QA/DevOps engineer | OIDC, tenant tests, audit, CI, Docker, observability | Security baseline, CI/CD, test automation and deployment |

All members must review the domain invariants in `AGENT.md`. Regulatory logic is owned by Member 1 but code changes require tests and peer review.

## 9. SIH sprint schedule (30 October–2 November 2026)

This is a compressed prototype plan, not a production delivery plan.

| Date | Work | Exit condition |
|---|---|---|
| 30 Oct | Repo, architecture, schema, API contracts, rule fixtures, wireframes | Six workstreams can develop against shared contracts |
| 31 Oct | Core backend, upload/staging, UI skeleton, mock provider, IAM | Upload reaches backend and produces row-level result |
| 1 Nov AM | Rule engine, identity matching, admission events, dashboards | Validated records and alerts appear in UI |
| 1 Nov PM | Cross-institution cases, human review, audit, access tests | Complete vertical slice works end-to-end |
| 1 Nov night | Regression, clean Docker deployment, demo seed reset | Demo repeatable from documented commands |
| 2 Nov | Final presentation and submission checks | No unlabelled mocks; docs and demo match actual build |

**Integration must happen continuously. Do not wait until 2 November.**

## 10. Proposed non-functional targets

These are initial engineering targets to validate, not achieved metrics or official AICTE service commitments.

| Quality | Initial target |
|---|---|
| Core API availability | 99.9% monthly design target |
| Standard API latency | P95 < 1.5 seconds under agreed workload |
| Batch submission | Fast acknowledgement; async processing for large files |
| Idempotency | Retry cannot create duplicate committed admission |
| Recovery point objective | 15 minutes or better, subject to cost/architecture review |
| Recovery time objective | 4 hours or better, subject to DR test |
| Identity exposure | No raw APAAR in URLs, ordinary logs or analytics exports |
| Audit | All privileged and critical business actions logged |
| Accessibility | WCAG 2.2 AA target |
| API compatibility | Versioned contracts and controlled deprecation |

## 11. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| No APAAR production credentials | Official identity verification unavailable | Mock adapter for prototype; formal partner onboarding for production |
| AICTE approval feed not available | Stale/seeded approval data | Source-backed imports, validity metadata and officer review |
| Policy interpretation errors | Incorrect compliance alerts | Versioned rules, clause references, independent regulatory review and regression cases |
| Institution data quality | False duplicates and reconciliation backlog | Staging, normalisation, row-level error feedback and human resolution |
| Privacy exposure | High-impact personal-data incident | Identity vault, minimisation, encryption, RBAC/ABAC and audit |
| ERP diversity | Integration cost and delays | Canonical schema and replaceable adapters |
| False positive conflict detection | Unfair student/institution outcome | Context-aware matching, UGC/professional rules and human review |
| Team integration delay | Demo failure | Freeze contracts early, integrate daily, automated CI and seed reset |

## 12. Definition of done

A feature is not complete merely because a page is visible. It is done only when:

- its API contract and owner are documented;
- positive, negative and boundary tests exist;
- permissions are validated server-side;
- relevant audit/provenance records are written;
- timeout/retry/error behaviour is defined;
- mock and production provider states are distinct;
- user-facing status is understandable;
- no unsupported regulatory assumption is hidden in code.
