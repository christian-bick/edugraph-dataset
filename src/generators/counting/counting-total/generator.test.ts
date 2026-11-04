import {describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import * as rng from '../../../lib/random.ts';
import {basicCountingCounts, basicCountingProfiles} from '../basic-counting-domain.ts';
import {CountingTotalGenerator} from './generator.ts';

describe('CountingTotalGenerator', () => {
    const generator = new CountingTotalGenerator();

    it('has the counting type and requires explicit range and parity', () => {
        expect(generator.type).toBe('counting');
        expect(() => generator.generate({})).toThrow();
        expect(() => generator.generate({parity: 'any'})).toThrow();
        expect(() => generator.generate({range: createCanonicalNumericRange(5)})).toThrow();
    });

    it.each(basicCountingProfiles('total'))('retains every nonsingleton total/parity outcome in $range.min..$range.max', ({range}) => {
        const draw = vi.spyOn(rng, 'random');
        try {
            for (const parity of ['any', 'even', 'odd'] as const) {
                const counts = basicCountingCounts('total', range, parity);
                for (let index = 0; index < counts.length; index++) {
                    draw.mockClear().mockReturnValue((index + 0.5) / counts.length);
                    const stub = generator.generate({range, parity}), data = stub.data;
                    expect(Object.keys(stub)).toEqual(['data']);
                    expect(data.kind).toBe('counting-total');
                    expect(data.numObjects).toBe(counts[index]);
                    expect(data.simpleAnswer).toBe(data.numObjects);
                    expect(data).not.toHaveProperty('countingNumbers');
                    expect(data).not.toHaveProperty('availableCount');
                    expect([5, 10, 20]).not.toContain(data.numObjects);
                    expect(hasCanonicalRangeWitness([data.numObjects], range)).toBe(true);
                    if (parity === 'any') expect(data).not.toHaveProperty('parity');
                    else {
                        expect(data.parity).toBe(parity);
                        expect(data.numObjects % 2).toBe(parity === 'even' ? 0 : 1);
                    }
                    expect(draw).toHaveBeenCalledTimes(1);
                }
            }
        } finally { draw.mockRestore(); }
    });

    it('returns fresh total payloads and preserves exact one-draw replay', () => {
        const config = {range: createCanonicalNumericRange(20, 10), parity: 'odd' as const};
        rng.setSeed('counting-total-replay');
        const first = generator.generate(config), continuation = rng.getRandomState();
        rng.setSeed('counting-total-replay');
        const second = generator.generate(config);
        expect(second).toEqual(first);
        expect(second.data).not.toBe(first.data);
        expect(rng.getRandomState()).toBe(continuation);
        rng.setSeed('counting-total-replay');
        rng.random();
        expect(rng.getRandomState()).toBe(continuation);
    });

    it.each([undefined, false, {min: 0, max: 10}, createCanonicalNumericRange(10),
        createCanonicalNumericRange(20, 5), createCanonicalNumericRange(100),
        {...createCanonicalNumericRange(10, 5), maximumAbove: 0},
        {...createCanonicalNumericRange(10, 5), minimumBelow: 20}])(
        'rejects missing, altered or unsupported range %j before randomness', range => {
            const draw = vi.spyOn(rng, 'random');
            try {
                expect(() => generator.generate({range, parity: 'any'} as never)).toThrow();
                expect(draw).not.toHaveBeenCalled();
            } finally { draw.mockRestore(); }
        });

    it('rejects an unsupported parity before randomness', () => {
        const draw = vi.spyOn(rng, 'random');
        try {
            expect(() => generator.generate({range: createCanonicalNumericRange(5), parity: 'prime'} as never)).toThrow();
            expect(draw).not.toHaveBeenCalled();
        } finally { draw.mockRestore(); }
    });
});
