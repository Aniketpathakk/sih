-- ======================================================================
-- APAAR-SHIELD DATABASE SCHEMA (PostgreSQL / Relational Blueprint)
-- Conforms to DATA_MODEL.md & SECURITY_PRIVACY.md
-- ======================================================================

CREATE TABLE IF NOT EXISTS institutions (
  id UUID PRIMARY KEY,
  aicte_institution_ref TEXT NOT NULL UNIQUE,
  official_name TEXT NOT NULL,
  institution_type TEXT NOT NULL, -- CENTRAL_UNIVERSITY / STATE_UNIVERSITY / DEEMED / PRIVATE_AIDED / PRIVATE_UNAIDED
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  source_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campuses (
  id UUID PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  source_campus_ref TEXT,
  campus_name TEXT NOT NULL,
  address_json JSONB,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  UNIQUE (institution_id, source_campus_ref)
);

CREATE TABLE IF NOT EXISTS universities (
  id UUID PRIMARY KEY,
  source_ref TEXT UNIQUE,
  official_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS programmes (
  id UUID PRIMARY KEY,
  programme_code TEXT NOT NULL UNIQUE,
  programme_name TEXT NOT NULL,
  programme_level TEXT NOT NULL, -- UNDERGRADUATE / POSTGRADUATE / DIPLOMA
  discipline_code TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS policy_releases (
  id UUID PRIMARY KEY,
  authority TEXT NOT NULL DEFAULT 'AICTE',
  policy_name TEXT NOT NULL,
  policy_version TEXT NOT NULL UNIQUE,
  source_document_uri TEXT NOT NULL,
  source_document_hash TEXT,
  applicable_from_year TEXT NOT NULL,
  applicable_to_year TEXT,
  effective_from DATE,
  effective_to DATE,
  status TEXT NOT NULL DEFAULT 'PUBLISHED',
  reviewed_by TEXT,
  published_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS program_approvals (
  id UUID PRIMARY KEY,
  campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
  programme_id UUID NOT NULL REFERENCES programmes(id),
  academic_year TEXT NOT NULL,
  approved_intake INTEGER NOT NULL CHECK (approved_intake >= 0),
  has_nri_approval BOOLEAN NOT NULL DEFAULT false,
  has_fn_oci_gulf_approval BOOLEAN NOT NULL DEFAULT false,
  has_tfw_approval BOOLEAN NOT NULL DEFAULT false,
  approval_reference TEXT NOT NULL,
  approval_status TEXT NOT NULL DEFAULT 'ACTIVE',
  source_document_uri TEXT NOT NULL,
  policy_release_id UUID REFERENCES policy_releases(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campus_id, programme_id, academic_year)
);

CREATE TABLE IF NOT EXISTS policy_rules (
  id UUID PRIMARY KEY,
  policy_release_id UUID NOT NULL REFERENCES policy_releases(id) ON DELETE CASCADE,
  rule_code TEXT NOT NULL,
  category_code TEXT NOT NULL,
  counting_basis TEXT NOT NULL, -- WITHIN_INTAKE / SUPERNUMERARY / SEPARATE_COHORT
  limit_type TEXT NOT NULL,     -- FIXED / PERCENTAGE_CEILING
  formula_text TEXT NOT NULL,
  source_clause TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY,
  source_system TEXT NOT NULL DEFAULT 'INSTITUTION_ERP',
  student_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Identity Vault: Encrypted APAAR + HMAC token matching
CREATE TABLE IF NOT EXISTS student_identifiers (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  identifier_type TEXT NOT NULL DEFAULT 'APAAR',
  identifier_ciphertext TEXT NOT NULL, -- AES-256-GCM encrypted
  identifier_iv TEXT NOT NULL,
  identifier_tag TEXT NOT NULL,
  apaar_hmac TEXT NOT NULL,            -- Deterministic matching token HMAC-SHA256
  apaar_masked TEXT NOT NULL,          -- XXXXXXXX1234
  key_version TEXT NOT NULL DEFAULT 'V1',
  verification_status TEXT NOT NULL DEFAULT 'MOCK_VERIFIED',
  is_mock BOOLEAN NOT NULL DEFAULT true,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, identifier_type)
);

CREATE INDEX IF NOT EXISTS idx_student_identifiers_hmac ON student_identifiers(apaar_hmac);

CREATE TABLE IF NOT EXISTS admissions (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  program_approval_id UUID NOT NULL REFERENCES program_approvals(id),
  academic_year TEXT NOT NULL,
  admission_date DATE NOT NULL,
  admission_route TEXT NOT NULL,
  seat_category TEXT NOT NULL,
  entry_type TEXT NOT NULL DEFAULT 'FIRST_YEAR',
  current_status TEXT NOT NULL DEFAULT 'CONFIRMED',
  source_record_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admission_events (
  id UUID PRIMARY KEY,
  admission_id UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- CONFIRMATION / WITHDRAWAL / CANCELLATION / TRANSFER / CORRECTION
  previous_status TEXT,
  new_status TEXT NOT NULL,
  source_system TEXT NOT NULL,
  event_reason TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS submission_batches (
  id UUID PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL,
  file_name TEXT NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  valid_rows INTEGER NOT NULL DEFAULT 0,
  warning_rows INTEGER NOT NULL DEFAULT 0,
  error_rows INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'RECEIVED',
  idempotency_key TEXT,
  submitted_by TEXT NOT NULL,
  certified_by TEXT,
  certified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS submission_rows (
  id UUID PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES submission_batches(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  source_record_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  apaar_masked TEXT NOT NULL,
  apaar_hmac TEXT NOT NULL,
  programme_code TEXT NOT NULL,
  seat_category TEXT NOT NULL,
  entry_type TEXT NOT NULL DEFAULT 'FIRST_YEAR',
  status TEXT NOT NULL DEFAULT 'VALID',
  issues_json JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reconciliation_cases (
  id UUID PRIMARY KEY,
  case_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'MEDIUM',
  status TEXT NOT NULL DEFAULT 'OPEN',
  academic_year TEXT NOT NULL,
  student_ref TEXT NOT NULL,
  student_masked_name TEXT NOT NULL,
  apaar_masked TEXT NOT NULL,
  apaar_hmac TEXT NOT NULL,
  institution_a_id UUID NOT NULL REFERENCES institutions(id),
  admission_a_id UUID REFERENCES admissions(id),
  institution_b_id UUID REFERENCES institutions(id),
  admission_b_id UUID REFERENCES admissions(id),
  evidence_summary TEXT NOT NULL,
  policy_clause_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS case_decisions (
  id UUID PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES reconciliation_cases(id) ON DELETE CASCADE,
  decision TEXT NOT NULL,
  reason TEXT NOT NULL,
  reviewer_id TEXT NOT NULL,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS verifications (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  provider_code TEXT NOT NULL DEFAULT 'MOCK_APAAR',
  purpose_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'MOCK_VERIFIED',
  is_mock BOOLEAN NOT NULL DEFAULT true,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS user_memberships (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  UNIQUE (user_id, institution_id, role)
);

CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY,
  actor_id TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  details_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS outbox_events (
  id UUID PRIMARY KEY,
  event_type TEXT NOT NULL,
  aggregate_id UUID NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

