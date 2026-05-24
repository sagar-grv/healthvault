import { render, screen } from '@testing-library/react';
import PatientProfilePage from '../page';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: jest.fn() }),
}));

// next-intl is mocked via src/__mocks__/next-intl.ts
// useTranslations('profile') returns (key) => 'profile.key'
// useTranslations('common') returns (key) => 'common.key'

const mockGetUser = jest.fn();
const mockFrom = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}));

jest.mock('@/lib/utils/language', () => ({
  getAiLanguage: () => 'en',
  setAiLanguage: jest.fn(),
  setPreferredLanguage: jest.fn().mockResolvedValue(undefined),
}));

const mockProfilesQuery = () => ({
  select: () => ({
    eq: () => ({
      single: async () => ({
        data: {
          full_name: 'Test User',
          phone: '',
          email: 'test@example.com',
          health_id: 'HV-123',
        },
      }),
    }),
  }),
});

const mockReportsQuery = () => ({
  select: () => ({
    eq: async () => ({ data: [] }),
  }),
});

const mockEmergencyQuery = () => ({
  select: () => ({
    eq: () => ({
      maybeSingle: async () => ({ data: null }),
    }),
  }),
});

describe('PatientProfilePage', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return mockProfilesQuery();
      if (table === 'reports') return mockReportsQuery();
      if (table === 'emergency_profiles') return mockEmergencyQuery();
      return { select: () => ({ eq: async () => ({ data: null }) }) };
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the emergency card section with translated keys', async () => {
    render(<PatientProfilePage />);

    // No emergency card set up → shows setup key
    expect(await screen.findByText('profile.emergencyCard')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'profile.setupEmergencyCard' })).toBeInTheDocument();
  });

  it('renders the profile page title', async () => {
    render(<PatientProfilePage />);
    expect(await screen.findByText('profile.pageTitle')).toBeInTheDocument();
  });
});
