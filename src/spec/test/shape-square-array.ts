import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const partitionBuilder = new DatasetPermutationBuilder().addLabels([
    Area.Rectangle,
    Area.Square,
    Area.ShapeComposition,
    Scope.BoxArrangement,
    Scope.EqualShares,
    Ability.VisualArticulation
]);

const countBuilder = new DatasetPermutationBuilder().addLabels([
    Area.Rectangle,
    Area.Square,
    Area.ShapeComposition,
    Scope.BoxArrangement,
    Scope.EqualShares,
    Ability.ProcedureExecution
]);

const interpretUnitBuilder = new DatasetPermutationBuilder().addLabels([
    Area.Square,
    Scope.TileScale,
    Ability.Interpretation
]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-shape-square-array-partition', partitionBuilder),
    ...toTargets('test-shape-square-array-count', countBuilder),
    ...toTargets('test-shape-square-array-interpret-unit', interpretUnitBuilder)
];
