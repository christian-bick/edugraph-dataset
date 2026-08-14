import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MeasuringTime,
        Scope.TimeIntervals,
        Scope.MinuteIntervals,
        Scope.IntegerNumbers,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([[Scope.AnalogClock], [Scope.DigitalClock]]);

export const spec: CompetencyTarget[] = toTargets('test-time-elapsed', builder);
