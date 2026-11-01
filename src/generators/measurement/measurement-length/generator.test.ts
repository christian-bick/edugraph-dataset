import {describe, expect, it, vi} from 'vitest';
import {Scope} from 'edugraph-ts';
import * as rng from '../../../lib/random.ts';
import {hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {getRulerTicks} from '../../../visuals/views/measure/measure-length/helpers.ts';
import {MeasurementLengthGenerator} from './generator.ts';
import {rulerLengthAt, rulerLengthCaseCount, rulerRangeProfiles} from './numeric-domain.ts';

describe('MeasurementLengthGenerator', () => {
    it('preserves all100 integer and991 tenth-unit lengths exactly once, with every ruler label in its canonical band', () => {
        const generator = new MeasurementLengthGenerator(), draw = vi.spyOn(rng, 'random');
        const seen = new Set<string>();
        try {
            for (const useDecimals of [false, true]) for (const {range} of rulerRangeProfiles) {
                const count = rulerLengthCaseCount(useDecimals, range);
                for (let index = 0; index < count; index++) {
                    draw.mockClear().mockReturnValue((index + 0.5) / count);
                    const {data} = generator.generate({useDecimals, range});
                    const ticks = getRulerTicks(data.bandLength).flatMap(tick => tick.value === undefined ? [] : [tick.value]);
                    expect(hasCanonicalRangeWitness([data.problemLength, ...ticks], range)).toBe(true);
                    expect(data.problemLength).toBeGreaterThanOrEqual(1);
                    expect(data.problemLength).toBeLessThanOrEqual(100);
                    expect(data.bandLength).toBeGreaterThanOrEqual(data.problemLength);
                    expect(data.useDecimals).toBe(useDecimals);
                    const key = `${useDecimals}:${Math.round(data.problemLength * 10)}`;
                    expect(seen.has(key)).toBe(false);
                    seen.add(key);
                    expect(draw).toHaveBeenCalledTimes(1);
                }
            }
            const expected = new Set<string>();
            for (let value = 1; value <= 100; value++) expected.add(`false:${value * 10}`);
            for (let value = 10; value <= 1000; value++) expected.add(`true:${value}`);
            expect(seen).toEqual(expected);
            expect(seen.size).toBe(1091);
            expect(rulerRangeProfiles.map(({range}) => rulerLengthCaseCount(false, range))).toEqual([5, 5, 10, 80]);
            expect(rulerRangeProfiles.map(({range}) => rulerLengthCaseCount(true, range))).toEqual([41, 50, 100, 800]);
        } finally { draw.mockRestore(); }
    });

    it('preserves both tool payloads and exact seeded replay with one within-profile draw', () => {
        const generator = new MeasurementLengthGenerator();
        for (const [tool, rendered] of [[Scope.PhysicalRuler, 'ruler'], [Scope.Tapemeter, 'tape']] as const) {
            const config = {range: rulerRangeProfiles[0]!.range, useDecimals: false, tool};
            rng.setSeed(123);
            const first = generator.generate(config), continuation = rng.random();
            expect(first.data.tool).toBe(rendered);
            expect(first.data.bandLength).toBe(5);
            rng.setSeed(123);
            expect(generator.generate(config)).toEqual(first);
            expect(rng.random()).toBe(continuation);
        }
    });

    it('rejects malformed or noncanonical configurations and indices before sampling', () => {
        const generator = new MeasurementLengthGenerator(), draw = vi.spyOn(rng, 'random');
        const range = rulerRangeProfiles[0]!.range;
        try {
            for (const config of [null, {}, {range}, {range, useDecimals: 'yes'},
                {range: {min: 0, max: 10}, useDecimals: false}, {range: {...range, min: 5}, useDecimals: false}]) {
                expect(() => generator.generate(config as never)).toThrow();
            }
            for (const index of [-1, 0.5, rulerLengthCaseCount(false, range)]) expect(() => rulerLengthAt(false, range, index)).toThrow();
            expect(draw).not.toHaveBeenCalled();
        } finally { draw.mockRestore(); }
    });
});
