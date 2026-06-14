import { MLDatasetPipelineConfig } from "../../types/ml-engine.ts";
import DatasetPermutationBuilder from "../../lib/dataset-permutation-builder.ts";
import { Area, Scope, Ability } from "edugraph-ts";

const SEED = 42;

function buildPermutations() {
    return new DatasetPermutationBuilder()
        .addLabels([
            Area.IntegerNotation,
            Scope.ArabicNumerals, 
            Scope.Base10, 
            Scope.NumbersSmaller10, 
            Scope.NumbersWithoutZero,
            Ability.ProcedureExecution
        ])
        .applyConstraintRange(['number'], [1, 9])
        .build();
}

export const config: MLDatasetPipelineConfig = {
    generatorName: 'writing',
    generationConfig: {
        permutations: buildPermutations(),
        countPerPermutation: 1,
        seed: SEED
    },
    splits: { train: 0.8, val: 0.2 },
    visualDistribution: [
        { rendererId: 'numbers-write', visualParams: { outline: false }, instancesPerProblem: 1 },
        { rendererId: 'numbers-write', visualParams: { outline: true }, instancesPerProblem: 1 }
    ]
};
