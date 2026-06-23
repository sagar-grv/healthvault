CREATE TABLE IF NOT EXISTS family_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  relationship TEXT NOT NULL CHECK (
    relationship IN ('parent', 'child', 'spouse', 'sibling', 'other')
  ),
  date_of_birth DATE,
  blood_group TEXT CHECK (
    blood_group IN ('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_family_profiles_guardian
  ON family_profiles(guardian_id);

ALTER TABLE family_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients manage own family profiles"
  ON family_profiles
  FOR ALL
  TO authenticated
  USING (
    guardian_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'patient'
    )
  )
  WITH CHECK (
    guardian_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'patient'
    )
  );
