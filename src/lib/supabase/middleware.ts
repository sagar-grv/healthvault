import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() validates JWT against Supabase Auth server.
  // getSession() does NOT validate and causes infinite redirect loops
  // when refresh tokens expire (refresh_token_not_found).
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtectedRoute =
    path.startsWith('/dashboard') || path.startsWith('/onboarding') || path.startsWith('/admin');
  const isAuthRoute = path.startsWith('/login') || path.startsWith('/register');
  const isAdminRoute = path.startsWith('/admin');

  // Auth error on a protected route → clear stale cookies and redirect to login.
  // Without this, a stale sb-* cookie causes an infinite reload loop.
  if (authError && isProtectedRoute) {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('error', 'session_expired');
    const redirectResponse = NextResponse.redirect(url);
    request.cookies.getAll().forEach(({ name }) => {
      if (name.startsWith('sb-')) {
        redirectResponse.cookies.delete(name);
      }
    });
    return redirectResponse;
  }

  // Unauthenticated user hitting a protected route → send to login
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Authenticated user hitting a login/register page → send to dashboard
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Check terms acceptance for authenticated users on protected routes
  if (user && isProtectedRoute) {
    let termsAccepted = false;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('terms_accepted_at')
        .eq('id', user.id)
        .single();
      termsAccepted = !!profile?.terms_accepted_at;
    } catch {
      // If profile query fails, let request through to avoid redirect loop
    }

    // If user hasn't accepted terms and isn't on terms page, redirect to terms
    if (!termsAccepted && !path.startsWith('/terms')) {
      const url = request.nextUrl.clone();
      url.pathname = '/terms';
      url.searchParams.set('redirect', path);
      return NextResponse.redirect(url);
    }

    // If user has accepted terms and is on terms page, redirect to destination
    if (termsAccepted && path.startsWith('/terms')) {
      const rawParam = request.nextUrl.searchParams.get('redirect') || '';
      const redirectParam =
        rawParam.startsWith('/') && !rawParam.startsWith('//') ? rawParam : '/dashboard';
      const url = request.nextUrl.clone();
      url.pathname = redirectParam;
      url.searchParams.delete('redirect');
      return NextResponse.redirect(url);
    }
  }

  // Admin route protection — only users with role='admin' in profiles
  if (user && isAdminRoute) {
    let isAdmin = false;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      isAdmin = profile?.role === 'admin';
    } catch {
      // If profile query fails, deny access
    }

    if (!isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  // Prevent back-button access to protected pages after logout (bfcache)
  if (isProtectedRoute) {
    supabaseResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    supabaseResponse.headers.set('Pragma', 'no-cache');
  }

  return supabaseResponse;
}
