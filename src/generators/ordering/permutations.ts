import { MLDatasetPipelineConfig } from "../../types/ml-engine.ts";
import PermutationBuilder from "../../lib/permutation-builder.ts";

const SEED = 42;

export const config: MLDatasetPipelineConfig = {
    generatorName: 'ordering',
    generationConfig: {
        permutations: new PermutationBuilder()
            .applyVariants('includesZero', [true, false])
            .build().map(p => p.params),
        countPerPermutation: 1,
        seed: SEED
    },
    splits: { train: 0.8, val: 0.2 },
    visualDistribution: [
        { rendererId: 'numbers-order', visualParams: { desc: false }, instancesPerProblem: 1 },
        { rendererId: 'numbers-order', visualParams: { desc: true }, instancesPerProblem: 1 }
    ]
};
