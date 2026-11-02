import {afterEach, describe, expect, it, vi} from 'vitest';
import * as randomness from '../../../lib/random.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {CountingHundredOffsetGenerator} from './generator.ts';
import {placeValueOffsetRangeProfiles, placeValueOffsetStarts} from '../place-value-offset-domain.ts';
import {countingOffsetStarts} from '../counting-offset.ts';

describe('CountingHundredOffsetGenerator', () => {
    const generator = new CountingHundredOffsetGenerator();
    afterEach(() => vi.restoreAllMocks());
    it('requires every mathematical selector', () => {
        expect(() => generator.generate(null as never)).toThrow();
        expect(() => generator.generate({})).toThrow('range');
        expect(() => generator.generate({range: createCanonicalNumericRange(1000), direction: 'inc',
            operandProfile: 'unrestricted'})).toThrow('requireZero');
    });
    it('uniformly projects every canonical range, direction, width and zero profile in one draw', () => {
        const draw = vi.spyOn(randomness, 'random');
        for (const {range} of placeValueOffsetRangeProfiles(100)) for (const direction of ['inc', 'dec'] as const)
            for (const operandProfile of ['unrestricted', 'three-digit'] as const)
                for (const requireZero of [false, true]) {
                    const starts = placeValueOffsetStarts(100, range, direction, operandProfile, requireZero);
                    draw.mockClear();
                    if (!starts.length) {
                        expect(generator.generate({range, direction, operandProfile, requireZero})).toBeNull();
                        expect(draw).not.toHaveBeenCalled(); continue;
                    }
                    for (let bin = 0; bin < starts.length; bin++) {
                        draw.mockClear().mockReturnValue((bin + .5) / starts.length);
                        const data = generator.generate({range, direction, operandProfile, requireZero})!.data;
                        expect(data.numObjects).toBe(starts[bin]);
                        expect(data.incDecAnswer).toBe(data.numObjects + (direction === 'inc' ? 100 : -100));
                        expect(data.stepSize).toBe(100);
                        expect(data.simpleAnswer).toBe(data.numObjects);
                        const coefficients = [...Object.values(data.startPlaceValue), ...Object.values(data.resultPlaceValue)];
                        expect(coefficients.includes(0)).toBe(requireZero);
                        expect(draw).toHaveBeenCalledTimes(1);
                    }
                }
    });
    it('preserves the complete old source support after correcting its false global floor', () => {
        for (const direction of ['inc', 'dec'] as const) {
            expect(placeValueOffsetStarts(100, createCanonicalNumericRange(1000), direction, 'three-digit', false))
                .toEqual(countingOffsetStarts({range: {min: 100, max: 1000}, direction}, 100, 'three-digit'));
        }
    });
    it('replays deterministically and rejects malformed range/direction without entropy', () => {
        const config = {range: createCanonicalNumericRange(1000), direction: 'inc' as const,
            operandProfile: 'three-digit' as const, requireZero: false};
        randomness.setSeed(42); randomness.random(); const continuation = randomness.getRandomState();
        randomness.setSeed(42); const first = generator.generate(config);
        expect(first).not.toBeNull(); expect(randomness.getRandomState()).toBe(continuation);
        randomness.setSeed(42); expect(generator.generate(config)).toEqual(first);
        const draw = vi.spyOn(randomness, 'random');
        expect(generator.generate({...config, range: {min: 1, max: 999} as never})).toBeNull();
        expect(generator.generate({...config, direction: 'bad'} as never)).toBeNull();
        expect(generator.generate({...config, requireZero: 'bad'} as never)).toBeNull();
        expect(draw).not.toHaveBeenCalled();
    });
});
