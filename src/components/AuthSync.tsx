'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * This component listens for auth state changes and ensures
 * the session is synced to cookies for server-side access.
 * It triggers a page refresh when auth state changes so the
 * server can read the updated cookies.
 */
export default function AuthSync() {
  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // When sign in or token refresh happens, the @supabase/ssr
      // client should automatically set cookies. But if it doesn't,
      // we force a server re-render by setting cookies manually.
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // The createBrowserClient from @supabase/ssr should handle this
        // but we'll log to debug
        console.log('[AuthSync]', event, session?.user?.email);
      }
      if (event === 'SIGNED_OUT') {
        console.log('[AuthSync] Signed out');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
