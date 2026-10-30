# Testing, Synthetic Data & SIH Demonstration Plan

## 1. Testing philosophy

Test whether the platform makes correct, explainable and secure decisions—not just whether pages render or APIs return HTTP 200.

Testing layers:

1. unit tests for domain logic and policy rules;
2. integration tests for PostgreSQL, queue, identity adapter and file ingestion;
3. API contract tests against OpenAPI;
4. end-to-end browser tests for institution and AICTE workflows;
5. security tests for authentication, tenant isolation and sensitive-data exposure;
6. performance tests for batches and dashboard queries;
7. resilience tests for provider outage, retry, queue backlog and database recovery;
8. regulatory test cases reviewed against source clauses.

## 2. Synthetic dataset design

Recommended SIH data:

| Dataset | Size |
|---|---:|
| Fictional institutions | 3 |
| Fictional campuses | 3–4 |
| Programmes | 4–6 |
| Academic years | 3 |
| Synthetic student identities | 300 |
| Admission instances | 330 |
| Admission lifecycle events | 80–120 |
| Mock identity results | 300 |
| Planted validation cases | 30–40 |

Use fictional names, synthetic identifiers and synthetic institution codes. Do not include real APAAR IDs, Aadhaar, phone, passport, date of birth or real student records. If an identifier fixture must resemble APAAR syntax, document that it is synthetic and never call a live provider with it.

### Example institutions

- Alpha Institute of Technology — synthetic private engineering institution.
- Beta College of Engineering — synthetic institution using a different ERP export.
- Gamma Technical Institute — synthetic institution with lateral-entry cohort fixtures.

### Example programmes

- B.Tech Computer Science and Engineering.
- B.Tech Electronics and Communication Engineering.
- B.Tech Mechanical Engineering.
- MBA or another AICTE-regulated programme only if the team's rule fixtures cover that programme's distinct policy conditions.

Do not assume that one programme's rule configuration applies to another programme type.

## 3. Mandatory functional scenarios

| ID | Scenario | Expected result |
|---|---|---|
| T01 | Valid required fields and synthetic APAAR syntax | Format valid; not automatically official verified |
| T02 | APAAR has wrong length/non-numeric value | Format error |
| T03 | Mock provider returns positive fixture | `MOCK_VERIFIED`, `production_verified=false` |
| T04 | Mock provider reports mismatch | Mismatch case/review status |
| T05 | Provider timeout | `PENDING_VERIFICATION` or `PROVIDER_UNAVAILABLE`; no invalid/not-found claim |
| T06 | Same source record appears twice in same batch | Duplicate source row identified |
| T07 | Same batch retried with same idempotency key | Existing processing result returned; no duplicate admission |
| T08 | No matching campus/programme approval for year | Approval issue |
| T09 | Confirmed within-intake admission count exceeds configured applicable capacity | Explainable capacity alert |
| T10 | NRI count crosses reviewed applicable limit | Category-specific alert |
| T11 | FN/OCI/Gulf count crosses approved specific provision | Category-specific supernumerary alert |
| T12 | Category supplied without required approval/evidence | Review/permission alert |
| T13 | Lateral entry recorded as first-year by mistake | Data-quality/cohort inconsistency |
| T14 | Student withdrawal event is accepted | Event appended; current state and relevant projections recalculated |
| T15 | Invalid withdrawal after already closed admission | State transition conflict; history preserved |
| T16 | Same protected identity appears at two institutions in overlapping period | Potential conflict case, not automatic fraud |
| T17 | Previous record was cancelled before later admission | Historical/progression explanation can resolve conflict |
| T18 | Concurrent programme combination may be permitted | Apply applicable rules; human review if facts are insufficient |
| T19 | University enrolment reference differs | Reconciliation case |
| T20 | Institution A requests Institution B's admission | 403/controlled non-disclosure; no data leak |
| T21 | Institution operator attempts to alter AICTE policy | 403 and audit event |
| T22 | Reviewer resolves a case as false positive | Decision stored; original evidence preserved |
| T23 | Policy version changes | Historical evaluation remains reproducible with original version |
| T24 | Malformed CSV or oversized upload | Rejected safely; no server compromise |
| T25 | CSV formula injection in exported error report | Export sanitises spreadsheet-active cells |
| T26 | Duplicate webhook/event replay | Consumer is idempotent |
| T27 | Outbox worker unavailable | Event remains pending and is replayed safely |
| T28 | HMAC/encryption key rotation | Existing match capability retained under controlled migration |
| T29 | Verifier asks for fields outside granted scope | Request rejected or fields omitted with explicit reason |
| T30 | Expired/revoked verification reference used | Verification denied |

