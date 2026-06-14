import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { random } from "../../lib/random.ts";
import { Area, Scope, Ability } from "edugraph-ts";

export class ComparisonGenerator implements ProblemGenerator {
    type: AbstractProblem['type'] = 'comparison';
    compatibleRenderers = ['numbers-compare'];

    generate(input: GeneratorInput): ProblemStub | null {
        const { constraints } = input;
        const digits = constraints.digits || 1;
        const includesZero = constraints.includesZero !== false;

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
