import { createClient } from '@/lib/supabase/server';

const BIOMARKER_ALIASES: Record<string, string> = {
  hb: 'haemoglobin',
  hemoglobin: 'haemoglobin',
  haemoglobin: 'haemoglobin',
  hgb: 'haemoglobin',
  wbc: 'white_blood_cells',
  'white blood cells': 'white_blood_cells',
  'white blood cell count': 'white_blood_cells',
  tlc: 'white_blood_cells',
  rbc: 'red_blood_cells',
  'red blood cells': 'red_blood_cells',
  'red blood cell count': 'red_blood_cells',
  platelets: 'platelet_count',
  'platelet count': 'platelet_count',
  plt: 'platelet_count',
  hct: 'haematocrit',
  haematocrit: 'haematocrit',
  hematocrit: 'haematocrit',
  pcv: 'haematocrit',
  mcv: 'mean_corpuscular_volume',
  'mean corpuscular volume': 'mean_corpuscular_volume',
  mch: 'mean_corpuscular_haemoglobin',
  'mean corpuscular haemoglobin': 'mean_corpuscular_haemoglobin',
  'mean corpuscular hemoglobin': 'mean_corpuscular_haemoglobin',
  mchc: 'mean_corpuscular_haemoglobin_concentration',
  'mean corpuscular haemoglobin concentration': 'mean_corpuscular_haemoglobin_concentration',
  rdw: 'red_cell_distribution_width',
  'red cell distribution width': 'red_cell_distribution_width',
  'fasting blood sugar': 'fasting_glucose',
  fbs: 'fasting_glucose',
  'fasting glucose': 'fasting_glucose',
  ppbs: 'post_prandial_glucose',
  'post prandial blood sugar': 'post_prandial_glucose',
  'blood sugar random': 'random_glucose',
  'random blood sugar': 'random_glucose',
  hba1c: 'glycated_haemoglobin',
  'glycated haemoglobin': 'glycated_haemoglobin',
  'glycated hemoglobin': 'glycated_haemoglobin',
  a1c: 'glycated_haemoglobin',
  'total cholesterol': 'total_cholesterol',
  cholesterol: 'total_cholesterol',
  'hdl cholesterol': 'hdl_cholesterol',
  hdl: 'hdl_cholesterol',
  'ldl cholesterol': 'ldl_cholesterol',
  ldl: 'ldl_cholesterol',
  triglycerides: 'triglycerides',
  tg: 'triglycerides',
  vldl: 'vldl_cholesterol',
  'vldl cholesterol': 'vldl_cholesterol',
  sgot: 'ast',
  ast: 'ast',
  sgpt: 'alt',
  alt: 'alt',
  'alkaline phosphatase': 'alkaline_phosphatase',
  alp: 'alkaline_phosphatase',
  'total bilirubin': 'total_bilirubin',
  'direct bilirubin': 'direct_bilirubin',
  'indirect bilirubin': 'indirect_bilirubin',
  'blood urea nitrogen': 'blood_urea_nitrogen',
  bun: 'blood_urea_nitrogen',
  urea: 'serum_urea',
  'serum urea': 'serum_urea',
  'serum creatinine': 'serum_creatinine',
  creatinine: 'serum_creatinine',
  cr: 'serum_creatinine',
  'uric acid': 'uric_acid',
  'serum uric acid': 'uric_acid',
  sodium: 'serum_sodium',
  na: 'serum_sodium',
  potassium: 'serum_potassium',
  k: 'serum_potassium',
  chloride: 'serum_chloride',
  cl: 'serum_chloride',
  calcium: 'serum_calcium',
  'total calcium': 'serum_calcium',
  phosphorus: 'serum_phosphorus',
  phosphate: 'serum_phosphorus',
  magnesium: 'serum_magnesium',
  mg: 'serum_magnesium',
  'free t3': 'free_t3',
  ft3: 'free_t3',
  'free t4': 'free_t4',
  ft4: 'free_t4',
  tsh: 'tsh',
  'thyroid stimulating hormone': 'tsh',
  thyrotropin: 'tsh',
  ferritin: 'ferritin',
  'vitamin b12': 'vitamin_b12',
  b12: 'vitamin_b12',
  cobalamin: 'vitamin_b12',
  'vitamin d': 'vitamin_d',
  '25-oh vitamin d': 'vitamin_d',
  '25-hydroxy vitamin d': 'vitamin_d',
  'vitamin d3': 'vitamin_d',
  iron: 'serum_iron',
  'serum iron': 'serum_iron',
  tibc: 'total_iron_binding_capacity',
  'total iron binding capacity': 'total_iron_binding_capacity',
  'transferrin saturation': 'transferrin_saturation',
};

