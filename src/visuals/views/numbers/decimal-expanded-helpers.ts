import type {DecimalExpandedPlace, DecimalPlaceValueExpandedProblem} from '../../../types/problems.ts';
import {ViewValidationError} from '../../helpers/validation.ts';

const PLACE_NAMES = [
    'thousandths', 'hundredths', 'tenths', 'ones', 'tens', 'hundreds',
    'thousands', 'ten-thousands', 'hundred-thousands', 'millions'
] as const;

function exactPlace(place: DecimalExpandedPlace, sourceDigit: number): boolean {
    const expectedName = PLACE_NAMES[place.exponent + 3];
    const expectedUnitNumerator = place.exponent >= 0 ? 10 ** place.exponent : 1;
    const expectedUnitDenominator = place.exponent >= 0 ? 1 : 10 ** -place.exponent;
    return expectedName !== undefined && place.name === expectedName &&
        place.digit === sourceDigit &&
        place.unitNumerator === expectedUnitNumerator &&
        place.unitDenominator === expectedUnitDenominator &&
        place.contributionInThousandths === place.digit * expectedUnitNumerator * 1000 / expectedUnitDenominator;
}

function samePlace(a: DecimalExpandedPlace, b: DecimalExpandedPlace): boolean {
    return a.name === b.name && a.exponent === b.exponent && a.digit === b.digit &&
        a.unitNumerator === b.unitNumerator && a.unitDenominator === b.unitDenominator &&
        a.contributionInThousandths === b.contributionInThousandths;
}

export function assertDecimalExpandedProblem(viewId: string, data: DecimalPlaceValueExpandedProblem): void {
    if (
        data?.kind !== 'decimal-place-value-expanded' || data.base !== 10 ||
        !Number.isSafeInteger(data.wholePart) || data.wholePart < 0 || data.wholePart > 9_999_999 ||
        !Number.isSafeInteger(data.valueInThousandths) ||
        !Array.isArray(data.fractionalDigits) || data.fractionalDigits.length !== 3 ||
        data.fractionalDigits.some(digit => !Number.isInteger(digit) || digit < 0 || digit > 9) ||
        ![1, 2, 3].includes(data.fractionalPrecision)
    ) throw new ViewValidationError(viewId, 'Expected an exact nonnegative decimal through thousandths.');

    const digits = data.fractionalDigits;
    const precision = data.fractionalPrecision;
    if (
        digits[precision - 1] === 0 || digits.slice(precision).some(digit => digit !== 0) ||
        data.valueInThousandths !== data.wholePart * 1000 + digits[0] * 100 + digits[1] * 10 + digits[2] ||
        data.canonicalNumeral !== `${data.wholePart}.${digits.slice(0, precision).join('')}`
    ) throw new ViewValidationError(viewId, 'Numeral, precision, digits, and exact value must agree.');

    if (!Array.isArray(data.places) || !Array.isArray(data.sumTerms) || data.sumTerms.length < 2) {
        throw new ViewValidationError(viewId, 'Ordered place columns and at least two nonzero sum terms are required.');
    }
    const highestExponent = data.places[0]?.exponent;
    if (
        !Number.isInteger(highestExponent) || highestExponent < 0 || highestExponent > 6 ||
        data.places.length !== highestExponent + 4
    ) throw new ViewValidationError(viewId, 'Place columns must span each base-ten position through thousandths.');

    for (const [index, place] of data.places.entries()) {
        const exponent = highestExponent - index;
        const sourceDigit = exponent >= 0
            ? Math.floor(data.wholePart / 10 ** exponent) % 10
            : digits[-exponent - 1];
        if (place.exponent !== exponent || !exactPlace(place, sourceDigit)) {
            throw new ViewValidationError(viewId, 'Place column digits, units, and contributions must agree exactly.');
        }
    }
    const nonzero = data.places.filter(place => place.digit !== 0);
    if (
        nonzero.length !== data.sumTerms.length ||
        nonzero.some((place, index) => !samePlace(place, data.sumTerms[index])) ||
        data.sumTerms.reduce((sum, term) => sum + term.contributionInThousandths, 0) !== data.valueInThousandths
    ) throw new ViewValidationError(viewId, 'Sum terms must be the ordered nonzero places and reconstruct the numeral.');
}

export function expandedUnit(place: DecimalExpandedPlace): string {
    return place.unitDenominator === 1
        ? `${place.unitNumerator}`
        : `${place.unitNumerator}/${place.unitDenominator}`;
}

export function expandedTerm(place: DecimalExpandedPlace): string {
    return `${place.digit} × ${expandedUnit(place)}`;
}

/** Keep long expanded expressions in two balanced visual rows. */
export function expandedTermRows(terms: readonly DecimalExpandedPlace[]): readonly (readonly DecimalExpandedPlace[])[] {
    if (terms.length <= 4) return [terms];
    const firstRowCount = Math.ceil(terms.length / 2);
    return [terms.slice(0, firstRowCount), terms.slice(firstRowCount)];
}
