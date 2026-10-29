import {afterEach, describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {additionWidthPairs, sampleAdditionWidthPair} from './width-sampling.ts';

afterEach(() => vi.restoreAllMocks());

describe('within-20 operand-width sampling', () => {
    it('partitions every original positive addition without losing a problem', () => {
        const single = additionWidthPairs(1);
        const two = additionWidthPairs(2);
        expect(single).toHaveLength(81);
        expect(two).toHaveLength(109);
        const pairs = [...single, ...two];
        expect(new Set(pairs.map(pair => pair.operands.join(','))).size).toBe(190);
        for (const {operands: [a, b], weight} of pairs) {
            expect(a).toBeGreaterThan(0);
            expect(b).toBeGreaterThan(0);
            expect(a + b).toBeLessThanOrEqual(20);
            expect(weight).toBeCloseTo((1 / 19) * (1 / (20 - a)), 14);
        }
        expect(pairs.reduce((sum, pair) => sum + pair.weight, 0)).toBeCloseTo(1, 14);
        expect(single.reduce((sum, pair) => sum + pair.weight, 0)).toBeCloseTo(0.2931022436094136, 12);
    });

    it.each([1, 2] as const)('selects every %i-digit pair with its original conditional probability', digits => {
        const pairs = additionWidthPairs(digits);
        const total = pairs.reduce((sum, pair) => sum + pair.weight, 0);
        let cumulative = 0;
        const draw = vi.spyOn(rng, 'random');
        for (const pair of pairs) {
            draw.mockReturnValue((cumulative + pair.weight / 2) / total);
            expect(sampleAdditionWidthPair(digits)).toEqual(pair.operands);
            expect(Math.max(...pair.operands) < 10 ? 1 : 2).toBe(digits);
            cumulative += pair.weight;
        }
        expect(draw).toHaveBeenCalledTimes(pairs.length);
        draw.mockReturnValue(0);
        expect(sampleAdditionWidthPair(digits)).toEqual(pairs[0].operands);
        draw.mockReturnValue(1 - Number.EPSILON);
        expect(sampleAdditionWidthPair(digits)).toEqual(pairs.at(-1)!.operands);
    });
});
