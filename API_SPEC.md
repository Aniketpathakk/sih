# API Specification — APAAR-SHIELD

**Status:** Proposed application API; not an existing AICTE, APAAR, ABC, DigiLocker or university API.  
**Base path:** `/api/v1`  
**Format:** REST + JSON; OpenAPI 3.1 contract to be maintained alongside implementation.

## 1. API design principles

- Use HTTPS in every shared environment.
- Authenticate human users with OIDC; use registered OAuth 2.0 clients or approved machine identity for institution-to-platform integrations.
- Enforce institution/tenant scope on the server for every object access.
- Do not accept an institution ID from the client as proof of access; resolve access from authenticated membership.
- Never use raw APAAR or other sensitive identifiers in URL path/query parameters.
- Use idempotency keys for retryable writes.
- Large batch work is asynchronous and returns a job/batch ID.
- Use stable error codes and request/correlation IDs.
- Use pagination, filter allowlists and response field minimisation.
- Use API versioning and an explicit deprecation policy.

## 2. Authentication and authorisation

### Human users

OIDC Authorization Code flow with PKCE through the configured identity provider. MFA is required for privileged roles in production.

### Machine-to-machine clients

Use a registered OAuth 2.0 client-credentials flow, mTLS or the mechanism approved by the receiving government integration. Bind each client to a specific institution, source system, scopes and key/certificate rotation policy.

### Proposed roles/scopes

| Role | Typical scope |
|---|---|
| `institution_admin` | Manage users and certify own institution submissions |
| `admission_operator` | Submit/update permitted records for assigned institution |
| `aicte_officer` | View authorised regulatory data and cases |
| `policy_admin` | Draft policy release; cannot self-approve/publish without required separation of duties |
| `university_officer` | Submit/reconcile records for associated university |
| `student` | View own permitted record and submit correction/optional disclosure request |
| `verifier` | Request and retrieve limited, approved verification results |
| `platform_operator` | Operational administration; no default unrestricted academic-record access |

## 3. Endpoint catalogue

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| `GET` | `/me` | Current user and scopes | Authenticated |
| `GET` | `/institutions` | Institutions visible to caller | Scoped |
| `GET` | `/institutions/{institutionId}` | Institution detail | Scoped |
| `GET` | `/institutions/{institutionId}/approvals` | Approval snapshots | Scoped/AICTE |
| `POST` | `/institutions/{institutionId}/batches` | Create batch upload | Institution operator |
| `GET` | `/batches/{batchId}` | Batch status/summary | Owner institution/AICTE |
| `GET` | `/batches/{batchId}/rows` | Row-level validation outcomes | Owner institution/AICTE |
| `POST` | `/batches/{batchId}/certify` | Certify reviewed batch | Institution admin/authorised certifier |
| `POST` | `/admissions` | Create individual admission | Institution operator |
| `GET` | `/admissions/{admissionId}` | Read permitted admission details | Scoped |
| `POST` | `/admissions/{admissionId}/events` | Submit lifecycle event | Institution operator |
| `GET` | `/admissions/{admissionId}/history` | Admission event history | Scoped/AICTE |
| `POST` | `/identity-verifications` | Initiate identity verification | Permitted role/service |
| `GET` | `/identity-verifications/{verificationId}` | Verification status | Request owner/AICTE |
| `GET` | `/programmes/{programmeId}/seat-position` | Seat utilisation snapshot | AICTE/authorised institution |
| `GET` | `/cases` | Search authorised reconciliation cases | AICTE/assigned reviewer |
| `GET` | `/cases/{caseId}` | Case detail/evidence | Assigned reviewer |
| `POST` | `/cases/{caseId}/decisions` | Review/resolve case | Authorised reviewer |
| `POST` | `/disclosure-requests` | Request scoped verification | Verifier/approved requester |
| `GET` | `/disclosure-requests/{requestId}` | Retrieve permitted result | Request owner |
| `GET` | `/reports/admissions` | Admission report | Authorised |
| `GET` | `/reports/integrity` | Integrity report | AICTE/authorised |

