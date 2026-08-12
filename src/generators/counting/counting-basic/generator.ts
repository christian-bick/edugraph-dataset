import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../../types/ml-engine.ts";
import {CountingProblem} from "../../../types/problems.ts";
import {random} from "../../../lib/random.ts";
import {CountingBasicGeneratorConfig, CountingBasicGeneratorSchema} from "./spec.ts";
import {validateConfigFields} from "../../../lib/errors.ts";

export class CountingBasicGenerator implements ProblemGenerator<CountingProblem, CountingBasicGeneratorConfig> {
    type: AbstractProblem['type'] = 'counting';
    schema = CountingBasicGeneratorSchema;

    generate(config: CountingBasicGeneratorConfig): ProblemStub | null {
        validateConfigFields('counting-basic', config, ['range', 'parity']);
        const resolvedRange = config.range!;
        
        const maxCount = resolvedRange.max;
        let minCount = resolvedRange.min;
        if (minCount < 1) {
            minCount = 1;
        }

        if (minCount > maxCount) return null;

        const parity = config.parity!;
        const requiredRemainder = parity === 'even' ? 0 : parity === 'odd' ? 1 : null;
        if (requiredRemainder !== null && minCount % 2 !== requiredRemainder) {
            minCount += 1;
        }
        if (minCount > maxCount) return null;

        const step = requiredRemainder === null ? 1 : 2;
        const candidateCount = Math.floor((maxCount - minCount) / step) + 1;
        const numObjects = minCount + Math.floor(random() * candidateCount) * step;
        const resolvedParity = numObjects % 2 === 0 ? 'even' as const : 'odd' as const;

        const data: CountingProblem = {
            numObjects,
            simpleAnswer: numObjects,
            ...(parity === 'any' ? {} : {parity: resolvedParity})
        };

        return {
            data
        };
    }
}
