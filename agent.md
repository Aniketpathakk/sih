# AGENT.md — Instructions for AI Coding Agents and Contributors

This file defines mandatory project context and engineering constraints for any AI coding agent, developer or reviewer modifying APAAR-SHIELD.

## 1. Project purpose

APAAR-SHIELD is a proposed AICTE student-enrolment integrity and regulatory monitoring platform for SIH26263. It receives student-level admission records from AICTE-approved institutions, associates records with a protected APAAR academic identity reference, checks them against authoritative institution/programme/academic-year approvals and versioned rules, reconciles changes and source-system data, detects duplicates and possible conflicts, and exposes audited dashboards and purpose-limited verification.

It is **not**:

- an APAAR ID generation or issuance service;
- an official AICTE approval system;
- a college ERP replacement;
- a university enrolment authority;
- a degree-awarding body;
- a public API for arbitrary APAAR lookup;
- an automated fraud adjudication system.

## 2. Mandatory domain invariants

Never violate these invariants:

1. **Student != admission.** One internal student identity may relate to multiple admission/programme records over time. Do not enforce a universal one-admission-per-student-per-year constraint.
2. **APAAR format != official verification.** A 12-digit format check only establishes syntax. Only an authorised provider response can produce an official verified status.
3. **Mock != official.** Mock provider results must use `MOCK_*` statuses and `production_verified: false`. Never render mock data with an “officially verified” label.
4. **Institution claim != source-authoritative fact.** Preserve who supplied each value and its source. Do not overwrite source provenance.
5. **Approved Intake is programme/campus/academic-year specific.** Do not compare all active students in a multi-year programme against one year's first-year intake.
6. **No universal seat formula.** Never implement `approved_intake * 1.15` or a fixed percentage as a universal permitted intake. Use a reviewed, versioned policy rule and approval-specific permissions.
7. **NRI and FN/OCI/Gulf are not interchangeable.** Store admission category, nationality, OCI status and eligibility evidence separately.
8. **Supernumerary categories are not one generic bucket.** Keep category-specific permissions, limits, conditions and source clauses.
9. **Lateral entry is its own admission cohort/type.** Do not apply a universal lateral-entry percentage without programme-specific authoritative configuration.
10. **Duplicate != fraud.** Exact duplicate submissions can be rejected/idempotently ignored. Potential concurrent enrolment must become a review case, not an automatic fraud determination.
11. **Admission lifecycle is evented.** Confirmation, withdrawal, cancellation, transfer and correction must create immutable history and must not erase source events.
12. **Historical rules remain reproducible.** Policy and approval updates create new versions. Never mutate old calculation inputs silently.
13. **Human review for contested regulatory outcomes.** ML/anomaly scores may prioritise a case but may not make final adverse findings.
14. **Privacy by default.** Do not use raw APAAR in URLs, ordinary logs, analytics, test fixtures or screenshots. Never request Aadhaar, OTP, credentials or biometrics for a prototype.
15. **Purpose-limited disclosure.** Verifiers receive only authorised fields for a defined purpose and expiry; never expose a full student record by default.

## 3. Source and policy discipline

- Prefer current primary sources from AICTE, APAAR/Ministry of Education, UGC, MeitY/Gazette, CERT-In, API Setu, DigiLocker/NAD and the relevant admission/university authority.
- For every regulatory rule, store `source_document`, `source_clause`, `applicable_academic_year`, `effective_from`, `effective_to`, `policy_version`, `review_status` and `approved_by`.
- Treat APH 2024–27 as a baseline source for the academic years it covers, not proof that no later amendment exists. Check later AICTE notices and institution-specific approval documents before enabling production policy.
- Public API catalogue entries do not grant credentials or legal permission. Never claim an external integration is live without an authorised sandbox/production account and successful end-to-end certification.
- Public APAAR FAQs prominently describe the school/UDISE+ workflow. Do not infer that those instructions define the higher-education integration protocol.
- When uncertain, fail safe: mark `PENDING_REVIEW`/`PROVIDER_UNAVAILABLE`, preserve the record and create a clear issue. Do not guess a policy outcome.

## 4. Architecture constraints

Baseline stack:

- React + TypeScript frontend.
- NestJS + TypeScript modular monolith backend.
- PostgreSQL as transactional system of record.
- Prisma or TypeORM (select one; do not mix ORMs).
- Redis + BullMQ for background work in MVP/pilot.
- Keycloak or approved OIDC provider for authentication.
- Private object storage for quarantined uploads.
- Python/Pandas analytics worker only when needed.
- Docker Compose for local development.
- OpenAPI 3.1 for API contracts.

Do not introduce Kafka, Kubernetes, GraphQL, blockchain, a vector database or an ML model unless a documented requirement justifies it and the team approves an architecture decision record.

Use domain modules such as:

- `identity`
- `institutions`
- `programmes`
- `approvals`
- `students`
- `admissions`
- `submissions`
- `policy-engine`
- `verification`
- `events`
- `reconciliation`
- `alerts`
- `audit`
- `analytics`
- `integrations`

