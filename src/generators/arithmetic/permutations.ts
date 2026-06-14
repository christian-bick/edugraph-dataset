import { MLDatasetPipelineConfig, GeneratorInput } from "../../types/ml-engine.ts";
import { Area, Scope } from "edugraph-ts";

const SEED = 42;

function buildPermutations(): GeneratorInput[] {
    const perms: GeneratorInput[] = [];
    const ops = [Area.IntegerAddition, Area.IntegerSubtraction, Area.IntegerMultiplication, Area.IntegerDivision];
    const scopes = [Scope.NumbersSmaller10, Scope.NumbersSmaller100];
    const zeros = [Scope.NumbersWithZero, Scope.NumbersWithoutZero];

    for (const op of ops) {
        for (const scope of scopes) {
            for (const zero of zeros) {
                perms.push({
                    labels: [op, scope, zero, Scope.ArabicNumerals, Scope.Base10],
                    constraints: { blankPart: 'answer' }
                });
            }
        }
    }
    
    // Add specific digit constraint examples
    perms.push({
        labels: [Area.IntegerAddition, Scope.NumbersSmaller100, Scope.NumbersWithoutZero],
        constraints: { digitsNum1: 2, digitsNum2: 1, blankPart: 'answer' }
    });

    return perms;
}

export const config: MLDatasetPipelineConfig = {
    generatorName: 'arithmetic',
    generationConfig: {
        permutations: buildPermutations(),
        countPerPermutation: 3,
        seed: SEED
    },
    splits: { train: 0.8, val: 0.2 },
    visualDistribution: [
        { rendererId: 'operations-boxes', visualParams: {}, instancesPerProblem: 1 },
        { rendererId: 'operations-vertical', visualParams: {}, instancesPerProblem: 1 }
    ]
};
