import {Scope} from 'edugraph-ts';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import * as rng from '../../../lib/random.ts';
import {expandedNumbers, expandedQuantities, expandedRangeBounds, hasExpandedCardinalityDomain, sparseExpandedNumbers} from './domain.ts';
import {PlaceValueExpandedGenerator} from './generator.ts';

afterEach(() => vi.restoreAllMocks());

// Independent decimal expansion and ontology thresholds, without the production
// place-value or canonical-witness helpers. Each integer is one original ticket.
const thresholds = [5, 10, 20, 100, 120, 1000, 10000, 100000, 1000000];
const termsOf = (number: number) => [...String(number)].map((digit, index, digits) =>
    Number(digit) * 10 ** (digits.length - index - 1)).filter(Boolean);
const groups = new Map<string, number[]>();
for (let number = 100; number < 1000000; number++) {
    const nonzeroDigits = String(number).replaceAll('0', '').length;
    if (nonzeroDigits !== 2 && nonzeroDigits !== 3) continue;
    const terms = termsOf(number), minimum = Math.min(...terms);
    const upper = thresholds.find(bound => number <= bound)!;
    const lower = thresholds.filter(bound => minimum >= bound).at(-1) ?? 0;
    const key = [upper, lower, terms.length].join(':');
    const rows = groups.get(key) ?? [];
    rows.push(number);
    groups.set(key, rows);
}
const cells = [...groups].map(([key, rows]) => {
    const [upper, lower, cardinality] = key.split(':').map(Number);
    return {upper: upper!, lower: lower!, cardinality: cardinality!, rows};
});

describe('integer expanded-form canonical domains', () => {
    it('partitions all15714 original numbers into50 nonempty cells using the requested sum rather than passive digits', () => {
        const advertised = expandedRangeBounds.flatMap(([upper, lower]) => [2, 3]
            .filter(cardinality => hasExpandedCardinalityDomain(upper, lower, cardinality))
            .map(cardinality => [upper, lower, cardinality].join(':')));
        expect(advertised.sort()).toEqual([...groups.keys()].sort());
        expect(cells).toHaveLength(50);
        expect(cells.filter(cell => cell.upper <= 1000)).toHaveLength(12);
        for (const upper of [10000, 100000, 1000000]) {
            expect(cells.filter(cell => cell.upper === upper)).toHaveLength(upper === 10000 ? 10 : upper === 100000 ? 13 : 15);
        }
        const seen = new Set<number>();
        let legacy = 0, large = 0;
        for (const {upper, lower, cardinality, rows} of cells) {
            const actual = expandedNumbers(createCanonicalNumericRange(upper, lower), cardinality);
            expect(actual).toEqual(rows);
            // A cached domain retains exactly the same ordered ticket array.
            expect(expandedNumbers(createCanonicalNumericRange(upper, lower), cardinality)).toBe(actual);
            for (const number of actual) {
                expect(seen.has(number)).toBe(false);
                seen.add(number);
                if (number < 1000) legacy++; else large++;
            }
        }
        expect([seen.size, legacy, large]).toEqual([15714, 891, 14823]);
        for (const cardinality of [2, 3]) {
            expect(sparseExpandedNumbers(cardinality)).toEqual([...seen]
                .filter(number => termsOf(number).length === cardinality).sort((a, b) => a - b));
        }
    });

    it.each(cells)('preserves one uniform draw for every native $cardinality-term outcome in $lower..$upper', ({upper, lower, cardinality, rows}) => {
        const draw = vi.spyOn(rng, 'random'), generator = new PlaceValueExpandedGenerator();
        const config = {range: createCanonicalNumericRange(upper, lower),
            operandCardinality: cardinality === 2 ? Scope.TwoOperands : Scope.ThreeOperands};
        for (let index = 0; index < rows.length; index++) {
            draw.mockClear().mockReturnValue((index + 0.5) / rows.length);
            const data = generator.generate(config).data;
            expect(data.number).toBe(rows[index]);
            expect(data.terms).toEqual(termsOf(data.number));
            expect(expandedQuantities(data.number)).toEqual([data.number, ...termsOf(data.number)]);
            if ('task' in data) {
                expect(data.task).toBe('multi-digit-expanded-form');
                expect(data.number).toBeGreaterThan(1000);
                expect(data.placeValues.some(place => place.digit === 0)).toBe(true);
            } else expect(data.number).toBeLessThan(1000);
            expect(draw).toHaveBeenCalledTimes(1);
        }
        for (const edge of [0, (2 ** 32 - 1) / 2 ** 32]) {
            draw.mockClear().mockReturnValue(edge);
            expect(generator.generate(config).data.number).toBe(edge === 0 ? rows[0] : rows.at(-1));
            expect(draw).toHaveBeenCalledTimes(1);
        }
    });

    it.each([
        [101, [101, 100, 1]],
        [3100, [3100, 3000, 100]],
        [7200, [7200, 7000, 200]],
        [1110, [1110, 1000, 100, 10]],
        [999000, [999000, 900000, 90000, 9000]]
    ] as const)('uses separately assessed sum terms for %s, without zero or digit-glyph witnesses', (number, quantities) => {
        expect(expandedQuantities(number)).toEqual(quantities);
    });

    it('rejects unauthored cardinalities, incomplete bounds and infeasible lower/term combinations before randomness', () => {
        const draw = vi.spyOn(rng, 'random');
        for (const range of [undefined, createCanonicalNumericRange(100), createCanonicalNumericRange(10000, 1000),
            {...createCanonicalNumericRange(1000), maximumAbove: 0}, {...createCanonicalNumericRange(1000), minimumBelow: 10}])
            expect(() => expandedNumbers(range as never, 2)).toThrow();
        expect(() => expandedNumbers(createCanonicalNumericRange(120), 1)).toThrow();
        for (const [upper, lower] of [[120, 10], [1000, 20], [10000, 100], [100000, 1000], [1000000, 10000]]) {
            expect(hasExpandedCardinalityDomain(upper!, lower!, 3)).toBe(false);
            expect(() => expandedNumbers(createCanonicalNumericRange(upper!, lower!), 3)).toThrow();
        }
        expect(draw).not.toHaveBeenCalled();
    });
});