## 4. Batch submission

### Request

`POST /api/v1/institutions/{institutionId}/batches`

Headers:

```http
Authorization: Bearer <access-token>
Idempotency-Key: <unique-key>
Content-Type: multipart/form-data
```

Multipart fields:

- `file`: CSV or approved format.
- `academic_year`: e.g. `2026-27`.
- `source_system`: registered connector code.
- `schema_version`: upload contract version.
- `approval_reference`: optional where rows map to multiple approvals; otherwise supply programme/approval in each row according to the template.

Never include provider secrets or identity-provider credentials in the uploaded file.

### Response — accepted job

```json
{
  "batch_id": "b5f0a0d7-5f8e-4e53-8a7e-a3ed9f4a8ed1",
  "status": "RECEIVED",
  "academic_year": "2026-27",
  "total_rows": 500,
  "submitted_at": "2026-10-31T06:30:00Z",
  "mock_data": true
}
```

The example is synthetic. `2026-10-31T06:30:00Z` is illustrative and should be generated by the server.

### Batch status lifecycle

`RECEIVED → QUARANTINED → SCANNING → STAGING → VALIDATING → VALIDATED / VALIDATED_WITH_ISSUES → CERTIFIED → COMMITTING → COMMITTED`

Terminal/error statuses may include `REJECTED`, `FAILED` and `CANCELLED`. Keep row statuses separate from batch status.

## 5. Example canonical row contract

```json
{
  "source_record_id": "SYN-ADM-0001",
  "institution_reference": "SYN-INST-001",
  "campus_reference": "SYN-CAMPUS-001",
  "programme_reference": "SYN-BTECH-CSE",
  "academic_year": "2026-27",
  "student": {
    "display_name": "Synthetic Student A",
    "apaar_reference": "900000000001"
  },
  "admission": {
    "admission_date": "2026-08-10",
    "route": "STATE_COUNSELLING",
    "entry_type": "FIRST_YEAR",
    "seat_category": "GENERAL",
    "status": "CONFIRMED"
  },
  "source": {
    "system": "SYNTHETIC_ERP",
    "source_event_id": "SYN-EVT-0001"
  }
}
```

This example contains a synthetic placeholder value only. Production data contracts must be reviewed for minimisation, legal basis, allowed fields and provider requirements. Prefer a secure identifier-handling channel where possible; do not store raw APAAR in general staging rows longer than necessary.

## 6. Verification API

### Request

`POST /api/v1/identity-verifications`

```json
{
  "student_id": "e3dfd7de-d3d5-4dbb-8d86-7f8f4d3260bb",
  "provider_code": "MOCK_APAAR",
  "purpose_code": "INSTITUTION_ENROLMENT_INTEGRITY",
  "requested_claims": ["IDENTITY_MATCH", "VERIFICATION_STATUS"]
}
```

The platform resolves the protected identity internally. The client must not pass a raw APAAR value in a URL.

### Mock response

```json
{
  "verification_id": "b2d15c7c-f6c5-4cec-9f6c-9be6ad1021e1",
  "provider_code": "MOCK_APAAR",
  "mode": "MOCK",
  "status": "MOCK_VERIFIED",
  "provider_reference": "MOCK-REF-001",
  "production_verified": false,
  "requested_claims": ["IDENTITY_MATCH", "VERIFICATION_STATUS"]
}
```

Allowed identity statuses should distinguish at minimum:

- `FORMAT_VALID`
- `FORMAT_INVALID`
- `PENDING_VERIFICATION`
- `OFFICIAL_VERIFIED`
- `MOCK_VERIFIED`
- `MISMATCH`
- `NOT_FOUND`
- `PROVIDER_UNAVAILABLE`
- `REQUIRES_MANUAL_REVIEW`

A timeout maps to `PROVIDER_UNAVAILABLE` or `PENDING_VERIFICATION`, not `NOT_FOUND`.

## 7. Seat-position API

`GET /api/v1/programmes/{programmeId}/seat-position?campusId=...&academicYear=2026-27`

