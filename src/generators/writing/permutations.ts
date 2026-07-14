import { MLDatasetPipelineConfig } from "../../types/ml-engine.ts";
import DatasetPermutationBuilder from "../../lib/dataset-permutation-builder.ts";
import { Area, Scope, Ability } from "edugraph-ts";

const SEED = 42;

function buildPermutations() {
    const legacy = new DatasetPermutationBuilder()
        .addLabels([
            Area.IntegerNotation,
            Scope.ArabicNumerals, 
            Scope.Base10, 
            Scope.NumbersSmaller10, 
            Scope.IntegersWithoutZero,
            Ability.ProcedureExecution
        ])
        .addConstraints({ mode: 'stroke' })
        .applyConstraintRange(['number'], [1, 9])
        .build();

    const strokePractice = new DatasetPermutationBuilder()
        .addLabels([
            Area.DigitNotation,
            Scope.ArabicNumerals,
            Scope.NumbersSmaller20,
            Scope.IntegersWithZero,
            Ability.ProcedureExecution
        ])
        .addConstraints({ mode: 'stroke' })
        .applyConstraintRange(['number'], [0, 20])
        .build();

    const countObjects = new DatasetPermutationBuilder()
        .addLabels([
            Area.Numeration,
            Scope.ArabicNumerals,
            Scope.NumbersSmaller20,
            Scope.IntegersWithZero,
            Scope.PhysicalNumbers,
            Ability.ProcedureExecution
        ])
        .addConstraints({ mode: 'count-objects' })
        .applyConstraintRange(['number'], [0, 20])
        .build();

    return [...legacy, ...strokePractice, ...countObjects];
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
        { viewId: 'numbers-write', visualParams: { outline: false }, instancesPerProblem: 1 },
        { viewId: 'numbers-write', visualParams: { outline: true }, instancesPerProblem: 1 }
    ]
};
