import {describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {lengthDifferenceRangeProfiles, lengthDifferenceTuples} from './numeric-domain.ts';
import {MeasurementLengthDifferenceGenerator} from './generator.ts';

describe('MeasurementLengthDifferenceGenerator', () => {
    it('keeps the typed length-difference relation coherent', () => {
        const data = new MeasurementLengthDifferenceGenerator().generate({range: lengthDifferenceRangeProfiles[0]!.range}).data;
        expect(data.longerLength - data.shorterLength).toBe(data.difference);
        expect(data.unitId).toBe('centimeter');
        expect(data).not.toHaveProperty('lengthA');
        expect(data).not.toHaveProperty('lengthB');
    });
    it('preserves all 88 relations exactly once across canonical profiles', () => {
        const generator = new MeasurementLengthDifferenceGenerator();
        const draw = vi.spyOn(rng, 'random');
        const expected = new Set<string>();
        for (let shorter = 5; shorter <= 15; shorter++) for (let difference = 2; difference <= 9; difference++) {
            expected.add([shorter, difference, shorter + difference].join(','));
        }
        const seen = new Set<string>();
        try {
            for (const {range} of lengthDifferenceRangeProfiles) {
                const tuples = lengthDifferenceTuples(range);
                for (let index = 0; index < tuples.length; index++) {
                    draw.mockClear().mockReturnValue((index + 0.5) / tuples.length);
                    const {data} = generator.generate({range});
                    const values = [data.shorterLength, data.difference, data.longerLength];
                    expect(data.longerLength - data.shorterLength).toBe(data.difference);
                    expect(hasCanonicalRangeWitness(values, range)).toBe(true);
                    expect(draw).toHaveBeenCalledTimes(1);
                    expect(seen.has(values.join(','))).toBe(false);
                    seen.add(values.join(','));
                }
            }
            expect(seen).toEqual(expected);
        } finally { draw.mockRestore(); }
    });

    it('rejects missing, malformed and infeasible profiles before sampling', () => {
        const generator = new MeasurementLengthDifferenceGenerator();
        const draw = vi.spyOn(rng, 'random');
        try {
            expect(() => generator.generate({})).toThrow();
            expect(() => generator.generate({range: {min: 0, max: 10}} as never)).toThrow();
            expect(() => generator.generate({range: {...lengthDifferenceRangeProfiles[0]!.range, min: 20}})).toThrow();
            expect(draw).not.toHaveBeenCalled();
        } finally { draw.mockRestore(); }
    });
});
