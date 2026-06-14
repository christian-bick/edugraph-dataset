import { MLDatasetPipelineConfig, GeneratorInput } from "../../types/ml-engine.ts";
import PermutationBuilder from "../../lib/permutation-builder.ts";
import { Area, Scope, Ability } from "edugraph-ts";

const SEED = 42;

function buildPermutations(): GeneratorInput[] {
    return new PermutationBuilder()
        .applyVariants('includesZero', [true, false])
        .build().map(p => {
            const params = p.params;
            const includesZero = params.includesZero === 'true' || params.includesZero === true;
            const zeroScope = includesZero ? Scope.NumbersWithZero : Scope.NumbersWithoutZero;

            return {
                labels: [
                    Area.NumerationWithIntegers,
                    Scope.ArabicNumerals, Scope.Base10, Scope.NumbersSmaller10, zeroScope,
                    Ability.ProcedureApplication, Ability.ProcedureExecution
                ],
                constraints: params
            };
        });
}

export const config: MLDatasetPipelineConfig = {
    generatorName: 'ordering',
    generationConfig: {
        permutations: buildPermutations(),
        countPerPermutation: 1,
        seed: SEED
    },
    splits: { train: 0.8, val: 0.2 },
    visualDistribution: [
        { rendererId: 'numbers-order', visualParams: { desc: false }, instancesPerProblem: 1 },
        { rendererId: 'numbers-order', visualParams: { desc: true }, instancesPerProblem: 1 }
    ]
};
