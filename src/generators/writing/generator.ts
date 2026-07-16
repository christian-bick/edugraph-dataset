import {AbstractProblem, GeneratorInput, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {WritingProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {resolveRangeFromLabels} from "../../lib/ontology.ts";

export class WritingGenerator implements ProblemGenerator<WritingProblem> {
    type: AbstractProblem['type'] = 'writing';

    generate(input: GeneratorInput): ProblemStub | null {
        const { constraints = {}, labels } = input;

        const resolvedRange = resolveRangeFromLabels(labels || []);
        const minNum = resolvedRange.min;
        const maxNum = resolvedRange.max;
        const fixedNumber = constraints.number;
        
        const currentNum = fixedNumber !== undefined ? fixedNumber : Math.floor(random() * (maxNum - minNum + 1)) + minNum;
        
        return {
            id: `writing-${currentNum}`,
            data: {
                number: currentNum
            }
        };
    }
}
