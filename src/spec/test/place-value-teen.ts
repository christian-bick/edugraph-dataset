import DatasetPermutationBuilder, { toTargets } from '../../lib/dataset-permutation-builder.ts';
import { Area, Scope, Ability } from 'edugraph-ts';
import { CompetencyTarget } from '../../types/ml-engine.ts';

const createTeenBuilder = (direction: string): DatasetPermutationBuilder =>
    new DatasetPermutationBuilder()
    .addLabels([
        Area.PlaceValue,
        direction,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.PhysicalNumbers,
        Ability.ProcedureExecution,
        Scope.NumbersSmaller20
    ]);

const composeTeenBuilder = createTeenBuilder(Area.UnionOfCollections);
const decomposeTeenBuilder = createTeenBuilder(Area.PartitionOfCollections);

const multipleTensBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.PlaceValue,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.MultiplesOf10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller100,
        Scope.PhysicalNumbers,
        Ability.ProcedureUnderstanding
    ]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-place-value-compose-teen', composeTeenBuilder),
    ...toTargets('test-place-value-decompose-teen', decomposeTeenBuilder),
    ...toTargets('test-place-value-multiple-tens', multipleTensBuilder)
];
