
import { DatasetGenerationConfig } from "../../types/ml-engine.ts";
import DatasetPermutationBuilder from "../../lib/dataset-permutation-builder.ts";
import { Area, Scope, Ability } from "edugraph-ts";

const SEED = 42;

function buildPermutations() {
    return new DatasetPermutationBuilder()
        .addLabels([
            Area.NumerationWithIntegers,
            Scope.ArabicNumerals, 
            Scope.Base10, 
            Scope.NumbersSmaller10,
            Ability.ProcedureExecution
        ])
        .applyLabelVariants([
            [Scope.NumbersWithZero],
            [Scope.NumbersWithoutZero]
        ])
        .build();
}

export const generationConfig: DatasetGenerationConfig = {
    permutations: buildPermutations(),
    countPerPermutation: 1,
    seed: SEED
};
