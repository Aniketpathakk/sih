import { db } from '../../database/db';

export interface InstitutionDto {
  id: string;
  aicteInstitutionRef: string;
  officialName: string;
  institutionType: string;
  status: string;
}

export class InstitutionsService {
  public getAll(): InstitutionDto[] {
    const records = db.find('institutions');
    return records.map((r) => ({
      id: r.id,
      aicteInstitutionRef: r.aicte_institution_ref,
      officialName: r.official_name,
      institutionType: r.institution_type,
      status: r.status,
    }));
  }

  public getById(id: string): InstitutionDto | null {
    const record = db.findById('institutions', id);
    if (!record) return null;
    return {
      id: record.id,
      aicteInstitutionRef: record.aicte_institution_ref,
      officialName: record.official_name,
      institutionType: record.institution_type,
      status: record.status,
    };
  }

  public getCampuses(institutionId: string) {
    return db.find('campuses', (c) => c.institution_id === institutionId);
  }
}

export const institutionsService = new InstitutionsService();

