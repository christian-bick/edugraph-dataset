import { MLDatasetPipelineConfig, GeneratorInput } from "../../types/ml-engine.ts";
import PermutationBuilder from "../../lib/permutation-builder.ts";
import { Area, Scope, Ability } from "edugraph-ts";

const SEED = 42;

function buildPermutations(): GeneratorInput[] {
    return new PermutationBuilder()
        .applyVariants('maxCount', [5, 10, 15, 20])
        .applyVariants('type', ['inc', 'dec', undefined])
        .build().map(p => {
            const params = p.params;
            const count = params.maxCount || params.count || 10;
            const scopes = [
                Scope.ArabicNumerals,
                Scope.Base10,
                Scope.NumbersWithoutZero,
                Scope.NumbersWithoutNegatives,
                Scope.CountingSymbols,
                count <= 10 ? Scope.NumbersSmaller10 : Scope.NumbersSmaller20
            ];

            const areas = [Area.NumerationWithIntegers];
            if (!params.type) {
                areas.push(Area.IntegerNotation);
            }

            const abilities = [Ability.ProcedureExecution];
            if (params.type === 'inc' || params.type === 'dec') {
                abilities.push(Ability.ProcedureApplication);
            }

            return {
                labels: [...areas, ...scopes, ...abilities],
                constraints: params
            };
        });
}

export const config: MLDatasetPipelineConfig = {
    generatorName: 'counting',
    generationConfig: {
        permutations: buildPermutations(),
        countPerPermutation: 1,
        seed: SEED
    },
    splits: { train: 0.8, val: 0.2 },
    visualDistribution: [
        { rendererId: 'counting-objects', visualParams: {}, instancesPerProblem: 1 },
        { rendererId: 'counting-inc-dec', visualParams: {}, instancesPerProblem: 1 }
    ]
};
