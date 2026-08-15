import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const distributiveAreaBuilder = new DatasetPermutationBuilder().addLabels([
    Area.AreaCalculation,
    Area.Rectangle,
    Area.ShapeComposition,
    Area.Multiplication,
    Area.Addition,
    Area.DistributiveLaw,
    Scope.ThreeOperands,
    Ability.ProcedureUnderstanding
]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-area-distributive-model', distributiveAreaBuilder)
];
