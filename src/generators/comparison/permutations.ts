import { MLDatasetPipelineConfig, GeneratorInput } from "../../types/ml-engine.ts";
import PermutationBuilder from "../../lib/permutation-builder.ts";
import { Area, Scope, Ability } from "edugraph-ts";

const SEED = 42;

function buildPermutations(): GeneratorInput[] {
    return new PermutationBuilder()
        .applyVariants('digits', [1, 2, 3])
        .applyVariants('includesZero', [true, false])
        .build().map(p => {
            const params = p.params;
            let scope;
            if (params.digits === 1) scope = Scope.NumbersSmaller10;
            else if (params.digits === 2) scope = Scope.NumbersSmaller100;
            else scope = Scope.NumbersSmaller1000;

            const zeroScope = params.includesZero ? Scope.NumbersWithZero : Scope.NumbersWithoutZero;

            return {
                labels: [
                    Area.NumerationWithIntegers,
                    Scope.ArabicNumerals, Scope.Base10, scope, zeroScope,
                    Ability.ProcedureApplication, Ability.ProcedureExecution
                ],
                constraints: params
            };
        });
}

export const config: MLDatasetPipelineConfig = {
    generatorName: 'comparison',
    generationConfig: {
        permutations: buildPermutations(),
        countPerPermutation: 1,
        seed: SEED
    },
    splits: { train: 0.8, val: 0.2 },
    visualDistribution: [
        { rendererId: 'numbers-compare', visualParams: {}, instancesPerProblem: 1 }
    ]
};
