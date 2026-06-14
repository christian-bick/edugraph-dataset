import { MLDatasetPipelineConfig } from "../../types/ml-engine.ts";
import { Area, Scope, Ability } from "edugraph-ts";
import DatasetPermutationBuilder from "../../lib/dataset-permutation-builder.ts";

const SEED = 42;

function buildPermutations() {
    return new DatasetPermutationBuilder()
        .addLabels([
            Scope.ArabicNumerals,
            Scope.Base10,
            Scope.NumbersWithoutZero,
            Scope.NumbersWithoutNegatives,
            Scope.CountingSymbols,
            Area.NumerationWithIntegers
        ])
        .applyLabelVariants([
            [Scope.NumbersSmaller10],
            [Scope.NumbersSmaller20]
        ])
        .applyConstraintVariants('type', ['inc', 'dec', undefined])
        .build().map(input => {
            // Add conditional labels based on constraints for counting
            if (!input.constraints.type) {
                input.labels.push(Area.IntegerNotation);
                input.labels.push(Ability.ProcedureExecution);
            } else {
                input.labels.push(Ability.ProcedureApplication);
                input.labels.push(Ability.ProcedureExecution);
            }
            return input;
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
