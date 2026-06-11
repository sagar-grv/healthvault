export type UserRole = 'patient' | 'doctor';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string | null;
  health_id: string | null; // HV-XXXX-XXXX for patients
  preferred_language: string; // ISO 639-1 code e.g. 'en', 'hi' (added migration 002)
  terms_accepted_at: string | null;
  consent_version: string | null;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface DoctorProfile {
  id: string;
  registration_number: string | null;
  council_name: string | null;
  qualification: string | null;
  specialization: string | null;
  clinic_name: string | null;
  clinic_address: string | null;
  city: string | null;
  hpr_id: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface Report {
  id: string;
  patient_id: string;
  title: string;
  report_type: ReportType;
  file_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string;
  thumbnail_path: string | null;
  notes: string | null;
  report_date: string;
  is_shareable: boolean;
  is_starred: boolean;
  uploaded_at: string;
  updated_at: string;
}

export type ReportType =
  | 'prescription'
  | 'lab_report'
  | 'scan'
  | 'discharge_summary'
  | 'vaccination'
  | 'other';

export interface AccessLog {
  id: string;
  patient_id: string;
  doctor_id: string;
  doctor_name: string;
  reports_viewed: string[];
  searched_at: string;
}

export interface SearchAttempt {
  id: string;
  doctor_id: string;
  searched_health_id: string;
  found: boolean;
  searched_at: string;
}

export interface SharedReport {
  id: string;
  patient_id: string;
  doctor_id: string;
  report_id: string;
  shared_at: string;
  viewed_at: string | null;
  message: string | null;
  patient_name?: string;
  patient_health_id?: string;
  report_title?: string;
  report_type?: ReportType;
}
