import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { WritingProblem } from "../../types/problems.ts";
import { random } from "../../lib/random.ts";

export class WritingGenerator implements ProblemGenerator<WritingProblem> {
    type: AbstractProblem['type'] = 'writing';

    generate(input: GeneratorInput): ProblemStub | null {
        const { constraints } = input;
        const minNum = constraints.min !== undefined ? constraints.min : 1;
        const maxNum = constraints.max !== undefined ? constraints.max : 9;
        const fixedNumber = constraints.number;
        const mode = constraints.mode || 'stroke';

        const currentNum = fixedNumber !== undefined ? fixedNumber : Math.floor(random() * (maxNum - minNum + 1)) + minNum;
        
        return {
            id: `${mode}-${currentNum}`,
            data: {
                number: currentNum,
                mode: mode
            }
        };
    }
}

