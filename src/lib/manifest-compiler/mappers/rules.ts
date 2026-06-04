import type { OntologyProject, Rule } from '@/types/ontology';
import type { ManifestRule } from '@/lib/manifest-validator';
import { mapRuleType } from './enums';

export function mapRules(project: OntologyProject): ManifestRule[] {
  const rules = project.ruleModel?.rules ?? [];

  return rules.map(
    (rule: Rule): ManifestRule & { expression?: unknown; errorMessage?: string; enabled?: boolean } => ({
      id: rule.id,
      name: rule.name,
      type: mapRuleType(rule.type),
      expression: rule.condition,
      errorMessage: rule.errorMessage,
      enabled: rule.enabled !== false,
    })
  );
}
