import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import PatientDashboardClient from '../PatientDashboardClient';
import type { Profile } from '@/types';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('next/dynamic', () => () => () => null);

const messages = {
  dashboard: {
    yourHealthId: 'TEST_YOUR_HEALTH_ID',
    copyId: 'TEST_COPY_ID',
    share: 'TEST_SHARE',
    showQr: 'TEST_SHOW_QR',
    hideQr: 'TEST_HIDE_QR',
    myReports: 'TEST_MY_REPORTS',
    noReports: 'TEST_NO_REPORTS',
    noReportsHint: 'TEST_NO_REPORTS_HINT',
    upload: 'TEST_UPLOAD',
    accessLog: 'TEST_ACCESS_LOG',
    profile: 'TEST_PROFILE',
    home: 'TEST_HOME',
    analyzeWithAi: 'TEST_ANALYZE_WITH_AI',
    explainInMyLanguage: 'TEST_EXPLAIN_IN_MY_LANGUAGE',
    deleteReport: 'TEST_DELETE_REPORT',
    reportIsNowShareable: 'TEST_REPORT_SHAREABLE',
    reportIsNowPrivate: 'TEST_REPORT_PRIVATE',
    shareableWithDoctors: 'TEST_SHAREABLE_WITH_DOCTORS',
    privateOnlyYou: 'TEST_PRIVATE_ONLY_YOU',
    processingReport: 'TEST_PROCESSING_REPORT',
    reportSaved: 'TEST_REPORT_SAVED',
    uploadFailed: 'TEST_UPLOAD_FAILED',
    somethingWentWrong: 'TEST_SOMETHING_WENT_WRONG',
  },
};

const profile: Profile = {
  id: 'user-1',
  health_id: 'HV-1234',
  full_name: 'Test User',
  role: 'patient',
  email: 'test@example.com',
  phone: null,
  onboarding_complete: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('PatientDashboardClient translations', () => {
  it('renders translated labels for key dashboard strings', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <PatientDashboardClient profile={profile} reports={[]} />
      </NextIntlClientProvider>
    );

    expect(screen.getByText('TEST_YOUR_HEALTH_ID')).toBeInTheDocument();
    expect(screen.getByText('TEST_COPY_ID')).toBeInTheDocument();
    expect(screen.getByText('TEST_SHOW_QR')).toBeInTheDocument();
    expect(screen.getByText('TEST_SHARE')).toBeInTheDocument();
    expect(screen.getByText('TEST_MY_REPORTS')).toBeInTheDocument();
    expect(screen.getByText('TEST_NO_REPORTS')).toBeInTheDocument();
    expect(screen.getByText('TEST_NO_REPORTS_HINT')).toBeInTheDocument();
    expect(screen.getAllByText('TEST_UPLOAD').length).toBeGreaterThan(0);
    expect(screen.getByText('TEST_HOME')).toBeInTheDocument();
    expect(screen.getByText('TEST_ACCESS_LOG')).toBeInTheDocument();
    expect(screen.getByText('TEST_PROFILE')).toBeInTheDocument();
  });
});
