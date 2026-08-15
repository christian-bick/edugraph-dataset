import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const distributiveAreaBuilder = new DatasetPermutationBuilder().addLabels([
    Area.AreaCalculation,
    Area.Rectangle,
    Area.ShapeDecomposition,
    Area.Multiplication,
    Area.Addition,
    Area.DistributiveLaw,
    Scope.ThreeOperands,
    Ability.ProcedureUnderstanding
]);

const rectilinearAreaBuilder = new DatasetPermutationBuilder().addLabels([
    Area.AreaCalculation,
    Area.Rectangle,
    Area.ShapeDecomposition,
    Area.Addition,
    Ability.VisualDecomposition,
    Ability.ProcedureExecution
]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-area-distributive-model', distributiveAreaBuilder),
    ...toTargets('test-area-rectilinear-decomposition', rectilinearAreaBuilder)
];
