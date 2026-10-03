import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {
    PowerTenPower,
    WholeNumberPowerTenScalingProblem,
    WholePowerTenPlaceShift,
    WholePowerTenScaleStep,
    WholePowerTenZeroPattern
} from '../../../types/problems.ts';
import {
    WholeNumberPowerTenScalingGeneratorSchema,
    type WholeNumberPowerTenScalingGeneratorConfig
} from './spec.ts';

const POWERS: readonly [PowerTenPower, PowerTenPower, PowerTenPower] = [
    {base: 10, exponent: 0, value: 1, repeatedFactors: []},
    {base: 10, exponent: 1, value: 10, repeatedFactors: [10]},
    {base: 10, exponent: 2, value: 100, repeatedFactors: [10, 10]}
];

const randomDigit = (): number => 1 + Math.floor(random() * 9);

function trailingZeros(positiveInteger: number): number {
    let remaining = positiveInteger;
    let count = 0;
    while (remaining % 10 === 0) {
        remaining /= 10;
        count++;
    }
    return count;
}

function placeShifts(original: number, exponent: PowerTenPower['exponent']): WholePowerTenPlaceShift[] {
    const digits = String(original);
    return Array.from(digits, (character, digitIndex) => {
        const digit = Number(character);
        const originalPlaceExponent = digits.length - digitIndex - 1;
        const productPlaceExponent = originalPlaceExponent + exponent;
        return {
            digitIndex,
            digit,
            originalPlaceExponent,
            productPlaceExponent,
            originalContribution: digit * 10 ** originalPlaceExponent,
            productContribution: digit * 10 ** productPlaceExponent
        };
    });
}

function scaleStep(original: number, power: PowerTenPower): WholePowerTenScaleStep {
    const zeroPattern: WholePowerTenZeroPattern = original === 0
        ? {
            kind: 'zero',
            originalTrailingZeros: null,
            introducedTrailingZeros: 0,
            productTrailingZeros: null
        }
        : {
            kind: 'positive',
            originalTrailingZeros: trailingZeros(original),
            introducedTrailingZeros: power.exponent,
            productTrailingZeros: trailingZeros(original) + power.exponent
        };
    return {
        original,
        power,
        product: original * power.value,
        placeShifts: placeShifts(original, power.exponent),
        zeroPattern
    };
}

export class WholeNumberPowerTenScalingGenerator implements ProblemGenerator<
    WholeNumberPowerTenScalingProblem,
    WholeNumberPowerTenScalingGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = WholeNumberPowerTenScalingGeneratorSchema;

    generate(config: WholeNumberPowerTenScalingGeneratorConfig): ProblemStub<WholeNumberPowerTenScalingProblem> {
        validateConfigFields('whole-number-power-ten-scaling', config, []);
        const original = 10 * randomDigit() + randomDigit();
        return {
            data: {
                kind: 'whole-number-power-ten-scaling',
                primarySeries: [
                    scaleStep(original, POWERS[0]),
                    scaleStep(original, POWERS[1]),
                    scaleStep(original, POWERS[2])
                ],
                existingZeroWitness: scaleStep(original * 10, POWERS[1]),
                zeroWitness: scaleStep(0, POWERS[2])
            }
        };
    }
}
