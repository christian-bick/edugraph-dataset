import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const concreteBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.PlaceValue,
        Area.IntegerRegrouping,
        Scope.PhysicalNumbers,
        Scope.TwoOperands,
        Scope.NumbersSmaller1000,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([[Area.Addition], [Area.Subtraction]]);

const methodBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.PlaceValue,
        Area.IntegerRegrouping,
        Scope.PhysicalNumbers,
        Scope.TwoOperands,
        Scope.NumbersSmaller1000,
        Ability.ProcedureUnderstanding,
        Ability.Formalization
    ])
    .applyLabelVariants([[Area.Addition], [Area.Subtraction]]);

const explanationBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.PlaceValue,
        Scope.TwoOperands,
        Scope.NumbersSmaller1000,
        Ability.TextualArticulation,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([[Area.Addition], [Area.Subtraction]]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-place-value-regrouping', concreteBuilder),
    ...toTargets('test-place-value-written-method', methodBuilder),
    ...toTargets('test-place-value-strategy-explanation', explanationBuilder)
];
