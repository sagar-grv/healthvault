import { render, screen } from '@testing-library/react';
import PatientDashboardClient from '../PatientDashboardClient';
import type { Profile } from '@/types';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('next/dynamic', () => () => () => null);

// next-intl is mocked via src/__mocks__/next-intl.ts
// useTranslations('dashboard') returns (key) => 'dashboard.key'

const profile: Profile = {
  id: 'user-1',
  health_id: 'HV-1234',
  full_name: 'Test User',
  role: 'patient',
  email: 'test@example.com',
  phone: null,
  preferred_language: 'en',
  onboarding_complete: true,
  terms_accepted_at: null,
  consent_version: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('PatientDashboardClient translations', () => {
  it('renders translated labels via useTranslations keys', () => {
    render(<PatientDashboardClient profile={profile} reports={[]} />);

    // Mock returns 'dashboard.<key>' — verifies translation keys are used
    expect(screen.getByText('dashboard.yourHealthId')).toBeInTheDocument();
    expect(screen.getByText('dashboard.copyId')).toBeInTheDocument();
    // showQr + share buttons removed — replaced with "Share with Doctor" single button
    expect(screen.getByText('Share with Doctor')).toBeInTheDocument();
    // Section heading changed from t('myReports') to "Recent Reports"
    expect(screen.getByText('Recent Reports')).toBeInTheDocument();
    expect(screen.getByText('dashboard.noReports')).toBeInTheDocument();
    expect(screen.getByText('dashboard.noReportsHint')).toBeInTheDocument();
    expect(screen.getAllByText('dashboard.upload').length).toBeGreaterThan(0);
    expect(screen.getByText('dashboard.home')).toBeInTheDocument();
    expect(screen.getByText('dashboard.accessLog')).toBeInTheDocument();
    expect(screen.getByText('dashboard.profile')).toBeInTheDocument();
  });
});
