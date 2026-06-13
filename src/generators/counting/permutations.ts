import { MLDatasetPipelineConfig } from "../../types/ml-engine.ts";
import PermutationBuilder from "../../lib/permutation-builder.ts";

const SEED = 42;

export const config: MLDatasetPipelineConfig = {
    generatorName: 'counting',
    generationConfig: {
        permutations: new PermutationBuilder()
            .applyVariants('maxCount', [5, 10, 15, 20])
            .applyVariants('type', ['inc', 'dec', undefined])
            .build().map(p => p.params),
        countPerPermutation: 1,
        seed: SEED
    },
    splits: { train: 0.8, val: 0.2 },
    visualDistribution: [
        { rendererId: 'counting-objects', visualParams: {}, instancesPerProblem: 1 },
        { rendererId: 'counting-inc-dec', visualParams: {}, instancesPerProblem: 1 }
    ]
};
