import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {WritingProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {WritingGeneratorConfig, WritingGeneratorSchema} from "./spec.ts";

export class WritingGenerator implements ProblemGenerator<WritingProblem, WritingGeneratorConfig> {
    type: AbstractProblem['type'] = 'writing';
    schema = WritingGeneratorSchema;

    generate(config: WritingGeneratorConfig): ProblemStub | null {
        const resolvedRange = config.range;
        if (!resolvedRange) return null;

        const minNum = resolvedRange.min;
        const maxNum = resolvedRange.max;
        const currentNum = Math.floor(random() * (maxNum - minNum + 1)) + minNum;
        
        return {
            id: `writing-${currentNum}`,
            data: {
                number: currentNum
            }
        };
    }
}
