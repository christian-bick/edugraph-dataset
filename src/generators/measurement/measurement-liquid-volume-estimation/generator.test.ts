import {describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {MeasurementLiquidVolumeEstimationGenerator} from './generator.ts';
import {liquidEstimateRangeProfiles, liquidEstimatesForRange} from './numeric-domain.ts';

describe('MeasurementLiquidVolumeEstimationGenerator', () => {
    it('preserves all four containers exactly once with the required one-liter reference', () => {
        const generator = new MeasurementLiquidVolumeEstimationGenerator();
        const draw = vi.spyOn(rng, 'random');
        const seen: string[] = [];
        try {
            for (const {range} of liquidEstimateRangeProfiles) {
                const pool = liquidEstimatesForRange(range);
                for (let index = 0; index < pool.length; index++) {
                    draw.mockClear().mockReturnValue((index + 0.5) / pool.length);
                    const {data} = generator.generate({range});
                    seen.push(`${data.container}:${data.estimateLiters}`);
                    expect(data.unit).toBe('L');
                    expect(data.referenceLiters).toBe(1);
                    expect(hasCanonicalRangeWitness([data.referenceLiters, data.estimateLiters], range)).toBe(true);
                    expect(draw).toHaveBeenCalledTimes(1);
                }
            }
            expect(seen.sort()).toEqual(['water-bottle:1', 'juice-carton:2', 'watering-can:5', 'bucket:10'].sort());
            expect(new Set(seen).size).toBe(4);
        } finally { draw.mockRestore(); }
    });

    it('rejects missing, malformed and infeasible profiles before sampling', () => {
        const generator = new MeasurementLiquidVolumeEstimationGenerator();
        const draw = vi.spyOn(rng, 'random');
        try {
            expect(() => generator.generate({})).toThrow();
            expect(() => generator.generate(null as never)).toThrow();
            expect(() => generator.generate({range: {min: 0, max: 5}} as never)).toThrow();
            expect(() => generator.generate({range: {...liquidEstimateRangeProfiles[0]!.range, min: 5}})).toThrow();
            expect(draw).not.toHaveBeenCalled();
        } finally { draw.mockRestore(); }
    });

    it('replays a selected profile with identical random continuation', () => {
        const generator = new MeasurementLiquidVolumeEstimationGenerator();
        const config = {range: liquidEstimateRangeProfiles[0]!.range};
        rng.setSeed('liquid-estimate');
        const first = generator.generate(config);
        const continuation = rng.random();
        rng.setSeed('liquid-estimate');
        expect(generator.generate(config)).toEqual(first);
        expect(rng.random()).toBe(continuation);
    });
});
