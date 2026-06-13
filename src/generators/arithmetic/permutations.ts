import { MLDatasetPipelineConfig } from "../../types/ml-engine.ts";
import PermutationBuilder from "../../lib/permutation-builder.ts";

const SEED = 42;

export const config: MLDatasetPipelineConfig = {
    generatorName: 'arithmetic',
    generationConfig: {
        permutations: [
            ...new PermutationBuilder()
                .applyVariants('operations', ['add', 'subtract', 'multiply', 'divide'])
                .applyVariants('blankPart', ['answer', 'problem', 'problem-answer', 'random'])
                .applyVariants('includeZero', [true, false])
                .applyVariants('allowNegatives', [false, true])
                .build().map(p => p.params),
            ...new PermutationBuilder()
                .applyRange(['digitsNum1', "digitsNum2"], [2, 3])
                .applyVariants('operations', ['add', 'subtract', 'multiply'])
                .applyVariants('allowNegatives', [false, true])
                .build().map(p => p.params)
        ],
        countPerPermutation: 1,
        seed: SEED
    },
    splits: { train: 0.8, val: 0.2 },
    visualDistribution: [
        { rendererId: 'operations-boxes', visualParams: {}, instancesPerProblem: 1 },
        { rendererId: 'operations-vertical', visualParams: {}, instancesPerProblem: 1 }
    ]
};
