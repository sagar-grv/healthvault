-- Evidence Graph Tables for claim-level evidence tracing
-- Each table has patient_id + RLS for multi-tenant isolation

-- 1. extracted_facts: Individual facts extracted from reports
CREATE TABLE IF NOT EXISTS extracted_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  claim TEXT NOT NULL,
  claim_type claim_type NOT NULL DEFAULT 'document_fact',
  category TEXT,
  value TEXT,
  unit TEXT,
  normal_range TEXT,
  is_abnormal BOOLEAN,
  confidence REAL NOT NULL DEFAULT 1.0,
  raw_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. fact_sources: Source document locations for each fact
CREATE TABLE IF NOT EXISTS fact_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fact_id UUID NOT NULL REFERENCES extracted_facts(id) ON DELETE CASCADE,
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  page_number INTEGER,
  region_x REAL,
  region_y REAL,
  region_width REAL,
  region_height REAL,
  source_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. normalized_biomarkers: Biomarker alias mappings
CREATE TABLE IF NOT EXISTS normalized_biomarkers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name TEXT NOT NULL UNIQUE,
  aliases TEXT[] NOT NULL DEFAULT '{}',
  category TEXT,
  default_unit TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. explanation_claims: Claims made by AI in explanations
CREATE TABLE IF NOT EXISTS explanation_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id UUID,
  claim TEXT NOT NULL,
  claim_type claim_type NOT NULL DEFAULT 'ai_interpretation',
  fact_ids UUID[] DEFAULT '{}',
  confidence REAL NOT NULL DEFAULT 0.5,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. comprehension_sessions: Teach-back tracking
CREATE TABLE IF NOT EXISTS comprehension_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options TEXT[] NOT NULL DEFAULT '{}',
  selected_answer TEXT,
  correct_answer TEXT NOT NULL,
  is_correct BOOLEAN,
  understanding_level INTEGER CHECK (understanding_level >= 1 AND understanding_level <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. user_corrections: User corrections to AI extraction
CREATE TABLE IF NOT EXISTS user_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  fact_id UUID REFERENCES extracted_facts(id),
  original_value TEXT NOT NULL,
  corrected_value TEXT NOT NULL,
  correction_type TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. authoritative_sources: Curated medical education sources
CREATE TABLE IF NOT EXISTS authoritative_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT,
  source_type TEXT NOT NULL,
  description TEXT,
  topics TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. confirmed_reminders: User-confirmed medication/visit reminders
CREATE TABLE IF NOT EXISTS confirmed_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
  reminder_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurring_interval TEXT,
  is_confirmed BOOLEAN NOT NULL DEFAULT false,
  source_fact_id UUID REFERENCES extracted_facts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add claim_type enum if not exists
DO $$ BEGIN
  CREATE TYPE claim_type AS ENUM ('document_fact', 'general_information', 'ai_interpretation', 'unknown');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_extracted_facts_report ON extracted_facts(report_id);
CREATE INDEX IF NOT EXISTS idx_extracted_facts_patient ON extracted_facts(patient_id);
CREATE INDEX IF NOT EXISTS idx_fact_sources_fact ON fact_sources(fact_id);
CREATE INDEX IF NOT EXISTS idx_explanation_claims_report ON explanation_claims(report_id);
CREATE INDEX IF NOT EXISTS idx_comprehension_sessions_patient ON comprehension_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_user_corrections_patient ON user_corrections(patient_id);
CREATE INDEX IF NOT EXISTS idx_confirmed_reminders_patient ON confirmed_reminders(patient_id);

-- RLS: Enable on all patient-scoped tables
ALTER TABLE extracted_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE explanation_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE comprehension_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE confirmed_reminders ENABLE ROW LEVEL SECURITY;

-- normalized_biomarkers and authoritative_sources are reference data — readable by all authenticated users
ALTER TABLE normalized_biomarkers ENABLE ROW LEVEL SECURITY;
ALTER TABLE authoritative_sources ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Patients see own data, doctors see shared data, admins see all
CREATE POLICY patient_own_extracted_facts ON extracted_facts
  FOR ALL USING (patient_id = auth.uid());
CREATE POLICY doctor_read_shared_extracted_facts ON extracted_facts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM reports
      WHERE reports.id = extracted_facts.report_id
      AND reports.is_shareable = true
      AND EXISTS (
        SELECT 1 FROM shared_reports
        WHERE shared_reports.report_ids @> ARRAY[reports.id]
        AND shared_reports.doctor_id = auth.uid()
      )
    )
  );
CREATE POLICY admin_all_extracted_facts ON extracted_facts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Reusable policies for other tables
CREATE POLICY patient_own_fact_sources ON fact_sources FOR ALL USING (
  EXISTS (SELECT 1 FROM extracted_facts WHERE extracted_facts.id = fact_sources.fact_id AND extracted_facts.patient_id = auth.uid())
);
CREATE POLICY patient_own_explanation_claims ON explanation_claims FOR ALL USING (patient_id = auth.uid());
CREATE POLICY patient_own_comprehension_sessions ON comprehension_sessions FOR ALL USING (patient_id = auth.uid());
CREATE POLICY patient_own_user_corrections ON user_corrections FOR ALL USING (patient_id = auth.uid());
CREATE POLICY patient_own_confirmed_reminders ON confirmed_reminders FOR ALL USING (patient_id = auth.uid());

-- Reference data: readable by all authenticated
CREATE POLICY auth_read_normalized_biomarkers ON normalized_biomarkers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY auth_read_authoritative_sources ON authoritative_sources FOR SELECT USING (auth.role() = 'authenticated');

-- Add analysis_type column to report_analyses
ALTER TABLE report_analyses ADD COLUMN IF NOT EXISTS analysis_type TEXT DEFAULT 'legacy';
