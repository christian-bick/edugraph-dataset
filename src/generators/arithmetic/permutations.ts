import { MLDatasetPipelineConfig } from "../../types/ml-engine.ts";
import { Ability, Area, Scope } from "edugraph-ts";
import DatasetPermutationBuilder from "../../lib/dataset-permutation-builder.ts";

const SEED = 42;

function buildPermutations() {
    return new DatasetPermutationBuilder()
        .addLabels([
            Scope.ArabicNumerals,
            Scope.Base10,
            Ability.ProcedureExecution
        ])
        .applyLabelVariants([
            [Area.Addition],
            [Area.Subtraction],
            [Area.Multiplication],
            [Area.Division]
        ])
        .applyLabelVariants([
            [Scope.NumbersSmaller10],
            [Scope.NumbersSmaller100]
        ])
        .applyLabelVariants([
            [Scope.IntegersWithZero],
            [Scope.IntegersWithoutZero]
        ])
        .applyConstraintVariants('blankPart', ['solution', 'problem'])
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
        { viewId: 'operations-boxes', visualParams: {}, instancesPerProblem: 1 },
        { viewId: 'operations-vertical', visualParams: {}, instancesPerProblem: 1 }
    ]
};
