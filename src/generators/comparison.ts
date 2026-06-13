import { ProblemGenerator, DatasetGenerationConfig, AbstractProblem } from "../types/ml-engine.ts";
import { random } from "../lib/random.ts";
import { Area, Scope, Ability } from "edugraph-ts";

export class ComparisonGenerator implements ProblemGenerator {
    type: AbstractProblem['type'] = 'comparison';
    compatibleRenderers = ['numbers-compare'];

    generateLabels(params: Record<string, any>): string[] {
        let scope;
        if (params.digits === 1) scope = Scope.NumbersSmaller10;
        else if (params.digits === 2) scope = Scope.NumbersSmaller100;
        else scope = Scope.NumbersSmaller1000;

        const zeroScope = params.includesZero ? Scope.NumbersWithZero : Scope.NumbersWithoutZero;

        return [
            Area.NumerationWithIntegers,
            Scope.ArabicNumerals, Scope.Base10, scope, zeroScope,
            Ability.ProcedureApplication, Ability.ProcedureExecution
        ];
    }

    generateDataset(config: DatasetGenerationConfig): AbstractProblem[] {
        const { permutations, countPerPermutation = 1 } = config;
        const generatedProblems: AbstractProblem[] = [];
        const existingKeys = new Set<string>();

        for (const params of permutations) {
            const digits = params.digits || 1;
            const includesZero = params.includesZero !== false;

            let countForThisPerm = 0;
            let attempts = 0;
            const maxAttempts = countPerPermutation * 50;

            const max = Math.pow(10, digits) - 1;
            let min = digits > 1 ? Math.pow(10, digits - 1) : 0;
            if (!includesZero && digits === 1) {
                min = 1;
            }

            while (countForThisPerm < countPerPermutation && attempts < maxAttempts) {
                attempts++;
                
                const num1 = Math.floor(random() * (max - min + 1)) + min;
                const num2 = Math.floor(random() * (max - min + 1)) + min;

                if (num1 === num2) {
                    continue;
                }

                const answer = num1 > num2 ? '>' : '<';
                const problemKey = `${num1}_${num2}`;
                
                if (!existingKeys.has(problemKey)) {
                    existingKeys.add(problemKey);
                    countForThisPerm++;
                    
                    generatedProblems.push({
                        id: `compare-${generatedProblems.length + 1}-${problemKey}`,
                        type: this.type,
                        data: {
                            num1: num1,
                            num2: num2,
                            answer: answer,
                            _permutationParams: params 
                        }
                    });
                }
            }
        }

        return generatedProblems;
    }
}
