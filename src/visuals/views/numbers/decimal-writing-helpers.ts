import type {DecimalReadingRelationProblem, DecimalWritingProblem} from '../../../types/problems.ts';
import {ViewValidationError} from '../../helpers/validation.ts';
import {numberToEnglishName} from './numbers-read-standard/helpers.ts';

type Precision = DecimalWritingProblem['fractionalPart']['precision'];

const PRECISION_LENGTH: Record<Precision, number> = {
    tenths: 1,
    hundredths: 2,
    thousandths: 3
};

const DENOMINATOR: Record<Precision, number> = {
    tenths: 10,
    hundredths: 100,
    thousandths: 1000
};

const UNIT_NAME: Record<Precision, readonly [string, string]> = {
    tenths: ['tenth', 'tenths'],
    hundredths: ['hundredth', 'hundredths'],
    thousandths: ['thousandth', 'thousandths']
};

export function assertDecimalWritingProblem(viewId: string, data: DecimalWritingProblem): void {
    if (
        data?.kind !== 'decimal-writing' || data.base !== 10 ||
        !Number.isInteger(data.wholePart) || data.wholePart < 0 || data.wholePart > 1000 ||
        !Number.isSafeInteger(data.valueInThousandths)
    ) throw new ViewValidationError(viewId, 'Expected an exact nonnegative base-ten decimal with a supported whole part.');

    const part = data.fractionalPart;
    const length = PRECISION_LENGTH[part?.precision];
    if (
        !length || !Array.isArray(part.digits) || part.digits.length !== 3 ||
        part.digits.some(digit => !Number.isInteger(digit) || digit < 0 || digit > 9) ||
        part.digits[length - 1] === 0 || part.digits.slice(length).some(digit => digit !== 0)
    ) throw new ViewValidationError(viewId, 'Fractional digits must have one necessary final place and valid zero placeholders.');

    const numerator = Number(part.digits.slice(0, length).join(''));
    const valueInThousandths = data.wholePart * 1000 +
        part.digits[0] * 100 + part.digits[1] * 10 + part.digits[2];
    const numeral = `${data.wholePart}.${part.digits.slice(0, length).join('')}`;
    if (
        part.denominator !== DENOMINATOR[part.precision] ||
        part.numerator !== numerator ||
        data.valueInThousandths !== valueInThousandths ||
        data.canonicalNumeral !== numeral
    ) throw new ViewValidationError(viewId, 'Numeral, fraction, digits, and exact value must agree.');
}

export function decimalNumberName(data: DecimalWritingProblem): string {
    const {numerator, precision} = data.fractionalPart;
    const unit = UNIT_NAME[precision][numerator === 1 ? 0 : 1];
    return `${numberToEnglishName(data.wholePart)} and ${numberToEnglishName(numerator)} ${unit}`;
}

function nameForFraction(wholePart: number, fractionInThousandths: number): string {
    const precision: Precision = fractionInThousandths % 100 === 0
        ? 'tenths'
        : fractionInThousandths % 10 === 0
            ? 'hundredths'
            : 'thousandths';
    const divisor = 1000 / DENOMINATOR[precision];
    const numerator = fractionInThousandths / divisor;
    const unit = UNIT_NAME[precision][numerator === 1 ? 0 : 1];
    return `${numberToEnglishName(wholePart)} and ${numberToEnglishName(numerator)} ${unit}`;
}

export type DecimalReadingChoice = Readonly<{valueInThousandths: number; name: string; correct: boolean}>;

export function assertDecimalReadingRelation(viewId: string, data: DecimalReadingRelationProblem): void {
    if (data?.kind !== 'decimal-reading-relation') {
        throw new ViewValidationError(viewId, 'Expected a canonical decimal reading relation.');
    }
    assertDecimalWritingProblem(viewId, data.source);
    const values = data.comparisonValues;
    const minimum = data.source.wholePart * 1000 + 1;
    if (!Array.isArray(values) || values.length !== 3
        || values.some(value => !Number.isSafeInteger(value) || value < minimum || value > minimum + 998)
        || new Set([data.source.valueInThousandths, ...values]).size !== 4) {
        throw new ViewValidationError(viewId, 'Expected three distinct exact comparison values in the source whole part.');
    }
}

/** Formatting and rotation only; all compared mathematics is supplied by the producer. */
export function decimalReadingChoices(data: DecimalReadingRelationProblem, seed: number): readonly DecimalReadingChoice[] {
    const source = data.source;
    const choices = [source.valueInThousandths, ...data.comparisonValues].map(value => ({
        valueInThousandths: value,
        name: nameForFraction(source.wholePart, value - source.wholePart * 1000),
        correct: value === source.valueInThousandths
    }));
    const rotation = ((seed % choices.length) + choices.length) % choices.length;
    return [...choices.slice(rotation), ...choices.slice(0, rotation)];
}

export function decimalResponseDigits(data: DecimalWritingProblem): readonly string[] {
    const length = PRECISION_LENGTH[data.fractionalPart.precision];
    return [String(data.wholePart), '.', ...data.fractionalPart.digits.slice(0, length).map(String)];
}
