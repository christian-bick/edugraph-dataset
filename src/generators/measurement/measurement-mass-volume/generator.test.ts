import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {MeasurementMassVolumeGenerator} from './generator.ts';

describe('MeasurementMassVolumeGenerator', () => {
    const generator = new MeasurementMassVolumeGenerator();

    it('generates coherent calibrated liquid measurements', () => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const data = generator.generate({measurement: 'liter-volume'}).data;
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
        const first = generator.generate({measurement: 'liter-volume'});
        setSeed('liquid-volume');
        expect(generator.generate({measurement: 'liter-volume'})).toEqual(first);
    });

    it.each([
        ['gram-weight', 'g', ['apple', 'book', 'toy-car']],
        ['kilogram-weight', 'kg', ['watermelon', 'backpack', 'suitcase']]
    ] as const)('generates coherent mass readings for %s', (measurement, unit, objects) => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const stub = generator.generate({measurement});
            expect(stub.data.measurementKind).toBe('mass');
            if (stub.data.measurementKind !== 'mass') throw new Error('Expected mass.');
            expect(stub.data.unit).toBe(unit);
            expect(stub.data.instrument).toBe('digital-scale');
            expect(objects).toContain(stub.data.object);
            expect(stub.data.value).toBeGreaterThan(0);
        }
    });

    it('rejects a missing scale', () => {
        expect(() => generator.generate({})).toThrow(
            '[Generator: measurement-mass-volume] Validation Error'
        );
    });

    it('rejects an unsupported resolved measurement configuration', () => {
        expect(() => generator.generate({measurement: 'unsupported' as never})).toThrow(
            'Unsupported scale'
        );
    });
});
