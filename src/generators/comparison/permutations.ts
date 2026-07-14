import { MLDatasetPipelineConfig } from "../../types/ml-engine.ts";
import DatasetPermutationBuilder from "../../lib/dataset-permutation-builder.ts";
import { Area, Scope, Ability } from "edugraph-ts";

const SEED = 42;

function buildPermutations() {
    // 1. Legacy Numeric Comparison
    const legacy = new DatasetPermutationBuilder()
        .addLabels([
            Area.NumerationWithIntegers,
            Scope.ArabicNumerals, 
            Scope.Base10, 
            Ability.ProcedureExecution
        ])
        .applyLabelVariants([
            [Scope.NumbersSmaller10],
            [Scope.NumbersSmaller100],
            [Scope.NumbersSmaller1000]
        ])
        .applyLabelVariants([
            [Scope.IntegersWithZero],
            [Scope.IntegersWithoutZero]
        ])
        .build();

    // 2. K.CC.C.6 Permutation A (matching mode)
    const matching = new DatasetPermutationBuilder()
        .addLabels([
            Area.NumericComparison,
            Area.SetComparison,
            Scope.NumbersSmaller10,
            Scope.PhysicalNumbers,
            Ability.ProcedureExecution
        ])
        .addConstraints({ mode: 'matching' })
        .applyConstraintVariants('comparisonType', ['greater', 'less', 'equal'])
        .build();

    // 3. K.CC.C.6 Permutation B (count-compare mode)
    const countCompare = new DatasetPermutationBuilder()
        .addLabels([
            Area.NumericComparison,
            Scope.NumbersSmaller10,
            Scope.PhysicalNumbers,
            Ability.ProcedureExecution
        ])
        .addConstraints({ mode: 'count-compare' })
        .applyConstraintVariants('comparisonType', ['greater', 'less', 'equal'])
        .build();

    return [...legacy, ...matching, ...countCompare];
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
        { viewId: 'numbers-compare', visualParams: {}, instancesPerProblem: 1 },
        { viewId: 'numbers-compare-groups', visualParams: {}, instancesPerProblem: 1 }
    ]
};
