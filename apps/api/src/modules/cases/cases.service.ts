import { v4 as uuidv4 } from 'uuid';
import { db } from '../../database/db';
import { CaseStatus, ReconciliationCase } from '@apaar-shield/contracts';
import { reconciliationService } from '../reconciliation/reconciliation.service';
import { auditService } from '../audit/audit.service';

export interface DecisionPayload {
  decision: CaseStatus; // FALSE_POSITIVE | CORRECTION_REQUESTED | RESOLVED | ESCALATED
  reason: string;
  reviewerId: string;
}

export class CasesService {
  public getAll(filters?: { status?: string; institutionId?: string }) {
    return reconciliationService.getCases(filters);
  }

  public getById(id: string): ReconciliationCase | null {
    return reconciliationService.getCaseById(id);
  }

  public decideCase(caseId: string, payload: DecisionPayload): ReconciliationCase {
    const existing = db.findById('reconciliation_cases', caseId);
    if (!existing) {
      throw new Error(`Case ${caseId} not found.`);
    }

    const decisionId = uuidv4();
    const decidedAt = new Date().toISOString();

    db.insert('case_decisions', {
      id: decisionId,
      case_id: caseId,
      decision: payload.decision,
      reason: payload.reason,
      reviewer_id: payload.reviewerId,
      decided_at: decidedAt,
    });

    const updated = db.update('reconciliation_cases', caseId, {
      status: payload.decision,
      decision_notes: payload.reason,
      decided_by: payload.reviewerId,
      decided_at: decidedAt,
    });

    auditService.log({
      actorId: payload.reviewerId,
      actorRole: 'AICTE_OFFICER',
      actorEmail: 'officer@aicte.gov.in',
      action: 'CASE_ADJUDICATED',
      resourceType: 'reconciliation_cases',
      resourceId: caseId,
      details: {
        newStatus: payload.decision,
        reason: payload.reason,
      },
    });

    return reconciliationService.getCaseById(caseId)!;
  }
}

export const casesService = new CasesService();

