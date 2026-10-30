import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../database/db';
import { PurposeLimitedDisclosure } from '@apaar-shield/contracts';
import { auditService } from '../audit/audit.service';

export interface VerificationRequestPayload {
  admissionId?: string;
  studentRef?: string;
  purposeCode: string; // e.g. EMPLOYER_BACKGROUND_CHECK, SCHOLARSHIP_VALIDATION
  verifierOrgName: string;
}

export class VerificationService {
  private readonly signingSecret: string;

  constructor() {
    this.signingSecret =
      process.env.JWT_SECRET || 'apaar-shield-demo-jwt-secret-2026';
  }

  public verifyClaim(
    payload: VerificationRequestPayload
  ): PurposeLimitedDisclosure {
    let admission = null;

    if (payload.admissionId) {
      admission = db.findById('admissions', payload.admissionId);
    } else if (payload.studentRef) {
      const student = db.findOne('students', (s) => s.id === payload.studentRef);
      if (student) {
        admission = db.findOne('admissions', (a) => a.student_id === student.id);
      }
    }

    if (!admission) {
      // Pick first confirmed admission as demo fallback if query ref not found
      admission = db.findOne('admissions', (a) => a.current_status === 'CONFIRMED');
    }

    if (!admission) {
      throw new Error('No admission record found to verify.');
    }

    const student = db.findById('students', admission.student_id);
    const identifier = db.findOne('student_identifiers', (i) => i.student_id === admission.student_id);
    const approval = db.findById('program_approvals', admission.program_approval_id);
    const prog = approval ? db.findById('programmes', approval.programme_id) : null;
    const campus = approval ? db.findById('campuses', approval.campus_id) : null;
    const inst = campus ? db.findById('institutions', campus.institution_id) : null;

    const verificationId = uuidv4();
    const now = new Date();
    const verifiedAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days validity

    const studentName = student?.student_name || 'Synthetic Student';
    const maskedName =
      studentName.slice(0, 1) + '*** ' + studentName.split(' ').slice(1).join(' ');

    const claimData = {
      verificationId,
      purposeCode: payload.purposeCode,
      institution: inst?.official_name || 'AICTE Approved Institute',
      programme: prog?.programme_name || 'B.Tech Course',
      year: admission.academic_year,
      status: admission.current_status,
      isMock: true,
      timestamp: verifiedAt,
    };

    const signature = crypto
      .createHmac('sha256', this.signingSecret)
      .update(JSON.stringify(claimData))
      .digest('hex');

    db.insert('verifications', {
      id: verificationId,
      student_id: admission.student_id,
      provider_code: 'MOCK_APAAR',
      purpose_code: payload.purposeCode,
      status: 'MOCK_VERIFIED',
      is_mock: true,
      requested_at: verifiedAt,
      completed_at: verifiedAt,
    });

    auditService.log({
      actorId: payload.verifierOrgName,
      actorRole: 'VERIFIER',
      actorEmail: 'verifier@portal.gov.in',
      action: 'DISCLOSURE_VERIFICATION_REQUESTED',
      resourceType: 'verifications',
      resourceId: verificationId,
      details: {
        purpose: payload.purposeCode,
        institution: inst?.official_name,
        programme: prog?.programme_name,
      },
    });

    return {
      verificationId,
      purposeCode: payload.purposeCode,
      verifiedAt,
      isMock: true,
      status: 'MOCK_VERIFIED',
      studentReference: `STU-${identifier?.apaar_masked.slice(-4) || '0001'}`,
      maskedName,
      institutionName: inst?.official_name || 'AICTE Approved Institute',
      programmeName: prog?.programme_name || 'Engineering Programme',
      academicYear: admission.academic_year,
      admissionStatus: admission.current_status,
      signature: `SIG-SHA256-${signature.slice(0, 32)}`,
      expiresAt,
    };
  }
}

export const verificationService = new VerificationService();

