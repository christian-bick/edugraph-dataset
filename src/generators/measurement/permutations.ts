import { MLDatasetPipelineConfig } from "../../types/ml-engine.ts";
import DatasetPermutationBuilder from "../../lib/dataset-permutation-builder.ts";
import { Area, Scope, Ability } from "edugraph-ts";

const SEED = 42;

function buildPermutations() {
    return new DatasetPermutationBuilder()
        .addLabels([
            Area.MeasuringObjects, 
            Area.DigitNotation,
            Scope.CentimeterScale, 
            Scope.MillimeterScale, 
            Scope.Tapemeter,
            Ability.ProcedureApplication, 
            Ability.ProcedureExecution
        ])
        .applyConstraintVariants('bandLength', [10, 20])
        .build();
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
