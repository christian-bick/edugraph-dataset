import DatasetPermutationBuilder from '../../lib/dataset-permutation-builder.ts';
import { Area, Scope, Ability } from 'edugraph-ts';
import { CompetencyTarget } from '../ccss/kindergarten.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MeasuringTime,
        Scope.AnalogClock
    ])
    .applyLabelVariants([
        [Scope.HourIntervals],
        [Scope.MinuteIntervals],
        [Scope.SecondIntervals]
    ])
    .applyLabelVariants([
        [Ability.ProcedureExecution],
        [Ability.VisualArticulation]
    ]);

export const TimeTestSpec: CompetencyTarget[] = builder.build().map((p, i) => ({
    id: `test-time-${i}`,
    labels: p.labels,
    constraints: p.constraints
}));
