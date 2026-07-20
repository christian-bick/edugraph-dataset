import DatasetPermutationBuilder from '../../lib/dataset-permutation-builder.ts';
import { Area, Scope, Ability } from 'edugraph-ts';
import { CompetencyTarget } from '../ccss/kindergarten.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumericOrder,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.NumbersWithZero],
        [Scope.NumbersWithoutZero]
    ])
    .applyLabelVariants([
        [Scope.NumbersWithNegatives],
        [Scope.NumbersWithoutNegatives]
    ])
    .applyLabelVariants([
        [Scope.Most],
        [Scope.Least]
    ])
    .addLabels([Scope.NumbersSmaller100]);

export const OrderingTestSpec: CompetencyTarget[] = builder.build().map((p, i) => ({
    id: `test-ordering-${i}`,
    labels: p.labels,
    constraints: p.constraints
}));
