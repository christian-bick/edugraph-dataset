import { Ability, Area, Scope } from 'edugraph-ts';
import DatasetPermutationBuilder, { toTargets } from '../../lib/dataset-permutation-builder.ts';
import { CompetencyTarget } from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumberNotation,
        Area.Addition,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller100,
        Scope.ArabicNumerals,
        Scope.PhysicalNumbers,
        Ability.ProcedureUnderstanding
    ]);

export const spec: CompetencyTarget[] = toTargets('test-arithmetic-decompose', builder);
