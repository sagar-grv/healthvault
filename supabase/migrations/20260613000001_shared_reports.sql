CREATE TABLE public.shared_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    report_ids UUID[] NOT NULL DEFAULT '{}',
    shared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    viewed_at TIMESTAMPTZ,
    UNIQUE(patient_id, doctor_id)
);

CREATE INDEX idx_shared_reports_doctor ON public.shared_reports(doctor_id);
CREATE INDEX idx_shared_reports_patient ON public.shared_reports(patient_id);
CREATE INDEX idx_shared_reports_unviewed ON public.shared_reports(doctor_id) WHERE viewed_at IS NULL;

ALTER TABLE public.shared_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "patients_manage_own_shares"
    ON public.shared_reports
    FOR ALL
    TO authenticated
    USING (auth.uid() = patient_id)
    WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "doctors_select_their_shares"
    ON public.shared_reports
    FOR SELECT
    TO authenticated
    USING (auth.uid() = doctor_id);

CREATE POLICY "doctors_update_viewed_at"
    ON public.shared_reports
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = doctor_id)
    WITH CHECK (auth.uid() = doctor_id);

CREATE OR REPLACE FUNCTION public.share_reports_with_doctor(
    p_patient_id UUID,
    p_doctor_id UUID,
    p_report_ids UUID[]
)
RETURNS public.shared_reports
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_result public.shared_reports;
BEGIN
    -- Only the patient themselves can create shares
    IF auth.uid() <> p_patient_id THEN
        RAISE EXCEPTION 'Not authorized to share reports for another patient';
    END IF;

    INSERT INTO public.shared_reports (patient_id, doctor_id, report_ids)
    VALUES (p_patient_id, p_doctor_id, p_report_ids)
    ON CONFLICT (patient_id, doctor_id)
    DO UPDATE SET
        report_ids = EXCLUDED.report_ids,
        shared_at = NOW(),
        viewed_at = NULL
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$;
