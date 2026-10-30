import { v4 as uuidv4 } from 'uuid';
import { db } from '../../database/db';
import { AuditEvent, UserRole } from '@apaar-shield/contracts';
import { identityService } from '../identity/identity.service';

export interface AuditLogInput {
  actorId: string;
  actorRole: UserRole;
  actorEmail: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

export class AuditService {
  public log(input: AuditLogInput): AuditEvent {
    const id = uuidv4();
    const now = new Date().toISOString();

    // Ensure strict privacy sanitization
    const sanitizedDetails = identityService.sanitizeLogPayload(
      input.details || {}
    );

    const record = db.insert('audit_events', {
      id,
      actor_id: input.actorId,
      actor_role: input.actorRole,
      actor_email: input.actorEmail,
      action: input.action,
      resource_type: input.resourceType,
      resource_id: input.resourceId,
      details_json: sanitizedDetails,
      ip_address: input.ipAddress || '127.0.0.1',
      occurred_at: now,
    });

    return {
      id,
      actorId: input.actorId,
      actorRole: input.actorRole,
      actorEmail: input.actorEmail,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      occurredAt: now,
      ipAddress: input.ipAddress || '127.0.0.1',
      details: sanitizedDetails,
    };
  }

  public getRecent(limit: number = 50): AuditEvent[] {
    const events = db.find('audit_events');
    events.sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
    return events.slice(0, limit).map((e) => ({
      id: e.id,
      actorId: e.actor_id,
      actorRole: e.actor_role,
      actorEmail: e.actor_email,
      action: e.action,
      resourceType: e.resource_type,
      resourceId: e.resource_id,
      occurredAt: e.occurred_at,
      ipAddress: e.ip_address,
      details: e.details_json,
    }));
  }
}

export const auditService = new AuditService();

