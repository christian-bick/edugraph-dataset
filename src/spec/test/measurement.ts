import DatasetPermutationBuilder from '../../lib/dataset-permutation-builder.ts';
import { Area, Scope, Ability } from 'edugraph-ts';
import { CompetencyTarget } from '../ccss/kindergarten.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Measurement,
        Scope.LengthMeasurement,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.IntegerNumbers],
        [Scope.DecimalNumbers]
    ])
    .applyLabelVariants([
        [Scope.NumbersSmaller10],
        [Scope.NumbersSmaller20],
        [Scope.NumbersSmaller100]
    ]);

export const MeasurementTestSpec: CompetencyTarget[] = builder.build().map((p, i) => ({
    id: `test-measurement-${i}`,
    labels: p.labels,
    constraints: p.constraints
}));
