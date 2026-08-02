import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {WritingProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {WritingGeneratorConfig, WritingGeneratorSchema} from "./spec.ts";
import {validateConfigFields} from "../../lib/errors.ts";

export class WritingGenerator implements ProblemGenerator<WritingProblem, WritingGeneratorConfig> {
    type: AbstractProblem['type'] = 'writing';
    schema = WritingGeneratorSchema;

    generate(config: WritingGeneratorConfig): ProblemStub | null {
        validateConfigFields('writing', config, ['range', 'requireZero']);
        const resolvedRange = config.range!;

        if (config.requireZero) {
            if (resolvedRange.min > 0 || resolvedRange.max < 0) return null;
            return {data: {number: 0}};
        }

        const minNum = resolvedRange.min >= 100
            ? Math.max(111, Math.ceil(resolvedRange.min))
            : Math.max(1, Math.ceil(resolvedRange.min));
        const maxNum = Math.min(resolvedRange.min >= 100 ? 119 : 120, Math.floor(resolvedRange.max));
        
        if (maxNum - minNum < 0) return null;

        const currentNum = Math.floor(random() * (maxNum - minNum + 1)) + minNum;
        
        return {
            data: {
                number: currentNum
            }
        };
    }
}
