import {random} from '../../lib/random.ts';
import {CountingOffsetProblem} from '../../types/problems.ts';
import {ProblemStub} from '../../types/ml-engine.ts';
import {CountingIncDecGeneratorConfig} from './counting-inc-dec/spec.ts';

const hasNoZeroDigit = (value: number): boolean => !String(value).includes('0');

export function generateCountingOffset<TStep extends 1 | 10 | 100>(
    config: CountingIncDecGeneratorConfig,
    stepSize: TStep
): ProblemStub<CountingOffsetProblem<TStep>> | null {
    const incDecType = config.direction;
    if (incDecType !== 'inc' && incDecType !== 'dec') return null;

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
