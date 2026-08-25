import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {MeasurementMassVolumeEstimationGenerator} from './generator.ts';

const expectedEstimates = {
    'water-bottle': 1,
    'juice-carton': 2,
    'watering-can': 5,
    bucket: 10
} as const;

describe('MeasurementMassVolumeEstimationGenerator', () => {
    const generator = new MeasurementMassVolumeEstimationGenerator();

    it('generates plausible liter estimates for familiar containers', () => {
        const containers = new Set<string>();
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const data = generator.generate({measurement: 'liter-volume'}).data;
            if (data.measurementKind !== 'liquid-volume') throw new Error('Expected liquid volume.');
            containers.add(data.container);
            expect(data.measurementKind).toBe('liquid-volume');
            expect(data.unit).toBe('L');
            expect(data.referenceLiters).toBe(1);
            expect(data.estimateLiters).toBe(expectedEstimates[data.container]);
        }
        expect([...containers].sort()).toEqual(['bucket', 'juice-carton', 'water-bottle', 'watering-can']);
    });

    it('is deterministic for the same seed', () => {
        setSeed('liquid-volume-estimate');
        const first = generator.generate({measurement: 'liter-volume'});
        setSeed('liquid-volume-estimate');
        expect(generator.generate({measurement: 'liter-volume'})).toEqual(first);
    });

    it.each([
        ['gram-weight', 'g', 'paperclip', [10, 200, 500]],
        ['kilogram-weight', 'kg', 'one-kilogram-bag', [3, 5, 12]]
    ] as const)('generates plausible mass estimates for %s', (measurement, unit, referenceObject, values) => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const stub = generator.generate({measurement});
            if (stub.data.measurementKind !== 'mass') throw new Error('Expected mass.');
            expect(stub.data.unit).toBe(unit);
            expect(stub.data.referenceObject).toBe(referenceObject);
            expect(stub.data.referenceValue).toBe(1);
            expect(stub.data.referenceCount).toBe(stub.data.estimate);
            expect(values).toContain(stub.data.estimate);
        }
    });

    it('rejects a missing configuration object', () => {
        expect(() => generator.generate(null as never)).toThrow(
            '[Generator: measurement-mass-volume-estimation] Validation Error'
        );
    });

    it('rejects an unsupported resolved measurement configuration', () => {
        expect(() => generator.generate({measurement: 'unsupported' as never})).toThrow(
            'Unsupported measurement configuration'
        );
    });
});
