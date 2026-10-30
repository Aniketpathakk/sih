# Integration Catalogue — Mock vs Authorised Production

## 1. Purpose

APAAR-SHIELD must integrate with heterogeneous institution and government systems, but the project team must never imply that a public website or API catalogue automatically grants permission to call a production endpoint.

Every integration must have:

- an adapter interface;
- a canonical internal contract;
- source-of-truth definition;
- authentication and authorisation method;
- data minimisation and purpose;
- timeout/retry/circuit-breaker policy;
- provenance and audit;
- test fixtures;
- explicit mode: `MOCK`, `SANDBOX` or `PRODUCTION`.

## 2. Integration status matrix

| System | What it may provide | Hackathon mode | Production requirement |
|---|---|---|---|
| APAAR/ABC | Academic identity/record-related operations, based on authorised services | Synthetic mock provider | Confirm higher-education use case, API specification, partner eligibility, credentials, agreements and testing approval |
| DigiLocker | Issuer/requester document flow | Mock document/consent flow | Approved issuer/requester onboarding, registered app, credentials, security/testing and permitted use |
| NAD | Academic award/record source | Mock credential reference | Institution/issuer onboarding and authorised verification route |
| AICTE approval data | Institution, campus, course, EoA and intake | Seeded approval snapshots from official public documents | Formal AICTE system interface, access approval and data contract |
| State counselling/DTE | Seat matrix, round, allotment and admission-reference data | Sample public dataset or synthetic file | Official published feed/export or agreement with authority |
| University ERP | University enrolment/registration/status | Mock CSV or synthetic API | University agreement, field mapping and secure credentials |
| College ERP/SIS | Actual institution admission/status data | CSV upload plus demo API | Institution connector contract and institution approval |
| Employer/verifier | Specific verification request/result | Synthetic signed response | Approved requester, purpose, consent/authority and limited disclosure |
| Hosting/IAM/KMS | Platform infrastructure and identity/key services | Local containers and dev identity | Government-approved environment and procurement/security approvals |

## 3. APAAR and ABC

The official APAAR website describes APAAR as a unique 12-digit academic identity linked to academic records, ABC and DigiLocker. The public FAQ prominently describes a school workflow involving UDISE+, PEN and demographic matching. Do not reuse that school-specific process as the higher-education integration specification.

API Setu's ABC collection lists operations such as ABC details, APAAR-related verification, student records fetch by APAAR ID, document verification, linking and related functions. The API catalogue demonstrates that such API products are listed; it does not establish that this project is subscribed, eligible or credentialled. The collection's API definition may also require authenticated access.

### Adapter contract

```ts
export type IdentityProviderMode = 'MOCK' | 'SANDBOX' | 'PRODUCTION';

export type IdentityVerificationStatus =
  | 'PENDING_VERIFICATION'
  | 'OFFICIAL_VERIFIED'
  | 'MOCK_VERIFIED'
  | 'MISMATCH'
  | 'NOT_FOUND'
  | 'PROVIDER_UNAVAILABLE'
  | 'REQUIRES_MANUAL_REVIEW';

export interface IdentityVerificationRequest {
  internalStudentId: string;
  purposeCode: string;
  requestedClaims: string[];
}

export interface IdentityVerificationResult {
  providerCode: string;
  mode: IdentityProviderMode;
  status: IdentityVerificationStatus;
  providerReference?: string;
  checkedAt: string;
  productionVerified: boolean;
  returnedClaims: Record<string, unknown>;
}

export interface AcademicIdentityProvider {
  verify(request: IdentityVerificationRequest): Promise<IdentityVerificationResult>;
}
```

The production adapter must be implemented only from the current official specification and after the appropriate onboarding and access approval. Never reverse-engineer a private endpoint or scrape a personal record portal.

## 4. DigiLocker and NAD

DigiLocker provides separate issuer and requester integration documentation. An organisation may need to register and complete a partner onboarding process before using production APIs. NAD is part of the academic-award/document ecosystem.

The product should distinguish:

- verifying that a particular admission/enrolment record exists;
- verifying a document issued by a competent institution;
- verifying a degree/academic award;
- retrieving academic credits.

These are different operations and may have different legal basis, source and API path.

## 5. AICTE approval data

### Hackathon

- Create a seeded registry from clearly sourced sample approval documents or synthetic fixtures.
- Store source document URI, hash, academic year, institution/campus/programme, intake, issue date, validity and superseding record.
- Mark fixture records as `DEMO_SEEDED` or `SYNTHETIC`.
- Do not allow an institution to edit the authoritative intake field.

### Production

- Confirm AICTE system owner and approved integration method.
- Agree canonical identifiers for institution/campus/course/approval.
- Define update frequency and correction procedure.
- Support amended/superseded EoA records.
- Preserve source snapshots and import acknowledgements.

## 6. State counselling and DTE

Use state-specific adapters because state processes, rounds, codes and file formats vary.

For Madhya Pradesh and Chhattisgarh research, map:

- seat-matrix version and publication date;
- institution and programme codes;
- counselling round;
- allotment reference;
- category/quota;
- vacancy/spot round;
- lateral-entry process;
- admission reporting/withdrawal timelines.

A public PDF or portal page can be used as a research/test fixture subject to its terms and permitted use. Do not scrape restricted portals or represent a sample matrix as a live feed.

## 7. University integration

Universities may maintain their own enrolment identifiers, examination records and status lifecycle. Build a mapping service between:

- institution admission ID;
- institution roll/admission ID;
- state counselling reference;
- university enrolment ID;
- APAAR-linked internal student identity.

Reconciliation outcomes should be `MATCHED`, `MISMATCHED`, `NOT_FOUND`, `PENDING`, `SOURCE_UNAVAILABLE` or `MANUAL_REVIEW`. A missing record at one source does not always imply a false admission; account for timing and source refresh windows.

## 8. College ERP/SIS integration

Support three levels:

1. **CSV template:** lowest integration barrier; versioned and documented.
2. **REST API connector:** registered institutional client with idempotency and per-institution scope.
3. **Managed connector/agent:** only if approved by institution IT and security; no direct database scraping or credential sharing.

Use a canonical schema and explicit field mapping per ERP. Provide row-level feedback to reduce manual support.

## 9. Employer and external verifier

The verifier API is not a public student search. Require an authenticated requester, defined purpose, scoped data request, appropriate student authorisation or other applicable legal authority, expiry and audit. Return only the approved claim fields.

A QR verification URL must contain an opaque, time-limited reference and must not embed a raw APAAR ID or full student record.

## 10. Provider resilience

Every adapter must implement:

- bounded timeout;
- retry with exponential backoff and jitter for retryable failures;
- circuit breaker;
- idempotency where provider supports it;
- response signature/authenticity check where supported;
- correlation ID;
- minimal request/response storage;
- clear provider mode;
- operator-visible outage status.

Do not retry permanent errors indefinitely. Do not convert network timeout to `NOT_FOUND` or `MISMATCH`.

## 11. Integration readiness checklist

- [ ] Data owner and source authority identified.
- [ ] Official interface documentation obtained.
- [ ] Partner eligibility and authorisation confirmed.
- [ ] API credentials issued through official process.
- [ ] Permitted purpose and data fields documented.
- [ ] Data-processing/legal agreement completed where required.
- [ ] Sandbox tests passed.
- [ ] Security review passed.
- [ ] Error, timeout and retry semantics documented.
- [ ] Production certification/approval completed.
- [ ] Monitoring, support owner and escalation route assigned.
