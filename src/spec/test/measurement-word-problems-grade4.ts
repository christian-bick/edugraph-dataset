import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const measurementKinds = [
    [Area.MeasuringWithUnits, Scope.LengthMeasurement],
    [Area.MeasuringWithUnits, Scope.TimeMeasurement],
    [Area.MeasuringWithUnits, Scope.VolumeMeasurement, Scope.LiquidVolumes],
    [Area.MeasuringWithUnits, Scope.WeightMeasurement],
    [Scope.Dollar]
];

const builder = new DatasetPermutationBuilder()
    .addLabels([Scope.SingleStep, Scope.TwoOperands, Ability.TextualReception])
    .applyLabelVariants(measurementKinds)
    .applyLabelVariants([[Scope.IntegerNumbers], [Scope.FractionNumbers], [Scope.DecimalNumbers]])
    .applyLabelVariants([[Area.Addition], [Area.Subtraction], [Area.Multiplication], [Area.Division]]);

export const spec: CompetencyTarget[] = toTargets('test-grade4-measurement-word-problems', builder);
