import {describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange} from '../../lib/canonical-numeric-range.ts';
import {buildGenericUnitCountRelation, selectUnitScaleFrame, unitScaleDomain,
    unitScaleNativeDomain, unitScaleQuantities} from './unit-scale-domain.ts';

const counts = [[0, 10, 3], [0, 20, 1], [5, 10, 1], [5, 20, 3]] as const;
const factors = [[0, 10, 4], [0, 20, 4]] as const;

describe('generic unit-scale domains', () => {
    it('retains the original eight uniformly weighted count/factor frames', () => {
        const expected = [];
        for (const largeUnitCount of [3, 4, 5, 6]) for (const unitsPerLarge of [2, 3])
            expected.push({largeUnitCount, smallUnitCount: largeUnitCount * unitsPerLarge, unitsPerLarge});
        expect(unitScaleNativeDomain()).toEqual(expected);
        expect(unitScaleNativeDomain()).toBe(unitScaleNativeDomain());
    });

    it.each(['counts', 'factor'] as const)('partitions all eight native outcomes into exact %s cells', contract => {
        const cells = contract === 'counts' ? counts : factors;
        const all = cells.flatMap(([lower, upper, count]) => {
            const range = createCanonicalNumericRange(upper, lower), rows = unitScaleDomain(contract, range);
            expect(rows).toHaveLength(count);
            expect(rows).toEqual(unitScaleNativeDomain().filter(({largeUnitCount, smallUnitCount, unitsPerLarge}) => {
                const min = contract === 'factor' ? unitsPerLarge : largeUnitCount;
                return smallUnitCount <= upper && smallUnitCount > (upper === 10 ? 5 : 10)
                    && min >= lower && min < (lower === 0 ? 5 : 10);
            }));
            expect(unitScaleDomain(contract, range)).toBe(rows);
            return rows;
        });
        expect(all).toHaveLength(8);
        expect(new Set(all.map(row => JSON.stringify(row)))).toEqual(new Set(unitScaleNativeDomain().map(row => JSON.stringify(row))));
    });

    it('makes five large/ten small counts lower5 while its factor-bearing relation has no positive lower', () => {
        const frame = {largeUnitCount: 5, smallUnitCount: 10, unitsPerLarge: 2};
        expect(unitScaleQuantities(frame, 'counts')).toEqual([5, 10]);
        expect(unitScaleQuantities(frame, 'factor')).toEqual([5, 10, 2]);
        expect(unitScaleDomain('counts', createCanonicalNumericRange(10, 5))).toEqual([frame]);
        expect(unitScaleDomain('factor', createCanonicalNumericRange(10))).toContainEqual(frame);
        expect(buildGenericUnitCountRelation(frame)).toEqual({kind: 'generic-unit-count-relation', largeUnitCount: 5, smallUnitCount: 10});
    });

    it.each(['counts', 'factor'] as const)('samples every %s outcome with uniform conditional weight and exactly two draws', contract => {
        for (const [lower, upper] of contract === 'counts' ? counts : factors) {
            const rows = unitScaleDomain(contract, createCanonicalNumericRange(upper, lower));
            for (const expected of rows) {
                const qRows = rows.filter(row => row.largeUnitCount === expected.largeUnitCount);
                const before = rows.filter(row => row.largeUnitCount < expected.largeUnitCount).length;
                const factorIndex = qRows.findIndex(row => row.unitsPerLarge === expected.unitsPerLarge);
                const draws = [(before + qRows.length / 2) / rows.length, (factorIndex + 0.5) / qRows.length];
                const draw = vi.fn(() => draws.shift()!);
                expect(selectUnitScaleFrame(rows, draw)).toEqual(expected);
                expect(draw).toHaveBeenCalledTimes(2);
            }
        }
    });

    it('preserves the original unconditioned q-then-factor draw law at its boundaries', () => {
        for (const first of [0, 0.249999, 0.25, 0.5, 0.75, 1 - Number.EPSILON]) {
            for (const second of [0, 0.499999, 0.5, 1 - Number.EPSILON]) {
                const draws = [first, second], largeUnitCount = 3 + Math.floor(first * 4), unitsPerLarge = 2 + Math.floor(second * 2);
                expect(selectUnitScaleFrame(unitScaleNativeDomain(), () => draws.shift()!)).toEqual({largeUnitCount,
                    smallUnitCount: largeUnitCount * unitsPerLarge, unitsPerLarge});
            }
        }
    });

    it('rejects absent, incompatible and weak bounds and invalid first/second draws', () => {
        for (const range of [undefined, null, createCanonicalNumericRange(5), createCanonicalNumericRange(100),
            createCanonicalNumericRange(20, 10), {...createCanonicalNumericRange(10), maximumAbove: 0},
            {...createCanonicalNumericRange(10), minimumBelow: 10}])
            expect(() => unitScaleDomain('counts', range as never)).toThrow();
        expect(() => unitScaleDomain('factor', createCanonicalNumericRange(10, 5))).toThrow();
        expect(() => unitScaleQuantities(unitScaleNativeDomain()[0]!, 'unknown' as never)).toThrow();
        expect(() => unitScaleDomain('unknown' as never, createCanonicalNumericRange(10))).toThrow();
        expect(() => selectUnitScaleFrame([], () => 0)).toThrow();
        for (const invalid of [NaN, Infinity, -0.1, 1]) {
            expect(() => selectUnitScaleFrame(unitScaleNativeDomain(), () => invalid)).toThrow();
            const draws = [0, invalid];
            expect(() => selectUnitScaleFrame(unitScaleNativeDomain(), () => draws.shift()!)).toThrow();
        }
    });
});
