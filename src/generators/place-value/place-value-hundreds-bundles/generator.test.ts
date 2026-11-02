import {afterEach, describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import * as randomness from '../../../lib/random.ts';
import {PlaceValueHundredsBundlesGenerator} from './generator.ts';
import {hundredsBundleQuantities, hundredsBundleRangeProfiles, hundredsBundleRows} from './numeric-domain.ts';

describe('PlaceValueHundredsBundlesGenerator', () => {
    const generator = new PlaceValueHundredsBundlesGenerator();
    afterEach(() => vi.restoreAllMocks());
    it('requires ordered range bounds and an explicit mathematical regrouping selector', () => {
        expect(() => generator.generate(null as never)).toThrow();
        expect(() => generator.generate({})).toThrow('range');
        expect(() => generator.generate({range: createCanonicalNumericRange(100)})).toThrow('requireRegrouping');
        expect(() => generator.generate({range: {...createCanonicalNumericRange(100), min: 200}, requireRegrouping: true})).toThrow();
        expect(() => generator.generate({range: createCanonicalNumericRange(100), requireRegrouping: 'yes'} as never)).toThrow();
    });
    it('retains exactly the ten original model states with uniform conditional sampling', () => {
        const draw = vi.spyOn(randomness, 'random'), states = [];
        for (const requireRegrouping of [false, true]) for (const {range} of hundredsBundleRangeProfiles) {
            const rows = hundredsBundleRows(range, requireRegrouping);
            draw.mockClear();
            if (!rows.length) {
                expect(generator.generate({range, requireRegrouping})).toBeNull();
                expect(draw).not.toHaveBeenCalled(); continue;
            }
            for (let index = 0; index < rows.length; index++) {
                draw.mockClear().mockReturnValue((index + .5) / rows.length);
                const data = generator.generate({range, requireRegrouping})!.data;
                expect(data).toEqual(rows[index]);
                expect(data.target).toBe(data.hundreds * 100);
                expect(data.tens).toBe(requireRegrouping ? 10 : 0);
                expect(data.ones).toBe(0);
                expect(hasCanonicalRangeWitness(hundredsBundleQuantities(data), range)).toBe(true);
                expect(draw).toHaveBeenCalledTimes(1);
                states.push(data);
            }
        }
        expect(states).toHaveLength(10);
        expect(states.filter(data => data.tens === 0).map(data => data.hundreds).sort((a, b) => a - b))
            .toEqual([1,2,3,4,5,6,7,8,9]);
        expect(states.filter(data => data.tens === 10)).toEqual([{hundreds: 1, tens: 10, ones: 0, target: 100}]);
    });
    it('distinguishes a flat and ten-tens exchange even at their identical canonical bounds', () => {
        const range = createCanonicalNumericRange(100);
        expect(generator.generate({range, requireRegrouping: false})!.data).toEqual({hundreds: 1, tens: 0, ones: 0, target: 100});
        expect(generator.generate({range, requireRegrouping: true})!.data).toEqual({hundreds: 1, tens: 10, ones: 0, target: 100});
        expect(hundredsBundleQuantities(generator.generate({range, requireRegrouping: true})!.data)).toContain(1);
    });
    it('preserves one-draw continuation even for the fixed exchange, and repeats exactly', () => {
        for (const requireRegrouping of [false, true]) {
            const config = {range: createCanonicalNumericRange(100), requireRegrouping};
            randomness.setSeed(42); randomness.random(); const continuation = randomness.getRandomState();
            randomness.setSeed(42); const first = generator.generate(config);
            expect(randomness.getRandomState()).toBe(continuation);
            randomness.setSeed(42); expect(generator.generate(config)).toEqual(first);
        }
    });
    it('returns null without drawing for malformed witnesses and impossible exchange ranges', () => {
        const draw = vi.spyOn(randomness, 'random');
        expect(generator.generate({range: {...createCanonicalNumericRange(100), maximumAbove: 100}, requireRegrouping: false})).toBeNull();
        expect(generator.generate({range: createCanonicalNumericRange(1000), requireRegrouping: true})).toBeNull();
        expect(generator.generate({range: createCanonicalNumericRange(1000, 5), requireRegrouping: true})).toBeNull();
        expect(draw).not.toHaveBeenCalled();
    });
});
