import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {MeasurementMassVolumeGenerator} from './generator.ts';

describe('MeasurementMassVolumeGenerator', () => {
    const generator = new MeasurementMassVolumeGenerator();

    it('generates coherent calibrated liquid measurements', () => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const data = generator.generate({}).data;
            expect(data.measurementKind).toBe('liquid-volume');
            expect(data.object).toBe('measuring-jug');
            expect(data.unit).toBe('L');
            expect(data.tickStep).toBe(1);
            expect(data.value).toBeGreaterThan(0);
            expect(data.value).toBeLessThan(data.capacity);
        }
    });

    it('is deterministic for the same seed', () => {
        setSeed('liquid-volume');
        const first = generator.generate({});
        setSeed('liquid-volume');
        expect(generator.generate({})).toEqual(first);
    });
});
