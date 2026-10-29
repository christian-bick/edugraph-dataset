import {afterEach, describe, expect, it, vi} from 'vitest';
import * as random from '../../lib/random.ts';
import {sampleDecimalWriting} from './decimal-writing-values.ts';

afterEach(() => vi.restoreAllMocks());

describe('shared exact decimal source sampler', () => {
    it.each([
        [[0.55, 0.06, 0.5], '5.5', 5500],
        [[0.55, 0.18, 0.25, 0.5], '5.05', 5050],
        [[0.55, 0.18, 0.75, 0.25, 0.5], '5.25', 5250],
        [[0.55, 0.62, 0.125, 0.5], '5.005', 5005],
        [[0.55, 0.62, 0.375, 0.5, 0.5], '5.505', 5505],
        [[0.55, 0.62, 0.625, 0.5, 0.5], '5.055', 5055],
        [[0.55, 0.62, 0.875, 0.5, 0.5, 0.5], '5.555', 5555]
    ] as const)('retains the original draw order for %s', (draws, numeral, value) => {
        const queue = [...draws];
        const spy = vi.spyOn(random, 'random').mockImplementation(() => {
            const next = queue.shift();
            if (next === undefined) throw new Error('Unexpected sampler draw');
            return next;
        });
        const data = sampleDecimalWriting();
        expect(data.canonicalNumeral).toBe(numeral);
        expect(data.valueInThousandths).toBe(value);
        expect(data.fractionalPart.numerator / data.fractionalPart.denominator + data.wholePart)
            .toBeCloseTo(value / 1000, 12);
        expect(spy).toHaveBeenCalledTimes(draws.length);
        expect(queue).toEqual([]);
    });
});
