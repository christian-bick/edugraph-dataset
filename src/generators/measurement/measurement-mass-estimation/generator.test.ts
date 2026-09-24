import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {MeasurementMassEstimationGenerator} from './generator.ts';

describe('MeasurementMassEstimationGenerator', () => {
    const generator = new MeasurementMassEstimationGenerator();

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
            '[Generator: measurement-mass-estimation] Validation Error'
        );
    });

    it('rejects an unsupported resolved measurement configuration', () => {
        expect(() => generator.generate({measurement: 'unsupported' as never})).toThrow(
            'Unsupported scale'
        );
    });
    it('is deterministic for the same seed and scale', () => {
        setSeed('measurement-mass-estimation');
        const first = generator.generate({measurement: 'gram-weight'});
        setSeed('measurement-mass-estimation');
        expect(generator.generate({measurement: 'gram-weight'})).toEqual(first);
    });

});