## 4. Regulatory edge-case suite

At minimum, test:

- ordinary within-intake count;
- NRI within-intake count;
- FN/OCI/Gulf supernumerary count, with relevant approval;
- Gulf subcategory allocation where applicable;
- TFW and other distinct special categories;
- lateral-entry cohort and its separate rule;
- programme/campus approval amended mid-cycle;
- intake reduction or course closure;
- spot/vacancy-round admissions;
- a withdrawal before and after the reporting cut-off;
- transfer between institutions;
- course/branch change;
- student with eligible concurrent programmes under relevant UGC/professional rules;
- one student with historical and current programme records;
- provider outage during the submission window.

Each test fixture must link to a specific reviewed policy release and clause or be explicitly labelled `SYNTHETIC_POLICY_TEST` where the exact rule is not yet approved.

## 5. Metrics

Measure on the labelled synthetic or approved pilot dataset:

- schema validation pass rate;
- row-level validation accuracy;
- exact duplicate precision/recall;
- cross-institution candidate precision/recall;
- false-positive rate for potential concurrent-enrolment alerts;
- percentage of alerts with complete evidence and policy reference;
- mean/median time to resolve a case;
- batch processing throughput and p95 completion time;
- provider timeout/retry behaviour;
- percentage of critical actions covered by audit events;
- API latency and error rate;
- cross-tenant access test results.

Do not claim 99% AI accuracy or fixed throughput unless actually measured with methodology, sample size and environment documented.

## 6. Suggested acceptance targets for prototype

These are engineering targets, not measured results:

| Measure | Prototype target |
|---|---|
| Core labelled rule test cases | 100% expected outcomes |
| Repeat batch idempotency | No duplicate committed admissions |
| Critical permission tests | 100% expected deny/allow outcomes |
| Privileged write audit | 100% of tested critical changes logged |
| Provider outage | No false invalid/not-found outcome |
| Alert explainability | Rule/evidence/explanation shown for every test alert |
| Demo data | 300+ synthetic identities and planted edge cases |
| Clean setup | Teammate can run from README in a fresh environment |

## 7. Eight-minute SIH demonstration

### Seed data

Use three synthetic institutions, four programmes, three academic years and a prepared dataset of 300 synthetic students. Prepare these cases:

- one malformed APAAR-format value;
- one mock positive provider result;
- one provider-unavailable result;
- one exact duplicate submission;
- one repeated batch upload;
- one potential cross-institution overlapping admission;
- one within-intake capacity warning;
- one category-specific supernumerary warning;
- one withdrawal event;
- one legitimate historical/cancelled record;
- one reviewer false-positive resolution.

### Demo sequence

| Time | Step | Screen/action | Judge takeaway |
|---|---|---|---|
| 0:00–0:40 | Institution login | Login as Alpha admin | Institution isolation and governance |
| 0:40–1:20 | Approval context | Open B.Tech CSE approval/year snapshot | Intake is programme/year-specific |
| 1:20–2:20 | Batch submission | Upload synthetic CSV | Practical interoperability and validation |
| 2:20–3:10 | Identity check | Show `MOCK_VERIFIED`, invalid and pending outcomes | Format is not official identity verification |
| 3:10–4:10 | Regulatory check | Show within-intake and distinct category evaluation | No simplistic total-intake formula |
| 4:10–5:10 | Reconciliation | Beta submission creates potential overlap case | Duplicate candidate is contextual, not automatic fraud |
| 5:10–6:20 | Lifecycle | Submit withdrawal; show event and recalculated view | Historical events and current state coexist |
| 6:20–7:20 | Human review | Officer resolves one false positive with evidence | Explainable and accountable workflow |
| 7:20–8:00 | Verification/audit | Show limited synthetic QR/verification and audit trail | Privacy, verifiability and traceability |

### Demo safety rules

- Every seeded institution/student is fictional.
- Every mock provider result is visibly labelled.
- Do not call real APAAR endpoints without official credentials and permission.
- Do not use live student information on projector/screenshots.
- Do not claim a QR or synthetic signature is a government credential.
- Do not claim production security certification or service-level achievement without evidence.

## 8. Demo fallback plan

- Keep a known-good database seed and reset script.
- Provide a preloaded batch and a fresh upload for judges.
- Run local Docker Compose if internet is unreliable.
- Keep mock providers deterministic (fixed fixtures, not random outcomes).
- Capture short screenshots/video of the full flow as backup; make clear that screenshots are backup evidence, not a live integration.
- Keep one presenter focused on the workflow and one engineer ready for technical questions.
