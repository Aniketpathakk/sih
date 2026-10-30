import { v4 as uuidv4 } from 'uuid';
import { db } from '../../database/db';
import {
  BatchStatus,
  CanonicalRow,
  RowIssue,
  RowValidationStatus,
  SubmissionBatch,
} from '@apaar-shield/contracts';
import { identityService } from '../identity/identity.service';
import { mockApaarProvider } from '../integrations/mock-apaar.provider';
import { approvalsService } from '../approvals/approvals.service';
import { reconciliationService } from '../reconciliation/reconciliation.service';
import { auditService } from '../audit/audit.service';

export class SubmissionsService {
  /**
   * Parses and stages batch records with schema & format checks
   */
  public async createBatch(
    institutionId: string,
    academicYear: string,
    fileName: string,
    rawRows: any[],
    idempotencyKey?: string,
    submittedBy: string = 'inst-admin-01'
  ): Promise<SubmissionBatch> {
    // Check idempotency
    if (idempotencyKey) {
      const existing = db.findOne(
        'submission_batches',
        (b) => b.idempotency_key === idempotencyKey
      );
      if (existing) {
        return this.mapBatch(existing);
      }
    }

    const batchId = uuidv4();
    const stagedRows: CanonicalRow[] = [];
    const seenHmacsInBatch = new Set<string>();

    let validCount = 0;
    let warningCount = 0;
    let errorCount = 0;

    for (let index = 0; index < rawRows.length; index++) {
      const raw = rawRows[index];
      const rowNumber = index + 1;
      const issues: RowIssue[] = [];
      let rowStatus: RowValidationStatus = 'VALID';

      const sourceRecordId = (raw.source_record_id || raw.sourceRecordId || `SRC-${rowNumber}`).trim();
      const studentName = (raw.student_name || raw.studentName || '').trim();
      const apaarRaw = (raw.apaar_reference || raw.apaarReference || raw.apaar || '').trim();
      const programmeCode = (raw.programme_code || raw.programmeCode || '').trim();
      const admissionRoute = (raw.admission_route || raw.admissionRoute || 'STATE_COUNSELLING').trim();
      const seatCategory = (raw.seat_category || raw.seatCategory || 'GENERAL').trim();
      const entryType = (raw.entry_type || raw.entryType || 'FIRST_YEAR').trim();
      const admissionDate = (raw.admission_date || raw.admissionDate || new Date().toISOString().slice(0, 10)).trim();

      // Check required fields
      if (!studentName) {
        issues.push({
          column: 'student_name',
          code: 'MISSING_STUDENT_NAME',
          message: 'Student name is mandatory.',
          severity: 'ERROR',
          suggestedFix: 'Provide full student legal name as per secondary certificate.',
        });
        rowStatus = 'ERROR';
      }

      // Check APAAR format
      if (!apaarRaw) {
        issues.push({
          column: 'apaar_reference',
          code: 'MISSING_APAAR',
          message: 'APAAR reference is mandatory for regulatory submission.',
          severity: 'ERROR',
          suggestedFix: 'Provide valid 12-digit APAAR ID.',
        });
        rowStatus = 'ERROR';
      } else if (!identityService.isValidApaarFormat(apaarRaw)) {
        issues.push({
          column: 'apaar_reference',
          code: 'INVALID_APAAR_FORMAT',
          message: `APAAR '${apaarRaw}' is not a valid 12-digit numeric identifier.`,
          severity: 'ERROR',
          suggestedFix: 'Check typing errors; APAAR must contain exactly 12 digits.',
        });
        rowStatus = 'ERROR';
      }

      // Check duplicate in same batch (T06)
      const hmac = identityService.computeHmac(apaarRaw);
      if (seenHmacsInBatch.has(hmac)) {
        issues.push({
          column: 'apaar_reference',
          code: 'BATCH_DUPLICATE_ROW',
          message: `Duplicate student entry detected within this batch.`,
          severity: 'ERROR',
          suggestedFix: 'Remove or consolidate duplicate student row in CSV before certifying.',
        });
        rowStatus = 'DUPLICATE';
      } else {
        seenHmacsInBatch.add(hmac);
      }

      // Check programme approval exists for institution (T08)
      const approval = approvalsService.findApprovalByCodeAndYear(
        institutionId,
        programmeCode,
        academicYear
      );

      if (!approval) {
        issues.push({
          column: 'programme_code',
          code: 'NO_ACTIVE_APPROVAL',
          message: `No approved intake snapshot found for course '${programmeCode}' in year '${academicYear}'.`,
          severity: 'ERROR',
          suggestedFix: 'Verify programme code against AICTE Extension of Approval (EoA).',
        });
        rowStatus = 'ERROR';
      }

      // Mask and vault
      const masked = identityService.maskApaar(apaarRaw);

      if (rowStatus === 'ERROR' || rowStatus === 'DUPLICATE') {
        errorCount++;
      } else if (issues.some((i) => i.severity === 'WARNING')) {
        rowStatus = 'WARNING';
        warningCount++;
      } else {
        validCount++;
      }

      // Save row to DB
      db.insert('submission_rows', {
        id: uuidv4(),
        batch_id: batchId,
        row_number: rowNumber,
        source_record_id: sourceRecordId,
        student_name: studentName,
        apaar_raw: apaarRaw, // Used during staging only, wiped upon commit
        apaar_masked: masked,
        apaar_hmac: hmac,
        programme_code: programmeCode,
        admission_route: admissionRoute,
        seat_category: seatCategory,
        entry_type: entryType,
        admission_date: admissionDate,
        status: rowStatus,
        issues_json: issues,
      });

      stagedRows.push({
        rowNumber,
        sourceRecordId,
        studentName,
        apaarReference: apaarRaw,
        apaarMasked: masked,
        apaarHmac: hmac,
        programmeCode,
        academicYear,
        admissionDate,
        admissionRoute: admissionRoute as any,
        seatCategory: seatCategory as any,
        entryType: entryType as any,
        status: rowStatus,
        issues,
      });
    }

    const batchStatus: BatchStatus =
      errorCount > 0 ? 'VALIDATED_WITH_ISSUES' : 'VALIDATED';

    const batchRecord = db.insert('submission_batches', {
      id: batchId,
      institution_id: institutionId,
      academic_year: academicYear,
      file_name: fileName,
      total_rows: rawRows.length,
      valid_rows: validCount,
      warning_rows: warningCount,
      error_rows: errorCount,
      status: batchStatus,
      idempotency_key: idempotencyKey,
      submitted_by: submittedBy,
    });

    auditService.log({
      actorId: submittedBy,
      actorRole: 'INSTITUTION_ADMIN',
      actorEmail: 'admin@college.ac.in',
      action: 'BATCH_UPLOADED',
      resourceType: 'submission_batches',
      resourceId: batchId,
      details: {
        fileName,
        totalRows: rawRows.length,
        validCount,
        errorCount,
      },
    });

    return this.mapBatch(batchRecord);
  }

