import {describe, expect, it} from 'vitest';
import {canonicalRangeProfiles} from '../../lib/canonical-range-labels.ts';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../lib/canonical-numeric-range.ts';
import {setSeed} from '../../lib/random.ts';
import {canSampleCanonicalSum, sampleCanonicalSum} from './canonical-sum-sampling.ts';

describe('canonical bounded sum construction', () => {
    it('admits exactly six four-addend source cells and constructs every selected witness', () => {
        const admitted: string[] = [];
        for (const {range} of canonicalRangeProfiles) {
            const domain = {count: 4, range, minimumOperand: 10, maximumOperand: 99, step: 1};
            if (!canSampleCanonicalSum(domain)) {expect(sampleCanonicalSum(domain)).toBeNull(); continue;}
            admitted.push(`${range.min}/${range.max}`);
            for (let seed = 0; seed < 20; seed++) {
                setSeed(seed);
                const operands = sampleCanonicalSum(domain)!;
                expect(operands).toHaveLength(4);
                expect(operands.every(value => value >= 10 && value <= 99)).toBe(true);
                expect(hasCanonicalRangeWitness([...operands, operands.reduce((sum, value) => sum + value, 0)], range)).toBe(true);
            }
        }
        expect(admitted.sort()).toEqual(['10/100', '10/120', '10/1000', '20/100', '20/120', '20/1000'].sort());
    });
    it('rejects malformed or impossible configurations without drawing', () => {
        const base = {count: 3, range: createCanonicalNumericRange(20), minimumOperand: 1, maximumOperand: 20, step: 1};
        for (const patch of [{count: 0}, {count: 1.5}, {count: 1, distinctOperands: true}, {step: 0}, {minimumOperand: 50}, {maximumOperand: NaN}])
            expect(canSampleCanonicalSum({...base, ...patch})).toBe(false);
    });
    it('constructs distinct interior compositions without changing their canonical total or bounds', () => {
        const domain = {count: 3, range: createCanonicalNumericRange(10), minimumOperand: 2,
            maximumOperand: 4, step: 1, distinctOperands: true};
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const values = sampleCanonicalSum(domain)!;
            expect(new Set(values).size).toBeGreaterThan(1);
            expect(values.every(value => value >= 2 && value <= 4)).toBe(true);
            expect(hasCanonicalRangeWitness([...values, values.reduce((sum, value) => sum + value, 0)], domain.range)).toBe(true);
        }
    });
});
