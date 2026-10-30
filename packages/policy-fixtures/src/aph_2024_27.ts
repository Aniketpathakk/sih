import {
  AdmissionStatus,
  PolicyEvaluationResult,
  SeatCategory,
  SeatPositionSummary,
} from '@apaar-shield/contracts';

export interface AdmissionCandidateRecord {
  id: string;
  admissionStatus: AdmissionStatus;
  seatCategory: SeatCategory;
  entryType: 'FIRST_YEAR' | 'LATERAL_ENTRY' | 'TRANSFER';
  academicYear: string;
}

export interface ProgrammeApprovalSnapshot {
  id: string;
  programmeCode: string;
  programmeName: string;
  academicYear: string;
  approvedIntake: number;
  hasNriApproval: boolean;
  hasFnOciGulfApproval: boolean;
  hasTfwApproval: boolean;
}

export const APH_2024_27_METADATA = {
  policyVersion: 'APH-2024-27-V1',
  sourceDocument: 'AICTE Approval Process Handbook 2024-2027',
  sourceUri: 'https://aicte.gov.in/sites/default/files/APH%20Final.pdf',
};

/**
 * Deterministic Regulatory Evaluator for AICTE Approval Process Handbook 2024–27
 */
export function evaluateProgrammeSeats(
  approval: ProgrammeApprovalSnapshot,
  admissions: AdmissionCandidateRecord[]
): {
  evaluations: PolicyEvaluationResult[];
  summary: SeatPositionSummary;
} {
  const evaluations: PolicyEvaluationResult[] = [];

  // Filter admissions for this academic year
  const yearAdmissions = admissions.filter(
    (a) => a.academicYear === approval.academicYear
  );

  // Active admissions (Confirmed only; Withdrawn/Cancelled are tracked separately)
  const activeAdmissions = yearAdmissions.filter(
    (a) => a.admissionStatus === 'CONFIRMED'
  );
  const withdrawnAdmissions = yearAdmissions.filter(
    (a) => a.admissionStatus === 'WITHDRAWN' || a.admissionStatus === 'CANCELLED'
  );

  // First-Year Admissions (excluding lateral entry cohort)
  const firstYearActive = activeAdmissions.filter(
    (a) => a.entryType === 'FIRST_YEAR'
  );

  // Categorisation
  // Within-intake categories: GENERAL, OBC_NCL, SC, ST, EWS, NRI
  const withinIntakeAdmissions = firstYearActive.filter((a) =>
    ['GENERAL', 'OBC_NCL', 'SC', 'ST', 'EWS', 'NRI'].includes(a.seatCategory)
  );

  const nriAdmissions = firstYearActive.filter((a) => a.seatCategory === 'NRI');

  // Supernumerary categories: FN, OCI, GULF_WORKER, TFW, OTHER_SUPERNUMERARY
  const fnOciGulfAdmissions = firstYearActive.filter((a) =>
    ['FN', 'OCI', 'GULF_WORKER'].includes(a.seatCategory)
  );
  const gulfWorkerAdmissions = firstYearActive.filter(
    (a) => a.seatCategory === 'GULF_WORKER'
  );
  const tfwAdmissions = firstYearActive.filter((a) => a.seatCategory === 'TFW');

  // Lateral Entry cohort (2nd Year)
  const lateralEntryAdmissions = activeAdmissions.filter(
    (a) => a.entryType === 'LATERAL_ENTRY' || a.seatCategory === 'LATERAL_ENTRY'
  );

  // 1. RULE: Approved Intake Compliance
  const approvedIntake = approval.approvedIntake;
  const actualWithinCount = withinIntakeAdmissions.length;
  const isIntakeExceeded = actualWithinCount > approvedIntake;

  evaluations.push({
    evaluationId: `EVAL-${approval.id}-INTAKE`,
    ruleCode: 'RULE_APH_APPROVED_INTAKE',
    programmeApprovalId: approval.id,
    academicYear: approval.academicYear,
    policyVersion: APH_2024_27_METADATA.policyVersion,
    sourceDocument: APH_2024_27_METADATA.sourceDocument,
    sourceClause: 'Chapter II, Section 2.1 — Approved Intake Sanction',
    outcome: isIntakeExceeded ? 'FAIL' : 'PASS',
    formulaApplied: `confirmed_within_intake (${actualWithinCount}) <= approved_intake (${approvedIntake})`,
    actualCount: actualWithinCount,
    permittedLimit: approvedIntake,
    details: isIntakeExceeded
      ? `Confirmed admissions within intake (${actualWithinCount}) exceed approved intake (${approvedIntake}) by ${actualWithinCount - approvedIntake} seats.`
      : `Within-intake admissions (${actualWithinCount}/${approvedIntake}) are fully compliant.`,
    requiresHumanReview: isIntakeExceeded,
  });

  // 2. RULE: NRI Intake (Within Intake <= 5%)
  const nriPermitted = approval.hasNriApproval
    ? Math.floor(approvedIntake * 0.05)
    : 0;
  const isNriExceeded = nriAdmissions.length > nriPermitted;

  evaluations.push({
    evaluationId: `EVAL-${approval.id}-NRI`,
    ruleCode: 'RULE_APH_NRI_INTAKE',
    programmeApprovalId: approval.id,
    academicYear: approval.academicYear,
    policyVersion: APH_2024_27_METADATA.policyVersion,
    sourceDocument: APH_2024_27_METADATA.sourceDocument,
    sourceClause: 'Chapter II, Clause 2.11 — NRI Admissions within Approved Intake',
    outcome: isNriExceeded ? 'FAIL' : 'PASS',
    formulaApplied: `nri_admissions (${nriAdmissions.length}) <= floor(approved_intake * 0.05) [${nriPermitted}]`,
    actualCount: nriAdmissions.length,
    permittedLimit: nriPermitted,
    details: isNriExceeded
      ? `NRI admissions (${nriAdmissions.length}) exceed permitted 5% limit (${nriPermitted}) under AICTE APH.`
      : `NRI admissions (${nriAdmissions.length}/${nriPermitted}) are compliant with the 5% within-intake ceiling.`,
    requiresHumanReview: isNriExceeded,
  });

  // 3. RULE: FN / OCI / Children of Indian Workers in Gulf Countries (Supernumerary <= 15%)
  const supernumeraryPermitted = approval.hasFnOciGulfApproval
    ? Math.floor(approvedIntake * 0.15)
    : 0;
  const gulfPermittedSubAllocation = approval.hasFnOciGulfApproval
    ? Math.floor(supernumeraryPermitted / 3) // 1/3 of supernumerary seats
    : 0;

  const isSupernumeraryExceeded =
    fnOciGulfAdmissions.length > supernumeraryPermitted;
  const isGulfSubExceeded =
    gulfWorkerAdmissions.length > gulfPermittedSubAllocation;

  evaluations.push({
    evaluationId: `EVAL-${approval.id}-FN-OCI-GULF`,
    ruleCode: 'RULE_APH_FN_OCI_GULF',
    programmeApprovalId: approval.id,
    academicYear: approval.academicYear,
    policyVersion: APH_2024_27_METADATA.policyVersion,
    sourceDocument: APH_2024_27_METADATA.sourceDocument,
    sourceClause:
      'Chapter II, Clause 2.12 — Supernumerary Seats for FN/OCI/Children of Indian Workers in Gulf',
    outcome: isSupernumeraryExceeded ? 'FAIL' : 'PASS',
    formulaApplied: `supernumerary_fn_oci_gulf (${fnOciGulfAdmissions.length}) <= floor(approved_intake * 0.15) [${supernumeraryPermitted}]`,
    actualCount: fnOciGulfAdmissions.length,
    permittedLimit: supernumeraryPermitted,
    details: isSupernumeraryExceeded
      ? `FN/OCI/Gulf supernumerary admissions (${fnOciGulfAdmissions.length}) exceed the 15% supernumerary ceiling (${supernumeraryPermitted}).`
      : `FN/OCI/Gulf supernumerary admissions (${fnOciGulfAdmissions.length}/${supernumeraryPermitted}) are compliant.`,
    requiresHumanReview: isSupernumeraryExceeded,
  });

  // 4. RULE: Tuition Fee Waiver (TFW) Supernumerary <= 5%
  const tfwPermitted = approval.hasTfwApproval
    ? Math.floor(approvedIntake * 0.05)
    : 0;
  const isTfwExceeded = tfwAdmissions.length > tfwPermitted;

  evaluations.push({
    evaluationId: `EVAL-${approval.id}-TFW`,
    ruleCode: 'RULE_APH_TFW',
    programmeApprovalId: approval.id,
    academicYear: approval.academicYear,
    policyVersion: APH_2024_27_METADATA.policyVersion,
    sourceDocument: APH_2024_27_METADATA.sourceDocument,
    sourceClause: 'Chapter II, Clause 2.13 — Tuition Fee Waiver (TFW) Scheme',
    outcome: isTfwExceeded ? 'FAIL' : 'PASS',
    formulaApplied: `tfw_admissions (${tfwAdmissions.length}) <= floor(approved_intake * 0.05) [${tfwPermitted}]`,
    actualCount: tfwAdmissions.length,
    permittedLimit: tfwPermitted,
    details: isTfwExceeded
      ? `TFW admissions (${tfwAdmissions.length}) exceed approved 5% supernumerary quota (${tfwPermitted}).`
      : `TFW admissions (${tfwAdmissions.length}/${tfwPermitted}) are compliant.`,
    requiresHumanReview: isTfwExceeded,
  });

  // 5. RULE: Lateral Entry Cohort Isolation
  evaluations.push({
    evaluationId: `EVAL-${approval.id}-LATERAL`,
    ruleCode: 'RULE_APH_LATERAL_ENTRY',
    programmeApprovalId: approval.id,
    academicYear: approval.academicYear,
    policyVersion: APH_2024_27_METADATA.policyVersion,
    sourceDocument: APH_2024_27_METADATA.sourceDocument,
    sourceClause: 'Chapter II, Clause 2.14 — Lateral Entry into 2nd Year',
    outcome: 'PASS',
    formulaApplied: 'lateral_entry_cohort evaluated separately from 1st-year approved intake',
    actualCount: lateralEntryAdmissions.length,
    permittedLimit: Math.floor(approvedIntake * 0.1), // Standard 10% provision
    details: `Lateral entry cohort (${lateralEntryAdmissions.length}) correctly isolated from 1st-year intake.`,
    requiresHumanReview: false,
  });

  // Overall status classification
  let summaryStatus: SeatPositionSummary['status'] = 'WITHIN_CAPACITY';
  if (isIntakeExceeded) {
    summaryStatus = 'CAPACITY_EXCEEDED';
  } else if (isNriExceeded || isSupernumeraryExceeded || isTfwExceeded) {
    summaryStatus = 'CATEGORY_VIOLATION';
  } else if (actualWithinCount >= approvedIntake * 0.95) {
    summaryStatus = 'NEAR_CAPACITY';
  }

  const summary: SeatPositionSummary = {
    programmeApprovalId: approval.id,
    programmeCode: approval.programmeCode,
    programmeName: approval.programmeName,
    academicYear: approval.academicYear,
    approvedIntake,
    actualWithinIntakeCount: actualWithinCount,
    remainingWithinIntakeSeats: Math.max(0, approvedIntake - actualWithinCount),
    nriCount: nriAdmissions.length,
    nriPermittedLimit: nriPermitted,
    supernumeraryCount: fnOciGulfAdmissions.length,
    supernumeraryPermittedLimit: supernumeraryPermitted,
    gulfWorkerSubCount: gulfWorkerAdmissions.length,
    tfwCount: tfwAdmissions.length,
    lateralEntryCount: lateralEntryAdmissions.length,
    withdrawnCount: withdrawnAdmissions.length,
    status: summaryStatus,
  };

  return { evaluations, summary };
}

