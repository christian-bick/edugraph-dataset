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
    .addLabels([
        Ability.TextualReception,
        Ability.Formalization,
        Ability.VisualArticulation
    ]);

const digitalReadingBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MeasuringTime,
        Scope.DigitalClock,
        Ability.VisualReception,
        Ability.Interpretation,
        Ability.Formalization
    ])
    .applyLabelVariants([
        [Scope.HourIntervals],
        [Scope.HalfHourIntervals]
    ]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-time', builder),
    ...toTargets('test-time-half-hour', halfHourBuilder),
    ...toTargets('test-time-digital-construction', digitalBuilder),
    ...toTargets('test-time-digital-reading', digitalReadingBuilder)
];
