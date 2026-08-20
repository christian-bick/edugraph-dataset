import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const tableBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Statistics,
        Area.Measurement,
        Scope.LengthMeasurement,
        Scope.ObservedMeasurement,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([[Scope.IntegerNumbers], [Scope.FractionNumbers]]);

const linePlotBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Statistics,
        Area.Measurement,
        Scope.LengthMeasurement,
        Scope.ProvidedMeasurement,
        Scope.IntegerNumbers,
        Scope.LinePlot,
        Scope.StepsOf1,
        Ability.VisualArticulation
    ]);

const fractionalLinePlotBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Statistics,
        Area.Measurement,
        Scope.LengthMeasurement,
        Scope.ProvidedMeasurement,
        Scope.FractionNumbers,
        Scope.LinePlot,
        Scope.SingleFrameOfReference,
        Ability.VisualArticulation
    ]);

const fractionalLinePlotArithmeticBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Statistics,
        Area.Measurement,
        Area.FractionArithmetic,
        Area.Subtraction,
        Scope.LengthMeasurement,
        Scope.ProvidedMeasurement,
        Scope.FractionNumbers,
        Scope.LinePlot,
        Scope.SingleFrameOfReference,
        Ability.ProcedureExecution
    ]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-measurement-data-table', tableBuilder),
    ...toTargets('test-measurement-data-line-plot', linePlotBuilder),
    ...toTargets('test-fractional-measurement-line-plot', fractionalLinePlotBuilder),
    ...toTargets('test-fractional-measurement-line-plot-arithmetic', fractionalLinePlotArithmeticBuilder)
];
