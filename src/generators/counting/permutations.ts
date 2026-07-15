
import { DatasetGenerationConfig } from "../../types/ml-engine.ts";
import { Area, Scope, Ability } from "edugraph-ts";
import DatasetPermutationBuilder from "../../lib/dataset-permutation-builder.ts";

const SEED = 42;

function buildPermutations() {
    // 1. Legacy
    const legacy = new DatasetPermutationBuilder()
        .addLabels([
            Scope.ArabicNumerals,
            Scope.Base10,
            Scope.IntegersWithoutZero,
            Scope.IntegersWithoutNegatives,
            Scope.CountingSymbols,
            Area.NumerationWithIntegers,
            Ability.ProcedureExecution
        ])
        .applyLabelVariants([
            [Scope.NumbersSmaller10],
            [Scope.NumbersSmaller20]
        ])
        .applyConstraintVariants('type', ['inc', 'dec', undefined])
        .build().map(input => {
            if (!input.constraints.type) {
                input.labels.push(Area.IntegerNotation);
            }
            return input;
        });

    // 2. K.CC.B.4a One-to-one
    const oneToOneLinear = new DatasetPermutationBuilder()
        .addLabels([Area.Numeration, Scope.AdditiveCount, Scope.PhysicalNumbers, Scope.NumbersSmaller10, Ability.ProcedureExecution])
        .addConstraints({ mode: 'one-to-one', layout: 'linear' })
        .applyConstraintRange(['count'], [1, 10])
        .build();

    const oneToOneScattered = new DatasetPermutationBuilder()
        .addLabels([Area.Numeration, Scope.AdditiveCount, Scope.PhysicalNumbers, Scope.NumbersSmaller20, Ability.ProcedureExecution])
        .addConstraints({ mode: 'one-to-one', layout: 'scattered' })
        .applyConstraintRange(['count'], [11, 20])
        .build();

    // 3. K.CC.B.4b Cardinality / Conservation
    const cardinality = new DatasetPermutationBuilder()
        .addLabels([Area.Numeration, Scope.AdditiveCount, Ability.ProcedureUnderstanding])
        .addConstraints({ mode: 'cardinality' })
        .applyConstraintRange(['count'], [1, 10])
        .build();

    const conservation = new DatasetPermutationBuilder()
        .addLabels([Area.Numeration, Area.NumericIdentity, Scope.AdditiveCount, Ability.DirectUnderstanding])
        .addConstraints({ mode: 'conservation' })
        .applyConstraintRange(['minCount', 'maxCount'], [5, 12])
        .build();

    // 4. K.CC.B.5 How-many / Count-out
    const howManyLine = new DatasetPermutationBuilder()
        .addLabels([Area.Numeration, Scope.NumbersSmaller20, Scope.PhysicalNumbers, Scope.AdditiveCount, Ability.ProcedureExecution])
        .addConstraints({ mode: 'how-many', arrangement: 'line' })
        .applyConstraintRange(['count'], [1, 20])
        .build();

    const howManyCircle = new DatasetPermutationBuilder()
        .addLabels([Area.Numeration, Scope.NumbersSmaller20, Scope.PhysicalNumbers, Scope.AdditiveCount, Ability.ProcedureExecution])
        .addConstraints({ mode: 'how-many', arrangement: 'circle' })
        .applyConstraintRange(['count'], [1, 20])
        .build();

    const howManyScattered = new DatasetPermutationBuilder()
        .addLabels([Area.Numeration, Scope.NumbersSmaller10, Scope.PhysicalNumbers, Scope.AdditiveCount, Ability.ProcedureExecution])
        .addConstraints({ mode: 'how-many', arrangement: 'scattered' })
        .applyConstraintRange(['count'], [1, 10])
        .build();

    const countOut = new DatasetPermutationBuilder()
        .addLabels([Area.Numeration, Scope.NumbersSmaller20, Scope.PhysicalNumbers, Scope.AdditiveCount, Ability.ProcedureExecution])
        .addConstraints({ mode: 'count-out' })
        .applyConstraintRange(['count'], [1, 20])
        .build();

    // 5. K.MD.B.3 Classify & Sort
    const classifyCount = new DatasetPermutationBuilder()
        .addLabels([Area.ObjectSorting, Area.CollectionSense, Area.Numeration, Scope.NumbersSmaller10, Ability.ConceptClassification])
        .addConstraints({ mode: 'classify-count' })
        .applyConstraintRange(['minTotal', 'maxTotal'], [5, 10])
        .build();

    const classifySort = new DatasetPermutationBuilder()
        .addLabels([Area.ObjectSorting, Area.NumericOrder, Scope.NumbersSmaller10, Ability.ProcedureExecution])
        .addConstraints({ mode: 'classify-sort' })
        .applyConstraintRange(['minTotal', 'maxTotal'], [5, 10])
        .build();

    return [
        ...legacy,
        ...oneToOneLinear,
        ...oneToOneScattered,
        ...cardinality,
        ...conservation,
        ...howManyLine,
        ...howManyCircle,
        ...howManyScattered,
        ...countOut,
        ...classifyCount,
        ...classifySort
    ];
}

export const generationConfig: DatasetGenerationConfig = {
    permutations: buildPermutations(),
    countPerPermutation: 1,
    seed: SEED
};
