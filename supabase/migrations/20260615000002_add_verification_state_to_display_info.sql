-- Add verification_state to get_doctor_display_info function

DROP FUNCTION IF EXISTS public.get_doctor_display_info(UUID);

CREATE FUNCTION public.get_doctor_display_info(p_doctor_id UUID)
RETURNS TABLE(full_name TEXT, clinic_name TEXT, verification_state TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT p.full_name, dp.clinic_name, dp.verification_state
  FROM public.profiles p
  LEFT JOIN public.doctor_profiles dp ON dp.id = p.id
  WHERE p.id = p_doctor_id AND p.role = 'doctor';
END;
$$;
