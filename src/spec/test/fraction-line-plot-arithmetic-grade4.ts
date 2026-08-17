import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const constructFractionalLinePlotBuilder = new DatasetPermutationBuilder().addLabels([
    Area.Statistics,
    Area.MeasuringObjects,
    Scope.LengthMeasurement,
    Scope.FractionNumbers,
    Scope.LinePlot,
    Scope.SingleFrameOfReference,
    Ability.VisualArticulation
]);

const fractionLinePlotArithmeticBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Statistics,
        Area.MeasuringObjects,
        Area.FractionArithmetic,
        Scope.LengthMeasurement,
        Scope.FractionNumbers,
        Scope.LinePlot,
        Scope.SingleFrameOfReference,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([[Area.Addition], [Area.Subtraction]]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-grade4-construct-fractional-line-plot', constructFractionalLinePlotBuilder),
    ...toTargets('test-grade4-line-plot-fraction-arithmetic', fractionLinePlotArithmeticBuilder)
];
