import DatasetPermutationBuilder, { toTargets } from '../../lib/dataset-permutation-builder.ts';
import { Area, Scope, Ability } from 'edugraph-ts';
import { CompetencyTarget } from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MeasuringLength,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.IntegerNumbers, Scope.NumbersSmaller10],
        [Scope.IntegerNumbers, Scope.NumbersSmaller20],
        [Scope.IntegerNumbers, Scope.NumbersSmaller100],
        [Scope.DecimalNumbers, Scope.NumbersSmaller10],
        [Scope.DecimalNumbers, Scope.NumbersSmaller20]
    ]);

export const spec: CompetencyTarget[] = toTargets('test-measurement-length', builder);
