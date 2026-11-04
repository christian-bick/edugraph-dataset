import {beforeEach, describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import * as rng from '../../../lib/random.ts';
import {basicCountingCounts, basicCountingProfiles} from '../basic-counting-domain.ts';
import {CountingBasicGenerator} from './generator.ts';

describe('CountingBasicGenerator', () => {
    const generator = new CountingBasicGenerator();
    beforeEach(() => rng.setSeed(42));

    it('has the counting type and requires explicit range and parity', () => {
        expect(generator.type).toBe('counting');
        expect(() => generator.generate({})).toThrow();
        expect(() => generator.generate({parity: 'any'})).toThrow();
        expect(() => generator.generate({range: createCanonicalNumericRange(10)})).toThrow();
    });

    it.each(basicCountingProfiles('enumeration'))('preserves every count/parity outcome in canonical $range.min..$range.max', ({range}) => {
        const draw = vi.spyOn(rng, 'random');
        try {
            for (const parity of ['any', 'even', 'odd'] as const) {
                const counts = basicCountingCounts('enumeration', range, parity);
                for (let index = 0; index < counts.length; index++) {
                    draw.mockClear().mockReturnValue((index + 0.5) / counts.length);
                    const stub = generator.generate({range, parity}), data = stub.data;
                    expect(Object.keys(stub)).toEqual(['data']);
                    expect(data.kind).toBe('counting-enumeration');
                    expect(data.numObjects).toBe(counts[index]);
                    expect(data.simpleAnswer).toBe(data.numObjects);
                    expect(data.countingNumbers).toEqual(Array.from({length: data.numObjects}, (_, number) => number + 1));
                    expect(hasCanonicalRangeWitness(data.countingNumbers, range)).toBe(true);
                    expect(data.numObjects).toBeGreaterThanOrEqual(1);
                    expect(data.numObjects).toBeLessThanOrEqual(20);
                    if (parity === 'any') expect(data).not.toHaveProperty('parity');
                    else {
                        expect(data.parity).toBe(parity);
                        expect(data.numObjects % 2).toBe(parity === 'even' ? 0 : 1);
                    }
                    expect(data).not.toHaveProperty('availableCount');
                    expect(draw).toHaveBeenCalledTimes(1);
                }
            }
        } finally { draw.mockRestore(); }
    });

    it.each([['any', 9], ['even', 8], ['odd', 9]] as const)(
        'keeps the original one-draw continuation for seed42 and %s', (parity, count) => {
            const {data} = generator.generate({range: createCanonicalNumericRange(10), parity});
            expect(data.numObjects).toBe(count);
            expect(rng.getRandomState()).toBe(1831565855);
        });

    it('allocates fresh enumeration arrays and replays exactly', () => {
        const config = {range: createCanonicalNumericRange(20), parity: 'odd' as const};
        const first = generator.generate(config), continuation = rng.getRandomState();
        rng.setSeed(42);
        expect(generator.generate(config)).toEqual(first);
        expect(rng.getRandomState()).toBe(continuation);
        (first.data.countingNumbers as number[])[0] = 99;
        rng.setSeed(42);
        const next = generator.generate(config);
        expect(next.data.countingNumbers[0]).toBe(1);
        expect(next.data).not.toBe(first.data);
        expect(next.data.countingNumbers).not.toBe(first.data.countingNumbers);
    });

    it.each([undefined, false, {min: 0, max: 10}, createCanonicalNumericRange(100),
        createCanonicalNumericRange(10, 5), {...createCanonicalNumericRange(10), maximumAbove: 0},
        {...createCanonicalNumericRange(10), minimumBelow: 10}, {min: 20, max: 10}])(
        'rejects missing, altered or unsupported range %j before randomness', range => {
            const draw = vi.spyOn(rng, 'random');
            try {
                expect(() => generator.generate({range, parity: 'any'} as never)).toThrow();
                expect(draw).not.toHaveBeenCalled();
                expect(rng.getRandomState()).toBe(42);
            } finally { draw.mockRestore(); }
        });

    it('rejects an unsupported parity before randomness', () => {
        const draw = vi.spyOn(rng, 'random');
        try {
            expect(() => generator.generate({range: createCanonicalNumericRange(10), parity: 'prime'} as never)).toThrow();
            expect(draw).not.toHaveBeenCalled();
        } finally { draw.mockRestore(); }
    });
});
