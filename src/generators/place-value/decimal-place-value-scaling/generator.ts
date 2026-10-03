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

const place = (index: DecimalScalingPlace['digitIndex'], digit: number): DecimalScalingPlace => ({
    name: PLACE_NAMES[index],
    exponent: PLACE_EXPONENTS[index],
    digitIndex: index,
    unitInThousandths: UNITS_IN_THOUSANDTHS[index],
    digitValueInThousandths: digit * UNITS_IN_THOUSANDTHS[index]
});

/** Every contribution stays integral in thousandths, including the 1/1000 place. */
function adjacentPlaceScaling(): DecimalAdjacentPlaceScalingProblem {
    const repeatedDigit = randomInteger(1, 9);
    const higherIndex = randomInteger(0, 4) as DecimalScalingPlace['digitIndex'];
    const lowerIndex = (higherIndex + 1) as DecimalScalingPlace['digitIndex'];
    const wholeCase = higherIndex < 2;
    const digitAt = (index: DecimalScalingPlace['digitIndex']): number =>
        index === higherIndex || index === lowerIndex ? repeatedDigit
            : wholeCase && index >= 3 ? 0 : otherDigit(repeatedDigit);
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
        validateConfigFields('decimal-place-value-scaling', config, []);
        return {data: adjacentPlaceScaling()};
    }
}
