import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Addition,
        Scope.FourOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersLarger10,
        Scope.NumbersSmaller100,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Ability.ProcedureExecution
    ]);

export const spec: CompetencyTarget[] = toTargets('test-arithmetic-four-addends', builder);
