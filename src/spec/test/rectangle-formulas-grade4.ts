import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const rectangleAreaFormulaBuilder = new DatasetPermutationBuilder().addLabels([
    Area.AreaCalculation,
    Area.Equation,
    Area.Rectangle,
    Area.Multiplication,
    Scope.IntegerNumbers,
    Scope.TwoOperands,
    Ability.ProcedureExecution
]);

const rectanglePerimeterFormulaBuilder = new DatasetPermutationBuilder().addLabels([
    Area.PerimeterCalculation,
    Area.Equation,
    Area.Rectangle,
    Area.Addition,
    Scope.IntegerNumbers,
    Ability.ProcedureExecution
]);

const unknownRectangleDimensionBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Equation,
        Area.Rectangle,
        Scope.IntegerNumbers,
        Ability.ProcedureInversion
    ])
    .applyLabelVariants([
        [Area.AreaCalculation, Area.Multiplication, Scope.TwoOperands],
        [Area.PerimeterCalculation, Area.Addition]
    ]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-grade4-rectangle-area-formula', rectangleAreaFormulaBuilder),
    ...toTargets('test-grade4-rectangle-perimeter-formula', rectanglePerimeterFormulaBuilder),
    ...toTargets('test-grade4-unknown-rectangle-dimension', unknownRectangleDimensionBuilder)
];
