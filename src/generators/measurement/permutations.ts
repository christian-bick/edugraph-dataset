
import { DatasetGenerationConfig } from "../../types/ml-engine.ts";
import DatasetPermutationBuilder from "../../lib/dataset-permutation-builder.ts";
import { Area, Scope, Ability } from "edugraph-ts";

const SEED = 42;

function buildPermutations() {
    // 1. Legacy Standard
    const legacy = new DatasetPermutationBuilder()
        .addLabels([
            Area.Measurement,
            Scope.NumbersSmaller100, 
            Ability.ProcedureExecution
        ])
        .applyConstraintVariants('bandLength', [10, 20])
        .build();

    // 2. K.MD.A.1 Describe measurable attributes
    const attributeType = new DatasetPermutationBuilder()
        .addLabels([Area.Measurement, Area.MeasuringObjects, Ability.ConceptSpecification])
        .applyLabelVariants([
            [Scope.LengthMeasurement],
            [Scope.WeightMeasurement]
        ])
        .addConstraints({ mode: 'attribute-type' })
        .applyConstraintVariants('attribute', ['length', 'height', 'weight'])
        .build();

    // 3. K.MD.A.2 Compare two objects
    const directCompareLen = new DatasetPermutationBuilder()
        .addLabels([Area.Measurement, Area.MeasuringObjects, Area.Difference, Scope.LengthMeasurement, Ability.ProcedureExecution])
        .addConstraints({ mode: 'direct-compare', attribute: 'length' })
        .applyConstraintVariants('relation', ['longer', 'shorter'])
        .build();

    const directCompareWt = new DatasetPermutationBuilder()
        .addLabels([Area.Measurement, Area.MeasuringObjects, Area.Difference, Scope.WeightMeasurement, Ability.ProcedureExecution])
        .addConstraints({ mode: 'direct-compare', attribute: 'weight' })
        .applyConstraintVariants('relation', ['heavier', 'lighter'])
        .build();

    return [...legacy, ...attributeType, ...directCompareLen, ...directCompareWt];
}

export const generationConfig: DatasetGenerationConfig = {
    permutations: buildPermutations(),
    countPerPermutation: 1,
    seed: SEED
};
