import {random} from '../../lib/random.ts';
import {CountingOffsetProblem} from '../../types/problems.ts';
import {ProblemStub} from '../../types/ml-engine.ts';
import {CountingIncDecGeneratorConfig} from './counting-inc-dec/spec.ts';

const hasNoZeroDigit = (value: number): boolean => !String(value).includes('0');

export type CountingOffsetOperandProfile = 'unrestricted' | 'two-digit' | 'three-digit';

/** Enumerates the complete domain before the single seeded mathematical draw. */
export function countingOffsetStarts(
    config: CountingIncDecGeneratorConfig,
    stepSize: 1 | 10 | 100,
    operandProfile: CountingOffsetOperandProfile = 'unrestricted'
): number[] {
    const {direction, range} = config;
    if ((direction !== 'inc' && direction !== 'dec') || !range
        || !Number.isSafeInteger(range.min) || !Number.isSafeInteger(range.max)
        || stepSize < range.min || stepSize > range.max) return [];
    if (operandProfile !== 'unrestricted' && operandProfile !== 'two-digit' && operandProfile !== 'three-digit') return [];

    const minimum = Math.max(1, range.min);
    let minCount = direction === 'dec' ? minimum + stepSize : minimum;
    let maxCount = direction === 'inc' ? range.max - stepSize : range.max;
    if (operandProfile !== 'unrestricted') {
        const profileMinimum = operandProfile === 'two-digit' ? 10 : 100;
        const profileMaximum = operandProfile === 'two-digit' ? 99 : 999;
        // The configured starting value is a largest operand; the result has its own range bound.
        minCount = Math.max(minCount, profileMinimum, stepSize);
        maxCount = Math.min(maxCount, profileMaximum);
    }
    if (minCount > maxCount) return [];

    return Array.from({length: maxCount - minCount + 1}, (_, index) => minCount + index)
        .filter(value => hasNoZeroDigit(value) && hasNoZeroDigit(
            direction === 'inc' ? value + stepSize : value - stepSize
        ));
}

export function generateCountingOffset<TStep extends 1 | 10 | 100>(
    config: CountingIncDecGeneratorConfig,
    stepSize: TStep,
    operandProfile: CountingOffsetOperandProfile = 'unrestricted'
): ProblemStub<CountingOffsetProblem<TStep>> | null {
    const incDecType = config.direction;
    if (incDecType !== 'inc' && incDecType !== 'dec') return null;

    const resolvedRange = config.range!;
    const validStarts = countingOffsetStarts(config, stepSize, operandProfile);
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
