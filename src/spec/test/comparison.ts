import DatasetPermutationBuilder from '../../lib/dataset-permutation-builder.ts';
import { Area, Scope, Ability } from 'edugraph-ts';
import { CompetencyTarget } from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumericComparison,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.Less],
        [Scope.Equal],
        [Scope.Greater]
    ])
    .applyLabelVariants([
        [Scope.NumbersWithZero],
        [Scope.NumbersWithoutZero]
    ])
    .addLabels([Scope.NumbersSmaller10]);

export const ComparisonTestSpec: CompetencyTarget[] = builder.build().map((p, i) => ({
    id: `test-comparison-${i}`,
    labels: p.labels,
    constraints: p.constraints
}));
