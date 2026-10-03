import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {
    DecimalPowerTenScaleStep,
    DecimalPowerTenScalingProblem,
    PowerTenDecimalValue,
    PowerTenPower
} from '../../../types/problems.ts';
import {
    DecimalPowerTenScalingGeneratorSchema,
    type DecimalPowerTenScalingGeneratorConfig
} from './spec.ts';

const POWERS: readonly [PowerTenPower, PowerTenPower, PowerTenPower] = [
    {base: 10, exponent: 0, value: 1, repeatedFactors: []},
    {base: 10, exponent: 1, value: 10, repeatedFactors: [10]},
    {base: 10, exponent: 2, value: 100, repeatedFactors: [10, 10]}
];

const randomDigit = (): number => 1 + Math.floor(random() * 9);

/** Build an exact, shortest decimal numeral from an integer coefficient. */
function decimalValue(unscaled: number, scale: number): PowerTenDecimalValue {
    let coefficient = unscaled;
    let precision = scale;
    while (precision > 0 && coefficient % 10 === 0) {
        coefficient /= 10;
        precision--;
    }
    const digits = String(coefficient).padStart(precision + 1, '0');
    const numeral = precision === 0 ? digits
        : `${digits.slice(0, -precision)}.${digits.slice(-precision)}`;
    return {unscaled: coefficient, scale: precision, numeral};
}

function contribution(digit: number, exponent: number): PowerTenDecimalValue {
    return exponent >= 0
        ? decimalValue(digit * 10 ** exponent, 0)
        : decimalValue(digit, -exponent);
}

function scaleStep(
    coefficient: number,
    inputScale: number,
    operation: DecimalPowerTenScalingProblem['operation'],
    power: PowerTenPower
): DecimalPowerTenScaleStep {
    const offset = operation === 'multiplication' ? power.exponent : -power.exponent;
    const resultScale = inputScale - offset;
    const before = decimalValue(coefficient, inputScale);
    const after = resultScale < 0
        ? decimalValue(coefficient * 10 ** -resultScale, 0)
        : decimalValue(coefficient, resultScale);
    const placeShifts = String(coefficient).split('').map((character, digitIndex) => {
        const digit = Number(character);
        const originalPlaceExponent = 1 - inputScale - digitIndex;
        const resultPlaceExponent = originalPlaceExponent + offset;
        return {
            digitIndex,
            digit,
            originalPlaceExponent,
            resultPlaceExponent,
            originalContribution: contribution(digit, originalPlaceExponent),
            resultContribution: contribution(digit, resultPlaceExponent)
        };
    });
    const crossesUnitsPlace = placeShifts.some(shift =>
        shift.originalPlaceExponent < 0 && shift.resultPlaceExponent >= 0
        || shift.originalPlaceExponent >= 0 && shift.resultPlaceExponent < 0);
    return {power, before, after, placeShifts, crossesUnitsPlace};
}

export class DecimalPowerTenScalingGenerator implements ProblemGenerator<
    DecimalPowerTenScalingProblem,
    DecimalPowerTenScalingGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = DecimalPowerTenScalingGeneratorSchema;

    generate(
        config: DecimalPowerTenScalingGeneratorConfig
    ): ProblemStub<DecimalPowerTenScalingProblem> {
        validateConfigFields('decimal-power-ten-scaling', config, ['operation']);
        const operation = config.operation!;
        const coefficient = 10 * randomDigit() + randomDigit();
        // Multiplication moves tenths into whole places; division moves ones into fractional places.
        const inputScale = operation === 'multiplication' ? 2 : 1;
        return {
            data: {
                kind: 'decimal-power-ten-scaling',
                operation,
                series: [
                    scaleStep(coefficient, inputScale, operation, POWERS[0]),
                    scaleStep(coefficient, inputScale, operation, POWERS[1]),
                    scaleStep(coefficient, inputScale, operation, POWERS[2])
                ]
            }
        };
    }
}
