import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import type {DecimalPlaceValueExpandedProblem} from '../../../types/problems.ts';
import {createExpandedDecimal, DecimalPlaceValueExpandedGenerator} from './generator.ts';

const generator = new DecimalPlaceValueExpandedGenerator();
const PLACE_NAMES = ['hundreds', 'tens', 'ones', 'tenths', 'hundredths', 'thousandths'];
const EXPONENTS = [2, 1, 0, -1, -2, -3];
const UNIT_NUMERATORS = [100, 10, 1, 1, 1, 1];
const UNIT_DENOMINATORS = [1, 1, 1, 10, 100, 1000];
const THOUSANDTH_FACTORS = [100000, 10000, 1000, 100, 10, 1];

function verifyExactDecomposition(data: DecimalPlaceValueExpandedProblem): void {
    expect(data.kind).toBe('decimal-place-value-expanded');
    expect(data.base).toBe(10);
    expect(data.places).toHaveLength(6);
    expect(data.fractionalDigits).toHaveLength(3);
    expect(data.places.map(place => place.name)).toEqual(PLACE_NAMES);
    expect(data.places.map(place => place.exponent)).toEqual(EXPONENTS);
    expect(data.places.map(place => place.unitNumerator)).toEqual(UNIT_NUMERATORS);
    expect(data.places.map(place => place.unitDenominator)).toEqual(UNIT_DENOMINATORS);
    expect(data.places.map(place => place.digit)).toEqual([
        Math.floor(data.wholePart / 100),
        Math.floor(data.wholePart / 10) % 10,
        data.wholePart % 10,
        ...data.fractionalDigits
    ]);
    data.places.forEach((place, index) => {
        expect(place.contributionInThousandths).toBe(place.digit * THOUSANDTH_FACTORS[index]!);
        expect(Number.isSafeInteger(place.contributionInThousandths)).toBe(true);
    });
    expect(data.sumTerms).toEqual(data.places.filter(place => place.digit !== 0));
    expect(data.sumTerms.length).toBeGreaterThanOrEqual(2);
    expect(data.sumTerms.some(place => place.exponent < 0)).toBe(true);
    expect(data.valueInThousandths).toBe(data.places.reduce(
        (sum, place) => sum + place.contributionInThousandths, 0
    ));
    expect(data.valueInThousandths).toBe(data.sumTerms.reduce(
        (sum, place) => sum + place.contributionInThousandths, 0
    ));
    expect(data.canonicalNumeral).toBe(
        `${data.wholePart}.${data.fractionalDigits.slice(0, data.fractionalPrecision).join('')}`
    );
    expect(data.fractionalDigits[data.fractionalPrecision - 1]).toBeGreaterThan(0);
    expect(data.fractionalDigits.slice(data.fractionalPrecision).every(digit => digit === 0)).toBe(true);
    expect(data).not.toHaveProperty('prompt');
    expect(data).not.toHaveProperty('blank');
    expect(data).not.toHaveProperty('explanation');
}

describe('DecimalPlaceValueExpandedGenerator', () => {
    it('rejects a missing configuration object', () => {
        expect(() => generator.generate(null as never)).toThrow();
    });

    it.each([
        [5, [0, 0, 8] as const, 3 as const, '5.008', [5000, 8]],
        [0, [3, 0, 5] as const, 3 as const, '0.305', [300, 5]],
        [305, [0, 0, 8] as const, 3 as const, '305.008', [300000, 5000, 8]],
        [5, [3, 0, 0] as const, 1 as const, '5.3', [5000, 300]],
        [5, [0, 3, 0] as const, 2 as const, '5.03', [5000, 30]]
    ])('decomposes %s with sparse digits and fractional units', (
        wholePart, fractionalDigits, precision, numeral, contributions
    ) => {
        const data = createExpandedDecimal(wholePart, fractionalDigits, precision)!;
        verifyExactDecomposition(data);
        expect(data.canonicalNumeral).toBe(numeral);
        expect(data.sumTerms.map(term => term.contributionInThousandths)).toEqual(contributions);
    });

    it('rejects one-term and invalid-precision values instead of claiming a sum', () => {
        expect(createExpandedDecimal(0, [0, 0, 8], 3)).toBeNull();
        expect(createExpandedDecimal(5, [0, 8, 0], 3)).toBeNull();
        expect(createExpandedDecimal(5, [3, 2, 0], 1)).toBeNull();
        expect(createExpandedDecimal(-1, [3, 0, 0], 1)).toBeNull();
        expect(createExpandedDecimal(1000, [3, 0, 0], 1)).toBeNull();
    });

    it('samples a nonzero thousandths term every time with diverse interior zeros', () => {
        let sparseThousandths = 0;
        let zeroWholeThousandths = 0;
        for (let seed = 0; seed < 300; seed++) {
            setSeed(seed);
            const data = generator.generate({})!.data;
            verifyExactDecomposition(data);
            expect(data.fractionalPrecision).toBe(3);
            expect(data.sumTerms.some(term => term.name === 'thousandths')).toBe(true);
            if (data.fractionalDigits.some(digit => digit === 0)) {
                sparseThousandths++;
            }
            if (data.wholePart === 0) zeroWholeThousandths++;
        }
        expect(sparseThousandths).toBeGreaterThan(80);
        expect(zeroWholeThousandths).toBeGreaterThan(10);
    });

    it('replays the exact same decomposition under one seed', () => {
        setSeed('decimal-expanded-form');
        const first = generator.generate({});
        setSeed('decimal-expanded-form');
        expect(generator.generate({})).toEqual(first);
    });
});
