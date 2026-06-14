import { MLDatasetPipelineConfig, GeneratorInput } from "../../types/ml-engine.ts";
import PermutationBuilder from "../../lib/permutation-builder.ts";
import { Area, Scope, Ability } from "edugraph-ts";

const SEED = 42;

function buildPermutations(): GeneratorInput[] {
    return new PermutationBuilder()
        .applyVariants('bandLength', [10, 20])
        .build().map(p => {
            return {
                labels: [
                    Area.MeasuringObjects, Area.DigitNotation,
                    Scope.CentimeterScale, Scope.MillimeterScale, Scope.Tapemeter,
                    Ability.ProcedureApplication, Ability.ProcedureExecution
                ],
                constraints: p.params
            };
        });
}

export const config: MLDatasetPipelineConfig = {
    generatorName: 'measurement',
    generationConfig: {
        permutations: buildPermutations(),
        countPerPermutation: 1,
        seed: SEED
    },
    splits: { train: 0.8, val: 0.2 },
    visualDistribution: [
        { rendererId: 'measure-length', visualParams: { decimal: true, reverse: false }, instancesPerProblem: 1 },
        { rendererId: 'measure-length', visualParams: { decimal: true, reverse: true }, instancesPerProblem: 1 }
    ]
};
