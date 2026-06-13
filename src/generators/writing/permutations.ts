import { MLDatasetPipelineConfig } from "../../types/ml-engine.ts";
import PermutationBuilder from "../../lib/permutation-builder.ts";

const SEED = 42;

export const config: MLDatasetPipelineConfig = {
    generatorName: 'writing',
    generationConfig: {
        permutations: new PermutationBuilder()
            .applyRange(['number'], [1, 9])
            .build().map(p => p.params),
        countPerPermutation: 1,
        seed: SEED
    },
    splits: { train: 0.8, val: 0.2 },
    visualDistribution: [
        { rendererId: 'numbers-write', visualParams: { outline: false }, instancesPerProblem: 1 },
        { rendererId: 'numbers-write', visualParams: { outline: true }, instancesPerProblem: 1 }
    ]
};
