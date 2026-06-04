import type { OntologyManifestBehavior } from '@/lib/manifest-validator';
import type { OntologyProject } from '@/types/ontology';
import { mapActions } from './mappers/actions';
import { mapRules } from './mappers/rules';

export function compileBehavior(project: OntologyProject): OntologyManifestBehavior {
  return {
    actions: mapActions(project),
    rules: mapRules(project),
    metrics: [],
    transactionBoundaries: [],
    sideEffects: [],
  };
}
