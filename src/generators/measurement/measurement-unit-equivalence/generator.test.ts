import {afterEach, describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {measurementConversionPairSeeds} from '../helpers.ts';
import {unitEquivalenceRanges, unitEquivalenceStarts} from '../unit-equivalence-domain.ts';
import {MeasurementUnitEquivalenceGenerator} from './generator.ts';

afterEach(() => vi.restoreAllMocks());
const generator = new MeasurementUnitEquivalenceGenerator();

describe('single named-unit equality generation', () => {
    it.each(Object.values(measurementConversionPairSeeds))('retains all eight exact equalities and one draw for $id', pair => {
        const seen = new Set<number>(), draw = vi.spyOn(rng, 'random');
        for (const range of unitEquivalenceRanges('single', pair.id)) {
            const starts = unitEquivalenceStarts('single', pair.id, range);
            for (const [index, start] of starts.entries()) {
                draw.mockReturnValueOnce((index + 0.5) / starts.length);
                const result = generator.generate(Object.freeze({unitPair: pair.id, range}));
                expect(result).toEqual({data: {kind: 'unit-equivalence', pair,
                    equivalent: {largerValue: start, smallerValue: start * pair.factor}}});
                expect(result.data.pair).not.toBe(pair);
                expect(result.data).not.toHaveProperty('equivalents');
                seen.add(start);
            }
        }
        expect(seen).toEqual(new Set([2, 3, 4, 5, 6, 7, 8, 9]));
        expect(draw).toHaveBeenCalledTimes(8);
        draw.mockRestore();
        for (const range of unitEquivalenceRanges('single', pair.id)) {
            rng.setSeed(pair.id); rng.random(); const state = rng.getRandomState();
            rng.setSeed(pair.id); const first = generator.generate({unitPair: pair.id, range});
            expect(rng.getRandomState()).toBe(state);
            rng.setSeed(pair.id); expect(generator.generate({unitPair: pair.id, range})).toEqual(first);
        }
    });

    it('requires a supported pair and complete feasible bounds', () => {
        expect(() => generator.generate({})).toThrow(/Required field "unitPair"/);
        expect(() => generator.generate(null as never)).toThrow();
        expect(() => generator.generate(undefined as never)).toThrow();
        expect(() => generator.generate({unitPair: 'hour-minute'})).toThrow(/Required field "range"/);
        for (const unitPair of ['yard-foot', 'constructor', 'toString', '__proto__'])
            expect(() => generator.generate({unitPair, range: createCanonicalNumericRange(1000)} as never)).toThrow(/Unsupported unit pair/);
        expect(() => generator.generate({unitPair: 'hour-minute', range: createCanonicalNumericRange(100)})).toThrow();
    });
});
