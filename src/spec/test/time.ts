import DatasetPermutationBuilder, { toTargets } from '../../lib/dataset-permutation-builder.ts';
import { Area, Scope, Ability } from 'edugraph-ts';
import { CompetencyTarget } from '../../types/ml-engine.ts';

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

const halfHourBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MeasuringTime,
        Scope.AnalogClock,
        Scope.HalfHourIntervals
    ])
    .applyLabelVariants([
        [Ability.ProcedureExecution],
        [Ability.VisualArticulation]
    ]);

const digitalBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MeasuringTime,
        Scope.DigitalClock
    ])
    .applyLabelVariants([
        [Scope.HourIntervals],
        [Scope.HalfHourIntervals]
    ])
    .applyLabelVariants([
        [Ability.ProcedureExecution],
        [Ability.VisualArticulation]
    ]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-time', builder),
    ...toTargets('test-time-half-hour', halfHourBuilder),
    ...toTargets('test-time-digital', digitalBuilder)
];
