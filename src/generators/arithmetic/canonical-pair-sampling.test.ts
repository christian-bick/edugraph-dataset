import {describe, expect, it} from 'vitest';
import {canonicalRangeProfiles} from '../../lib/canonical-range-labels.ts';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../lib/canonical-numeric-range.ts';
import {setSeed} from '../../lib/random.ts';
import {canSampleCanonicalPair, canonicalOperandWidth, sampleCanonicalPair, type CanonicalPairConfig} from './canonical-pair-sampling.ts';

const base: CanonicalPairConfig = {operation: 'addition', range: createCanonicalNumericRange(20), largestOperandDigits: 1,
    requireNegative: false, requireZero: false, requireMultipleOf10: false, requireEqualAddends: false, requireEvenResult: false};

describe('canonical pair sampling', () => {
    it('constructs every admitted range/operation/width/sign/zero profile without retries', () => {
        let admitted = 0;
        for (const {range} of canonicalRangeProfiles) for (const operation of ['addition', 'subtraction', 'multiplication', 'division'] as const)
            for (const largestOperandDigits of [1, 2, 3, 4, 'multiple'] as const)
                for (const requireNegative of [false, true]) for (const requireZero of [false, true])
                    for (const requireMultipleOf10 of [false, true]) for (const requireEvenResult of [false, true]) {
                        const config = {...base, range, operation, largestOperandDigits, requireNegative, requireZero, requireMultipleOf10, requireEvenResult};
                        if (!canSampleCanonicalPair(config)) {expect(sampleCanonicalPair(config)).toBeNull(); continue;}
                        admitted++;
                        for (const seed of [0, 1, 77]) {
                            setSeed(seed);
                            const data = sampleCanonicalPair(config)!;
                            const values = [data.num1, data.num2, data.answer];
                            expect(values.every(Number.isSafeInteger)).toBe(true);
                            expect(hasCanonicalRangeWitness(values, range)).toBe(true);
                            expect(values.some(value => value < 0)).toBe(requireNegative);
                            expect(values.includes(0)).toBe(requireZero);
                            const width = canonicalOperandWidth(largestOperandDigits);
                            expect(Math.max(Math.abs(data.num1), Math.abs(data.num2))).toBeGreaterThanOrEqual(width[0]);
                            expect(Math.max(Math.abs(data.num1), Math.abs(data.num2))).toBeLessThanOrEqual(width[1]);
                            if (requireEvenResult) expect(Math.abs(data.answer % 2)).toBe(0);
                            if (operation === 'addition') expect(data.num1 + data.num2).toBe(data.answer);
                            if (operation === 'subtraction') expect(data.num1 - data.num2).toBe(data.answer);
                            if (operation === 'multiplication') expect(data.num1 * data.num2).toBeCloseTo(data.answer);
                            if (operation === 'division') {expect(data.num2).not.toBe(0); expect(data.num1 / data.num2).toBeCloseTo(data.answer);}
                        }
                    }
        expect(admitted).toBeGreaterThan(500);
    });

    it('constructs all six correlated two-digit addend cells and rejects the empty lower10/upper1000 cell', () => {
        for (const [lower, uppers] of [[10, [20, 100, 120]], [20, [100, 120, 1000]]] as const) {
            for (const upper of uppers) for (let seed = 0; seed < 30; seed++) {
                setSeed(seed);
                const config = {...base, range: createCanonicalNumericRange(upper, lower), largestOperandDigits: 2 as const};
                const data = sampleCanonicalPair(config)!;
                expect([data.num1, data.num2].every(value => value >= 10 && value <= 99)).toBe(true);
                expect(hasCanonicalRangeWitness([data.num1, data.num2, data.answer], config.range)).toBe(true);
            }
        }
        expect(canSampleCanonicalPair({...base, largestOperandDigits: 2, range: createCanonicalNumericRange(1000, 10)})).toBe(false);
    });

    it('samples equal addends only from feasible bands without an imposed width balance', () => {
        for (const {range} of canonicalRangeProfiles) for (const largestOperandDigits of [1, 2, 3, 4, 'multiple'] as const) {
            const config = {...base, range, largestOperandDigits, requireEqualAddends: true, requireEvenResult: true};
            const data = sampleCanonicalPair(config);
            if (!canSampleCanonicalPair(config)) {expect(data).toBeNull(); continue;}
            expect(data!.num1).toBe(data!.num2);
            expect(hasCanonicalRangeWitness([data!.num1, data!.num2, data!.answer], range)).toBe(true);
        }
    });
    it('preserves the single-digit times whole-tens source domain and even subtraction roles', () => {
        for (let seed = 0; seed < 80; seed++) {
            setSeed(seed);
            const config = {...base, operation: 'multiplication' as const, range: createCanonicalNumericRange(1000),
                largestOperandDigits: 2 as const, requireMultipleOf10: true};
            const data = sampleCanonicalPair(config)!;
            expect(Math.min(data.num1, data.num2)).toBeLessThanOrEqual(9);
            expect(Math.max(data.num1, data.num2) % 10).toBe(0);
            expect(data.answer).toBeGreaterThan(120);
        }
        const results = Array.from({length: 200}, (_, seed) => {
            setSeed(seed);
            return sampleCanonicalPair({...base, operation: 'subtraction', range: createCanonicalNumericRange(100),
                largestOperandDigits: 2, requireEvenResult: true})!;
        });
        expect(results.some(data => data.answer === 2 && data.num1 % 2 === 1 && data.num2 > 10)).toBe(true);
    });
    it('retains both division factor roles and applies evenness to the selected quotient', () => {
        for (const requireEvenResult of [false, true]) {
            const samples = Array.from({length: 200}, (_, seed) => {
                setSeed(seed);
                return sampleCanonicalPair({...base, operation: 'division', range: createCanonicalNumericRange(10), requireEvenResult})!;
            });
            expect(samples.some(data => data.num1 === 6 && data.num2 === 3 && data.answer === 2)).toBe(true);
            if (!requireEvenResult) expect(samples.some(data => data.num1 === 6 && data.num2 === 2 && data.answer === 3)).toBe(true);
            else expect(samples.every(data => data.answer % 2 === 0)).toBe(true);
        }
    });
    it('does not fix the negative multiplication sign to the smaller factor', () => {
        const samples = Array.from({length: 200}, (_, seed) => {
            setSeed(seed);
            return sampleCanonicalPair({...base, operation: 'multiplication', range: createCanonicalNumericRange(10), requireNegative: true})!;
        });
        expect(samples.some(data => [data.num1, data.num2].includes(-3) && [data.num1, data.num2].includes(2))).toBe(true);
        expect(samples.some(data => [data.num1, data.num2].includes(-2) && [data.num1, data.num2].includes(3))).toBe(true);
    });
    it('rejects malformed profiles and contradictory equal-addend claims before sampling', () => {
        for (const patch of [{operation: 'unknown'}, {largestOperandDigits: 0},
            {range: {...base.range, maximumAbove: NaN}}, {range: {...base.range, min: base.range.max}},
            {requireEqualAddends: true, requireNegative: true}, {requireEqualAddends: true, requireZero: true}]) {
            const config = {...base, ...patch} as CanonicalPairConfig;
            expect(canSampleCanonicalPair(config)).toBe(false);
            expect(sampleCanonicalPair(config)).toBeNull();
        }
    });
});
