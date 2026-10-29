import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {
    DecimalAdjacentPlaceScalingProblem,
    DecimalScalingPlace
} from '../../../types/problems.ts';
import {
    DecimalPlaceValueScalingGeneratorConfig,
    DecimalPlaceValueScalingGeneratorSchema
} from './spec.ts';

const PLACE_NAMES = ['hundreds', 'tens', 'ones', 'tenths', 'hundredths', 'thousandths'] as const;
const PLACE_EXPONENTS = [2, 1, 0, -1, -2, -3] as const;
const UNITS_IN_THOUSANDTHS = [100000, 10000, 1000, 100, 10, 1] as const;

const randomInteger = (minimum: number, maximum: number): number =>
    minimum + Math.floor(random() * (maximum - minimum + 1));

const otherDigit = (repeatedDigit: number): number => {
    const candidate = randomInteger(0, 8);
    return candidate >= repeatedDigit ? candidate + 1 : candidate;
};

const nonzeroOtherDigit = (repeatedDigit: number): number => {
    const candidate = randomInteger(1, 8);
    return candidate >= repeatedDigit ? candidate + 1 : candidate;
};

// Four free digits each have nine choices, including zero. Classifying by the
// first zero gives disjoint blocks and retains the old conditional distribution.
const FIRST_ZERO_COUNTS = [9 ** 3, 8 * 9 ** 2, 8 ** 2 * 9, 8 ** 3] as const;
const ZERO_SHARE = FIRST_ZERO_COUNTS.reduce((sum, count) => sum + count, 0) / 9 ** 4;
const weightedIndex = (weights: readonly number[]): number => {
    let remaining = random() * weights.reduce((sum, weight) => sum + weight, 0);
    const index = weights.findIndex(weight => (remaining -= weight) < 0);
    return index < 0 ? weights.length - 1 : index;
};

const place = (index: DecimalScalingPlace['digitIndex'], digit: number): DecimalScalingPlace => ({
    name: PLACE_NAMES[index],
    exponent: PLACE_EXPONENTS[index],
    digitIndex: index,
    unitInThousandths: UNITS_IN_THOUSANDTHS[index],
    digitValueInThousandths: digit * UNITS_IN_THOUSANDTHS[index]
});

/** Every contribution stays integral in thousandths, including the 1/1000 place. */
function adjacentPlaceScaling(requireZeroCoefficient: boolean): DecimalAdjacentPlaceScalingProblem {
    const repeatedDigit = randomInteger(1, 9);
    const higherIndex = (requireZeroCoefficient
        ? weightedIndex([1, 1, ZERO_SHARE, ZERO_SHARE, ZERO_SHARE])
        : randomInteger(2, 4)) as DecimalScalingPlace['digitIndex'];
    const lowerIndex = (higherIndex + 1) as DecimalScalingPlace['digitIndex'];
    const wholeCase = higherIndex < 2;
    const firstZero = requireZeroCoefficient && !wholeCase ? weightedIndex(FIRST_ZERO_COUNTS) : -1;
    let freeIndex = 0;
    const digitAt = (index: DecimalScalingPlace['digitIndex']): number => {
        if (index === higherIndex || index === lowerIndex) return repeatedDigit;
        if (wholeCase) return index >= 3 ? 0 : otherDigit(repeatedDigit);
        const current = freeIndex++;
        if (current === firstZero) return 0;
        return !requireZeroCoefficient || current < firstZero
            ? nonzeroOtherDigit(repeatedDigit) : otherDigit(repeatedDigit);
    };
    const digits: DecimalAdjacentPlaceScalingProblem['digits'] = [
        digitAt(0), digitAt(1), digitAt(2), digitAt(3), digitAt(4), digitAt(5)
    ];

    return {
        kind: 'decimal-adjacent-place-scaling',
        digits,
        numberInThousandths: digits.reduce((sum, digit, index) =>
            sum + digit * UNITS_IN_THOUSANDTHS[index]!, 0),
        repeatedDigit,
        higherPlace: place(higherIndex, repeatedDigit),
        lowerPlace: place(lowerIndex, repeatedDigit),
        scale: {factor: 10, reciprocalNumerator: 1, reciprocalDenominator: 10}
    };
}

export class DecimalPlaceValueScalingGenerator implements ProblemGenerator<
    DecimalAdjacentPlaceScalingProblem,
    DecimalPlaceValueScalingGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = DecimalPlaceValueScalingGeneratorSchema;

    generate(config: DecimalPlaceValueScalingGeneratorConfig): ProblemStub<DecimalAdjacentPlaceScalingProblem> {
        validateConfigFields('decimal-place-value-scaling', config, ['requireZeroCoefficient']);
        return {data: adjacentPlaceScaling(config.requireZeroCoefficient!)};
    }
}