const UNIT_NORMALIZATIONS: Record<string, string> = {
  'mg/dl': 'mg/dL',
  'mg%': 'mg/dL',
  'mg/100ml': 'mg/dL',
  'g/dl': 'g/dL',
  'gm/dl': 'g/dL',
  'gm%': 'g/dL',
  'g%': 'g/dL',
  'ng/ml': 'ng/mL',
  'pg/ml': 'pg/mL',
  'u/l': 'U/L',
  'iu/l': 'IU/L',
  'miu/ml': 'mIU/mL',
  'mmol/l': 'mmol/L',
  'meq/l': 'mEq/L',
  'cells/cmm': 'cells/cmm',
  'per mm3': 'cells/cmm',
  '/mm3': 'cells/cmm',
  '%': '%',
  femtoliters: 'fL',
  fl: 'fL',
  picograms: 'pg',
  '10^3/ul': '10^3/µL',
  '10^6/ul': '10^6/µL',
  'lakhs/cmm': 'lakhs/cmm',
};

function normalizeName(raw: string): string {
  const cleaned = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  return (
    BIOMARKER_ALIASES[cleaned] ??
    cleaned
      .replace(/[^a-z0-9_\s]/g, '')
      .trim()
      .replace(/\s+/g, '_')
  );
}

function normalizeUnit(raw: string): string {
  const cleaned = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  return UNIT_NORMALIZATIONS[cleaned] ?? raw.trim();
}

function parseNumericValue(value: string): number | null {
  const cleaned = value.replace(/[<>,\s]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function parseNormalRange(range: string): { low: number | null; high: number | null } | null {
  const cleaned = range.replace(/\s/g, '');
  const match = cleaned.match(/^(\d+\.?\d*)\s*[-–—to]+\s*(\d+\.?\d*)$/);
  if (match) {
    return { low: parseFloat(match[1]), high: parseFloat(match[2]) };
  }
  const lessThan = cleaned.match(/^[<]\s*(\d+\.?\d*)$/);
  if (lessThan) {
    return { low: null, high: parseFloat(lessThan[1]) };
  }
  return null;
}

function normalizeValue(
  value: string,
  rawRange?: string
): { numericValue: number | null; isAbnormal: boolean | null } {
  const numeric = parseNumericValue(value);
  if (numeric === null || !rawRange) {
    return { numericValue: numeric, isAbnormal: null };
  }
  const parsed = parseNormalRange(rawRange);
  if (!parsed) {
    return { numericValue: numeric, isAbnormal: null };
  }
  let isAbnormal = false;
  if (parsed.low !== null && numeric < parsed.low) isAbnormal = true;
  if (parsed.high !== null && numeric > parsed.high) isAbnormal = true;
  return { numericValue: numeric, isAbnormal };
}

export interface NormalizedBiomarker {
  canonicalName: string;
  originalName: string;
  value: string;
  numericValue: number | null;
  unit: string;
  normalRange: string | null;
  normalizedRange: { low: number | null; high: number | null } | null;
  isAbnormal: boolean | null;
}

export function normalizeBiomarker(
  name: string,
  value: string,
  unit?: string | null,
  normalRange?: string | null
): NormalizedBiomarker {
  const canonicalName = normalizeName(name);
  const normalizedUnit = unit ? normalizeUnit(unit) : '';
  const { numericValue, isAbnormal } = normalizeValue(value, normalRange ?? undefined);
  return {
    canonicalName,
    originalName: name,
    value,
    numericValue,
    unit: normalizedUnit,
    normalRange: normalRange ?? null,
    normalizedRange: normalRange ? parseNormalRange(normalRange) : null,
    isAbnormal,
  };
}

export async function seedBiomarkerAliases(): Promise<void> {
  const supabase = await createClient();
  const entries = Object.entries(BIOMARKER_ALIASES);
  const grouped: Record<string, string[]> = {};
  for (const [alias, canonical] of entries) {
    if (!grouped[canonical]) grouped[canonical] = [];
    grouped[canonical].push(alias);
  }
  for (const [canonical, aliases] of Object.entries(grouped)) {
    const { data: existing } = await supabase
      .from('normalized_biomarkers')
      .select('id')
      .eq('canonical_name', canonical)
      .maybeSingle();
    if (existing) continue;
    await supabase.from('normalized_biomarkers').insert({
      canonical_name: canonical,
      aliases,
    });
  }
}
