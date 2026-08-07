import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const operationsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.ThreeOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller20,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction],
        [Area.Multiplication],
        [Area.Division]
    ]);

const threeAddendsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Addition,
        Area.Sum,
        Scope.ThreeOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller20,
        Scope.PhysicalNumbers,
        Ability.TextualReception
    ]);

const propertiesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Addition,
        Scope.ThreeOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller20,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([
        [Area.CommutativeLaw],
        [Area.AssociativeLaw]
    ]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-arithmetic-ops-triples', operationsBuilder),
    ...toTargets('test-arithmetic-three-addends', threeAddendsBuilder),
    ...toTargets('test-arithmetic-properties', propertiesBuilder)
];
