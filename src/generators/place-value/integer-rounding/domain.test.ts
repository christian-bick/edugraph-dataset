import {describe, expect, it} from 'vitest';
import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {CANONICAL_RANGE_THRESHOLDS, createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {buildIntegerRoundingProblem, integerRoundingQuantities, roundingDomain, roundingFrame} from './domain.ts';

describe('rounding endpoint and distance canonical intervals', () => {
    it('exactly partitions every original interval/offset and preserves native midpoint probability', () => {
        let fullCount = 0;
        for (const place of [10, 100, 1000, 10000, 100000]) for (const multiDigit of [false, true]) {
            if (!multiDigit && place > 100) continue;
            for (const zero of [false, true]) {
                const expected = new Map<string, number>();
                const first = zero ? 0 : Math.max(1, multiDigit ? Math.floor(1000 / place) : 0);
                const last = zero ? 0 : multiDigit ? Math.floor(999999 / place) : Math.floor((1000 - place - 1) / place);
                let originalCount = 0;
                for (let index = first; index <= last; index++) for (let offset = 1; offset < place; offset++) {
                    const number = index * place + offset;
                    if (multiDigit && (number < 1000 || offset !== place / 2 && Math.abs(offset - place / 2) < Math.ceil(place * 0.05))) continue;
                    const minimum = index === 0 ? 0 : Math.min(offset, place - offset);
                    const maximum = (index + 1) * place;
                    const upper = CANONICAL_RANGE_THRESHOLDS.find(bound => maximum <= bound)!;
                    const lower = [10000, 1000, 120, 100, 20, 10, 5, 0].find(bound => minimum >= bound)!;
                    const key = `${lower}:${upper}`;
                    expected.set(key, (expected.get(key) ?? 0) + 1); originalCount++;
                }
                let actualCount = 0, mass = 0, tieMass = 0;
                for (const {range} of canonicalRangeProfiles) {
                    const domain = roundingDomain(place, zero, range);
                    if (domain.multiDigit !== multiDigit) continue;
                    expect(domain.count).toBe(expected.get(`${range.min}:${range.max}`) ?? 0);
                    for (const row of domain.rows) {
                        const count = (row.lastIndex - row.firstIndex + 1) * (row.lastOffset - row.firstOffset + 1);
                        for (const index of [row.firstIndex, row.lastIndex]) for (const offset of [row.firstOffset, row.lastOffset]) {
                            const data = buildIntegerRoundingProblem(index * place + offset, place, multiDigit);
                            expect(hasCanonicalRangeWitness(integerRoundingQuantities(data), range)).toBe(true);
                            expect(data.lowerMultiple === 0).toBe(zero);
                        }
                        if (row.firstOffset === place / 2 && row.lastOffset === place / 2) tieMass += count * row.pointWeight;
                    }
                    actualCount += domain.count; mass += domain.weight;
                }
                expect(actualCount).toBe(originalCount);
                if (originalCount) {
                    expect(mass).toBeCloseTo(1, 12);
                    if (multiDigit) expect(tieMass).toBeCloseTo(0.2, 12);
                }
                fullCount += originalCount;
            }
        }
        expect(fullCount).toBe(4508183);
    }, 60000);

    it('draws every weighted-row boundary without changing its endpoint/distance calculation', () => {
        for (const place of [10, 100, 1000, 10000, 100000]) for (const zero of [false, true]) {
            for (const {range} of canonicalRangeProfiles) {
                const domain = roundingDomain(place, zero, range);
                let previous = 0;
                for (const row of domain.rows) {
                    for (const position of [previous + row.pointWeight / 2, row.end - row.pointWeight / 2]) {
                        const data = roundingFrame(domain, position);
                        expect(hasCanonicalRangeWitness(integerRoundingQuantities(data), range)).toBe(true);
                        expect(data.roundedValue).toBe(Math.round(data.number / place) * place);
                        expect(data.lowerMultiple === 0).toBe(zero);
                    }
                    previous = row.end;
                }
            }
        }
    });

    it('retains the original concrete precision and inclusive million-boundary witnesses', () => {
        expect(buildIntegerRoundingProblem(851, 100, false)).toMatchObject({lowerMultiple: 800,
            upperMultiple: 900, midpoint: 850, roundedValue: 900, distanceLower: 51, distanceUpper: 49});
        expect(buildIntegerRoundingProblem(1500, 1000, true)).toMatchObject({number: 1500,
            lowerMultiple: 1000, midpoint: 1500, upperMultiple: 2000, roundedValue: 2000, isMidpointTie: true});
        expect(buildIntegerRoundingProblem(123456, 100000, true)).toMatchObject({distanceLower: 23456, distanceUpper: 76544});
        expect(buildIntegerRoundingProblem(1000, 100000, true)).toMatchObject({lowerMultiple: 0, upperMultiple: 100000, roundedValue: 0});
        expect(buildIntegerRoundingProblem(999999, 100000, true)).toMatchObject({upperMultiple: 1000000, roundedValue: 1000000});
        const domain = roundingDomain(100, false, createCanonicalNumericRange(1000, 20));
        for (const position of [-1, NaN, domain.weight]) expect(() => roundingFrame(domain, position)).toThrow();
        for (const [number, place, multiDigit] of [[0, 100, false], [1000, 1000, true], [99, 1000, false], [999, 100, true]] as const) {
            expect(() => buildIntegerRoundingProblem(number, place, multiDigit)).toThrow();
        }
        expect(() => roundingDomain(3, true, createCanonicalNumericRange(100))).toThrow();
        expect(() => roundingDomain(10, true, {...createCanonicalNumericRange(100), minimumBelow: 10})).toThrow();
    });
});
