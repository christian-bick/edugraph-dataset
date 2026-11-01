import {describe, expect, it} from 'vitest';
import {canonicalRangeProfiles} from '../../lib/canonical-range-labels.ts';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../lib/canonical-numeric-range.ts';
import {setSeed} from '../../lib/random.ts';
import {canSampleCanonicalTriple, sampleCanonicalTriple, type CanonicalTripleConfig} from './canonical-triple-sampling.ts';

const base: CanonicalTripleConfig = {operation: 'addition', range: createCanonicalNumericRange(20), requireZero: false,
    requireMultipleOf10: false, requireTwoDigitOperands: false, useCommutativeLaw: false, useAssociativeLaw: false, useDistributiveLaw: false};

describe('canonical triple sampling', () => {
    it('constructs every admitted range, operation, zero and law profile', () => {
        let admitted = 0;
        for (const {range} of canonicalRangeProfiles) for (const operation of ['addition', 'subtraction', 'multiplication', 'division'] as const)
            for (const requireZero of [false, true]) for (const requireMultipleOf10 of [false, true])
                for (const law of ['none', 'commutative', 'associative', 'distributive']) {
                    const config = {...base, range, operation, requireZero, requireMultipleOf10,
                        useCommutativeLaw: law === 'commutative', useAssociativeLaw: law === 'associative', useDistributiveLaw: law === 'distributive'};
                    if (!canSampleCanonicalTriple(config)) {expect(sampleCanonicalTriple(config)).toBeNull(); continue;}
                    admitted++;
                    for (const seed of [0, 5, 77]) {
                        setSeed(seed);
                        const data = sampleCanonicalTriple(config)!;
                        const values = [data.num1, data.num2, data.num3, data.answer,
                            ...(data.combinedFactor === undefined ? [] : [data.combinedFactor, ...data.partialProducts!])];
                        if (operation === 'multiplication' && config.useAssociativeLaw)
                            values.push(data.num1 * data.num2, data.num1 * data.num3, data.num2 * data.num3);
                        expect(hasCanonicalRangeWitness(values, range)).toBe(true);
                        expect(values.every(value => Number.isSafeInteger(value) && value >= 0)).toBe(true);
                        expect(values.includes(0)).toBe(requireZero);
                        if (operation === 'addition') expect(data.num1 + data.num2 + data.num3).toBe(data.answer);
                        if (operation === 'subtraction') expect(data.num1 - data.num2 - data.num3).toBe(data.answer);
                        if (operation === 'multiplication') expect(data.num1 * (config.useDistributiveLaw ? data.num2 + data.num3 : data.num2 * data.num3)).toBe(data.answer);
                        if (operation === 'division') expect(data.num1 / data.num2 / data.num3).toBe(data.answer);
                        if (config.useCommutativeLaw) {expect(data.num1).not.toBe(data.num2); expect(data.num1).not.toBe(data.num3);}
                    }
                }
        expect(admitted).toBeGreaterThan(100);
    });
    it('constructs all six two-digit triple cells and rejects two-digit sums below30', () => {
        for (const lower of [10, 20]) for (const upper of [100, 120, 1000]) for (let seed = 0; seed < 20; seed++) {
            const config = {...base, range: createCanonicalNumericRange(upper, lower), requireTwoDigitOperands: true};
            setSeed(seed);
            const data = sampleCanonicalTriple(config)!;
            expect([data.num1, data.num2, data.num3].every(value => value >= 10 && value <= 99)).toBe(true);
            expect(hasCanonicalRangeWitness([data.num1, data.num2, data.num3, data.answer], config.range)).toBe(true);
        }
        expect(canSampleCanonicalTriple({...base, requireTwoDigitOperands: true, range: createCanonicalNumericRange(20, 10)})).toBe(false);
    });
    it('rejects unknown operations, malformed bounds and incompatible law combinations', () => {
        for (const patch of [{operation: 'unknown'}, {range: {...base.range, max: NaN}},
            {useCommutativeLaw: true, useAssociativeLaw: true}, {operation: 'division', requireTwoDigitOperands: true}]) {
            const config = {...base, ...patch} as CanonicalTripleConfig;
            expect(canSampleCanonicalTriple(config)).toBe(false);
            expect(sampleCanonicalTriple(config)).toBeNull();
        }
    });
    it('counts the required associative product, but never a hidden commutative product, as an upper witness', () => {
        let sawAssociativeSix = false;
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const associative = sampleCanonicalTriple({...base, operation: 'multiplication', requireZero: true,
                range: createCanonicalNumericRange(10), useAssociativeLaw: true})!;
            if (associative.num2 === 2 && associative.num3 === 3) sawAssociativeSix = true;
            expect(hasCanonicalRangeWitness([associative.num1, associative.num2, associative.num3, associative.answer,
                associative.num2 * associative.num3], createCanonicalNumericRange(10))).toBe(true);
            setSeed(seed);
            const commutative = sampleCanonicalTriple({...base, operation: 'multiplication', requireZero: true,
                range: createCanonicalNumericRange(10), useCommutativeLaw: true})!;
            expect(Math.max(commutative.num1, commutative.num2, commutative.num3, commutative.answer)).toBeGreaterThan(5);
            expect(commutative.num2 * commutative.num3).toBeLessThanOrEqual(10);
        }
        expect(sawAssociativeSix).toBe(true);
    });
});
