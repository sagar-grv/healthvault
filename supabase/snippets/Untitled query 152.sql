UPDATE public.profiles SET role = 'admin' WHERE id = '4be66638-48a0-4671-8bf8-71b0d34dcbc4';
INSERT INTO public.doctor_profiles (id, registration_number, council_name, qualification, verification_state)
VALUES ('4be66638-48a0-4671-8bf8-71b0d34dcbc4', 'ADM-001', 'National Medical Commission (NMC)', 'MBBS', 'unverified')
ON CONFLICT (id) DO NOTHING;