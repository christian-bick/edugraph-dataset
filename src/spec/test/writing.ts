import DatasetPermutationBuilder, { toTargets } from '../../lib/dataset-permutation-builder.ts';
import { Area, Scope, Ability } from 'edugraph-ts';
import { CompetencyTarget } from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.DigitNotation,
        Ability.ProcedureExecution,
        Scope.NumbersSmaller10
    ]);

export const spec: CompetencyTarget[] = toTargets('test-writing', builder);
