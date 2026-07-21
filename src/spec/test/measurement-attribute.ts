import DatasetPermutationBuilder from '../../lib/dataset-permutation-builder.ts';
import { Area, Scope, Ability } from 'edugraph-ts';
import { CompetencyTarget } from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MeasuringObjects,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.LengthMeasurement],
        [Scope.WeightMeasurement]
    ]);

export const MeasurementAttributeTestSpec: CompetencyTarget[] = builder.build().map((p, i) => ({
    id: `test-measurement-attribute-${i}`,
    labels: p.labels,
    constraints: p.constraints
}));
