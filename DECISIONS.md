# Architecture Decision Records (ADRs)

This document records the current proposed decisions. A production owner may supersede them through a reviewed ADR. Do not silently contradict an accepted decision in code.

## ADR-001 — Central regulatory registry with event-driven lifecycle

**Status:** Accepted for proposed solution  
**Decision:** Maintain a central student-level regulatory registry for required submissions, with immutable admission events and asynchronous reconciliation.  
**Reason:** Directly addresses the AICTE problem statement's central student-data and monitoring requirements while preserving source history.  
**Trade-off:** Centralised personal data increases privacy/security obligations. Mitigate with identity-vault isolation, minimisation, access control and purpose-limited disclosure.

## ADR-002 — Modular monolith first

**Status:** Accepted  
**Decision:** Start with a domain-oriented NestJS modular monolith and independent background worker.  
**Reason:** Six-member team, faster integration, fewer deployment dependencies and reliable database transactions.  
**Future extraction:** Identity, ingestion, event processing or analytics can be separated if scale/security boundaries justify it.

## ADR-003 — PostgreSQL system of record

**Status:** Accepted  
**Decision:** PostgreSQL stores institution, approval, student internal reference, admission, event, batch and case records.  
**Reason:** Strong relational integrity, transactional updates, constraints and JSONB flexibility.  
**Trade-off:** Analytics-heavy workloads may later require read replicas or a warehouse.

## ADR-004 — Dedicated identity protection boundary

**Status:** Accepted as design direction; legal/data-owner approval required  
**Decision:** APAAR handling is isolated in a dedicated identity service/vault. If retention is approved, encrypt the raw value and use keyed HMAC for internal matching.  
**Reason:** Avoid plaintext identifiers in general application tables and reduce exposure.  
**Caveat:** HMAC tokens remain linkable personal data; they are not anonymous. Key operations require managed KMS/HSM in production.

## ADR-005 — Provider adapters and explicit modes

**Status:** Accepted  
**Decision:** All external integrations use replaceable adapters with `MOCK`, `SANDBOX` and `PRODUCTION` modes.  
**Reason:** Official credentials and agreements may not be available during a hackathon.  
**Invariant:** `MOCK_VERIFIED` is never represented as official verification.

## ADR-006 — Versioned policy engine

**Status:** Accepted  
**Decision:** AICTE/other applicable rules are stored as versioned, source-linked policy data with controlled release and regression tests.  
**Reason:** Rules vary by academic year, category, programme and approval conditions.  
**Invariant:** No universal `Approved Intake × 1.15` calculation.

## ADR-007 — Human review for potential violations

**Status:** Accepted  
**Decision:** Deterministic checks may generate failures/warnings; duplicate and anomaly findings requiring interpretation become review cases.  
**Reason:** Legitimate simultaneous programmes and lifecycle timing can create apparent conflicts.  
**Invariant:** ML scores do not determine fraud or final adverse regulatory action.

## ADR-008 — CSV-first, API-ready interoperability

**Status:** Accepted  
**Decision:** Support a versioned CSV template and REST API using the same canonical model.  
**Reason:** Institutions have varied ERP capabilities and CSV provides a practical onboarding path.  
**Future:** ERP-specific connectors and secure API/webhook integration.

## ADR-009 — PostgreSQL outbox + Redis/BullMQ for MVP

**Status:** Accepted  
**Decision:** Use transactional outbox and BullMQ/Redis for async jobs.  
**Reason:** Reliable enough for prototype/pilot without Kafka operational overhead.  
**Future:** Evaluate Kafka or managed event streaming only when throughput, replay, retention or consumer-isolation needs justify it.

## ADR-010 — Analytics separated from transactional identity data

**Status:** Accepted  
**Decision:** Dashboards use aggregate/read models and should not query the raw identity vault.  
**Reason:** Reduce privacy exposure and protect transaction performance.

## Decisions still requiring owner approval

1. Exact legal/data governance roles among AICTE, institutions, universities and technology operators.
2. Exact required student-level fields and update cadence for each institution type/programme.
3. Higher-education APAAR verification/association API access and partner requirements.
4. Authoritative source and synchronization mechanism for AICTE EoA/approval snapshots.
5. Applicable policy clauses and category permissions for each programme and academic year.
6. Admission reporting cut-off and treatment of withdrawals/cancellations for each report.
7. Hosting, procurement, data-residency and government-cloud requirements.
8. Retention/deletion schedule for student admission and audit records.
9. Certificate display/QR requirements established by the awarding institution/AICTE.
10. Required security certification and independent audit scope for production.
