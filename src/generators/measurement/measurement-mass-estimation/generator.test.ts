import {describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {MeasurementMassEstimationGenerator} from './generator.ts';
import {massEstimateRangeProfiles, massEstimatesForRange} from './numeric-domain.ts';

describe('MeasurementMassEstimationGenerator', () => {
    it('partitions the complete six-object support exactly once across scale and range profiles', () => {
        const generator = new MeasurementMassEstimationGenerator();
        const draw = vi.spyOn(rng, 'random');
        const seen: string[] = [];
        try {
            for (const measurement of ['gram-weight', 'kilogram-weight'] as const) for (const {range} of massEstimateRangeProfiles) {
                const pool = massEstimatesForRange(measurement, range);
                for (let index = 0; index < pool.length; index++) {
                    draw.mockClear().mockReturnValue((index + 0.5) / pool.length);
                    const {data} = generator.generate({measurement, range});
                    seen.push(`${data.object}:${data.estimate}:${data.unit}`);
                    expect(hasCanonicalRangeWitness([data.referenceValue, data.referenceCount, data.estimate], range)).toBe(true);
                    expect(data.measurementKind).toBe('mass');
                    expect(data.referenceCount).toBe(data.estimate);
                    expect(data.referenceValue).toBe(1);
                    expect(data.referenceObject).toBe(data.unit === 'g' ? 'paperclip' : 'one-kilogram-bag');
                    expect(draw).toHaveBeenCalledTimes(1);
                }
            }
            expect(seen.sort()).toEqual(["crayon:10:g","apple:200:g","book:500:g","backpack:3:kg","chair:5:kg","bicycle:12:kg"].sort());
            expect(new Set(seen).size).toBe(6);
        } finally { draw.mockRestore(); }
    });

    it('rejects missing, malformed, incompatible and unsupported configurations before sampling', () => {
        const generator = new MeasurementMassEstimationGenerator();
        const draw = vi.spyOn(rng, 'random');
        try {
            expect(() => generator.generate({})).toThrow();
            expect(() => generator.generate(null as never)).toThrow();
            expect(() => generator.generate({measurement: 'unsupported' as never})).toThrow('Unsupported scale');
            expect(() => generator.generate({measurement: 'gram-weight'})).toThrow();
            expect(() => generator.generate({measurement: 'gram-weight', range: {min: 0, max: 10}} as never)).toThrow();
            expect(() => generator.generate({measurement: 'gram-weight', range: massEstimateRangeProfiles[0]!.range})).toThrow('Unsupported canonical range');
            expect(draw).not.toHaveBeenCalled();
        } finally { draw.mockRestore(); }
    });

    it('replays the same mathematical profile and seed exactly', () => {
        const range = massEstimateRangeProfiles.find(({range}) => massEstimatesForRange('gram-weight', range).length > 0)!.range;
        const generator = new MeasurementMassEstimationGenerator();
        rng.setSeed('measurement-mass-estimation');
        const first = generator.generate({measurement: 'gram-weight', range});
        rng.setSeed('measurement-mass-estimation');
        expect(generator.generate({measurement: 'gram-weight', range})).toEqual(first);
    });
});