  public getBatch(batchId: string): SubmissionBatch | null {
    const record = db.findById('submission_batches', batchId);
    if (!record) return null;
    return this.mapBatch(record);
  }

  public getBatchRows(batchId: string) {
    return db.find('submission_rows', (r) => r.batch_id === batchId);
  }

  /**
   * Formally certifies and commits valid staging rows to the primary admissions ledger
   */
  public async certifyBatch(
    batchId: string,
    certifiedBy: string = 'inst-principal-01'
  ): Promise<SubmissionBatch> {
    const batch = db.findById('submission_batches', batchId);
    if (!batch) {
      throw new Error(`Batch ${batchId} not found.`);
    }

    if (batch.status === 'COMMITTED') {
      return this.mapBatch(batch);
    }

    const rows = db.find(
      'submission_rows',
      (r) => r.batch_id === batchId && (r.status === 'VALID' || r.status === 'WARNING')
    );

    for (const row of rows) {
      const studentId = uuidv4();
      const admissionId = uuidv4();

      // 1. Resolve approval
      const approval = approvalsService.findApprovalByCodeAndYear(
        batch.institution_id,
        row.programme_code,
        batch.academic_year
      );

      if (!approval) continue;

      // 2. Insert Student
      db.insert('students', {
        id: studentId,
        source_system: 'INSTITUTION_ERP',
        student_name: row.student_name,
      });

      // 3. Vault APAAR reference
      const enc = identityService.encryptApaar(row.apaar_raw || '900000000000');
      db.insert('student_identifiers', {
        id: uuidv4(),
        student_id: studentId,
        identifier_type: 'APAAR',
        identifier_ciphertext: enc.ciphertext,
        identifier_iv: enc.iv,
        identifier_tag: enc.tag,
        apaar_hmac: enc.hmac,
        apaar_masked: enc.masked,
        verification_status: 'MOCK_VERIFIED',
        is_mock: true,
        verified_at: new Date().toISOString(),
      });

      // 4. Create Admission
      db.insert('admissions', {
        id: admissionId,
        student_id: studentId,
        program_approval_id: approval.id,
        academic_year: batch.academic_year,
        admission_date: row.admission_date,
        admission_route: row.admission_route,
        seat_category: row.seat_category,
        entry_type: row.entry_type,
        current_status: 'CONFIRMED',
        source_record_id: row.source_record_id,
      });

      // 5. Append immutable admission event (CONFIRMATION)
      db.insert('admission_events', {
        id: uuidv4(),
        admission_id: admissionId,
        event_type: 'CONFIRMATION',
        previous_status: null,
        new_status: 'CONFIRMED',
        source_system: 'INSTITUTION_SUBMISSION_BATCH',
        event_reason: 'Institutional batch certified and committed.',
        actor_id: certifiedBy,
        occurred_at: new Date().toISOString(),
      });

      // 6. Check for duplicate or cross-institution conflicts
      reconciliationService.detectConflictsForAdmission(
        admissionId,
        enc.hmac,
        enc.masked,
        row.student_name,
        batch.institution_id,
        batch.academic_year
      );

      // Cleanse raw APAAR from staging row for privacy compliance
      delete row.apaar_raw;
    }

    const updated = db.update('submission_batches', batchId, {
      status: 'COMMITTED',
      certified_by: certifiedBy,
      certified_at: new Date().toISOString(),
    });

    auditService.log({
      actorId: certifiedBy,
      actorRole: 'INSTITUTION_ADMIN',
      actorEmail: 'principal@college.ac.in',
      action: 'BATCH_CERTIFIED',
      resourceType: 'submission_batches',
      resourceId: batchId,
      details: { committedRows: rows.length },
    });

    return this.mapBatch(updated);
  }

  private mapBatch(r: any): SubmissionBatch {
    return {
      id: r.id,
      institutionId: r.institution_id,
      academicYear: r.academic_year,
      fileName: r.file_name,
      totalRows: r.total_rows,
      validRows: r.valid_rows,
      warningRows: r.warning_rows,
      errorRows: r.error_rows,
      status: r.status,
      submittedAt: r.created_at,
      submittedBy: r.submitted_by,
      certifiedAt: r.certified_at,
      certifiedBy: r.certified_by,
      isMock: true,
    };
  }
}

export const submissionsService = new SubmissionsService();

