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

        const includeZero = config.includeZero;
        const minNum = includeZero ? resolvedRange.min : Math.max(1, resolvedRange.min);
        const maxNum = resolvedRange.max;
        
        if (maxNum - minNum < 0) return null;

        const currentNum = Math.floor(random() * (maxNum - minNum + 1)) + minNum;
        
        return {
            id: `writing-${currentNum}`,
            data: {
                number: currentNum
            }
        };
    }
}
