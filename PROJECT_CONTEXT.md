# APAAR-SHIELD — Project Context Pack

Use this file as the compact context handoff when opening a new AI coding/research conversation. For full requirements, read the linked project documents.

## Project identity

- **Name:** APAAR-SHIELD
- **Problem:** SIH26263 — Development of an APAAR ID-Based Student Data Management and Verification Platform for AICTE-Approved Institutions.
- **Sponsor:** AICTE, Regulation Bureau.
- **Theme:** Smart Automation.
- **Documentation baseline:** 30 October 2026.
- **Team:** 6 members.
- **Proposed product:** A student-level regulatory data, admission lifecycle, identity association and reconciliation platform.

## Problem to solve

AICTE needs a secure, scalable, interoperable way for AICTE-approved institutions to submit and maintain student-level admission data linked to APAAR, validate data, monitor admissions against the correct approvals and category rules, identify duplicates/inconsistencies, provide authorised verification, support reports and enable APAAR/student-ID display in certificates issued by competent degree-awarding bodies.

## Selected architecture

**Hybrid:**

1. Central regulatory student/admission registry (Plan 1).
2. Event-driven admission lifecycle and reconciliation (Plan 3).
3. Privacy-preserving identity and limited-disclosure controls from federated architecture (Plan 2).

Start as a **domain-oriented modular monolith** with asynchronous workers, not a microservices estate.

## Core product components

- Institution/campus/programme registry.
- AICTE approval and academic-year snapshot registry.
- Student internal identity and protected APAAR reference service.
- Admission registry separated from student identity.
- CSV/API ingestion, staging and row-level validation.
- Replaceable APAAR/ABC identity provider adapter.
- Versioned regulatory policy engine.
- Admission lifecycle events and transactional outbox.
- Exact duplicate and potential cross-institution conflict detection.
- Reconciliation case/reviewer workflow.
- Institution dashboard and AICTE command centre.
- Purpose-limited verifier and synthetic signed credential/QR demo.
- Audit, observability and reports.

## Domain invariants

- A student and an admission are different entities.
- APAAR format validity is not official identity verification.
- `MOCK_VERIFIED` is never presented as `OFFICIAL_VERIFIED`.
- A college-submitted assertion is not automatically a source-authoritative fact.
- Approved Intake is programme/campus/academic-year specific.
- New cohort admissions are not the same measure as active population across all programme years.
- NRI and FN/OCI/Gulf are distinct categories; category, nationality and OCI status are separate fields.
- Supernumerary provisions have their own eligibility, approvals and counting bases; do not use a universal `intake * 1.15` formula.
- Lateral entry is a separate admission type/cohort; never hard-code a universal quota.
- A repeated APAAR can create a candidate conflict, not an automatic fraud decision. Consider permitted simultaneous programmes and programme-specific rules.
- Withdrawals, cancellations, transfers and corrections are append-only events; preserve historical source data.
- Policy and approval changes create versions; historic evaluations must remain reproducible.
- ML may prioritise exceptions, never independently impose adverse regulatory findings.
- No raw APAAR in URLs, ordinary logs, analytics, Git or public API responses.
- Verifiers receive minimum necessary information for a specific authorised purpose.

## Source and regulatory cautions

- AICTE Approval Process Handbook 2024–2027 is the baseline source located for AY 2024–25 through 2026–27. Later AICTE notices, the exact institutional EoA, programme conditions and statutory-council requirements must be checked before production rules are activated.
- APH 2024–27 describes NRI seats within Approved Intake and a separate conditional FN/OCI/children of Indian workers in Gulf countries supernumerary provision; other categories have distinct conditions. Store source clause, year, eligibility and permission per rule.
- Public APAAR FAQ prominently describes school UDISE+/PEN generation workflow; do not treat it as the complete higher-education operating procedure or proof of unrestricted higher-ed API access.
- API Setu lists ABC/APAAR-related APIs, but catalogue listing is not credentials or production access. Partner onboarding/approval is required.
- DPDP commencement is phased in the 13 November 2025 Gazette notification: specific provisions from publication, specified Section 6(9)/Section 27(1)(d)/Rule 4 after one year (13 November 2026), and main processing provisions/most rules after eighteen months (13 May 2027). Re-check for later amendments and legal applicability.
- CERT-In directions dated 28 April 2022 include specified incident reporting and 180-day rolling log requirements for covered entities. Confirm operator applicability.
- See `SOURCES.md` for primary source URLs and verification notes.

