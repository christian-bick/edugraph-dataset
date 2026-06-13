import { ProblemGenerator, DatasetGenerationConfig, AbstractProblem } from "../types/ml-engine.ts";
import { Area, Scope, Ability } from "edugraph-ts";

export class WritingGenerator implements ProblemGenerator {
    type: AbstractProblem['type'] = 'writing';
    compatibleRenderers = ['numbers-write'];

    private generateLabels() {
        return {
            Area: [Area.IntegerNotation],
            Ability: [Ability.ProcedureExecution],
            Scope: [Scope.ArabicNumerals, Scope.Base10, Scope.NumbersSmaller10, Scope.NumbersWithoutZero],
        };
    }

    generateDataset(config: DatasetGenerationConfig): AbstractProblem[] {
        const { permutations, countPerPermutation = 1 } = config;
        const generatedProblems: AbstractProblem[] = [];
        const existingKeys = new Set<string>();

        for (const params of permutations) {
            const minNum = params.min || 1;
            const maxNum = params.max || 9;
            const fixedNumber = params.number;

            const labels = this.generateLabels();
            const tags = [
                ...labels.Area,
                ...labels.Scope,
                ...labels.Ability
            ];

            let countForThisPerm = 0;
            let attempts = 0;
            const maxAttempts = countPerPermutation * 10;
            
            let currentNum = fixedNumber !== undefined ? fixedNumber : minNum;

            while (countForThisPerm < countPerPermutation && attempts < maxAttempts) {
                attempts++;
                
                const problemKey = `${currentNum}`;

                if (!existingKeys.has(problemKey)) {
                    existingKeys.add(problemKey);
                    countForThisPerm++;
                    
                    generatedProblems.push({
                        id: `write-${generatedProblems.length + 1}-${problemKey}`,
                        type: this.type,
                        data: {
                            number: currentNum,
                            _permutationParams: params 
                        },
                        tags: tags
                    });
                }
                
                if (fixedNumber === undefined) {
                    currentNum++;
                    if (currentNum > maxNum) {
                        currentNum = minNum;
                        if (countForThisPerm >= maxNum - minNum + 1) break;
                    }
                } else {
                    // Only one number allowed for this permutation if it's fixed
                    break;
                }
            }
        }

        return generatedProblems;
    }
}
