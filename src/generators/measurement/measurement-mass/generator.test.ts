import {describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {MeasurementMassGenerator} from './generator.ts';
import {massReadingRangeProfiles, massReadingsForRange} from './numeric-domain.ts';

describe('MeasurementMassGenerator', () => {
    it('partitions the complete six-object support exactly once across scale and range profiles', () => {
        const generator = new MeasurementMassGenerator();
        const draw = vi.spyOn(rng, 'random');
        const seen: string[] = [];
        try {
            for (const measurement of ['gram-weight', 'kilogram-weight'] as const) for (const {range} of massReadingRangeProfiles) {
                const pool = massReadingsForRange(measurement, range);
                for (let index = 0; index < pool.length; index++) {
                    draw.mockClear().mockReturnValue((index + 0.5) / pool.length);
                    const {data} = generator.generate({measurement, range});
                    seen.push(`${data.object}:${data.value}:${data.unit}`);
                    expect(hasCanonicalRangeWitness([data.value], range)).toBe(true);
                    expect(data.measurementKind).toBe('mass');
                    expect(data.instrument).toBe('digital-scale');
                    expect(draw).toHaveBeenCalledTimes(1);
                }
            }
            expect(seen.sort()).toEqual(["apple:180:g","book:450:g","toy-car:320:g","watermelon:4:kg","backpack:3:kg","suitcase:12:kg"].sort());
            expect(new Set(seen).size).toBe(6);
        } finally { draw.mockRestore(); }
    });

    it('rejects missing, malformed, incompatible and unsupported configurations before sampling', () => {
        const generator = new MeasurementMassGenerator();
        const draw = vi.spyOn(rng, 'random');
        try {
            expect(() => generator.generate({})).toThrow();
            expect(() => generator.generate(null as never)).toThrow();
            expect(() => generator.generate({measurement: 'unsupported' as never})).toThrow('Unsupported scale');
            expect(() => generator.generate({measurement: 'gram-weight'})).toThrow();
            expect(() => generator.generate({measurement: 'gram-weight', range: {min: 0, max: 10}} as never)).toThrow();
            expect(() => generator.generate({measurement: 'gram-weight', range: massReadingRangeProfiles[0]!.range})).toThrow('Unsupported canonical range');
            expect(draw).not.toHaveBeenCalled();
        } finally { draw.mockRestore(); }
    });

    it('replays the same mathematical profile and seed exactly', () => {
        const range = massReadingRangeProfiles.find(({range}) => massReadingsForRange('gram-weight', range).length > 0)!.range;
        const generator = new MeasurementMassGenerator();
        rng.setSeed('measurement-mass');
        const first = generator.generate({measurement: 'gram-weight', range});
        rng.setSeed('measurement-mass');
        expect(generator.generate({measurement: 'gram-weight', range})).toEqual(first);
    });
});
