import DatasetPermutationBuilder, { toTargets } from '../../lib/dataset-permutation-builder.ts';
import { Area, Scope, Ability } from 'edugraph-ts';
import { CompetencyTarget } from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Difference,
        Ability.ProcedureExecution,
        Scope.NumbersSmaller20
    ]);

export const PlaceValueTeenTestSpec: CompetencyTarget[] = toTargets('test-place-value-teen', builder);
