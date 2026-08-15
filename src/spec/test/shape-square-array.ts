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

const interpretCoverageBuilder = new DatasetPermutationBuilder().addLabels([
    Area.AreaCalculation,
    Area.Iteration,
    Area.Square,
    Scope.TileScale,
    Scope.IntegerNumbers,
    Ability.Interpretation
]);

const countAreaBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.AreaCalculation,
        Area.Iteration,
        Area.Square,
        Scope.TileScale,
        Scope.IntegerNumbers,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [],
        [Scope.SquareCentimeterScale],
        [Scope.SquareMeterScale],
        [Scope.SquareInchScale],
        [Scope.SquareFootScale]
    ]);

const explainProductBuilder = new DatasetPermutationBuilder().addLabels([
    Area.AreaCalculation,
    Area.Rectangle,
    Area.Square,
    Area.Multiplication,
    Scope.BoxArrangement,
    Scope.TwoOperands,
    Ability.ProcedureUnderstanding
]);

const calculateAreaBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.AreaCalculation,
        Area.Rectangle,
        Area.Multiplication,
        Scope.TwoOperands,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([[], [Ability.TextualReception]]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-shape-square-array-partition', partitionBuilder),
    ...toTargets('test-shape-square-array-count', countBuilder),
    ...toTargets('test-shape-square-array-interpret-unit', interpretUnitBuilder),
    ...toTargets('test-shape-square-array-interpret-coverage', interpretCoverageBuilder),
    ...toTargets('test-shape-square-array-count-area', countAreaBuilder),
    ...toTargets('test-shape-square-array-explain-product', explainProductBuilder),
    ...toTargets('test-shape-square-array-calculate-area', calculateAreaBuilder)
];
