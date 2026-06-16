import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();

  // Validate session server-side
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/login');
  }

  // Fetch profile — use error + data separately so we can distinguish
  // "no row" from "RLS/DB error"
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, onboarding_complete')
    .eq('id', user.id)
    .single();

  // DB or RLS error (not just missing row) — show error page, don't sign out
  // Signing out here would cause a redirect loop if the issue is transient.
  if (profileError && profileError.code !== 'PGRST116') {
    // PGRST116 = "no rows returned" — that's a missing profile, handled below
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 16,
          padding: 24,
          fontFamily: 'sans-serif',
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1F2937' }}>
          Could not load your profile
        </h2>
        <p style={{ color: '#6B7280', textAlign: 'center', maxWidth: 360 }}>
          There was a temporary issue loading your account. Please try again.
        </p>
        <a
          href="/dashboard"
          style={{
            padding: '10px 24px',
            background: '#1a56db',
            color: '#fff',
            borderRadius: 8,
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          Try Again
        </a>
        <button
          onClick={async () => {
            await fetch('/api/auth/signout', { method: 'POST' });
            window.location.href = '/login';
          }}
          style={{
            color: '#6B7280',
            fontSize: 14,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Sign out
        </button>
      </div>
    );
  }

  // No profile row at all — account setup failed during registration
  if (!profile) {
    await supabase.auth.signOut();
    redirect('/login?error=setup_failed');
  }

  // Admin users skip onboarding and go straight to admin dashboard
  if (profile.role === 'admin') {
    redirect('/admin');
  }

  // Role-based routing — only patient and doctor are supported
  if (!profile.onboarding_complete) {
    redirect(profile.role === 'patient' ? '/onboarding/patient' : '/onboarding/doctor');
  }

  if (profile.role === 'patient') {
    redirect('/dashboard/patient');
  }

  if (profile.role === 'doctor') {
    redirect('/dashboard/doctor');
  }

  // Unknown role — sign out cleanly
  await supabase.auth.signOut();
  redirect('/login?error=unknown_role');
}
