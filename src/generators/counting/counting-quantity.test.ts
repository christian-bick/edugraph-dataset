import {describe, expect, it, vi} from 'vitest';
import {sampleCountingQuantity} from './counting-quantity.ts';

describe('sampleCountingQuantity', () => {
    it.each([
        [{min: 0, max: 5}, 'any', [1, 2, 3, 4, 5]],
        [{min: 3, max: 9}, 'even', [4, 6, 8]],
        [{min: 2, max: 8}, 'odd', [3, 5, 7]]
    ] as const)('samples every admissible quantity once across equal entropy intervals: %j / %s', (range, parity, values) => {
        for (let index = 0; index < values.length; index++) {
            const draw = vi.fn(() => (index + 0.5) / values.length);
            const data = sampleCountingQuantity(range, parity, draw)!;
            expect(data.numObjects).toBe(values[index]);
            expect(data.simpleAnswer).toBe(values[index]);
            if (parity === 'any') expect(data).not.toHaveProperty('parity');
            else expect(data.parity).toBe(parity);
            expect(draw).toHaveBeenCalledTimes(1);
        }
    });

    it('includes both endpoints and clamps nonpositive minimums to one', () => {
        expect(sampleCountingQuantity({min: -5, max: 5}, 'any', () => 0)?.numObjects).toBe(1);
        expect(sampleCountingQuantity({min: -5, max: 5}, 'any', () => 0.999)?.numObjects).toBe(5);
    });

    it('retains a single draw for singleton domains', () => {
        const draw = vi.fn(() => 0.7);
        expect(sampleCountingQuantity({min: 5, max: 5}, 'odd', draw))
            .toEqual({numObjects: 5, simpleAnswer: 5, parity: 'odd'});
        expect(draw).toHaveBeenCalledTimes(1);
    });

    it('returns null without consuming entropy when no eligible positive quantity exists', () => {
        const draw = vi.fn(() => 0.5);
        expect(sampleCountingQuantity({min: 10, max: 5}, 'any', draw)).toBeNull();
        expect(sampleCountingQuantity({min: 0, max: 0}, 'any', draw)).toBeNull();
        expect(sampleCountingQuantity({min: 1, max: 1}, 'even', draw)).toBeNull();
        expect(draw).not.toHaveBeenCalled();
    });
});
