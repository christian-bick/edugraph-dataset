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

const nativeDivisionPartitions = [1, 2, 3, 4].flatMap(dividendDigits => [1, 2].flatMap(divisorDigits => {
    const minimum = 10 ** (dividendDigits - 1), maximum = 10 ** dividendDigits - 1;
    const span = dividendDigits === 4 ? 1000 : maximum - minimum + 1;
    return Array.from({length: Math.ceil((maximum - minimum + 1) / span)}, (_, index) => ({
        dividendDigits, divisorDigits, firstDividend: minimum + index * span,
        lastDividend: Math.min(maximum, minimum + (index + 1) * span - 1)
    }));
}));

describe('finite weighted partial-quotient domains', () => {
    it.each(nativeDivisionPartitions)('retains widths $dividendDigits/$divisorDigits, dividends $firstDividend through $lastDividend, with exact original mass',
        ({dividendDigits, divisorDigits, firstDividend, lastDividend}) => {
            const minimum = 10 ** (dividendDigits - 1), maximum = 10 ** dividendDigits - 1;
            const seen = new Uint8Array((maximum + 1) * 100);
            let actualCount = 0, fullCount = 0, weightSum = 0;
            for (const zero of [false, true]) for (const {range} of ranges) {
                const domain = partialQuotientDomain(dividendDigits, divisorDigits, zero, range);
                let valid = true, count = 0;
                for (const row of domain.rows) {
                    valid &&= row.remainders.length > 0;
                    const initialDividend = row.divisor * row.quotient + row.remainders[0]!;
                    const ownsRow = initialDividend >= firstDividend && initialDividend <= lastDividend;
                    if (ownsRow) {
                        const exact = row.remainders[0] === 0;
                        const lastDivisor = dividendDigits === 2 && !exact ? 98 : 99;
                        const firstQ = Math.max(1, Math.ceil((minimum - (exact ? 0 : row.divisor - 1)) / row.divisor));
                        const lastQ = Math.floor((maximum - (exact ? 0 : 1)) / row.divisor);
                        const firstR = exact ? 0 : Math.max(1, minimum - row.divisor * row.quotient);
                        const lastR = exact ? 0 : Math.min(row.divisor - 1, maximum - row.divisor * row.quotient);
                        const expectedWeight = divisorDigits === 1 ? 1 : 0.5 / (lastDivisor - 9) / (lastQ - firstQ + 1) / (lastR - firstR + 1);
                        valid &&= Math.abs(row.weight - expectedWeight) < 1e-15;
                    }
                    for (const remainder of row.remainders) {
                        const dividend = row.divisor * row.quotient + remainder;
                        count++;
                        valid &&= dividend >= minimum && dividend <= maximum;
                        if (dividend < firstDividend || dividend > lastDividend) continue;
                        const index = dividend * 100 + row.divisor;
                        valid &&= seen[index] === 0 && hasCanonicalRangeWitness(quantities(dividend, row.divisor), range)
                            && partialQuotientHasZero({dividend, divisor: row.divisor, quotient: row.quotient, remainder}) === zero;
                        seen[index] = 1;
                        actualCount++;
                    }
                    // Each row's original weight and both exact weighted-index
                    // endpoints belong to the partition containing its first dividend.
                    if (ownsRow) for (const index of [0, row.remainders.length - 1]) {
                        const position = row.end - row.weight * row.remainders.length + row.weight * (index + 0.5);
                        const candidate = partialQuotientFrame(domain, position);
                        valid &&= candidate.divisor === row.divisor && candidate.quotient === row.quotient
                            && candidate.remainder === row.remainders[index];
                    }
                }
                expect(valid).toBe(true);
                expect(count).toBe(domain.count);
                fullCount += count;
                weightSum += domain.weight;
            }
            let expectedCount = 0, exactSupport = true;
            for (let n = firstDividend; n <= lastDividend; n++) for (let d = divisorDigits === 1 ? 2 : 10; d <= (divisorDigits === 1 ? 9 : 99); d++) {
                const q = Math.floor(n / d), r = n % d;
                const supported = divisorDigits <= dividendDigits && q > 0 && (divisorDigits === 2
                    || r > 0 && ![n, q].some(value => String(value).includes('0')));
                exactSupport &&= Boolean(seen[n * 100 + d]) === supported;
                if (supported) expectedCount++;
            }
            expect(exactSupport).toBe(true);
            expect(actualCount).toBe(expectedCount);
            if (divisorDigits === 2 && dividendDigits >= 2) expect(weightSum).toBeCloseTo(1, 10);
            else expect(weightSum).toBe(fullCount);
        });

    it('covers every original dividend interval and all931315 native pairs without shared result state', () => {
        let total = 0;
        for (const dividendDigits of [1, 2, 3, 4]) for (const divisorDigits of [1, 2]) {
            const minimum = 10 ** (dividendDigits - 1), maximum = 10 ** dividendDigits - 1;
            const partitions = nativeDivisionPartitions.filter(partition => partition.dividendDigits === dividendDigits && partition.divisorDigits === divisorDigits);
            expect(partitions.flatMap(({firstDividend, lastDividend}) => Array.from({length: lastDividend - firstDividend + 1}, (_, index) => firstDividend + index)))
                .toEqual(Array.from({length: maximum - minimum + 1}, (_, index) => minimum + index));
            for (let n = minimum; n <= maximum; n++) for (let d = divisorDigits === 1 ? 2 : 10; d <= (divisorDigits === 1 ? 9 : 99); d++) {
                const q = Math.floor(n / d), r = n % d;
                if (divisorDigits <= dividendDigits && q > 0 && (divisorDigits === 2
                    || r > 0 && ![n, q].some(value => String(value).includes('0')))) total++;
            }
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
