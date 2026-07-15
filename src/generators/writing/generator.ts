import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { WritingProblem } from "../../types/problems.ts";
import { random } from "../../lib/random.ts";
import { Area } from "edugraph-ts";

export class WritingGenerator implements ProblemGenerator<WritingProblem> {
    type: AbstractProblem['type'] = 'writing';

    generate(input: GeneratorInput): ProblemStub | null {
        const { constraints, labels } = input;
        const minNum = constraints.minVal !== undefined ? constraints.minVal : (constraints.min !== undefined ? constraints.min : 1);
        const maxNum = constraints.maxVal !== undefined ? constraints.maxVal : (constraints.max !== undefined ? constraints.max : 9);
        const fixedNumber = constraints.number;
        
        let mode = constraints.mode;
        if (!mode && labels) {
            if (labels.includes(Area.Numeration)) {
                mode = 'count-objects';
            } else if (labels.includes(Area.DigitNotation)) {
                mode = 'stroke';
            }
        }
        if (!mode) mode = 'stroke';

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

