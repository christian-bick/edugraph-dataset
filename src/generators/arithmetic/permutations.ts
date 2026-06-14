import { MLDatasetPipelineConfig } from "../../types/ml-engine.ts";
import { Area, Scope } from "edugraph-ts";
import DatasetPermutationBuilder from "../../lib/dataset-permutation-builder.ts";

const SEED = 42;

function buildPermutations() {
    return new DatasetPermutationBuilder()
        .addLabels([Scope.ArabicNumerals, Scope.Base10])
        .applyLabelVariants([
            [Area.IntegerAddition],
            [Area.IntegerSubtraction],
            [Area.IntegerMultiplication],
            [Area.IntegerDivision]
        ])
        .applyLabelVariants([
            [Scope.NumbersSmaller10],
            [Scope.NumbersSmaller100]
        ])
        .applyLabelVariants([
            [Scope.NumbersWithZero],
            [Scope.NumbersWithoutZero]
        ])
        .applyConstraintVariants('blankPart', ['answer', 'problem'])
        .build();
}

export const config: MLDatasetPipelineConfig = {
    generatorName: 'arithmetic',
    generationConfig: {
        permutations: buildPermutations(),
        countPerPermutation: 3,
        seed: SEED
    },
    splits: { train: 0.8, val: 0.2 },
    visualDistribution: [
        { rendererId: 'operations-boxes', visualParams: {}, instancesPerProblem: 1 },
        { rendererId: 'operations-vertical', visualParams: {}, instancesPerProblem: 1 }
    ]
};
