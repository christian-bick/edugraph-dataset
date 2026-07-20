import DatasetPermutationBuilder from '../../lib/dataset-permutation-builder.ts';
import { Area, Scope, Ability } from 'edugraph-ts';
import { CompetencyTarget } from '../ccss/kindergarten.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Measurement,
        Area.ObjectSorting,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.LengthMeasurement],
        [Scope.WeightMeasurement]
    ])
    .applyLabelVariants([
        [Scope.Greater],
        [Scope.Less]
    ]);

export const MeasurementCompareTestSpec: CompetencyTarget[] = builder.build().map((p, i) => ({
    id: `test-measurement-compare-${i}`,
    labels: p.labels,
    constraints: p.constraints
}));
