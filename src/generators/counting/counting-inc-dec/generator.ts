import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../../types/ml-engine.ts";
import {CountingIncDecProblem} from "../../../types/problems.ts";
import {random} from "../../../lib/random.ts";
import {Scope} from "edugraph-ts";
import {CountingIncDecGeneratorConfig, CountingIncDecGeneratorSchema} from "./spec.ts";
import {validateConfigFields} from "../../../lib/errors.ts";

export class CountingIncDecGenerator implements ProblemGenerator<CountingIncDecProblem, CountingIncDecGeneratorConfig> {
    type: AbstractProblem['type'] = 'counting';
    schema = CountingIncDecGeneratorSchema;

    generate(config: CountingIncDecGeneratorConfig): ProblemStub | null {
        validateConfigFields('counting-inc-dec', config, ['range', 'direction']);
        const incDecType = config.direction === Scope.AdditiveCount
            ? 'inc'
            : config.direction === Scope.SubtractiveCount
                ? 'dec'
                : null;
        if (incDecType === null) return null;

        const resolvedRange = config.range!;
        let maxCount = resolvedRange.max;
        let minCount = resolvedRange.min;
        if (minCount < 1) {
            minCount = 1;
        }

        if (incDecType === 'inc') {
            maxCount -= 1;
        } else {
            minCount += 1;
        }

        if (minCount > maxCount) {
            return null;
        }

        const numObjects = Math.floor(random() * (maxCount - minCount + 1)) + minCount;
        const incDecAnswer = incDecType === 'inc'
            ? numObjects + 1
            : numObjects - 1;

        return {
            data: {
                numObjects,
                incDecType,
                incDecAnswer,
                simpleAnswer: numObjects
            }
        };
    }
}
