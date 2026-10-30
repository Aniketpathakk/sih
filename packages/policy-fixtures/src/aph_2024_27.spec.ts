import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  evaluateProgrammeSeats,
  ProgrammeApprovalSnapshot,
  AdmissionCandidateRecord,
} from './aph_2024_27';

describe('Regulatory Policy Engine — AICTE APH 2024-27 Tests', () => {
  const sampleApproval: ProgrammeApprovalSnapshot = {
    id: 'APP-BTECH-CSE-2026',
    programmeCode: 'BTECH-CSE',
    programmeName: 'B.Tech Computer Science and Engineering',
    academicYear: '2026-27',
    approvedIntake: 120,
    hasNriApproval: true,
    hasFnOciGulfApproval: true,
    hasTfwApproval: true,
  };

  it('T09: Confirmed within-intake admission within capacity should PASS', () => {
    const admissions: AdmissionCandidateRecord[] = Array.from(
      { length: 110 },
      (_, i) => ({
        id: `ADM-${i}`,
        admissionStatus: 'CONFIRMED',
        seatCategory: 'GENERAL',
        entryType: 'FIRST_YEAR',
        academicYear: '2026-27',
      })
    );

    const { evaluations, summary } = evaluateProgrammeSeats(
      sampleApproval,
      admissions
    );
    const intakeEval = evaluations.find(
      (e) => e.ruleCode === 'RULE_APH_APPROVED_INTAKE'
    );

    assert.strictEqual(intakeEval?.outcome, 'PASS');
    assert.strictEqual(summary.actualWithinIntakeCount, 110);
    assert.strictEqual(summary.status, 'WITHIN_CAPACITY');
  });

  it('T09: Confirmed within-intake count exceeding approved capacity should FAIL and trigger review', () => {
    const admissions: AdmissionCandidateRecord[] = Array.from(
      { length: 125 },
      (_, i) => ({
        id: `ADM-${i}`,
        admissionStatus: 'CONFIRMED',
        seatCategory: 'GENERAL',
        entryType: 'FIRST_YEAR',
        academicYear: '2026-27',
      })
    );

    const { evaluations, summary } = evaluateProgrammeSeats(
      sampleApproval,
      admissions
    );
    const intakeEval = evaluations.find(
      (e) => e.ruleCode === 'RULE_APH_APPROVED_INTAKE'
    );

    assert.strictEqual(intakeEval?.outcome, 'FAIL');
    assert.strictEqual(intakeEval?.requiresHumanReview, true);
    assert.strictEqual(summary.status, 'CAPACITY_EXCEEDED');
  });

  it('T10: NRI count exceeding 5% permitted limit should FAIL', () => {
    // 120 * 0.05 = 6 allowed NRI seats
    // Provide 7 NRI admissions
    const admissions: AdmissionCandidateRecord[] = Array.from(
      { length: 7 },
      (_, i) => ({
        id: `ADM-NRI-${i}`,
        admissionStatus: 'CONFIRMED',
        seatCategory: 'NRI',
        entryType: 'FIRST_YEAR',
        academicYear: '2026-27',
      })
    );

    const { evaluations, summary } = evaluateProgrammeSeats(
      sampleApproval,
      admissions
    );
    const nriEval = evaluations.find((e) => e.ruleCode === 'RULE_APH_NRI_INTAKE');

    assert.strictEqual(nriEval?.outcome, 'FAIL');
    assert.strictEqual(summary.nriPermittedLimit, 6);
    assert.strictEqual(summary.status, 'CATEGORY_VIOLATION');
  });

  it('T11: FN/OCI/Gulf supernumerary seats up to 15% should PASS', () => {
    // 120 * 0.15 = 18 allowed
    const admissions: AdmissionCandidateRecord[] = Array.from(
      { length: 15 },
      (_, i) => ({
        id: `ADM-FN-${i}`,
        admissionStatus: 'CONFIRMED',
        seatCategory: 'FN',
        entryType: 'FIRST_YEAR',
        academicYear: '2026-27',
      })
    );

    const { evaluations, summary } = evaluateProgrammeSeats(
      sampleApproval,
      admissions
    );
    const fnEval = evaluations.find(
      (e) => e.ruleCode === 'RULE_APH_FN_OCI_GULF'
    );

    assert.strictEqual(fnEval?.outcome, 'PASS');
    assert.strictEqual(summary.supernumeraryCount, 15);
  });

  it('T13: Lateral entry cohort should be isolated from first-year intake', () => {
    const admissions: AdmissionCandidateRecord[] = [
      ...Array.from({ length: 120 }, (_, i) => ({
        id: `ADM-FY-${i}`,
        admissionStatus: 'CONFIRMED' as const,
        seatCategory: 'GENERAL' as const,
        entryType: 'FIRST_YEAR' as const,
        academicYear: '2026-27',
      })),
      ...Array.from({ length: 12 }, (_, i) => ({
        id: `ADM-LE-${i}`,
        admissionStatus: 'CONFIRMED' as const,
        seatCategory: 'LATERAL_ENTRY' as const,
        entryType: 'LATERAL_ENTRY' as const,
        academicYear: '2026-27',
      })),
    ];

    const { evaluations, summary } = evaluateProgrammeSeats(
      sampleApproval,
      admissions
    );
    const intakeEval = evaluations.find(
      (e) => e.ruleCode === 'RULE_APH_APPROVED_INTAKE'
    );

    // Lateral entry does NOT cause 1st-year intake to fail
    assert.strictEqual(intakeEval?.outcome, 'PASS');
    assert.strictEqual(summary.lateralEntryCount, 12);
  });

  it('T14: Student withdrawal updates active count without deleting history', () => {
    const admissions: AdmissionCandidateRecord[] = [
      {
        id: 'ADM-1',
        admissionStatus: 'CONFIRMED',
        seatCategory: 'GENERAL',
        entryType: 'FIRST_YEAR',
        academicYear: '2026-27',
      },
      {
        id: 'ADM-2',
        admissionStatus: 'WITHDRAWN',
        seatCategory: 'GENERAL',
        entryType: 'FIRST_YEAR',
        academicYear: '2026-27',
      },
    ];

    const { summary } = evaluateProgrammeSeats(sampleApproval, admissions);
    assert.strictEqual(summary.actualWithinIntakeCount, 1);
    assert.strictEqual(summary.withdrawnCount, 1);
  });
});

