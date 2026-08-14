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
            const data = generator.generate({}).data;
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
        const first = generator.generate({});
        setSeed('liquid-volume-estimate');
        expect(generator.generate({})).toEqual(first);
    });

    it('rejects a missing configuration object', () => {
        expect(() => generator.generate(null as never)).toThrow(
            '[Generator: measurement-mass-volume-estimation] Validation Error'
        );
    });
});
