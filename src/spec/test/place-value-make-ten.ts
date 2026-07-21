import DatasetPermutationBuilder from '../../lib/dataset-permutation-builder.ts';
import { Area, Scope, Ability } from 'edugraph-ts';
import { CompetencyTarget } from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Difference,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.NumbersWithZero],
        [Scope.NumbersWithoutZero]
    ]);

export const PlaceValueMakeTenTestSpec: CompetencyTarget[] = builder.build().map((p, i) => ({
    id: `test-place-value-make-ten-${i}`,
    labels: p.labels,
    constraints: p.constraints
}));
