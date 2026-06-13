import { MLDatasetPipelineConfig } from "../../types/ml-engine.ts";
import PermutationBuilder from "../../lib/permutation-builder.ts";

const SEED = 42;

export const config: MLDatasetPipelineConfig = {
    generatorName: 'measurement',
    generationConfig: {
        permutations: new PermutationBuilder()
            .applyVariants('bandLength', [10, 20])
            .build().map(p => p.params),
        countPerPermutation: 1,
        seed: SEED
    },
    splits: { train: 0.8, val: 0.2 },
    visualDistribution: [
        { rendererId: 'measure-length', visualParams: { decimal: true, reverse: false }, instancesPerProblem: 1 },
        { rendererId: 'measure-length', visualParams: { decimal: true, reverse: true }, instancesPerProblem: 1 }
    ]
};
