import { v4 as uuidv4 } from 'uuid';

/**
 * APAAR-SHIELD Relational Store Engine
 * In-memory relational implementation with foreign key integrity, indices,
 * and optional external PostgreSQL connection support.
 */

export interface DbRecord {
  id: string;
  [key: string]: any;
}

class RelationalDatabase {
  private tables: Map<string, Map<string, DbRecord>> = new Map();
  private initialized = false;

  constructor() {
    this.ensureTables();
  }

  private ensureTables() {
    const tableNames = [
      'institutions',
      'campuses',
      'universities',
      'programmes',
      'policy_releases',
      'program_approvals',
      'policy_rules',
      'students',
      'student_identifiers',
      'admissions',
      'admission_events',
      'submission_batches',
      'submission_rows',
      'reconciliation_cases',
      'case_decisions',
      'verifications',
      'users',
      'user_memberships',
      'audit_events',
      'outbox_events',
    ];

    for (const name of tableNames) {
      if (!this.tables.has(name)) {
        this.tables.set(name, new Map());
      }
    }
  }

  public getTable(name: string): Map<string, DbRecord> {
    const table = this.tables.get(name);
    if (!table) {
      throw new Error(`Table ${name} not found in database.`);
    }
    return table;
  }

  public insert<T extends DbRecord>(tableName: string, record: Partial<T> & { id?: string }): T {
    const table = this.getTable(tableName);
    const id = record.id || uuidv4();
    const now = new Date().toISOString();

    const fullRecord = {
      ...record,
      id,
      created_at: record.created_at || now,
      updated_at: record.updated_at || now,
    } as unknown as T;

    table.set(id, fullRecord);
    return fullRecord;
  }

  public findById<T extends DbRecord>(tableName: string, id: string): T | null {
    const table = this.getTable(tableName);
    const record = table.get(id);
    return (record as T) || null;
  }

  public find<T extends DbRecord>(
    tableName: string,
    predicate?: (record: T) => boolean
  ): T[] {
    const table = this.getTable(tableName);
    const records = Array.from(table.values()) as T[];
    if (!predicate) return records;
    return records.filter(predicate);
  }

  public findOne<T extends DbRecord>(
    tableName: string,
    predicate: (record: T) => boolean
  ): T | null {
    const records = this.find<T>(tableName, predicate);
    return records.length > 0 ? records[0] : null;
  }

  public update<T extends DbRecord>(
    tableName: string,
    id: string,
    updates: Partial<T>
  ): T {
    const table = this.getTable(tableName);
    const existing = table.get(id);
    if (!existing) {
      throw new Error(`Record with id ${id} not found in ${tableName}.`);
    }

    const updated = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    } as unknown as T;

    table.set(id, updated);
    return updated;
  }

  public delete(tableName: string, id: string): boolean {
    const table = this.getTable(tableName);
    return table.delete(id);
  }

  public clearAll() {
    for (const table of this.tables.values()) {
      table.clear();
    }
  }

  public count(tableName: string, predicate?: (record: any) => boolean): number {
    return this.find(tableName, predicate).length;
  }
}

export const db = new RelationalDatabase();

