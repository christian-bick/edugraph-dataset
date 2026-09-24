import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {MeasurementLiquidVolumeGenerator} from './generator.ts';

describe('MeasurementLiquidVolumeGenerator', () => {
    const generator = new MeasurementLiquidVolumeGenerator();

    it('generates coherent calibrated liquid measurements', () => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const data = generator.generate({}).data;
            expect(data.measurementKind).toBe('liquid-volume');
            if (data.measurementKind !== 'liquid-volume') throw new Error('Expected liquid volume.');
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


    it('rejects a missing configuration object', () => {
        expect(() => generator.generate(null as never)).toThrow();
    });

});
