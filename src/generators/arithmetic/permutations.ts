import { MLDatasetPipelineConfig } from "../../types/ml-engine.ts";
import { Ability, Area, Scope } from "edugraph-ts";
import DatasetPermutationBuilder from "../../lib/dataset-permutation-builder.ts";

const SEED = 42;

function buildPermutations() {
    // 1. Legacy Standard Arithmetic
    const legacy = new DatasetPermutationBuilder()
        .addLabels([
            Scope.ArabicNumerals,
            Scope.Base10,
            Ability.ProcedureExecution
        ])
        .applyLabelVariants([
            [Area.Addition],
            [Area.Subtraction],
            [Area.Multiplication],
            [Area.Division]
        ])
        .applyLabelVariants([
            [Scope.NumbersSmaller10],
            [Scope.NumbersSmaller100]
        ])
        .applyLabelVariants([
            [Scope.IntegersWithZero],
            [Scope.IntegersWithoutZero]
        ])
        .build();

    // 2. K.OA.A.1 Representation (addition/subtraction <= 10)
    const representationAdd = new DatasetPermutationBuilder()
        .addLabels([Area.Addition, Scope.PhysicalNumbers, Scope.VisualNumbers, Ability.Visualization])
        .addConstraints({ mode: 'representation', operation: 'addition', maxSum: 10 })
        .applyConstraintRange(['term1'], [1, 9])
        .build();

    const representationSub = new DatasetPermutationBuilder()
        .addLabels([Area.Subtraction, Scope.PhysicalNumbers, Scope.VisualNumbers, Ability.Visualization])
        .addConstraints({ mode: 'representation', operation: 'subtraction', maxMinuend: 10 })
        .applyConstraintRange(['minuend'], [2, 10])
        .build();

    // 3. K.OA.A.2 Word Problems
    const wordProblemAdd = new DatasetPermutationBuilder()
        .addLabels([Area.Addition, Scope.NumbersSmaller10, Scope.PhysicalNumbers, Scope.VisualNumbers, Ability.ProcedureExecution])
        .addConstraints({ mode: 'word-problem', operation: 'addition', maxSum: 10 })
        .applyConstraintRange(['term1'], [1, 9])
        .build();

    const wordProblemSub = new DatasetPermutationBuilder()
        .addLabels([Area.Subtraction, Scope.NumbersSmaller10, Scope.PhysicalNumbers, Scope.VisualNumbers, Ability.ProcedureExecution])
        .addConstraints({ mode: 'word-problem', operation: 'subtraction', maxMinuend: 10 })
        .applyConstraintRange(['minuend'], [2, 10])
        .build();

    // 4. K.OA.A.3 Decompose
    const decompose = new DatasetPermutationBuilder()
        .addLabels([Area.Addition, Area.Sum, Scope.NumbersSmaller10, Scope.PhysicalNumbers, Ability.ProcedureExecution])
        .addConstraints({ mode: 'decompose' })
        .applyConstraintRange(['targetNumber'], [3, 10])
        .build();

    // 5. K.OA.A.4 Make Ten
    const makeTen = new DatasetPermutationBuilder()
        .addLabels([Area.Addition, Area.Sum, Scope.NumbersSmaller10, Scope.PhysicalNumbers, Ability.ProcedureExecution])
        .addConstraints({ mode: 'make-ten' })
        .applyConstraintRange(['givenNumber'], [1, 9])
        .build();

    // 6. K.NBT.A.1 Teen Place Value
    const composeTeen = new DatasetPermutationBuilder()
        .addLabels([Area.PlaceValue, Area.Addition, Scope.NumbersSmaller20, Scope.NumbersLarger10, Scope.PhysicalNumbers, Ability.ProcedureExecution])
        .addConstraints({ mode: 'compose-teen' })
        .applyConstraintRange(['ones'], [1, 9])
        .build();

    const decomposeTeen = new DatasetPermutationBuilder()
        .addLabels([Area.PlaceValue, Area.Numeration, Scope.NumbersSmaller20, Scope.NumbersLarger10, Scope.PhysicalNumbers, Ability.DirectUnderstanding])
        .addConstraints({ mode: 'decompose-teen' })
        .applyConstraintRange(['ones'], [1, 9])
        .build();

    return [
        ...legacy,
        ...representationAdd,
        ...representationSub,
        ...wordProblemAdd,
        ...wordProblemSub,
        ...decompose,
        ...makeTen,
        ...composeTeen,
        ...decomposeTeen
    ];
}

export const config: MLDatasetPipelineConfig = {
    generatorName: 'arithmetic',
    generationConfig: {
        permutations: buildPermutations(),
        countPerPermutation: 1,
        seed: SEED
    },
    splits: { train: 0.8, val: 0.2 },
    visualDistribution: [
        { viewId: 'operations-boxes', visualParams: {}, instancesPerProblem: 1 },
        { viewId: 'operations-vertical', visualParams: {}, instancesPerProblem: 1 },
        { viewId: 'operations-representation', visualParams: {}, instancesPerProblem: 1 },
        { viewId: 'operations-decompose', visualParams: {}, instancesPerProblem: 1 },
        { viewId: 'place-value-blocks', visualParams: {}, instancesPerProblem: 1 }
    ]
};
