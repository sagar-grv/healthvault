import { VerificationState } from './verification';

export type UserRole = 'patient' | 'doctor' | 'admin';

export interface EmergencyProfile {
  id: string;
  patient_id: string;
  random_id: string;
  blood_group: string | null;
  allergies: string[];
  conditions: string[];
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConsentLog {
  id: string;
  user_id: string;
  consent_type: string;
  consent_version: string;
  accepted_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

export interface UploadAttempt {
  id: string;
  user_id: string;
  uploaded_at: string;
}

export interface AiAuditLog {
  id: string;
  user_id: string;
  report_id: string | null;
  action: string;
  model_used: string | null;
  file_size_bytes: number | null;
  flagged: boolean;
  flag_reason: string | null;
  created_at: string;
}

export interface AiUsage {
  id: string;
  user_id: string;
  used_at: string;
}

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
  latitude: number | null;
  longitude: number | null;
  hpr_id: string | null;
  verification_state: VerificationState;
  verification_submitted_at: string | null;
  rejection_reason: string | null;
  verified_at: string | null;
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
  report_ids: string[];
  shared_at: string;
  viewed_at: string | null;
  // Joined fields (from Supabase select)
  patient?: Profile;
  doctor?: Profile;
}

// Pre-Check Types
export interface SymptomEntry {
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  duration: string;
  body_part?: string;
}

export interface PatientVitals {
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  temperature_f?: number;
  weight_kg?: number;
  blood_sugar_mg?: number;
  oxygen_saturation?: number;
}

export interface PreCheckSubmission {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  symptoms: SymptomEntry[];
  vitals: PatientVitals;
  existing_conditions: string[];
  current_medications: string[];
  allergies: string[];
  past_surgeries: string[];
  family_history: string[];
  ai_summary: string | null;
  ai_key_findings: unknown;
  status: 'draft' | 'submitted' | 'reviewed';
  submitted_at: string | null;
  reviewed_at: string | null;
  doctor_notes: string | null;
  created_at: string;
  updated_at: string;
}

// Queue Types
export interface PriorityReason {
  rule: string;
  points: number;
  description: string;
}

export interface QueueEntry {
  id: string;
  patient_id: string;
  doctor_id: string;
  priority_score: number;
  priority_reasons: PriorityReason[];
  status: 'waiting' | 'in_consultation' | 'completed' | 'cancelled' | 'no_show';
  checked_in_at: string;
  consultation_started_at: string | null;
  consultation_ended_at: string | null;
  pre_check_id: string | null;
  created_at: string;
  updated_at: string;
  patient?: Profile;
  pre_check?: PreCheckSubmission;
}

export interface QueueRule {
  id: string;
  rule_name: string;
  rule_type: 'age' | 'condition' | 'vital' | 'pre_check';
  condition_config: Record<string, unknown>;
  points: number;
  is_active: boolean;
  created_at: string;
}
