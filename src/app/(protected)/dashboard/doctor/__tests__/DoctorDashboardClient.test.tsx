import { render, screen } from '@testing-library/react';
import DoctorDashboardClient from '../DoctorDashboardClient';
import type { DoctorProfile, Profile } from '@/types';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('next/dynamic', () => () => () => null);

const profile: Profile = {
  id: 'doctor-1',
  health_id: null,
  full_name: 'Asha Rao',
  role: 'doctor',
  email: 'doctor@example.com',
  phone: null,
  preferred_language: 'en',
  onboarding_complete: true,
  terms_accepted_at: null,
  consent_version: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const doctorProfile: DoctorProfile = {
  id: 'doctor-1',
  registration_number: 'MH-12345',
  council_name: 'Maharashtra Medical Council',
  qualification: 'MBBS',
  specialization: 'General Medicine',
  clinic_name: 'Care Clinic',
  clinic_address: null,
  city: 'Mumbai',
  hpr_id: null,
  verification_state: 'admin_verified',
  verification_submitted_at: null,
  rejection_reason: null,
  verified_at: null,
  created_at: '2026-01-01T00:00:00Z',
};

describe('DoctorDashboardClient product sections', () => {
  test('renders fast-consultation dashboard sections', () => {
    render(<DoctorDashboardClient profile={profile} doctorProfile={doctorProfile} />);

    expect(screen.getByText('Shared with me')).toBeInTheDocument();
    expect(screen.getByText('Search by Health ID')).toBeInTheDocument();
    expect(screen.getByText('Recent patient contexts')).toBeInTheDocument();
    expect(screen.getByText('Verification status')).toBeInTheDocument();
    expect(screen.getByText('AI assistant')).toBeInTheDocument();
  });
});
