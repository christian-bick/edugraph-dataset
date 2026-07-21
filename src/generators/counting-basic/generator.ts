import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {CountingProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {CountingBasicGeneratorConfig, CountingBasicGeneratorSchema} from "./spec.ts";
import {validateConfigFields} from "../../lib/errors.ts";

export class CountingBasicGenerator implements ProblemGenerator<CountingProblem, CountingBasicGeneratorConfig> {
    type: AbstractProblem['type'] = 'counting';
    schema = CountingBasicGeneratorSchema;

    generate(config: CountingBasicGeneratorConfig): ProblemStub | null {
        validateConfigFields('counting-basic', config, ['range']);
        const resolvedRange = config.range!;
        
        const maxCount = resolvedRange.max;
        let minCount = resolvedRange.min;
        if (minCount < 1) {
            minCount = 1;
        }

        if (minCount > maxCount) return null;
        
        const numObjects = Math.floor(random() * (maxCount - minCount + 1)) + minCount;

        const data: CountingProblem = {
            numObjects,
            simpleAnswer: numObjects
        };

        return {
            id: `count-${numObjects}`,
            data
        };
    }
}
