# Security, Privacy & Trust Model

## 1. Security objectives

APAAR-SHIELD processes academic identity references, admission records and regulatory evidence. The security objectives are:

- confidentiality of identity and education records;
- integrity and provenance of submissions and regulatory decisions;
- availability of institution submission and monitoring services;
- non-repudiable, attributable audit evidence where technically and legally appropriate;
- purpose-limited disclosure to authorised stakeholders;
- safe operation despite external provider outages;
- protection against cross-institution data access and abuse by privileged users.

## 2. Data classification

| Class | Examples | Handling |
|---|---|---|
| Public | Public institution names, public approval documents, published seat matrices | Public/approved display; source and version retained |
| Internal | Batch status, operational workflow, non-sensitive policy configuration | Authenticated staff access |
| Confidential | Student name, course/admission status, institution-linked student record | Least privilege, encryption and audit |
| Restricted identity | APAAR, other high-risk identifiers, identity-provider responses | Dedicated service boundary, encryption, no ordinary logging, narrowly granted access |
| Security secrets | API secrets, private keys, encryption keys, signing keys | Secret manager/KMS/HSM; never source-controlled |

Classification must be confirmed by the data owner and privacy/legal review.

## 3. Threat model

| Threat | Example | Primary controls |
|---|---|---|
| Broken object-level authorisation | College A requests College B's student record by changing UUID | Server-side tenant checks, scoped repositories, RLS defence-in-depth, negative tests |
| Credential compromise | Institution admin account stolen | MFA, conditional access, short sessions, rate limits, anomaly alerts |
| Bulk data exfiltration | User exports all student records | Purpose/role checks, export approval, rate limits, watermarking where appropriate, audit and alerts |
| APAAR enumeration | Public endpoint tests sequential identifiers | No public lookup, authenticated provider adapter, rate limiting, opaque references |
| Malicious file upload | CSV/Excel payload or malware | Quarantine, allowlisted types, size limits, malware scan, parser sandboxing, formula-injection-safe export |
| Data tampering | User changes admission category after certification | Immutable event history, approval workflow, source provenance, audit |
| Replay/duplicate events | Retry creates repeated admissions or withdrawals | Idempotency key, source event ID uniqueness, state transition validation |
| Provider compromise/outage | External API returns invalid or times out | Circuit breaker, signed/authenticated responses where supported, pending status, bounded retries |
| Insider misuse | Privileged operator views unnecessary records | Least privilege, just-in-time access, dual control for sensitive tasks, audit and review |
| Supply-chain compromise | Vulnerable npm/container dependency | SBOM, lockfiles, vulnerability scanning, signed builds and patch process |
| Model error | ML score flags a legitimate concurrent programme | Explainability, human review, measured false positives, no automatic punitive decision |
| Backup exposure | Unencrypted backup copy leaks records | Encryption, access control, retention and restore testing |

## 4. Authentication and access control

### Authentication

- OIDC for human users.
- MFA for privileged users and sensitive actions.
- Machine clients use registered workload identity (OAuth 2.0 client credentials, mTLS or approved mechanism).
- Short-lived access tokens and controlled refresh/revocation.
- No shared institution passwords or hard-coded API keys.

### Authorisation

Use RBAC for broad roles and ABAC for context such as institution, campus, assigned case, purpose and data sensitivity.

Every request must verify server-side:

1. authenticated principal;
2. active role/membership;
3. institution/campus scope;
4. requested resource ownership/relationship;
5. action permission;
6. purpose and disclosure scope, where applicable.

Do not trust a client-supplied `institution_id` as sufficient proof of access.

## 5. APAAR/identity protection

Recommended design, subject to the actual data flow and authorised provider contract:

- minimise collection and avoid duplicate retention;
- transmit over authenticated TLS channels;
- place raw identity handling in a dedicated identity service/vault;
- if retention is legally/policy-approved, use envelope encryption with managed KMS/HSM keys;
- generate keyed HMAC match tokens for internal deduplication;
- version and rotate keys under controlled procedure;
- never use plain hash of a 12-digit value as a secure pseudonym;
- never log raw identifier or provider payload containing it;
- mask display (e.g. partial identifier) only where display is necessary;
- exclude raw APAAR from analytics warehouse and general exports;
- use opaque internal UUIDs in URLs;
- restrict detokenisation/decryption to specifically authorised operations and log the reason.

HMAC match tokens are still linkable/pseudonymous data and must be protected as sensitive personal data in the platform's privacy model. They are not anonymous data.

## 6. Privacy and data-governance controls

