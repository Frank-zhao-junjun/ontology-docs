import type { OntologyManifestGovernance } from '@/lib/manifest-validator';

/** P0：无治理 UI 时输出空结构，满足 spec 段完整性 */
export function compileGovernance(): OntologyManifestGovernance {
  return {
    roles: [],
    fieldPermissions: [],
    agentPolicies: [],
  };
}
