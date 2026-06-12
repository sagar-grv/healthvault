-- SECURITY DEFINER function to allow patients to view doctor display info
-- without exposing sensitive fields (email, phone).
-- This bypasses RLS on the profiles table which blocks patients from
-- viewing doctor profiles.

CREATE OR REPLACE FUNCTION public.get_doctor_display_info(p_doctor_id UUID)
RETURNS TABLE(full_name TEXT, clinic_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT p.full_name, dp.clinic_name
  FROM public.profiles p
  LEFT JOIN public.doctor_profiles dp ON dp.id = p.id
  WHERE p.id = p_doctor_id AND p.role = 'doctor';
END;
$$;
