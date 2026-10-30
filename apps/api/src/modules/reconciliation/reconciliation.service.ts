import { v4 as uuidv4 } from 'uuid';
import { db } from '../../database/db';
import { ReconciliationCase } from '@apaar-shield/contracts';
import { auditService } from '../audit/audit.service';

export class ReconciliationService {
  /**
   * Evaluates newly committed admission against existing records across all institutions.
   */
  public detectConflictsForAdmission(
    currentAdmissionId: string,
    apaarHmac: string,
    apaarMasked: string,
    studentName: string,
    institutionId: string,
    academicYear: string
  ): ReconciliationCase | null {
    // Find other student identifiers with matching HMAC
    const matchingIdentifiers = db.find(
      'student_identifiers',
      (idRecord) => idRecord.apaar_hmac === apaarHmac
    );

    const matchingStudentIds = matchingIdentifiers.map((i) => i.student_id);

    // Find admissions belonging to these student IDs
    const otherAdmissions = db.find(
      'admissions',
      (a) =>
        matchingStudentIds.includes(a.student_id) &&
        a.id !== currentAdmissionId &&
        a.current_status === 'CONFIRMED'
    );

    if (otherAdmissions.length === 0) {
      return null;
    }

    // Examine the other admission
    const conflictingAdmission = otherAdmissions[0];
    const conflictingApproval = db.findById(
      'program_approvals',
      conflictingAdmission.program_approval_id
    );
    const conflictingCampus = conflictingApproval
      ? db.findById('campuses', conflictingApproval.campus_id)
      : null;
    const conflictingInstitutionId = conflictingCampus?.institution_id;

    // Check if the other admission is in the same institution or a different one
    const currentInst = db.findById('institutions', institutionId);
    const otherInst = conflictingInstitutionId
      ? db.findById('institutions', conflictingInstitutionId)
      : null;

    const caseType =
      conflictingInstitutionId === institutionId
        ? 'EXACT_DUPLICATE_SUBMISSION'
        : 'POSSIBLE_CONCURRENT_ENROLMENT';

    // Check if a case already exists for this pair
    const existingCase = db.findOne(
      'reconciliation_cases',
      (c) =>
        c.apaar_hmac === apaarHmac &&
        (c.admission_a_id === currentAdmissionId ||
          c.admission_b_id === currentAdmissionId)
    );

    if (existingCase) {
      return this.mapCase(existingCase);
    }

    const caseId = uuidv4();
    const caseRecord = db.insert('reconciliation_cases', {
      id: caseId,
      case_type: caseType,
      severity: caseType === 'POSSIBLE_CONCURRENT_ENROLMENT' ? 'HIGH' : 'MEDIUM',
      status: 'OPEN',
      academic_year: academicYear,
      student_ref: `STU-${apaarMasked.slice(-4)}`,
      student_masked_name: studentName,
      apaar_masked: apaarMasked,
      apaar_hmac: apaarHmac,
      institution_a_id: institutionId,
      admission_a_id: currentAdmissionId,
      institution_b_id: conflictingInstitutionId || institutionId,
      admission_b_id: conflictingAdmission.id,
      evidence_summary:
        caseType === 'POSSIBLE_CONCURRENT_ENROLMENT'
          ? `Active concurrent enrolment detected between '${currentInst?.official_name}' and '${otherInst?.official_name}' for academic year ${academicYear}. Requires review against UGC Simultaneous Academic Programme Guidelines.`
          : `Duplicate confirmed admission submitted within the same institution.`,
      policy_clause_ref:
        'UGC Guidelines for Pursuing Two Academic Programmes Simultaneously (April 2022) / AICTE Invariant 10',
    });

    auditService.log({
      actorId: 'SYSTEM_RECONCILIATION_ENGINE',
      actorRole: 'AICTE_OFFICER',
      actorEmail: 'system.engine@aicte.gov.in',
      action: 'RECONCILIATION_CASE_OPENED',
      resourceType: 'reconciliation_cases',
      resourceId: caseId,
      details: {
        caseType,
        apaarMasked,
        institutionA: currentInst?.official_name,
        institutionB: otherInst?.official_name,
      },
    });

    return this.mapCase(caseRecord);
  }

  public getCases(filters?: { status?: string; institutionId?: string }) {
    let cases = db.find('reconciliation_cases');
    if (filters?.status) {
      cases = cases.filter((c) => c.status === filters.status);
    }
    if (filters?.institutionId) {
      cases = cases.filter(
        (c) =>
          c.institution_a_id === filters.institutionId ||
          c.institution_b_id === filters.institutionId
      );
    }
    return cases.map((c) => this.mapCase(c));
  }

  public getCaseById(id: string): ReconciliationCase | null {
    const record = db.findById('reconciliation_cases', id);
    if (!record) return null;
    return this.mapCase(record);
  }

  private mapCase(c: any): ReconciliationCase {
    const instA = db.findById('institutions', c.institution_a_id);
    const instB = c.institution_b_id
      ? db.findById('institutions', c.institution_b_id)
      : null;

    return {
      id: c.id,
      caseType: c.case_type,
      severity: c.severity,
      status: c.status,
      academicYear: c.academic_year,
      studentRef: c.student_ref,
      studentMaskedName: c.student_masked_name,
      apaarMasked: c.apaar_masked,
      institutionIdA: c.institution_a_id,
      institutionNameA: instA?.official_name || 'Institution A',
      admissionIdA: c.admission_a_id,
      institutionIdB: c.institution_b_id,
      institutionNameB: instB?.official_name || 'Institution B',
      admissionIdB: c.admission_b_id,
      evidenceSummary: c.evidence_summary,
      policyClauseRef: c.policy_clause_ref,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      decisionNotes: c.decision_notes,
      decidedBy: c.decided_by,
      decidedAt: c.decided_at,
    };
  }
}

export const reconciliationService = new ReconciliationService();

