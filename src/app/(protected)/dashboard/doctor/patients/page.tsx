import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PatientsClient from './PatientsClient';
import type { AccessLog, SearchAttempt } from '@/types';

export const dynamic = 'force-dynamic';

interface PatientInfo {
  id: string;
  full_name: string | null;
  health_id: string | null;
}

interface SharedPatientRecord {
  id: string;
  patient_id: string;
  report_ids: string[];
  shared_at: string;
  viewed_at: string | null;
  patient: PatientInfo | null;
}

interface AccessLogRecord extends AccessLog {
  patient: PatientInfo | null;
}

interface SearchAttemptRecord extends SearchAttempt {
  patient: PatientInfo | null;
}

export default async function PatientsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [sharedResult, accessResult, searchResult] = await Promise.all([
    supabase
      .from('shared_reports')
      .select('id, patient_id, report_ids, shared_at, viewed_at')
      .eq('doctor_id', user.id)
      .order('shared_at', { ascending: false }),
    supabase
      .from('access_logs')
      .select('id, patient_id, doctor_id, doctor_name, reports_viewed, searched_at')
      .eq('doctor_id', user.id)
      .order('searched_at', { ascending: false })
      .limit(100),
    supabase
      .from('search_attempts')
      .select('id, doctor_id, searched_health_id, found, searched_at')
      .eq('doctor_id', user.id)
      .order('searched_at', { ascending: false })
      .limit(100),
  ]);

  const sharedReports = (sharedResult.data ?? []) as Array<{
    id: string;
    patient_id: string;
    report_ids: string[];
    shared_at: string;
    viewed_at: string | null;
  }>;
  const accessLogs = (accessResult.data ?? []) as AccessLog[];
  const searchAttempts = (searchResult.data ?? []) as SearchAttempt[];

  const patientIds = [...new Set([...sharedReports, ...accessLogs].map((item) => item.patient_id))];
  const searchHealthIds = [...new Set(searchAttempts.map((item) => item.searched_health_id))];
  const emptyProfileResult = { data: [] as PatientInfo[], error: null };

  const [patientProfileResult, searchProfileResult] = await Promise.all([
    patientIds.length
      ? supabase.from('profiles').select('id, full_name, health_id').in('id', patientIds)
      : Promise.resolve(emptyProfileResult),
    searchHealthIds.length
      ? supabase
          .from('profiles')
          .select('id, full_name, health_id')
          .in('health_id', searchHealthIds)
      : Promise.resolve(emptyProfileResult),
  ]);

  const patientProfiles = ((patientProfileResult.data ?? []) as PatientInfo[]).map((profile) => ({
    ...profile,
    full_name: profile.full_name ?? 'Unknown Patient',
  }));
  const searchedProfiles = ((searchProfileResult.data ?? []) as PatientInfo[]).map((profile) => ({
    ...profile,
    full_name: profile.full_name ?? 'Unknown Patient',
  }));

  const patientById = new Map(patientProfiles.map((profile) => [profile.id, profile]));
  const patientByHealthId = new Map(
    searchedProfiles.map((profile) => [profile.health_id ?? '', profile])
  );

  const enrichedSharedReports: SharedPatientRecord[] = sharedReports.map((share) => ({
    ...share,
    patient: patientById.get(share.patient_id) ?? null,
  }));

  const enrichedAccessLogs: AccessLogRecord[] = accessLogs.map((log) => ({
    ...log,
    patient: patientById.get(log.patient_id) ?? null,
  }));

  const enrichedSearchAttempts: SearchAttemptRecord[] = searchAttempts.map((attempt) => ({
    ...attempt,
    patient: patientByHealthId.get(attempt.searched_health_id) ?? null,
  }));

  const hasDataWarning =
    !!sharedResult.error ||
    !!accessResult.error ||
    !!searchResult.error ||
    !!patientProfileResult.error ||
    !!searchProfileResult.error;

  return (
    <PatientsClient
      shares={enrichedSharedReports}
      accessLogs={enrichedAccessLogs}
      searchAttempts={enrichedSearchAttempts}
      warning={hasDataWarning ? 'Some patient activity could not be loaded.' : null}
    />
  );
}
