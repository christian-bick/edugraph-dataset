import { MLDatasetPipelineConfig } from "../../types/ml-engine.ts";
import PermutationBuilder from "../../lib/permutation-builder.ts";

const SEED = 42;

export const config: MLDatasetPipelineConfig = {
    generatorName: 'time',
    generationConfig: {
        permutations: new PermutationBuilder()
            .applyVariants('interval', [3600, 1800, 900, 60, 1])
            .build().map(p => p.params),
        countPerPermutation: 1,
        seed: SEED
    },
    splits: { train: 0.8, val: 0.2 },
    visualDistribution: [
        { rendererId: 'time-analog', visualParams: { reverse: false }, instancesPerProblem: 1 },
        { rendererId: 'time-analog', visualParams: { reverse: true }, instancesPerProblem: 1 }
    ]
};
