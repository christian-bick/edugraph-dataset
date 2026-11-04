import {random} from '../../lib/random.ts';
import {createCanonicalNumericRange, type CanonicalNumericRange} from '../../lib/canonical-numeric-range.ts';
import type {DecimalWritingProblem} from '../../types/problems.ts';

type FractionalPart = DecimalWritingProblem['fractionalPart'];

const nonzeroDigit = (): number => 1 + Math.floor(random() * 9);
const anyDigit = (): number => Math.floor(random() * 10);

/** Thousandths are frequent so canonical samples exercise the full Grade 5 bound. */
function precision(): FractionalPart['precision'] {
    const draw = random();
    return draw < 0.12 ? 'tenths' : draw < 0.24 ? 'hundredths' : 'thousandths';
}

function fractionalPart(selected: FractionalPart['precision']): FractionalPart {
    if (selected === 'tenths') {
        const tenth = nonzeroDigit();
        return {precision: selected, digits: [tenth, 0, 0], numerator: tenth, denominator: 10};
    }
    if (selected === 'hundredths') {
        const tenth = random() < 0.5 ? 0 : anyDigit();
        const hundredth = nonzeroDigit();
        return {precision: selected, digits: [tenth, hundredth, 0],
            numerator: 10 * tenth + hundredth, denominator: 100};
    }

    // Retain the original internal-placeholder scenarios and their draw order.
    const pattern = Math.floor(random() * 4);
    const tenth = pattern === 0 || pattern === 2 ? 0 : nonzeroDigit();
    const hundredth = pattern === 0 || pattern === 1 ? 0 : nonzeroDigit();
    const thousandth = nonzeroDigit();
    return {precision: selected, digits: [tenth, hundredth, thousandth],
        numerator: 100 * tenth + 10 * hundredth + thousandth, denominator: 1000};
}

const precisionLength = (selected: FractionalPart['precision']): number =>
    selected === 'tenths' ? 1 : selected === 'hundredths' ? 2 : 3;

function decimalWriting(wholePart: number): DecimalWritingProblem {
    const fraction = fractionalPart(precision());
    const scale = precisionLength(fraction.precision);
    const valueInThousandths = wholePart * 1000 + fraction.numerator * 10 ** (3 - scale);
    const canonicalNumeral = `${wholePart}.${fraction.digits.slice(0, scale).join('')}`;
    return {kind: 'decimal-writing', base: 10, wholePart, valueInThousandths,
        canonicalNumeral, fractionalPart: fraction};
}

/** Condition the original uniform0..9 whole-part proposal on the complete
 * decimal value. Zero wholes and digit placeholders are not zero quantities. */
export function sampleDecimalWritingInRange(range: CanonicalNumericRange): DecimalWritingProblem {
    if (!range || !(range.max === 5 && range.min === 0 || range.max === 10 && range.min === 5))
        throw new Error('Unsupported decimal-value range.');
    const expected = createCanonicalNumericRange(range.max, range.min);
    if (range.maximumAbove !== expected.maximumAbove || range.minimumBelow !== expected.minimumBelow)
        throw new Error('Invalid decimal-value range witnesses.');
    const draw = random();
    const wholePart = (range.max === 5 ? 0 : 5) + Math.floor(draw * 5);
    return decimalWriting(wholePart);
}

