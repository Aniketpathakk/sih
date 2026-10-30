// ==========================================
// APAAR-SHIELD CANONICAL CONTRACTS & TYPES
// ==========================================

export type AdmissionStatus =
  | 'CONFIRMED'
  | 'WITHDRAWN'
  | 'CANCELLED'
  | 'TRANSFERRED'
  | 'CORRECTION_PENDING';

export type AdmissionRoute =
  | 'STATE_COUNSELLING'
  | 'CENTRAL_COUNSELLING'
  | 'INSTITUTE_LEVEL'
  | 'MANAGEMENT_QUOTA'
  | 'SPOT_ROUND'
  | 'LATERAL_ENTRY'
  | 'NRI'
  | 'FN_OCI_GULF';

export type SeatCategory =
  | 'GENERAL'
  | 'OBC_NCL'
  | 'SC'
  | 'ST'
  | 'EWS'
  | 'NRI'
  | 'FN'
  | 'OCI'
  | 'GULF_WORKER'
  | 'TFW'
  | 'LATERAL_ENTRY'
  | 'OTHER_SUPERNUMERARY';

export type EntryType = 'FIRST_YEAR' | 'LATERAL_ENTRY' | 'TRANSFER';

export type BatchStatus =
  | 'RECEIVED'
  | 'QUARANTINED'
  | 'SCANNING'
  | 'STAGING'
  | 'VALIDATING'
  | 'VALIDATED'
  | 'VALIDATED_WITH_ISSUES'
  | 'CERTIFIED'
  | 'COMMITTING'
  | 'COMMITTED'
  | 'REJECTED'
  | 'FAILED';

export type RowValidationStatus = 'VALID' | 'WARNING' | 'ERROR' | 'DUPLICATE';

export type IdentityProviderMode = 'MOCK' | 'SANDBOX' | 'PRODUCTION';

export type IdentityVerificationStatus =
  | 'PENDING_VERIFICATION'
  | 'OFFICIAL_VERIFIED'
  | 'MOCK_VERIFIED'
  | 'MISMATCH'
  | 'NOT_FOUND'
  | 'PROVIDER_UNAVAILABLE'
  | 'REQUIRES_MANUAL_REVIEW';

export type ReconciliationCaseType =
  | 'EXACT_DUPLICATE_SUBMISSION'
  | 'POSSIBLE_CONCURRENT_ENROLMENT'
  | 'CAPACITY_OVERFLOW'
  | 'CATEGORY_OVERFLOW'
  | 'UNIVERSITY_MISMATCH'
  | 'IDENTITY_MISMATCH';

export type CaseStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'CORRECTION_REQUESTED'
  | 'FALSE_POSITIVE'
  | 'RESOLVED'
  | 'ESCALATED';

export type CaseSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type UserRole =
  | 'INSTITUTION_ADMIN'
  | 'ADMISSION_OPERATOR'
  | 'AICTE_OFFICER'
  | 'POLICY_ADMIN'
  | 'UNIVERSITY_OFFICER'
  | 'VERIFIER'
  | 'STUDENT';

// Row issue structure for CSV / API ingestion
export interface RowIssue {
  column: string;
  code: string;
  message: string;
  severity: 'WARNING' | 'ERROR';
  suggestedFix?: string;
}

// Canonical Row representation in Staging
export interface CanonicalRow {
  rowNumber: number;
  sourceRecordId: string;
  studentName: string;
  apaarReference: string; // Plaintext during initial validation, masked before persistence
  apaarMasked?: string;
  apaarHmac?: string;
  campusReference?: string;
  programmeCode: string;
  academicYear: string;
  admissionDate: string;
  admissionRoute: AdmissionRoute;
  seatCategory: SeatCategory;
  entryType: EntryType;
  counsellingRollNumber?: string;
  allotmentQuota?: string;
  rank?: number;
  status: RowValidationStatus;
  issues: RowIssue[];
}

// Submission Batch Summary
export interface SubmissionBatch {
  id: string;
  institutionId: string;
  academicYear: string;
  fileName: string;
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  status: BatchStatus;
  submittedAt: string;
  submittedBy: string;
  certifiedAt?: string;
  certifiedBy?: string;
  isMock: boolean;
}

// Policy Evaluation Model
export type PolicyEvaluationOutcome = 'PASS' | 'WARNING' | 'REVIEW_REQUIRED' | 'FAIL';

export interface PolicyEvaluationResult {
  evaluationId: string;
  ruleCode: string;
  programmeApprovalId: string;
  academicYear: string;
  policyVersion: string;
  sourceDocument: string;
  sourceClause: string;
  outcome: PolicyEvaluationOutcome;
  formulaApplied: string;
  actualCount: number;
  permittedLimit: number;
  details: string;
  requiresHumanReview: boolean;
}

// Seat Position & Capacity Snapshot
export interface SeatPositionSummary {
  programmeApprovalId: string;
  programmeCode: string;
  programmeName: string;
  academicYear: string;
  approvedIntake: number;
  actualWithinIntakeCount: number;
  remainingWithinIntakeSeats: number;
  nriCount: number;
  nriPermittedLimit: number;
  supernumeraryCount: number;
  supernumeraryPermittedLimit: number;
  gulfWorkerSubCount: number;
  tfwCount: number;
  lateralEntryCount: number;
  withdrawnCount: number;
  status: 'WITHIN_CAPACITY' | 'NEAR_CAPACITY' | 'CAPACITY_EXCEEDED' | 'CATEGORY_VIOLATION';
}

// Reconciliation Review Case
export interface ReconciliationCase {
  id: string;
  caseType: ReconciliationCaseType;
  severity: CaseSeverity;
  status: CaseStatus;
  academicYear: string;
  studentRef: string;
  studentMaskedName: string;
  apaarMasked: string;
  institutionIdA: string;
  institutionNameA: string;
  admissionIdA: string;
  institutionIdB?: string;
  institutionNameB?: string;
  admissionIdB?: string;
  evidenceSummary: string;
  policyClauseRef?: string;
  createdAt: string;
  updatedAt: string;
  decisionNotes?: string;
  decidedBy?: string;
  decidedAt?: string;
}

// Purpose-Limited Verification Disclosure
export interface PurposeLimitedDisclosure {
  verificationId: string;
  purposeCode: string;
  verifiedAt: string;
  isMock: boolean;
  status: IdentityVerificationStatus;
  studentReference: string;
  maskedName: string;
  institutionName: string;
  programmeName: string;
  academicYear: string;
  admissionStatus: AdmissionStatus;
  signature: string;
  expiresAt: string;
}

// Audit Event
export interface AuditEvent {
  id: string;
  actorId: string;
  actorRole: UserRole;
  actorEmail: string;
  action: string;
  resourceType: string;
  resourceId: string;
  occurredAt: string;
  ipAddress?: string;
  details: Record<string, unknown>;
}

