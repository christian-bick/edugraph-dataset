import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { random } from "../../lib/random.ts";
import { Area, Scope, Ability } from "edugraph-ts";

export class ComparisonGenerator implements ProblemGenerator {
    type: AbstractProblem['type'] = 'comparison';
    compatibleRenderers = ['numbers-compare'];

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels, constraints } = input;
        
        let digits = constraints.digits;
        if (!digits) {
            if (labels.includes(Scope.NumbersSmaller1000)) digits = 3;
            else if (labels.includes(Scope.NumbersSmaller100)) digits = 2;
            else digits = 1;
        }

        const includesZero = constraints.includesZero !== undefined 
            ? constraints.includesZero 
            : !labels.includes(Scope.NumbersWithoutZero);

        const max = Math.pow(10, digits) - 1;
        let min = digits > 1 ? Math.pow(10, digits - 1) : 0;
        if (!includesZero && digits === 1) {
            min = 1;
        }

        const num1 = Math.floor(random() * (max - min + 1)) + min;
        const num2 = Math.floor(random() * (max - min + 1)) + min;

        if (num1 === num2) {
            return null;
        }

        const answer = num1 > num2 ? '>' : '<';
        const problemKey = `${num1}_${num2}`;
        
        return {
            id: problemKey,
            data: {
                num1: num1,
                num2: num2,
                answer: answer
            }
        };
    }
}
