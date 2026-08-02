import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../../types/ml-engine.ts";
import {CountingIncDecProblem} from "../../../types/problems.ts";
import {random} from "../../../lib/random.ts";
import {Scope} from "edugraph-ts";
import {CountingIncDecGeneratorConfig, CountingIncDecGeneratorSchema} from "./spec.ts";
import {GeneratorValidationError, validateConfigFields} from "../../../lib/errors.ts";

export class CountingIncDecGenerator implements ProblemGenerator<CountingIncDecProblem, CountingIncDecGeneratorConfig> {
    type: AbstractProblem['type'] = 'counting';
    schema = CountingIncDecGeneratorSchema;

    generate(config: CountingIncDecGeneratorConfig): ProblemStub | null {
        validateConfigFields('counting-inc-dec', config, ['range', 'isIncrement', 'isDecrement', 'countMode']);
        if (config.isIncrement === config.isDecrement) return null;
        const incDecType = config.isIncrement ? 'inc' : 'dec';

        const stepSize = config.countMode === Scope.DerivedCount
            ? 10
            : config.countMode === Scope.AdditiveCount || config.countMode === Scope.SubtractiveCount
                ? 1
                : null;
        if (stepSize === null) {
            throw new GeneratorValidationError('counting-inc-dec', 'Unsupported counting mode.');
        }
        if (
            (config.countMode === Scope.AdditiveCount && incDecType !== 'inc') ||
            (config.countMode === Scope.SubtractiveCount && incDecType !== 'dec')
        ) {
            return null;
        }

        const resolvedRange = config.range!;
        let maxCount = resolvedRange.max;
        let minCount = resolvedRange.min;
        if (minCount < 1) {
            minCount = 1;
        }

        if (incDecType === 'inc') {
            maxCount -= stepSize;
        } else {
            minCount += stepSize;
        }

        if (minCount > maxCount) {
            return null;
        }

        const numObjects = Math.floor(random() * (maxCount - minCount + 1)) + minCount;
        const incDecAnswer = incDecType === 'inc'
            ? numObjects + stepSize
            : numObjects - stepSize;

        return {
            data: {
                numObjects,
                incDecType,
                stepSize,
                incDecAnswer,
                simpleAnswer: numObjects
            }
        };
    }
}
