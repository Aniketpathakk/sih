import { v4 as uuidv4 } from 'uuid';
import { db } from '../../database/db';
import { AdmissionStatus } from '@apaar-shield/contracts';
import { auditService } from '../audit/audit.service';

export interface AdmissionEventPayload {
  eventType: 'WITHDRAWAL' | 'CANCELLATION' | 'TRANSFER' | 'CORRECTION';
  reason: string;
  actorId: string;
  sourceSystem?: string;
}

export class AdmissionsService {
  public getAdmissions(filters?: {
    institutionId?: string;
    programmeCode?: string;
    academicYear?: string;
  }) {
    let admissions = db.find('admissions');

    if (filters?.academicYear) {
      admissions = admissions.filter((a) => a.academic_year === filters.academicYear);
    }

    if (filters?.institutionId) {
      const campuses = db.find('campuses', (c) => c.institution_id === filters.institutionId);
      const campusIds = campuses.map((c) => c.id);
      const approvals = db.find('program_approvals', (a) => campusIds.includes(a.campus_id));
      const approvalIds = approvals.map((a) => a.id);
      admissions = admissions.filter((a) => approvalIds.includes(a.program_approval_id));
    }

    return admissions.map((a) => this.mapAdmission(a));
  }

  public getById(id: string) {
    const admission = db.findById('admissions', id);
    if (!admission) return null;
    return this.mapAdmission(admission);
  }

  public getHistory(admissionId: string) {
    return db.find('admission_events', (e) => e.admission_id === admissionId);
  }

  public submitLifecycleEvent(
    admissionId: string,
    payload: AdmissionEventPayload
  ) {
    const admission = db.findById('admissions', admissionId);
    if (!admission) {
      throw new Error(`Admission ${admissionId} not found.`);
    }

    let newStatus: AdmissionStatus = admission.current_status;
    if (payload.eventType === 'WITHDRAWAL') {
      newStatus = 'WITHDRAWN';
    } else if (payload.eventType === 'CANCELLATION') {
      newStatus = 'CANCELLED';
    } else if (payload.eventType === 'TRANSFER') {
      newStatus = 'TRANSFERRED';
    }

    // Insert immutable lifecycle event
    const eventId = uuidv4();
    const event = db.insert('admission_events', {
      id: eventId,
      admission_id: admissionId,
      event_type: payload.eventType,
      previous_status: admission.current_status,
      new_status: newStatus,
      source_system: payload.sourceSystem || 'INSTITUTION_PORTAL',
      event_reason: payload.reason,
      occurred_at: new Date().toISOString(),
      actor_id: payload.actorId,
    });

    // Update current admission status
    const updatedAdmission = db.update('admissions', admissionId, {
      current_status: newStatus,
    });

    auditService.log({
      actorId: payload.actorId,
      actorRole: 'ADMISSION_OPERATOR',
      actorEmail: 'admissions@college.ac.in',
      action: `ADMISSION_${payload.eventType}`,
      resourceType: 'admissions',
      resourceId: admissionId,
      details: {
        previousStatus: admission.current_status,
        newStatus,
        reason: payload.reason,
      },
    });

    return {
      admission: this.mapAdmission(updatedAdmission),
      event,
    };
  }

  private mapAdmission(a: any) {
    const student = db.findById('students', a.student_id);
    const identifier = db.findOne('student_identifiers', (i) => i.student_id === a.student_id);
    const approval = db.findById('program_approvals', a.program_approval_id);
    const prog = approval ? db.findById('programmes', approval.programme_id) : null;
    const campus = approval ? db.findById('campuses', approval.campus_id) : null;
    const inst = campus ? db.findById('institutions', campus.institution_id) : null;

    return {
      id: a.id,
      studentId: a.student_id,
      studentName: student?.student_name || 'Student',
      apaarMasked: identifier?.apaar_masked || 'XXXXXXXXXXXX',
      verificationStatus: identifier?.verification_status || 'MOCK_VERIFIED',
      institutionId: inst?.id,
      institutionName: inst?.official_name || 'Institution',
      programmeCode: prog?.programme_code || 'PROG',
      programmeName: prog?.programme_name || 'Programme',
      academicYear: a.academic_year,
      admissionDate: a.admission_date,
      admissionRoute: a.admission_route,
      seatCategory: a.seat_category,
      entryType: a.entry_type,
      currentStatus: a.current_status,
      sourceRecordId: a.source_record_id,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
    };
  }
}

export const admissionsService = new AdmissionsService();

