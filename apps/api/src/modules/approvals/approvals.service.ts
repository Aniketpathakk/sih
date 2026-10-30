import { db } from '../../database/db';
import { ProgrammeApprovalSnapshot } from '@apaar-shield/policy-fixtures';

export class ApprovalsService {
  public getApprovalsByCampus(campusId: string): any[] {
    const approvals = db.find('program_approvals', (a) => a.campus_id === campusId);
    return approvals.map((app) => {
      const prog = db.findById('programmes', app.programme_id);
      return {
        ...app,
        programmeCode: prog?.programme_code || 'UNKNOWN',
        programmeName: prog?.programme_name || 'Unknown Programme',
      };
    });
  }

  public getApprovalSnapshot(
    approvalId: string
  ): ProgrammeApprovalSnapshot | null {
    const app = db.findById('program_approvals', approvalId);
    if (!app) return null;
    const prog = db.findById('programmes', app.programme_id);

    return {
      id: app.id,
      programmeCode: prog?.programme_code || 'UNKNOWN',
      programmeName: prog?.programme_name || 'Unknown Programme',
      academicYear: app.academic_year,
      approvedIntake: app.approved_intake,
      hasNriApproval: !!app.has_nri_approval,
      hasFnOciGulfApproval: !!app.has_fn_oci_gulf_approval,
      hasTfwApproval: !!app.has_tfw_approval,
    };
  }

  public findApprovalByCodeAndYear(
    institutionId: string,
    programmeCode: string,
    academicYear: string
  ): ProgrammeApprovalSnapshot | null {
    const campuses = db.find('campuses', (c) => c.institution_id === institutionId);
    const campusIds = campuses.map((c) => c.id);

    const prog = db.findOne('programmes', (p) => p.programme_code === programmeCode);
    if (!prog) return null;

    const approval = db.findOne(
      'program_approvals',
      (a) =>
        campusIds.includes(a.campus_id) &&
        a.programme_id === prog.id &&
        a.academic_year === academicYear
    );

    if (!approval) return null;

    return {
      id: approval.id,
      programmeCode: prog.programme_code,
      programmeName: prog.programme_name,
      academicYear: approval.academic_year,
      approvedIntake: approval.approved_intake,
      hasNriApproval: !!approval.has_nri_approval,
      hasFnOciGulfApproval: !!approval.has_fn_oci_gulf_approval,
      hasTfwApproval: !!approval.has_tfw_approval,
    };
  }
}

export const approvalsService = new ApprovalsService();

