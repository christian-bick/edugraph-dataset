import { MLDatasetPipelineConfig, GeneratorInput } from "../../types/ml-engine.ts";
import PermutationBuilder from "../../lib/permutation-builder.ts";
import { Area, Scope, Ability } from "edugraph-ts";

const SEED = 42;

function buildPermutations(): GeneratorInput[] {
    return new PermutationBuilder()
        .applyRange(['number'], [1, 9])
        .build().map(p => {
            return {
                labels: [
                    Area.IntegerNotation,
                    Scope.ArabicNumerals, Scope.Base10, Scope.NumbersSmaller10, Scope.NumbersWithoutZero,
                    Ability.ProcedureExecution
                ],
                constraints: p.params
            };
        });
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
