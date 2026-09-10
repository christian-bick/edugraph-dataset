import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const fractionLinePlotArithmeticBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Statistics,
        Area.FractionArithmetic,
        Area.Addition,
        Scope.InchScale,
        Scope.ProvidedMeasurement,
        Scope.FractionNumbers,
        Scope.LinePlot,
        Scope.SingleFrameOfReference,
        Ability.ProcedureExecution
    ]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-grade4-line-plot-fraction-arithmetic', fractionLinePlotArithmeticBuilder)
];
