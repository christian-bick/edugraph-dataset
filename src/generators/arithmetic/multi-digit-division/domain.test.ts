import {describe, expect, it} from 'vitest';
import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {partialQuotientDomain, partialQuotientFrame} from './domain.ts';
import {partialQuotientHasZero} from './zero-profile.ts';

const parts = (value: number) => [...String(value)].map((digit, index, digits) => Number(digit) * 10 ** (digits.length - index - 1));
const quantities = (n: number, d: number) => {
    const q = Math.floor(n / d), r = n % d;
    let remaining = n;
    const work = parts(q).flatMap(chunk => {
        const before = remaining, product = d * chunk;
        remaining -= product;
        return [chunk, product, before, remaining];
    });
    return [n, d, q, r, ...parts(n), ...parts(d), ...work];
};
const ranges = canonicalRangeProfiles.filter(({range}) => range.max <= 10000 && [0, 5].includes(range.min));

describe('finite weighted partial-quotient domains', () => {
    it('retains every original divisor/dividend pair exactly once and conditions its original draw-path probability', () => {
        let total = 0;
        for (const dividendDigits of [1, 2, 3, 4]) for (const divisorDigits of [1, 2]) {
            const minimum = 10 ** (dividendDigits - 1), maximum = 10 ** dividendDigits - 1;
            const seen = new Uint8Array((maximum + 1) * 100);
            let actualCount = 0, weightSum = 0;
            for (const zero of [false, true]) for (const {range} of ranges) {
                const domain = partialQuotientDomain(dividendDigits, divisorDigits, zero, range);
                let valid = true, count = 0;
                for (const row of domain.rows) {
                    const exact = row.remainders[0] === 0;
                    const lastDivisor = dividendDigits === 2 && !exact ? 98 : 99;
                    const firstQ = Math.max(1, Math.ceil((minimum - (exact ? 0 : row.divisor - 1)) / row.divisor));
                    const lastQ = Math.floor((maximum - (exact ? 0 : 1)) / row.divisor);
                    const firstR = exact ? 0 : Math.max(1, minimum - row.divisor * row.quotient);
                    const lastR = exact ? 0 : Math.min(row.divisor - 1, maximum - row.divisor * row.quotient);
                    const expectedWeight = divisorDigits === 1 ? 1 : 0.5 / (lastDivisor - 9) / (lastQ - firstQ + 1) / (lastR - firstR + 1);
                    valid &&= Math.abs(row.weight - expectedWeight) < 1e-15;
                    for (const remainder of row.remainders) {
                        const dividend = row.divisor * row.quotient + remainder;
                        const index = dividend * 100 + row.divisor;
                        valid &&= seen[index] === 0 && hasCanonicalRangeWitness(quantities(dividend, row.divisor), range)
                            && partialQuotientHasZero({dividend, divisor: row.divisor, quotient: row.quotient, remainder}) === zero;
                        seen[index] = 1;
                        count++;
                    }
                    for (const index of [0, row.remainders.length - 1]) {
                        const position = row.end - row.weight * row.remainders.length + row.weight * (index + 0.5);
                        const candidate = partialQuotientFrame(domain, position);
                        valid &&= candidate.divisor === row.divisor && candidate.quotient === row.quotient
                            && candidate.remainder === row.remainders[index];
                    }
                }
                expect(valid).toBe(true);
                expect(count).toBe(domain.count);
                actualCount += count;
                weightSum += domain.weight;
            }
            let expectedCount = 0, exactSupport = true;
            for (let n = minimum; n <= maximum; n++) for (let d = divisorDigits === 1 ? 2 : 10; d <= (divisorDigits === 1 ? 9 : 99); d++) {
                const q = Math.floor(n / d), r = n % d;
                const supported = divisorDigits <= dividendDigits && q > 0 && (divisorDigits === 2
                    || r > 0 && ![n, q].some(value => String(value).includes('0')));
                exactSupport &&= Boolean(seen[n * 100 + d]) === supported;
                if (supported) expectedCount++;
            }
            expect(exactSupport).toBe(true);
            expect(actualCount).toBe(expectedCount);
            if (divisorDigits === 2 && dividendDigits >= 2) expect(weightSum).toBeCloseTo(1, 10);
            else expect(weightSum).toBe(actualCount);
            total += actualCount;
        }
        expect(total).toBe(931315);
    });

    it('retains inclusive dividend boundaries and genuine positive decomposition floors', () => {
        expect(partialQuotientDomain(3, 2, true, createCanonicalNumericRange(100)).count).toBeGreaterThan(0);
        expect(partialQuotientDomain(4, 2, true, createCanonicalNumericRange(1000)).count).toBeGreaterThan(0);
        expect(partialQuotientDomain(2, 1, false, createCanonicalNumericRange(100, 5)).count).toBeGreaterThan(0);
        expect(partialQuotientDomain(2, 2, true, createCanonicalNumericRange(100, 5)).count).toBe(0);
        expect(() => partialQuotientDomain(2, 2, true, {...createCanonicalNumericRange(100), maximumAbove: 0})).toThrow('witnesses');
        expect(() => partialQuotientFrame(partialQuotientDomain(1, 2, false, createCanonicalNumericRange(10)), 0)).toThrow('position');
    });
});
