import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../../types/ml-engine.ts";
import {CountingIncDecProblem} from "../../../types/problems.ts";
import {random} from "../../../lib/random.ts";
import {Scope} from "edugraph-ts";
import {CountingIncDecGeneratorConfig, CountingIncDecGeneratorSchema} from "./spec.ts";
import {validateConfigFields} from "../../../lib/errors.ts";

const hasNoZeroDigit = (value: number): boolean => !String(value).includes('0');

export class CountingIncDecGenerator implements ProblemGenerator<CountingIncDecProblem, CountingIncDecGeneratorConfig> {
    type: AbstractProblem['type'] = 'counting';
    schema = CountingIncDecGeneratorSchema;

    generate(config: CountingIncDecGeneratorConfig): ProblemStub<CountingIncDecProblem> | null {
        validateConfigFields('counting-inc-dec', config, ['range', 'direction', 'stepMagnitude']);
        const incDecType = config.direction === Scope.AdditiveCount
            ? 'inc'
            : config.direction === Scope.SubtractiveCount
                ? 'dec'
                : null;
        if (incDecType === null) return null;

        const stepSize = config.stepMagnitude === Scope.StepsOf1
            ? 1
            : config.stepMagnitude === Scope.StepsOf10
                ? 10
                : config.stepMagnitude === Scope.StepsOf100
                    ? 100
                : null;
        if (stepSize === null) return null;

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

        const validStarts = Array.from(
            {length: maxCount - minCount + 1},
            (_, index) => minCount + index
        ).filter(value => hasNoZeroDigit(value) && hasNoZeroDigit(
            incDecType === 'inc' ? value + stepSize : value - stepSize
        ));
        if (validStarts.length === 0) return null;

        const numObjects = validStarts[Math.floor(random() * validStarts.length)];
        const incDecAnswer = incDecType === 'inc'
            ? numObjects + stepSize
            : numObjects - stepSize;

        const useHundreds = resolvedRange.max > 100;
        const decompose = (value: number) => useHundreds
            ? {
                hundreds: Math.floor(value / 100),
                tens: Math.floor((value % 100) / 10),
                ones: value % 10
            }
            : {
                tens: Math.floor(value / 10),
                ones: value % 10
            };

        return {
            data: {
                numObjects,
                incDecType,
                incDecAnswer,
                simpleAnswer: numObjects,
                stepSize,
                startPlaceValue: decompose(numObjects),
                resultPlaceValue: decompose(incDecAnswer)
            }
        };
    }
}
