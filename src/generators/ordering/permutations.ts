import { MLDatasetPipelineConfig } from "../../types/ml-engine.ts";
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
            Ability.ProcedureApplication, 
            Ability.ProcedureExecution
        ])
        .applyLabelVariants([
            [Scope.NumbersWithZero],
            [Scope.NumbersWithoutZero]
        ])
        .build();
}

export const config: MLDatasetPipelineConfig = {
    generatorName: 'ordering',
    generationConfig: {
        permutations: buildPermutations(),
        countPerPermutation: 1,
        seed: SEED
    },
    splits: { train: 0.8, val: 0.2 },
    visualDistribution: [
        { rendererId: 'numbers-order', visualParams: { desc: false }, instancesPerProblem: 1 },
        { rendererId: 'numbers-order', visualParams: { desc: true }, instancesPerProblem: 1 }
    ]
};
