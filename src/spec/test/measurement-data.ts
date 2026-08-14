import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const tableBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Statistics,
        Area.MeasuringObjects,
        Scope.LengthMeasurement,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([[Scope.IntegerNumbers], [Scope.FractionNumbers]]);

const linePlotBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Statistics,
        Area.MeasuringObjects,
        Scope.LengthMeasurement,
        Scope.IntegerNumbers,
        Scope.LinePlot,
        Scope.StepsOf1,
        Ability.VisualArticulation
    ]);

const fractionalLinePlotBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Statistics,
        Area.MeasuringObjects,
        Scope.LengthMeasurement,
        Scope.FractionNumbers,
        Scope.LinePlot,
        Ability.ProcedureExecution,
        Ability.VisualArticulation
    ]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-measurement-data-table', tableBuilder),
    ...toTargets('test-measurement-data-line-plot', linePlotBuilder),
    ...toTargets('test-fractional-measurement-line-plot', fractionalLinePlotBuilder)
];
