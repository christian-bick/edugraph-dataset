import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
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
import {scalingDecimalRangeBlocks} from './domain.ts';

const PLACE_NAMES = ['hundreds', 'tens', 'ones', 'tenths', 'hundredths', 'thousandths'] as const;
const PLACE_EXPONENTS = [2, 1, 0, -1, -2, -3] as const;
const UNITS_IN_THOUSANDTHS = [100000, 10000, 1000, 100, 10, 1] as const;

const place = (index: DecimalScalingPlace['digitIndex'], digit: number): DecimalScalingPlace => ({
    name: PLACE_NAMES[index],
    exponent: PLACE_EXPONENTS[index],
    digitIndex: index,
    unitInThousandths: UNITS_IN_THOUSANDTHS[index],
    digitValueInThousandths: digit * UNITS_IN_THOUSANDTHS[index]
});

/** Every contribution stays integral in thousandths, including the 1/1000 place. */
function adjacentPlaceScaling(config: DecimalPlaceValueScalingGeneratorConfig): DecimalAdjacentPlaceScalingProblem {
    const blocks = scalingDecimalRangeBlocks(config.requireZeroCoefficient!, config.range!);
    if (!blocks.length) throw new GeneratorValidationError('decimal-place-value-scaling', 'No adjacent-place charts support this range and zero profile.');
    let remaining = random() * blocks.reduce((total, block) => total + block.weight, 0);
    const block = blocks.find(block => (remaining -= block.weight) < 0) ?? blocks[blocks.length - 1]!;
    const {repeatedDigit, higherIndex} = block;
    const lowerIndex = (higherIndex + 1) as DecimalScalingPlace['digitIndex'];
    const whole = block.wholes[Math.floor(random() * block.wholes.length)]!;
    const fractional = block.fractionalDigits.map(values => values.length === 1 ? values[0]! : values[Math.floor(random() * values.length)]!);
    const digits: DecimalAdjacentPlaceScalingProblem['digits'] = [
        ...whole, fractional[0]!, fractional[1]!, fractional[2]!
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
        validateConfigFields('decimal-place-value-scaling', config, ['requireZeroCoefficient', 'range']);
        return {data: adjacentPlaceScaling(config)};
    }
}