## Technology baseline

- Frontend: React + TypeScript + Vite.
- Backend: NestJS + TypeScript modular monolith.
- Database: PostgreSQL; Prisma or TypeORM (choose one only).
- Jobs/events: Redis + BullMQ and PostgreSQL transactional outbox for MVP/pilot.
- IAM: Keycloak or approved OIDC provider.
- Files: private quarantine/object storage.
- Analytics: SQL aggregates plus Python/Pandas worker; ML only after labelled-data governance.
- API: REST/JSON, OpenAPI 3.1.
- Testing: Jest, Supertest, Playwright, k6/Locust.
- Observability: OpenTelemetry, Prometheus/Grafana; production SIEM.
- Local deployment: Docker Compose.
- Production: hosting approved by system owner, managed HA database, KMS/HSM, backups, DR and independent security review.

Do not add Kafka/Kubernetes/microservices just for appearance. Add when there is an evidence-based scaling or isolation requirement.

## Mock vs production integration

**Mock in hackathon:** APAAR provider, DigiLocker/NAD, university enrolment, counselling API and any unavailable AICTE data feed. Use synthetic approval snapshots and clearly labelled demo fixtures.

**Potential production sources:** APAAR/ABC, DigiLocker/NAD, AICTE approval source, state counselling authority, institution ERP/SIS and affiliating university. Each requires documented interface, data owner, legal basis, partner/onboarding approval, credentials, sandbox tests and production certification as applicable.

## First end-to-end vertical slice

`Institution OIDC login → upload synthetic batch → quarantine/staging → schema validation → mock APAAR status → approval and versioned seat-rule checks → duplicate/reconciliation case → human review → AICTE dashboard → limited synthetic verification → audit history`.

## Six-member ownership

1. Product/regulatory architect — source-backed rules, workflows and acceptance criteria.
2. Backend/database engineer — NestJS domain services, schema, migrations and APIs.
3. Data/integration engineer — ingestion, identity adapter, HMAC matching, workers and reconciliation.
4. Institution frontend engineer — portal, upload, row errors and corrections.
5. AICTE dashboard/analytics engineer — national dashboard, alerts, review and verifier UI.
6. Security/QA/DevOps engineer — OIDC, tenant tests, audit, CI, Docker, observability and demo operations.

## Critical documents

- `README.md`: entry point and document map.
- `plan.md`: scope, phases, team allocation, milestones and acceptance criteria.
- `agent.md`: coding-agent rules and non-negotiable domain invariants.
- `ARCHITECTURE.md`: architecture and trust boundaries.
- `DOMAIN_AND_REGULATORY.md`: India domain, rules, field research and caveats.
- `DATA_MODEL.md`: schema and ER design.
- `API_SPEC.md`: proposed APIs and event contracts.
- `SECURITY_PRIVACY.md`: threat model and privacy controls.
- `INTEGRATIONS.md`: mock/official integration separation.
- `TESTING_AND_DEMO.md`: synthetic data, scenarios and judge demo.
- `TEAM_AND_ROADMAP.md`: six-member work split and rollout.
- `DECISIONS.md`: architecture decisions and pending approvals.
- `SOURCES.md`: authoritative references.

## Instructions to any coding agent

Read `agent.md` before editing. Then read the relevant domain/API/data/security document. State assumptions, use synthetic data, update tests and documentation, and never claim an official integration or compliance status that has not been independently confirmed.
