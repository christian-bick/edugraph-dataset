import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MeasuringTime,
        Scope.TimeIntervals,
        Scope.MinuteIntervals,
        Scope.IntegerNumbers,
        Scope.SingleStep,
        Ability.ProcedureExecution,
        Ability.TextualReception
    ])
    .applyLabelVariants([[Scope.AnalogClock], [Scope.DigitalClock]])
    .applyLabelVariants([[Area.Addition], [Area.Subtraction]]);

export const spec: CompetencyTarget[] = toTargets('test-time-interval-arithmetic', builder);
