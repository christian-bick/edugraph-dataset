import {afterEach, describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {operandWidthPairs, sampleOperandWidthPair} from './width-sampling.ts';

afterEach(() => vi.restoreAllMocks());

describe.each(['addition', 'subtraction'] as const)('within-20 %s operand-width sampling', operation => {
    it('partitions every original positive problem without losing one', () => {
        const single = operandWidthPairs(operation, 1);
        const two = operandWidthPairs(operation, 2);
        expect(single).toHaveLength(operation === 'addition' ? 81 : 36);
        expect(two).toHaveLength(operation === 'addition' ? 109 : 154);
        const pairs = [...single, ...two];
        expect(new Set(pairs.map(pair => pair.operands.join(','))).size).toBe(190);
        for (const {operands: [a, b], weight} of pairs) {
            expect(a).toBeGreaterThan(0);
            expect(b).toBeGreaterThan(0);
            expect(operation === 'addition' ? a + b : a).toBeLessThanOrEqual(20);
            if (operation === 'subtraction') expect(a - b).toBeGreaterThan(0);
            expect(weight).toBeCloseTo((1 / 19) * (1 / (20 - (operation === 'addition' ? a : b))), 14);
        }
        expect(pairs.reduce((sum, pair) => sum + pair.weight, 0)).toBeCloseTo(1, 14);
        expect(single.reduce((sum, pair) => sum + pair.weight, 0))
            .toBeCloseTo(operation === 'addition' ? 0.29310224 : 0.11544814, 7);
    });

    it.each([1, 2] as const)('selects every %i-digit pair with its original conditional probability', digits => {
        const pairs = operandWidthPairs(operation, digits);
        const total = pairs.reduce((sum, pair) => sum + pair.weight, 0);
        let cumulative = 0;
        const draw = vi.spyOn(rng, 'random');
        for (const pair of pairs) {
            draw.mockReturnValue((cumulative + pair.weight / 2) / total);
            expect(sampleOperandWidthPair(operation, digits)).toEqual(pair.operands);
            expect(Math.max(...pair.operands) < 10 ? 1 : 2).toBe(digits);
            cumulative += pair.weight;
        }
        expect(draw).toHaveBeenCalledTimes(pairs.length);
        draw.mockReturnValue(0);
        expect(sampleOperandWidthPair(operation, digits)).toEqual(pairs[0].operands);
        draw.mockReturnValue(1 - Number.EPSILON);
        expect(sampleOperandWidthPair(operation, digits)).toEqual(pairs.at(-1)!.operands);
    });
});
