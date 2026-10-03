import type {DecimalWritingProblem} from '../../../types/problems.ts';
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

/** The three alternatives change exact thousandths values without changing the whole part. */
export function decimalReadingChoices(data: DecimalWritingProblem, seed: number): readonly DecimalReadingChoice[] {
    const fractional = data.valueInThousandths - data.wholePart * 1000;
    const fractions = [fractional, ...[1, 10, 100].map(offset =>
        fractional + offset <= 999 ? fractional + offset : fractional - offset
    )];
    const choices = fractions.map((value, index) => ({
        valueInThousandths: data.wholePart * 1000 + value,
        name: nameForFraction(data.wholePart, value),
        correct: index === 0
    }));
    const rotation = ((seed % choices.length) + choices.length) % choices.length;
    return [...choices.slice(rotation), ...choices.slice(0, rotation)];
}

export function decimalResponseDigits(data: DecimalWritingProblem): readonly string[] {
    const length = PRECISION_LENGTH[data.fractionalPart.precision];
    return [String(data.wholePart), '.', ...data.fractionalPart.digits.slice(0, length).map(String)];
}
