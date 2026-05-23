import { render, screen } from '@testing-library/react';
import PatientProfilePage from '../page';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
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
    eq: async () => ({
      data: [],
    }),
  }),
});

describe('PatientProfilePage', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return mockProfilesQuery();
      if (table === 'reports') return mockReportsQuery();
      return { select: () => ({ eq: async () => ({ data: [] }) }) };
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the emergency card section with translated keys', async () => {
    render(<PatientProfilePage />);

    // Mock returns 'profile.<key>' — verifies translation keys are used
    expect(await screen.findByText('profile.emergencyCard')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'profile.setupEmergencyCard' })).toBeInTheDocument();
  });

  it('renders the profile page title', async () => {
    render(<PatientProfilePage />);
    expect(await screen.findByText('profile.pageTitle')).toBeInTheDocument();
  });
});