Example response:

```json
{
  "programme_id": "SYN-PROG-001",
  "academic_year": "2026-27",
  "approval_id": "SYN-APPROVAL-001",
  "policy_release": "SYN-APH-RULESET-2026-27",
  "approved_intake": 120,
  "within_intake": {
    "confirmed_count": 115,
    "category_breakdown": {
      "GENERAL": 90,
      "RESERVED": 20,
      "NRI": 5
    }
  },
  "supernumerary": {
    "provision_summary": "See category-level permissions",
    "categories": [
      {
        "category": "FN_OCI_GULF",
        "permitted_count": 18,
        "confirmed_count": 15,
        "requires_approval": true
      }
    ]
  },
  "alerts": [],
  "data_classification": "SYNTHETIC_DEMO"
}
```

The counts are synthetic and do not establish a universal seat formula. The API must return the actual configured policy basis and source clause for each category. Never aggregate independent provisions into one generic percentage without policy authorisation.

## 8. Case decision API

`POST /api/v1/cases/{caseId}/decisions`

```json
{
  "decision_code": "EXPLANATION_ACCEPTED",
  "reason": "Source evidence shows the earlier admission was cancelled before the new admission became active.",
  "evidence_references": ["SYN-DOC-REF-001"]
}
```

Allowed decisions may include `ISSUE_CONFIRMED`, `DATA_CORRECTED`, `FALSE_POSITIVE`, `EXPLANATION_ACCEPTED`, `ESCALATED` and `MORE_INFORMATION_REQUIRED`. Exact options and permissions must be governed by workflow configuration.

## 9. Error response

```json
{
  "error": {
    "code": "APPROVAL_NOT_FOUND",
    "message": "No applicable programme approval was found for the supplied academic year.",
    "request_id": "req-8c9d",
    "details": {
      "academic_year": "2026-27",
      "programme_reference": "SYN-BTECH-CSE"
    }
  }
}
```

Recommended HTTP status usage:

| Status | Use |
|---|---|
| 200 | Successful retrieval/action |
| 201 | Resource created |
| 202 | Accepted for asynchronous processing |
| 400 | Malformed request |
| 401 | Missing/invalid authentication |
| 403 | Authenticated but unauthorised |
| 404 | Resource not available to caller / not found according to disclosure policy |
| 409 | Idempotency or state conflict |
| 413 | Upload too large |
| 415 | Unsupported media type |
| 422 | Business/schema validation result |
| 429 | Rate limit exceeded |
| 500 | Internal error |
| 503 | Dependency unavailable |

## 10. Event contract

Example event:

```json
{
  "event_id": "SYN-EVT-1001",
  "event_type": "ADMISSION_WITHDRAWN",
  "aggregate_type": "ADMISSION",
  "aggregate_id": "SYN-ADM-1001",
  "source_system": "INSTITUTION_PORTAL",
  "source_event_id": "SYN-SRC-EVT-1001",
  "occurred_at": "2026-10-31T10:15:00Z",
  "received_at": "2026-10-31T10:15:02Z",
  "schema_version": "1.0",
  "payload": {
    "reason_code": "STUDENT_WITHDRAWAL",
    "evidence_reference": "SYN-EVIDENCE-001"
  }
}
```

Events must be idempotent and immutable. Do not place raw identity values in event payloads.

## 11. OpenAPI and contract testing

The implementation must generate/publish an OpenAPI 3.1 document. CI should:

- validate schema syntax;
- compare generated spec with committed API contract;
- run provider mock contract tests;
- test success, validation, auth, tenant-isolation and timeout paths;
- reject accidental sensitive fields in response schemas;
- version breaking changes under a new major API version.

## 12. Official integrations are separate

All endpoints above are APAAR-SHIELD proposals. They are not claimed to be live AICTE endpoints. APAAR/ABC, DigiLocker/NAD, AICTE approval and university connectors must implement separate adapter contracts after documented authorisation and partner onboarding. See `INTEGRATIONS.md`.
