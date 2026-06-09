'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cacheReports, getCachedReports, isOnline, type CachedReport } from './db';

export function useOfflineReports(patientId: string | undefined) {
  const [reports, setReports] = useState<CachedReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [fromCache, setFromCache] = useState(false);

  const fetchReports = useCallback(async () => {
    if (!patientId) return;

    setLoading(true);

    // Try network first
    if (isOnline()) {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('reports')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false });

        if (data) {
          setReports(data as CachedReport[]);
          setFromCache(false);
          await cacheReports(data as Omit<CachedReport, 'cached_at'>[]);
          setLoading(false);
          return;
        }
      } catch {
        // Fall through to cache
      }
    }

    // Offline or network failed — use cache
    const cached = await getCachedReports();
    const filtered = cached.filter((r) => r.patient_id === patientId);
    setReports(filtered);
    setFromCache(true);
    setLoading(false);
  }, [patientId]);

  return { reports, loading, fromCache, refresh: fetchReports };
}
