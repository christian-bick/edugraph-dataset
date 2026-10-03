import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {
    DecimalDivisionGroupingBar,
    DecimalDivisionOperand,
    DecimalDivisionPlace,
    DecimalDivisionProblem,
    DecimalDivisionStep
} from '../../../types/problems.ts';
import {
    DecimalDivisionModelGeneratorSchema,
    type DecimalDivisionModelGeneratorConfig
} from './spec.ts';

const QUOTIENT_SCALE = 10000;
const PLACES: readonly DecimalDivisionPlace[] = [
    'ones', 'tenths', 'hundredths', 'thousandths', 'ten-thousandths'
];

const randomInteger = (minimum: number, maximum: number): number =>
    minimum + Math.floor(random() * (maximum - minimum + 1));

const operand = (valueInHundredths: number): DecimalDivisionOperand => {
    const fraction = String(valueInHundredths % 100).padStart(2, '0')
        .replace(/0+$/, '');
    const whole = String(Math.floor(valueInHundredths / 100));
    return {
        valueInHundredths,
        canonicalNumeral: fraction === '' ? whole : `${whole}.${fraction}`,
        alignedDigits: [
            Math.floor(valueInHundredths / 100),
            Math.floor(valueInHundredths / 10) % 10,
            valueInHundredths % 10
        ]
    };
};

const quotient = (
    valueInTenThousandths: number
): DecimalDivisionProblem['quotient'] => {
    const fraction = String(valueInTenThousandths % QUOTIENT_SCALE).padStart(4, '0')
        .replace(/0+$/, '');
    const whole = Math.floor(valueInTenThousandths / QUOTIENT_SCALE);
    return {
        valueInTenThousandths,
        canonicalNumeral: fraction === '' ? String(whole) : `${whole}.${fraction}`,
        precision: fraction.length as 0 | 1 | 2 | 3 | 4,
        alignedDigits: [
            whole,
            Math.floor(valueInTenThousandths / 1000) % 10,
            Math.floor(valueInTenThousandths / 100) % 10,
            Math.floor(valueInTenThousandths / 10) % 10,
            valueInTenThousandths % 10
        ]
    };
};

const grouping = (
    dividendInHundredths: number,
    divisorInHundredths: number
): DecimalDivisionProblem['grouping'] => {
    const fullGroupCount = Math.floor(dividendInHundredths / divisorInHundredths);
    const remainderCells = dividendInHundredths % divisorInHundredths;
    const bars: DecimalDivisionGroupingBar[] = Array.from(
        {length: fullGroupCount},
        (_, index) => ({
            kind: 'full',
            index,
            capacityCells: divisorInHundredths,
            filledCells: divisorInHundredths,
            quotientContributionInTenThousandths: QUOTIENT_SCALE
        })
    );
    if (remainderCells !== 0) {
        bars.push({
            kind: 'partial',
            index: fullGroupCount,
            capacityCells: divisorInHundredths,
            filledCells: remainderCells,
            quotientContributionInTenThousandths:
                remainderCells * QUOTIENT_SCALE / divisorInHundredths
        });
    }
    return {
        unitValueInHundredths: 1,
        cellsPerGroup: divisorInHundredths,
        fullGroupCount,
        remainderCells,
        bars
    };
};

const divisionSteps = (
    dividendInHundredths: number,
    divisorInHundredths: number
): DecimalDivisionStep[] => {
    const steps: DecimalDivisionStep[] = [];
    let remainder = dividendInHundredths;
    for (const place of PLACES) {
        const partialDividend = steps.length === 0 ? remainder : remainder * 10;
        const quotientDigit = Math.floor(partialDividend / divisorInHundredths);
        const subtrahend = divisorInHundredths * quotientDigit;
        remainder = partialDividend - subtrahend;
        steps.push({place, partialDividend, quotientDigit, subtrahend, remainder});
        if (remainder === 0) break;
    }
    return steps;
};

/** Construct an exact finite quotient, its grouping bars, and its written trace. */
export function createDecimalDivisionProblem(
    dividendInHundredths: number,
    divisorInHundredths: number
): DecimalDivisionProblem | null {
    if (!Number.isSafeInteger(dividendInHundredths)
        || !Number.isSafeInteger(divisorInHundredths)
        || dividendInHundredths < 0 || dividendInHundredths > 999
        || divisorInHundredths < 1 || divisorInHundredths > 999) return null;
    const scaledDividend = dividendInHundredths * QUOTIENT_SCALE;
    if (scaledDividend % divisorInHundredths !== 0) return null;
    const valueInTenThousandths = scaledDividend / divisorInHundredths;
    if (valueInTenThousandths > 99999) return null;

    const dividend = operand(dividendInHundredths);
    const divisor = operand(divisorInHundredths);
    const steps = divisionSteps(dividendInHundredths, divisorInHundredths);
    if (steps.at(-1)?.remainder !== 0) return null;
    return {
        kind: 'decimal-division-model',
        base: 10,
        operandScale: 100,
        quotientScale: QUOTIENT_SCALE,
        dividend,
        divisor,
        quotient: quotient(valueInTenThousandths),
        grouping: grouping(dividendInHundredths, divisorInHundredths),
        divisionTrace: {
            dividendUnitCount: dividendInHundredths,
            divisorUnitCount: divisorInHundredths,
            steps
        },
        inverse: {
            divisorTimesQuotientInMillionths: divisorInHundredths * valueInTenThousandths,
            dividendInMillionths: dividendInHundredths * QUOTIENT_SCALE
        }
    };
}

export class DecimalDivisionModelGenerator implements ProblemGenerator<
    DecimalDivisionProblem,
    DecimalDivisionModelGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = DecimalDivisionModelGeneratorSchema;

    generate(config: DecimalDivisionModelGeneratorConfig): ProblemStub<DecimalDivisionProblem> {
        validateConfigFields('decimal-division-model', config, []);
        if (Object.keys(config).length !== 0) {
            throw new GeneratorValidationError(
                'decimal-division-model', 'The configuration contains an unexpected field.'
            );
        }
        const divisorInHundredths = random() < 0.5 ? 8 : 16;
        const fullGroupCount = randomInteger(1, 4);
        const remainderCells = 2 * randomInteger(0, divisorInHundredths / 2 - 1) + 1;
        const dividendInHundredths = fullGroupCount * divisorInHundredths + remainderCells;
        // Powers-of-two divisors and odd remainders guarantee an exact quotient
        // whose minimal decimal precision is three or four places.
        const data = createDecimalDivisionProblem(
            dividendInHundredths, divisorInHundredths
        );
        if (data === null) {
            throw new GeneratorValidationError(
                'decimal-division-model', 'The bounded exact sample was unexpectedly invalid.'
            );
        }
        return {data};
    }
}