- Maintain a data inventory and processing-purpose register.
- Document source, owner, processor, purpose, field, retention and recipients for each data flow.
- Collect only fields needed for a defined AICTE/institution workflow.
- Separate mandatory regulatory submission from optional student-authorised disclosure.
- Record legal basis/authority, notice version and consent receipt where consent is the applicable basis.
- Provide correction/dispute workflow and traceable resolution.
- Define retention and deletion based on applicable law, institutional records schedules and contract; do not invent one universal duration.
- Apply processor/vendor contractual and security controls.
- Define breach detection, escalation and notification responsibilities.
- Perform privacy impact/data protection assessment before production integration.
- Review children's data handling if the system covers minors; do not assume the adult higher-education process applies to every case.

The DPDP Act commencement schedule is phased. See `DOMAIN_AND_REGULATORY.md` and `SOURCES.md`. Obtain legal advice on current commencement, applicable obligations, data fiduciary/processor roles and transition provisions as at the date of deployment.

## 7. Verifier disclosure protocol

A verifier must not be able to submit a raw APAAR and retrieve a complete student profile.

Recommended flow:

1. Authenticate the verifier organisation/user.
2. Capture the verification purpose and legal/consent authority as required.
3. Obtain candidate/student-initiated authorisation where required by the applicable policy and integration.
4. Resolve opaque record reference.
5. Validate requested fields against approved disclosure scope.
6. Query the authoritative source or an approved verified record.
7. Return minimum necessary claims, issuer/source, status, timestamp and expiry.
8. Record the verifier, purpose, fields disclosed and request ID in audit.
9. Provide revocation/expiry controls where applicable.

Degree verification should query the competent awarding body or authorised issuer/NAD/DigiLocker source. Admission verification is a different claim from degree verification.

## 8. Cryptographic and key management controls

- Use standard, reviewed cryptographic libraries; do not implement cryptography manually.
- TLS 1.2+ (prefer TLS 1.3 where supported) for network paths.
- Envelope encryption for restricted identity data.
- KMS/HSM-backed key storage in production.
- Separate keys for encryption, HMAC matching and credential signing.
- Rotation, revocation, backup and disaster recovery procedures for keys.
- Avoid embedding private keys in environment files, containers or Git.
- Use digital signatures for integrity/issuer authenticity, not as a replacement for source verification or legal authority.

## 9. Application and infrastructure security baseline

- WAF/API gateway and request limits.
- Secure headers and CSP.
- CORS allowlist.
- CSRF protection where cookie-based sessions are used.
- Server-side input validation and parameterised database operations.
- File upload quarantine and scanning.
- Rate limits on login, provider checks, exports and verification.
- Dependency, container and secret scanning.
- SAST/DAST and code review.
- SBOM and controlled release artefacts.
- Environment separation and least-privilege service accounts.
- Centralised monitoring and vulnerability/patch management.
- Independent security assessment before production launch.

Suggested assurance references: OWASP ASVS 5.0, OWASP API Security Top 10:2023, NIST SP 800-207 and ISO/IEC 27001:2022. These are proposed engineering baselines, not claims of a project-specific statutory mandate.

## 10. Logging and incident response

- Create an incident response plan with severity, containment, evidence preservation, communications, recovery and post-incident review.
- Maintain a designated incident point of contact.
- Apply CERT-In directions where applicable, including specified six-hour incident reporting and 180-day rolling log retention in Indian jurisdiction.
- Synchronise system clocks with approved sources.
- Do not include raw identity data or credentials in logs.
- Separate security logs from ordinary application logs and restrict access.
- Test alerting and incident escalation, not just log ingestion.

## 11. Availability and disaster recovery

Initial planning targets (validate with system owner):

- 99.9% core API monthly availability;
- RPO 15 minutes or better;
- RTO 4 hours or better;
- backups with encryption and tested restoration;
- multi-zone high availability where required;
- circuit breakers and retries for external providers;
- queue backlog monitoring and replay;
- documented manual/alternate institution submission process during extended outage.

An external APAAR provider outage must not be interpreted as a negative identity result. Keep the record pending and queue a safe retry.

## 12. Security release checklist

- [ ] Threat model reviewed.
- [ ] Data-flow and trust-boundary diagrams approved.
- [ ] Tenant-isolation tests pass.
- [ ] Privileged actions require appropriate MFA/approval.
- [ ] Sensitive fields are masked/redacted in logs and analytics.
- [ ] Secrets are not committed.
- [ ] Uploads are quarantined and scanned.
- [ ] Key management and rotation design documented.
- [ ] Audit events cover critical changes.
- [ ] Provider timeout/replay tests pass.
- [ ] Backup restore test completed.
- [ ] Incident response and CERT-In applicability reviewed.
- [ ] Privacy/legal review completed before production processing.
- [ ] Independent security assessment completed before national rollout.
