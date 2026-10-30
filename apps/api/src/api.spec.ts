import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { runSeed } from './seeds/seed';
import { submissionsService } from './modules/submissions/submissions.service';
import { admissionsService } from './modules/admissions/admissions.service';
import { casesService } from './modules/cases/cases.service';
import { verificationService } from './modules/verification/verification.service';
import { reportsService } from './modules/reports/reports.service';

describe('APAAR-SHIELD Backend Modular Monolith Integration Tests', () => {
  before(() => {
    runSeed();
  });

  it('T01 & T02: Ingestion parses CSV rows and flags invalid APAAR format', async () => {
    const rawRows = [
      {
        sourceRecordId: 'TEST-ROW-01',
        studentName: 'Valid Student',
        apaarReference: '900000001001',
        programmeCode: 'BTECH-CSE',
        seatCategory: 'GENERAL',
        admissionRoute: 'STATE_COUNSELLING',
      },
      {
        sourceRecordId: 'TEST-ROW-02',
        studentName: 'Malformed Student',
        apaarReference: '90000000000X', // invalid format
        programmeCode: 'BTECH-CSE',
        seatCategory: 'GENERAL',
        admissionRoute: 'STATE_COUNSELLING',
      },
    ];

    const batch = await submissionsService.createBatch(
      'inst-alpha-001',
      '2026-27',
      'test_upload.csv',
      rawRows
    );

    assert.strictEqual(batch.totalRows, 2);
    assert.strictEqual(batch.validRows, 1);
    assert.strictEqual(batch.errorRows, 1);
    assert.strictEqual(batch.status, 'VALIDATED_WITH_ISSUES');

    const rows = submissionsService.getBatchRows(batch.id);
    const errorRow = rows.find((r) => r.source_record_id === 'TEST-ROW-02');
    assert.strictEqual(errorRow?.status, 'ERROR');
  });

  it('T07: Idempotency check prevents duplicate batch processing', async () => {
    const rawRows = [
      {
        sourceRecordId: 'IDEMP-01',
        studentName: 'Idempotency Student',
        apaarReference: '900000002001',
        programmeCode: 'BTECH-CSE',
      },
    ];

    const batch1 = await submissionsService.createBatch(
      'inst-alpha-001',
      '2026-27',
      'idemp.csv',
      rawRows,
      'IDEMP-KEY-999'
    );

    const batch2 = await submissionsService.createBatch(
      'inst-alpha-001',
      '2026-27',
      'idemp.csv',
      rawRows,
      'IDEMP-KEY-999'
    );

    assert.strictEqual(batch1.id, batch2.id);
  });

  it('T14: Admission withdrawal appends lifecycle event and updates status', () => {
    const admissions = admissionsService.getAdmissions({
      institutionId: 'inst-alpha-001',
    });
    const candidate = admissions.find((a) => a.currentStatus === 'CONFIRMED');
    assert.ok(candidate);

    const result = admissionsService.submitLifecycleEvent(candidate.id, {
      eventType: 'WITHDRAWAL',
      reason: 'Student transferred to IIT Bombay.',
      actorId: 'test-operator',
    });

    assert.strictEqual(result.admission.currentStatus, 'WITHDRAWN');

    const history = admissionsService.getHistory(candidate.id);
    assert.ok(history.length >= 2);
    const withdrawalEvent = history.find((e) => e.event_type === 'WITHDRAWAL');
    assert.strictEqual(withdrawalEvent?.new_status, 'WITHDRAWN');
  });

  it('T16: Cross-institution concurrent enrolment is registered as a review case', () => {
    const cases = casesService.getAll({ status: 'OPEN' });
    const conflictCase = cases.find(
      (c) => c.caseType === 'POSSIBLE_CONCURRENT_ENROLMENT'
    );

    assert.ok(conflictCase);
    assert.strictEqual(conflictCase.severity, 'HIGH');
    assert.strictEqual(conflictCase.studentMaskedName, 'Synthetic Aryan Sharma');
  });

  it('T22: Case adjudication preserves evidence and updates status to FALSE_POSITIVE', () => {
    const cases = casesService.getAll({ status: 'OPEN' });
    const targetCase = cases[0];
    assert.ok(targetCase);

    const updated = casesService.decideCase(targetCase.id, {
      decision: 'FALSE_POSITIVE',
      reason:
        'Reviewed under UGC Simultaneous Programme Guidelines: evening diploma and morning degree compatible.',
      reviewerId: 'aicte-director-01',
    });

    assert.strictEqual(updated.status, 'FALSE_POSITIVE');
    assert.strictEqual(updated.decidedBy, 'aicte-director-01');
  });

  it('T29: Purpose-limited disclosure returns minimal permitted claims without raw APAAR', () => {
    const disclosure = verificationService.verifyClaim({
      purposeCode: 'EMPLOYMENT_BACKGROUND_CHECK',
      verifierOrgName: 'Tata Consultancy Services HR',
    });

    assert.strictEqual(disclosure.purposeCode, 'EMPLOYMENT_BACKGROUND_CHECK');
    assert.strictEqual(disclosure.status, 'MOCK_VERIFIED');
    assert.strictEqual(disclosure.isMock, true);
    assert.ok(disclosure.signature.startsWith('SIG-SHA256-'));
    assert.ok(disclosure.studentReference.startsWith('STU-'));
    assert.strictEqual(disclosure.maskedName.includes('***'), true);
  });

  it('National summary report calculates utilisation accurately', () => {
    const summary = reportsService.getNationalSummary();
    assert.strictEqual(summary.totalInstitutions >= 3, true);
    assert.ok(summary.totalApprovedIntake > 0);
    assert.ok(summary.totalConfirmedAdmissions > 0);
  });
});

