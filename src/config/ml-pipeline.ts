import { MLDatasetPipelineConfig } from "../types/ml-engine.ts";
import PermutationBuilder from "../lib/permutation-builder.ts";

const splits = { train: 0.8, val: 0.2 };
const SEED = 42;

const arithmeticConfig: MLDatasetPipelineConfig = {
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
    splits,
    visualDistribution: [
        { rendererId: 'operations-boxes', visualParams: {}, instancesPerProblem: 1 },
        { rendererId: 'operations-vertical', visualParams: {}, instancesPerProblem: 1 }
    ]
};

const countingConfig: MLDatasetPipelineConfig = {
    generatorName: 'counting',
    generationConfig: {
        permutations: new PermutationBuilder()
            .applyVariants('maxCount', [5, 10, 15, 20])
            .applyVariants('type', ['inc', 'dec', undefined])
            .build().map(p => p.params),
        countPerPermutation: 1,
        seed: SEED
    },
    splits,
    visualDistribution: [
        { rendererId: 'counting-objects', visualParams: {}, instancesPerProblem: 1 },
        { rendererId: 'counting-inc-dec', visualParams: {}, instancesPerProblem: 1 }
    ]
};

const measurementConfig: MLDatasetPipelineConfig = {
    generatorName: 'measurement',
    generationConfig: {
        permutations: new PermutationBuilder()
            .applyVariants('bandLength', [10, 20])
            .build().map(p => p.params),
        countPerPermutation: 1,
        seed: SEED
    },
    splits,
    visualDistribution: [
        { rendererId: 'measure-length', visualParams: { decimal: true, reverse: false }, instancesPerProblem: 1 },
        { rendererId: 'measure-length', visualParams: { decimal: true, reverse: true }, instancesPerProblem: 1 }
    ]
};

const comparisonConfig: MLDatasetPipelineConfig = {
    generatorName: 'comparison',
    generationConfig: {
        permutations: new PermutationBuilder()
            .applyVariants('digits', [1, 2, 3])
            .applyVariants('includesZero', [true, false])
            .build().map(p => p.params),
        countPerPermutation: 1,
        seed: SEED
    },
    splits,
    visualDistribution: [
        { rendererId: 'numbers-compare', visualParams: {}, instancesPerProblem: 1 }
    ]
};

const orderingConfig: MLDatasetPipelineConfig = {
    generatorName: 'ordering',
    generationConfig: {
        permutations: new PermutationBuilder()
            .applyVariants('includesZero', [true, false])
            .build().map(p => p.params),
        countPerPermutation: 1,
        seed: SEED
    },
    splits,
    visualDistribution: [
        { rendererId: 'numbers-order', visualParams: { desc: false }, instancesPerProblem: 1 },
        { rendererId: 'numbers-order', visualParams: { desc: true }, instancesPerProblem: 1 }
    ]
};

const writingConfig: MLDatasetPipelineConfig = {
    generatorName: 'writing',
    generationConfig: {
        permutations: new PermutationBuilder()
            .applyRange(['number'], [1, 9])
            .build().map(p => p.params),
        countPerPermutation: 1,
        seed: SEED
    },
    splits,
    visualDistribution: [
        { rendererId: 'numbers-write', visualParams: { outline: false }, instancesPerProblem: 1 },
        { rendererId: 'numbers-write', visualParams: { outline: true }, instancesPerProblem: 1 }
    ]
};

const timeConfig: MLDatasetPipelineConfig = {
    generatorName: 'time',
    generationConfig: {
        permutations: new PermutationBuilder()
            .applyVariants('interval', [3600, 1800, 900, 60, 1])
            .build().map(p => p.params),
        countPerPermutation: 1,
        seed: SEED
    },
    splits,
    visualDistribution: [
        { rendererId: 'time-analog', visualParams: { reverse: false }, instancesPerProblem: 1 },
        { rendererId: 'time-analog', visualParams: { reverse: true }, instancesPerProblem: 1 }
    ]
};

export const pipelineConfigs: MLDatasetPipelineConfig[] = [
    arithmeticConfig,
    countingConfig,
    measurementConfig,
    comparisonConfig,
    orderingConfig,
    writingConfig,
    timeConfig
];
