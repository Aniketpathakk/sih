import { db } from '../../database/db';
import {
  evaluateProgrammeSeats,
  ProgrammeApprovalSnapshot,
  AdmissionCandidateRecord,
} from '@apaar-shield/policy-fixtures';
import { SeatPositionSummary } from '@apaar-shield/contracts';

export class ReportsService {
  /**
   * Generates AICTE National Dashboard overview statistics
   */
  public getNationalSummary() {
    const institutions = db.find('institutions');
    const approvals = db.find('program_approvals');
    const admissions = db.find('admissions');
    const cases = db.find('reconciliation_cases');

    const totalApprovedIntake = approvals.reduce(
      (sum, a) => sum + (a.approved_intake || 0),
      0
    );
    const confirmedAdmissions = admissions.filter(
      (a) => a.current_status === 'CONFIRMED'
    ).length;
    const withdrawnAdmissions = admissions.filter(
      (a) => a.current_status === 'WITHDRAWN' || a.current_status === 'CANCELLED'
    ).length;

    const openCases = cases.filter((c) => c.status === 'OPEN').length;
    const resolvedCases = cases.filter(
      (c) => c.status === 'RESOLVED' || c.status === 'FALSE_POSITIVE'
    ).length;

    const batches = db.find('submission_batches');

    return {
      totalInstitutions: institutions.length,
      totalProgrammesApproved: approvals.length,
      totalApprovedIntake,
      totalConfirmedAdmissions: confirmedAdmissions,
      totalWithdrawnAdmissions: withdrawnAdmissions,
      overallIntakeUtilisationPct: totalApprovedIntake
        ? Math.round((confirmedAdmissions / totalApprovedIntake) * 100)
        : 0,
      openIntegrityCases: openCases,
      resolvedIntegrityCases: resolvedCases,
      totalBatchesProcessed: batches.length,
      mockIntegrationActive: true,
    };
  }

  /**
   * Evaluates seat matrix and policy compliance across programmes
   */
  public getSeatPositionSummaries(institutionId?: string): {
    summaries: SeatPositionSummary[];
    evaluations: any[];
  } {
    let approvals = db.find('program_approvals');

    if (institutionId) {
      const campuses = db.find('campuses', (c) => c.institution_id === institutionId);
      const campusIds = campuses.map((c) => c.id);
      approvals = approvals.filter((a) => campusIds.includes(a.campus_id));
    }

    const allSummaries: SeatPositionSummary[] = [];
    const allEvaluations: any[] = [];

    for (const app of approvals) {
      const prog = db.findById('programmes', app.programme_id);
      const snapshot: ProgrammeApprovalSnapshot = {
        id: app.id,
        programmeCode: prog?.programme_code || 'UNKNOWN',
        programmeName: prog?.programme_name || 'Programme',
        academicYear: app.academic_year,
        approvedIntake: app.approved_intake,
        hasNriApproval: !!app.has_nri_approval,
        hasFnOciGulfApproval: !!app.has_fn_oci_gulf_approval,
        hasTfwApproval: !!app.has_tfw_approval,
      };

      const rawAdmissions = db.find(
        'admissions',
        (a) => a.program_approval_id === app.id
      );

      const candidateRecords: AdmissionCandidateRecord[] = rawAdmissions.map((a) => ({
        id: a.id,
        admissionStatus: a.current_status,
        seatCategory: a.seat_category,
        entryType: a.entry_type,
        academicYear: a.academic_year,
      }));

      const { evaluations, summary } = evaluateProgrammeSeats(
        snapshot,
        candidateRecords
      );

      allSummaries.push(summary);
      allEvaluations.push(...evaluations);
    }

    return {
      summaries: allSummaries,
      evaluations: allEvaluations,
    };
  }
}

export const reportsService = new ReportsService();

