import {describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange} from '../../lib/canonical-numeric-range.ts';
import {buildFractionScaleComparison, buildFractionScaleRelation, fractionScaleDomain,
    fractionScaleNativeDomain, fractionScaleProfiles, fractionScaleQuantities, fractionScaleUpperBounds,
    selectFractionScaleFrame, type FractionScaleContract} from './fraction-scale-domain.ts';

const contracts = ['comparison', 'analogy'] as const;
const counts = {comparison: {greater: [16, 40, 4], less: [40, 20], equal: [16, 4]},
    analogy: {greater: [4, 52, 4], less: [10, 50], equal: [4, 16]}};
const weights = {comparison: {greater: [560, 592, 48], less: [960, 240], equal: [960, 240]},
    analogy: {greater: [140, 1012, 48], less: [240, 960], equal: [240, 960]}};

describe('fraction scale native and canonical domains', () => {
    it.each(fractionScaleProfiles)('retains every original %s outcome and its exact nested-draw weight', profile => {
        const expected = [];
        for (let q = 2; q <= 5; q++) for (let b = 2; b <= 6; b++) {
            for (let a = profile === 'greater' ? b + 1 : profile === 'less' ? 1 : b;
                a <= (profile === 'greater' ? 2 * b - 1 : profile === 'less' ? b - 1 : b); a++)
                expected.push({q, a, b, weight: profile === 'equal' ? 60 : 60 / (b - 1)});
        }
        expect(fractionScaleNativeDomain(profile)).toEqual(expected);
        expect(expected).toHaveLength(profile === 'equal' ? 20 : 60);
        expect(expected.reduce((sum, row) => sum + row.weight, 0)).toBe(1200);
        expect(fractionScaleNativeDomain(profile)).toBe(fractionScaleNativeDomain(profile));
    });

    it.each(contracts)('partitions every %s native profile into its exact part-count bands', contract => {
        for (const profile of fractionScaleProfiles) {
            const native = fractionScaleNativeDomain(profile);
            const all = fractionScaleUpperBounds(profile).flatMap((upper, index) => {
                const range = createCanonicalNumericRange(upper);
                const rows = fractionScaleDomain(contract, profile, range);
                expect(rows).toHaveLength(counts[contract][profile][index]!);
                expect(rows.reduce((sum, row) => sum + row.weight, 0)).toBe(weights[contract][profile][index]!);
                expect(rows).toEqual(native.filter(({q, a, b}) => {
                    const max = Math.max(q, a, b, contract === 'analogy' ? 2 * q : 1);
                    return max <= upper && max > (upper === 5 ? -1 : upper === 10 ? 5 : 10);
                }));
                expect(fractionScaleDomain(contract, profile, range)).toBe(rows);
                return rows;
            });
            expect(new Set(all.map(row => JSON.stringify(row)))).toEqual(new Set(native.map(row => JSON.stringify(row))));
        }
    });

    it('counts meaningful parts and the analogy while excluding unused product and difference', () => {
        const frame = {q: 5, a: 3, b: 2};
        expect(fractionScaleQuantities(frame, 'comparison')).toEqual([
            {numerator: 5, denominator: 1}, {numerator: 3, denominator: 2},
            {numerator: 5, denominator: 2}, {numerator: 3, denominator: 1},
            {numerator: 2, denominator: 1}, {numerator: 1, denominator: 1}
        ]);
        expect(fractionScaleDomain('comparison', 'greater', createCanonicalNumericRange(5))).toContainEqual({...frame, weight: 60});
        expect(fractionScaleDomain('analogy', 'greater', createCanonicalNumericRange(10))).toContainEqual({...frame, weight: 60});
        const relation = buildFractionScaleRelation(frame, 'greater');
        expect(relation.product).toEqual({numerator: 15, denominator: 2});
        expect(relation).not.toHaveProperty('wholeNumberAnalogy');
        expect(buildFractionScaleComparison(frame, 'greater')).toEqual({...relation, kind: 'fraction-scale-comparison',
            wholeNumberAnalogy: {factor: 2, product: {numerator: 10, denominator: 1}}});
    });

    it.each(contracts)('reaches every %s outcome with exact conditional q, b and a weights', contract => {
        for (const profile of fractionScaleProfiles) for (const upper of fractionScaleUpperBounds(profile)) {
            const rows = fractionScaleDomain(contract, profile, createCanonicalNumericRange(upper));
            const total = rows.reduce((sum, row) => sum + row.weight, 0);
            for (const expected of rows) {
                const qRows = rows.filter(row => row.q === expected.q);
                const qbRows = qRows.filter(row => row.b === expected.b);
                const qMass = qRows.reduce((sum, row) => sum + row.weight, 0);
                const qbMass = qbRows.reduce((sum, row) => sum + row.weight, 0);
                const draws = [
                    (rows.filter(row => row.q < expected.q).reduce((sum, row) => sum + row.weight, 0) + qMass / 2) / total,
                    (qRows.filter(row => row.b < expected.b).reduce((sum, row) => sum + row.weight, 0) + qbMass / 2) / qMass,
                    (qbRows.filter(row => row.a < expected.a).reduce((sum, row) => sum + row.weight, 0) + expected.weight / 2) / qbMass
                ];
                const draw = vi.fn(() => draws.shift()!);
                expect(selectFractionScaleFrame(rows, profile, draw)).toEqual({q: expected.q, a: expected.a, b: expected.b});
                expect(draw).toHaveBeenCalledTimes(profile === 'equal' ? 2 : 3);
            }
        }
    });

    it('rejects absent, weak, incompatible and unsupported bounds and invalid draws', () => {
        for (const range of [undefined, null, createCanonicalNumericRange(100), createCanonicalNumericRange(10, 5),
            {...createCanonicalNumericRange(5), maximumAbove: 0}, {...createCanonicalNumericRange(5), minimumBelow: 10}])
            expect(() => fractionScaleDomain('comparison', 'less', range as never)).toThrow();
        expect(() => fractionScaleDomain('comparison', 'less', createCanonicalNumericRange(20))).toThrow();
        expect(() => fractionScaleNativeDomain('unknown' as never)).toThrow();
        expect(() => fractionScaleQuantities({q: 2, a: 3, b: 2}, 'unknown' as FractionScaleContract)).toThrow();
        const rows = fractionScaleNativeDomain('equal');
        for (const value of [NaN, Infinity, -0.1, 1])
            expect(() => selectFractionScaleFrame(rows, 'equal', () => value)).toThrow();
        expect(() => selectFractionScaleFrame([], 'equal', () => 0)).toThrow();
        expect(() => selectFractionScaleFrame([{q: 2, a: 2, b: 2, weight: 0}], 'equal', () => 0)).toThrow();
    });
});