Keep domain services independent of provider-specific APIs. External systems must be behind adapter interfaces.

## 5. Identity and privacy implementation rules

- Generate internal UUIDs for students, admission instances, batches, events and cases.
- Keep APAAR value handling inside a dedicated identity module/service boundary.
- If retention is approved, store the value encrypted with a managed key; use a keyed HMAC token for matching. Plain SHA-256 of a 12-digit identifier is insufficient because the identifier space can be brute-forced.
- Keep HMAC key version metadata. Design for controlled key rotation and re-indexing.
- Do not make the HMAC token a public or institution-facing identifier.
- Never log raw request bodies containing personal data.
- Redact identity values in exception traces and observability attributes.
- Use synthetic identifiers in fixtures and screenshots. Clearly state that they are fake.
- Separate student correction requests, optional consent receipts and records of other applicable legal authority. Do not assume consent is the only lawful basis for every regulatory processing purpose.

## 6. API rules

- All API routes must be versioned (`/api/v1` or `/v1`).
- Use DTO/schema validation at the edge and domain validation inside services.
- Enforce institution membership and object-level authorisation on the server. Frontend hiding is not security.
- Require idempotency keys for batch creation and externally retried write operations.
- Use asynchronous job IDs for large imports and provider calls.
- Return stable error codes, request IDs and safe human-readable messages.
- Do not put raw APAAR or other sensitive attributes in route parameters.
- Use pagination and query limits for collection endpoints.
- Avoid returning more fields than the caller needs.
- OpenAPI must match actual controller behaviour; update tests when contracts change.

## 7. Event and transaction rules

- Events are immutable. Corrections append a new event.
- Use a transactional outbox when a database update must trigger asynchronous processing.
- Consumers must be idempotent.
- Record `event_id`, `event_type`, `aggregate_id`, `source_system`, `source_event_id`, `occurred_at`, `received_at`, `schema_version` and minimal payload.
- Preserve source time and platform receipt time separately.
- Reject invalid state transitions with a stable business error.
- Never let a provider timeout convert a record to `INVALID` or `NOT_FOUND`.

## 8. Regulatory rule engine rules

Rules are data/configuration with tests, not scattered `if` statements.

Every evaluation must return:

- evaluation ID;
- programme approval ID and academic year;
- policy release/rule ID;
- input counts and counting basis;
- formula/rounding method;
- result: `PASS`, `WARNING`, `REVIEW_REQUIRED` or `FAIL`;
- plain-language explanation;
- source clause;
- human-review requirement.

A policy change requires:

1. primary source reference;
2. applicability analysis;
3. independent review;
4. boundary and regression tests;
5. version increment;
6. authorised publication.

Never silently enable an unreviewed rule in production.

## 9. AI/ML rules

- Build deterministic rules before ML.
- ML output is an anomaly signal, not a legal conclusion.
- Include model version, features, evidence summary and calibrated score metadata where appropriate.
- Do not train on real student data without documented lawful authority, purpose, governance and security approvals.
- Test precision, recall, false-positive and false-negative rates on labelled, representative data before deployment.
- Human reviewer decision must be captured independently from model score.
- Never label a student or institution as fraudulent solely from similarity or anomaly score.

## 10. Testing requirements

Every pull request should include appropriate tests for:

- positive and negative paths;
- tenant isolation and object-level access;
- idempotency and duplicate retries;
- approval/policy version boundaries;
- category-specific edge cases;
- provider timeout and retry;
- lifecycle transition rules;
- audit/provenance writes;
- data masking and redaction;
- pagination and query scoping.

Before merge, run formatter, lint, unit tests, integration tests and build. Before release, run Playwright end-to-end tests, dependency/security checks and migration tests.

## 11. Code quality and collaboration

- Use TypeScript strict mode.
- Prefer explicit types and small domain services.
- Do not use `any` for core admission, identity or policy objects.
- Separate controllers, DTOs, services, repositories, domain types and adapters.
- Use dependency injection for provider adapters.
- Keep configuration in environment variables/secret manager; commit only `.env.example` with dummy values.
- Do not commit credentials, API keys, real student records or unredacted logs.
- Use migrations; do not rely on schema auto-sync in production.
- Add comments for regulatory rationale, not obvious syntax.
- Keep README and OpenAPI aligned with code.
- Use pull requests and require review for policy/security changes.

## 12. Required response format for an AI coding agent

When implementing a task, the agent should report:

1. **Scope:** what requirement is implemented.
2. **Files changed:** list relevant files.
3. **Domain impact:** whether identity, admission, policy or audit invariants are affected.
4. **API/database changes:** contracts and migrations.
5. **Security/privacy impact:** access, PII, secrets and audit behaviour.
6. **Tests:** commands run and outcomes; state clearly what was not tested.
7. **Mock/official status:** identify any synthetic provider or test-only result.
8. **Open questions:** unresolved policy, data-source or authorisation dependency.

Do not claim a test, integration, audit or deployment succeeded unless it was actually run and observed.
