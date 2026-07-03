-- Migration: Add location columns to doctor_profiles + nearby search RPC
ALTER TABLE public.doctor_profiles
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8);

-- Nearby doctors search using Haversine formula
CREATE OR REPLACE FUNCTION public.get_nearby_doctors(
  p_patient_lat DECIMAL,
  p_patient_lng DECIMAL,
  p_radius_km DECIMAL DEFAULT 25
)
RETURNS TABLE(
  id UUID,
  full_name TEXT,
  clinic_name TEXT,
  clinic_address TEXT,
  city TEXT,
  specialization TEXT,
  distance_km DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT sub.id, sub.full_name, sub.clinic_name, sub.clinic_address, sub.city, sub.specialization, sub.distance_km
  FROM (
    SELECT 
      p.id,
      pr.full_name,
      p.clinic_name,
      p.clinic_address,
      p.city,
      p.specialization,
      (6371 * acos(
        cos(radians(p_patient_lat)) * cos(radians(p.latitude)) *
        cos(radians(p.longitude) - radians(p_patient_lng)) +
        sin(radians(p_patient_lat)) * sin(radians(p.latitude))
      ))::DECIMAL(10,2) AS distance_km
    FROM public.doctor_profiles p
    JOIN public.profiles pr ON pr.id = p.id
    WHERE p.latitude IS NOT NULL 
      AND p.longitude IS NOT NULL
      AND p.verification_state = 'admin_verified'
      AND pr.role = 'doctor'
  ) sub
  WHERE sub.distance_km <= p_radius_km
  ORDER BY sub.distance_km;
END;
$$;

-- Fix get_doctor_display_info to return all verified doctors when p_doctor_id is null
DROP FUNCTION IF EXISTS public.get_doctor_display_info(UUID);

CREATE FUNCTION public.get_doctor_display_info(p_doctor_id UUID DEFAULT NULL)
RETURNS TABLE(full_name TEXT, clinic_name TEXT, verification_state TEXT, id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_doctor_id IS NULL THEN
    RETURN QUERY
    SELECT pr.full_name, dp.clinic_name, dp.verification_state, dp.id
    FROM public.doctor_profiles dp
    JOIN public.profiles pr ON pr.id = dp.id
    WHERE pr.role = 'doctor' AND dp.verification_state = 'admin_verified'
    ORDER BY pr.full_name;
  ELSE
    RETURN QUERY
    SELECT pr.full_name, dp.clinic_name, dp.verification_state, dp.id
    FROM public.profiles pr
    LEFT JOIN public.doctor_profiles dp ON dp.id = pr.id
    WHERE pr.id = p_doctor_id AND pr.role = 'doctor';
  END IF;
END;
$$;
