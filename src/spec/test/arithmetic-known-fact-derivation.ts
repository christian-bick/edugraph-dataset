import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const knownFactDerivationSmokeBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MultiplicationKnownFactDerivation,
        Area.CommutativeLaw,
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller20,
        Ability.ProcedureUnderstanding
    ]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-arithmetic-known-fact-derivation', knownFactDerivationSmokeBuilder)
];
