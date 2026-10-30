import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { identityService } from '../modules/identity/identity.service';
import { reconciliationService } from '../modules/reconciliation/reconciliation.service';
import { APH_2024_27_METADATA } from '@apaar-shield/policy-fixtures';

export function runSeed() {
  console.log('🌱 Starting APAAR-SHIELD Synthetic Data Seeding...');
  db.clearAll();

  // 1. Policy Release
  const policyReleaseId = uuidv4();
  db.insert('policy_releases', {
    id: policyReleaseId,
    authority: 'AICTE',
    policy_name: 'AICTE Approval Process Handbook 2024-2027',
    policy_version: APH_2024_27_METADATA.policyVersion,
    source_document_uri: APH_2024_27_METADATA.sourceUri,
    applicable_from_year: '2024-25',
    applicable_to_year: '2026-27',
    status: 'PUBLISHED',
    reviewed_by: 'AICTE Regulation Bureau',
  });

  // 2. Institutions
  const instAlphaId = 'inst-alpha-001';
  const instBetaId = 'inst-beta-002';
  const instGammaId = 'inst-gamma-003';

  db.insert('institutions', {
    id: instAlphaId,
    aicte_institution_ref: '1-3324567891',
    official_name: 'Alpha Institute of Technology (Autonomous)',
    institution_type: 'PRIVATE_UNAIDED',
    status: 'ACTIVE',
  });

  db.insert('institutions', {
    id: instBetaId,
    aicte_institution_ref: '1-3324567892',
    official_name: 'Beta College of Engineering & Research',
    institution_type: 'STATE_AFFILIATED',
    status: 'ACTIVE',
  });

  db.insert('institutions', {
    id: instGammaId,
    aicte_institution_ref: '1-3324567893',
    official_name: 'Gamma Technical Institute',
    institution_type: 'POLYTECHNIC_TECHNICAL',
    status: 'ACTIVE',
  });

  // 3. Campuses
  const campusAlphaId = 'campus-alpha-001';
  const campusBetaId = 'campus-beta-002';
  const campusGammaId = 'campus-gamma-003';

  db.insert('campuses', {
    id: campusAlphaId,
    institution_id: instAlphaId,
    campus_name: 'AIT Main Campus, Knowledge Park',
    status: 'ACTIVE',
  });

  db.insert('campuses', {
    id: campusBetaId,
    institution_id: instBetaId,
    campus_name: 'BCER City Campus',
    status: 'ACTIVE',
  });

  db.insert('campuses', {
    id: campusGammaId,
    institution_id: instGammaId,
    campus_name: 'GTI Industrial Campus',
    status: 'ACTIVE',
  });

  // 4. Programmes
  const progCseId = 'prog-cse-01';
  const progEceId = 'prog-ece-02';
  const progMechId = 'prog-mech-03';
  const progMcaId = 'prog-mca-04';

  db.insert('programmes', {
    id: progCseId,
    programme_code: 'BTECH-CSE',
    programme_name: 'B.Tech Computer Science and Engineering',
    programme_level: 'UNDERGRADUATE',
    discipline_code: 'ENGG',
  });

  db.insert('programmes', {
    id: progEceId,
    programme_code: 'BTECH-ECE',
    programme_name: 'B.Tech Electronics & Communication Engineering',
    programme_level: 'UNDERGRADUATE',
    discipline_code: 'ENGG',
  });

  db.insert('programmes', {
    id: progMechId,
    programme_code: 'BTECH-MECH',
    programme_name: 'B.Tech Mechanical Engineering',
    programme_level: 'UNDERGRADUATE',
    discipline_code: 'ENGG',
  });

  db.insert('programmes', {
    id: progMcaId,
    programme_code: 'MCA',
    programme_name: 'Master of Computer Applications',
    programme_level: 'POSTGRADUATE',
    discipline_code: 'COMP_APP',
  });

  // 5. Program Approvals (AY 2026-27)
  const appAlphaCseId = 'app-alpha-cse-2026';
  const appAlphaEceId = 'app-alpha-ece-2026';
  const appBetaCseId = 'app-beta-cse-2026';
  const appGammaMechId = 'app-gamma-mech-2026';

  db.insert('program_approvals', {
    id: appAlphaCseId,
    campus_id: campusAlphaId,
    programme_id: progCseId,
    academic_year: '2026-27',
    approved_intake: 120,
    has_nri_approval: true,
    has_fn_oci_gulf_approval: true,
    has_tfw_approval: true,
    approval_reference: 'AICTE/CR/2026-27/1-3324567891/AIT-CSE',
    source_document_uri: 'https://aicte.gov.in/eoa/2026-27/1-3324567891.pdf',
    policy_release_id: policyReleaseId,
  });

  db.insert('program_approvals', {
    id: appAlphaEceId,
    campus_id: campusAlphaId,
    programme_id: progEceId,
    academic_year: '2026-27',
    approved_intake: 60,
    has_nri_approval: true,
    has_fn_oci_gulf_approval: false,
    has_tfw_approval: true,
    approval_reference: 'AICTE/CR/2026-27/1-3324567891/AIT-ECE',
    source_document_uri: 'https://aicte.gov.in/eoa/2026-27/1-3324567891.pdf',
    policy_release_id: policyReleaseId,
  });

  db.insert('program_approvals', {
    id: appBetaCseId,
    campus_id: campusBetaId,
    programme_id: progCseId,
    academic_year: '2026-27',
    approved_intake: 60,
    has_nri_approval: false,
    has_fn_oci_gulf_approval: false,
    has_tfw_approval: true,
    approval_reference: 'AICTE/CR/2026-27/1-3324567892/BCER-CSE',
    source_document_uri: 'https://aicte.gov.in/eoa/2026-27/1-3324567892.pdf',
    policy_release_id: policyReleaseId,
  });

  db.insert('program_approvals', {
    id: appGammaMechId,
    campus_id: campusGammaId,
    programme_id: progMechId,
    academic_year: '2026-27',
    approved_intake: 60,
    has_nri_approval: false,
    has_fn_oci_gulf_approval: false,
    has_tfw_approval: true,
    approval_reference: 'AICTE/CR/2026-27/1-3324567893/GTI-MECH',
    source_document_uri: 'https://aicte.gov.in/eoa/2026-27/1-3324567893.pdf',
    policy_release_id: policyReleaseId,
  });

  // 6. Users
  db.insert('users', {
    id: 'user-inst-admin',
    email: 'admin@alpha.ac.in',
    full_name: 'Prof. Rajesh K. Varma',
    role: 'INSTITUTION_ADMIN',
  });

  db.insert('users', {
    id: 'user-aicte-officer',
    email: 'officer.reg@aicte.gov.in',
    full_name: 'Dr. Sunita Deshmukh',
    role: 'AICTE_OFFICER',
  });

  // 7. Seed Admissions & Students (Synthetic Data Generator)
  console.log('Creating 300 synthetic students with planted regulatory scenarios...');

  // Helper to insert a student & admission
  function createStudentAdmission(
    apaarNum: number,
    name: string,
    appId: string,
    category: string,
    route: string,
    entryType: string = 'FIRST_YEAR',
    status: string = 'CONFIRMED'
  ) {
    const studentId = uuidv4();
    const admissionId = uuidv4();
    const apaarStr = String(apaarNum).padStart(12, '900000000000');

    db.insert('students', {
      id: studentId,
      source_system: 'SEED_DATASET',
      student_name: name,
    });

    const enc = identityService.encryptApaar(apaarStr);
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
      verified_at: '2026-08-15T10:00:00Z',
    });

    db.insert('admissions', {
      id: admissionId,
      student_id: studentId,
      program_approval_id: appId,
      academic_year: '2026-27',
      admission_date: '2026-08-10',
      admission_route: route,
      seat_category: category,
      entry_type: entryType,
      current_status: status,
      source_record_id: `SEED-ADM-${apaarNum}`,
    });

    db.insert('admission_events', {
      id: uuidv4(),
      admission_id: admissionId,
      event_type: 'CONFIRMATION',
      previous_status: null,
      new_status: status,
      source_system: 'SEED_LOADER',
      event_reason: 'Synthetic benchmark seed record.',
      actor_id: 'SYSTEM_SEED',
      occurred_at: '2026-08-10T11:00:00Z',
    });

    return { studentId, admissionId, hmac: enc.hmac, masked: enc.masked };
  }

  // --- Planted Case 1: Alpha CSE (110 General/OBC + 7 NRI to trigger NRI overflow + 12 FN/OCI + 1 Withdrawal)
  // General & OBC (110)
  for (let i = 1; i <= 110; i++) {
    createStudentAdmission(
      i,
      `Synthetic Student ${i}`,
      appAlphaCseId,
      i % 2 === 0 ? 'GENERAL' : 'OBC_NCL',
      'STATE_COUNSELLING'
    );
  }

  // Planted Scenario T10: 7 NRI students (exceeds 5% of 120 = 6 limit)
  for (let i = 111; i <= 117; i++) {
    createStudentAdmission(
      i,
      `NRI Student ${i}`,
      appAlphaCseId,
      'NRI',
      'NRI'
    );
  }

  // Planted Scenario T11: Supernumerary FN / OCI / Gulf Worker (12 students, within 15% = 18 limit)
  for (let i = 118; i <= 126; i++) {
    createStudentAdmission(
      i,
      `International Student ${i}`,
      appAlphaCseId,
      i <= 121 ? 'FN' : 'OCI',
      'FN_OCI_GULF'
    );
  }
  // 3 Gulf Worker children (within 1/3 sub-allocation)
  for (let i = 127; i <= 129; i++) {
    createStudentAdmission(
      i,
      `Gulf Worker Ward ${i}`,
      appAlphaCseId,
      'GULF_WORKER',
      'FN_OCI_GULF'
    );
  }

  // Planted Scenario T14: Withdrawal Event
  const withdrawnSeed = createStudentAdmission(
    130,
    'Synthetic Priya Patel (Withdrawn)',
    appAlphaCseId,
    'GENERAL',
    'STATE_COUNSELLING',
    'FIRST_YEAR',
    'WITHDRAWN'
  );

  db.insert('admission_events', {
    id: uuidv4(),
    admission_id: withdrawnSeed.admissionId,
    event_type: 'WITHDRAWAL',
    previous_status: 'CONFIRMED',
    new_status: 'WITHDRAWN',
    source_system: 'INSTITUTION_PORTAL',
    event_reason: 'Student opted for national counselling allotment at NIT.',
    actor_id: 'user-inst-admin',
    occurred_at: '2026-08-25T14:30:00Z',
  });

  // --- Planted Case 2: Beta CSE (50 students)
  for (let i = 131; i <= 180; i++) {
    createStudentAdmission(
      i,
      `Beta Scholar ${i}`,
      appBetaCseId,
      'GENERAL',
      'STATE_COUNSELLING'
    );
  }

  // --- Planted Case 3: Gamma Technical Mech (60 students including lateral entry)
  for (let i = 181; i <= 230; i++) {
    createStudentAdmission(
      i,
      `Gamma Student ${i}`,
      appGammaMechId,
      'GENERAL',
      'STATE_COUNSELLING'
    );
  }
  // Lateral entry cohort (10 students)
  for (let i = 231; i <= 240; i++) {
    createStudentAdmission(
      i,
      `Lateral Diploma Scholar ${i}`,
      appGammaMechId,
      'LATERAL_ENTRY',
      'LATERAL_ENTRY',
      'LATERAL_ENTRY'
    );
  }

  // --- Planted Scenario T16: Cross-Institution Concurrent Enrolment Alert
  // Student "Synthetic Aryan Sharma" (APAAR: 900000000300) enrolled at Alpha CSE and Beta CSE
  const conflictA = createStudentAdmission(
    300,
    'Synthetic Aryan Sharma',
    appAlphaCseId,
    'GENERAL',
    'STATE_COUNSELLING'
  );

  const conflictB = createStudentAdmission(
    300,
    'Synthetic Aryan Sharma',
    appBetaCseId,
    'GENERAL',
    'STATE_COUNSELLING'
  );

  // Trigger reconciliation case creation
  reconciliationService.detectConflictsForAdmission(
    conflictB.admissionId,
    conflictB.hmac,
    conflictB.masked,
    'Synthetic Aryan Sharma',
    instBetaId,
    '2026-27'
  );

  console.log('✅ APAAR-SHIELD Synthetic Data Seeding completed successfully!');
}

