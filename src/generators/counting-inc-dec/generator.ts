import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {CountingIncDecProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {CountingIncDecGeneratorConfig, CountingIncDecGeneratorSchema} from "./spec.ts";

export class CountingIncDecGenerator implements ProblemGenerator<CountingIncDecProblem, CountingIncDecGeneratorConfig> {
    type: AbstractProblem['type'] = 'counting';
    schema = CountingIncDecGeneratorSchema;

    generate(config: CountingIncDecGeneratorConfig): ProblemStub | null {
        let incDecType: 'inc' | 'dec' = 'inc';
        if (config.wantsSubtractive) {
            incDecType = 'dec';
        } else if (config.wantsAdditive) {
            incDecType = 'inc';
        } else {
            incDecType = random() > 0.5 ? 'inc' : 'dec';
        }

        const resolvedRange = config.range;
        if (!resolvedRange) return null;
        let maxCount = resolvedRange.max;
        let minCount = resolvedRange.min;
        
        const numObjects = Math.floor(random() * (maxCount - minCount + 1)) + minCount;
        
        if (incDecType === 'dec' && numObjects <= 1) {
            return null;
        }

        let incDecAnswer = 0;
        if (incDecType === 'inc') incDecAnswer = numObjects + 1;
        if (incDecType === 'dec') incDecAnswer = numObjects - 1;

        return {
            id: `simple-${numObjects}-${incDecType}`,
            data: {
                numObjects: numObjects,
                incDecType: incDecType as 'inc' | 'dec',
                incDecAnswer: incDecAnswer,
                simpleAnswer: numObjects
            }
        };
    }
}
