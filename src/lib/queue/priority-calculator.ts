import type { QueueRule, PriorityReason, PatientVitals } from '@/types';

interface PatientContext {
  age: number;
  conditions: string[];
  vitals: PatientVitals;
  hasPreCheck: boolean;
}

function checkVitalRule(vitals: PatientVitals, config: Record<string, unknown>): boolean {
  const vital = config.vital as string;
  const operator = config.operator as string;
  const value = config.value as number;
  const vitalsRecord = vitals as Record<string, number | undefined>;
  const actualValue = vitalsRecord[vital];
  if (actualValue === undefined) return false;
  switch (operator) {
    case '>=':
      return actualValue >= value;
    case '>':
      return actualValue > value;
    case '<=':
      return actualValue <= value;
    case '<':
      return actualValue < value;
    case '==':
      return actualValue === value;
    default:
      return false;
  }
}

export function calculatePriorityScore(
  patient: PatientContext,
  rules: QueueRule[]
): { score: number; reasons: PriorityReason[] } {
  let score = 0;
  const reasons: PriorityReason[] = [];

  for (const rule of rules) {
    if (!rule.is_active) continue;

    switch (rule.rule_type) {
      case 'age': {
        const minAge = rule.condition_config.min_age as number;
        if (patient.age >= minAge) {
          score += rule.points;
          reasons.push({
            rule: rule.rule_name,
            points: rule.points,
            description: `Age ${patient.age} (≥${minAge})`,
          });
        }
        break;
      }
      case 'condition': {
        const matching = (rule.condition_config.conditions as string[]).filter((c) =>
          patient.conditions.some(
            (pc) => pc.toLowerCase().replace(/\s+/g, '_') === c.toLowerCase().replace(/\s+/g, '_')
          )
        );
        if (matching.length > 0) {
          score += rule.points;
          reasons.push({
            rule: rule.rule_name,
            points: rule.points,
            description: `Conditions: ${matching.join(', ')}`,
          });
        }
        break;
      }
      case 'vital': {
        if (checkVitalRule(patient.vitals, rule.condition_config)) {
          score += rule.points;
          const vitalLabel = (rule.condition_config.vital as string).replace(/_/g, ' ');
          reasons.push({
            rule: rule.rule_name,
            points: rule.points,
            description: `${vitalLabel} ${rule.condition_config.operator} ${rule.condition_config.value}`,
          });
        }
        break;
      }
      case 'pre_check': {
        if (patient.hasPreCheck) {
          score += rule.points;
          reasons.push({
            rule: rule.rule_name,
            points: rule.points,
            description: 'Pre-check completed',
          });
        }
        break;
      }
    }
  }

  return { score, reasons };
}
