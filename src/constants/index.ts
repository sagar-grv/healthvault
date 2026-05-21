export const REPORT_TYPES = [
  { value: 'prescription', label: 'Prescription' },
  { value: 'lab_report', label: 'Lab Report' },
  { value: 'scan', label: 'Scan / Imaging' },
  { value: 'discharge_summary', label: 'Discharge Summary' },
  { value: 'vaccination', label: 'Vaccination Record' },
  { value: 'other', label: 'Other' },
] as const;

export const REPORT_TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  prescription: { bg: '#EFF6FF', color: '#1D4ED8' },
  lab_report: { bg: '#F0FDF4', color: '#047857' },
  scan: { bg: '#FDF4FF', color: '#7C3AED' },
  discharge_summary: { bg: '#FFF7ED', color: '#C2410C' },
  vaccination: { bg: '#ECFDF5', color: '#065F46' },
  other: { bg: '#F9FAFB', color: '#374151' },
};

export const MEDICAL_COUNCILS = [
  'National Medical Commission (NMC)',
  'Andhra Pradesh Medical Council',
  'Arunachal Pradesh Medical Council',
  'Assam Medical Council',
  'Bihar Medical Council',
  'Chhattisgarh Medical Council',
  'Delhi Medical Council',
  'Goa Medical Council',
  'Gujarat Medical Council',
  'Haryana Medical Council',
  'Himachal Pradesh Medical Council',
  'Jammu & Kashmir Medical Council',
  'Jharkhand Medical Council',
  'Karnataka Medical Council',
  'Kerala Medical Council',
  'Madhya Pradesh Medical Council',
  'Maharashtra Medical Council',
  'Manipur Medical Council',
  'Meghalaya Medical Council',
  'Mizoram Medical Council',
  'Nagaland Medical Council',
  'Odisha Medical Council',
  'Punjab Medical Council',
  'Rajasthan Medical Council',
  'Sikkim Medical Council',
  'Tamil Nadu Medical Council',
  'Telangana State Medical Council',
  'Tripura Medical Council',
  'Uttar Pradesh Medical Council',
  'Uttarakhand Medical Council',
  'West Bengal Medical Council',
] as const;

export const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Health ID characters (excluding confusing ones: 0/O, 1/I/L)
export const HEALTH_ID_CHARS = '2345679ABCDEFGHJKMNPQRSTUVWXYZ';
export const HEALTH_ID_PREFIX = 'HV';

export const DOCTOR_SEARCH_RATE_LIMIT = 10; // max searches per hour
