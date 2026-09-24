import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {MeasurementMassGenerator} from './generator.ts';

describe('MeasurementMassGenerator', () => {
    const generator = new MeasurementMassGenerator();

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
            '[Generator: measurement-mass] Validation Error'
        );
    });

    it('rejects an unsupported resolved measurement configuration', () => {
        expect(() => generator.generate({measurement: 'unsupported' as never})).toThrow(
            'Unsupported scale'
        );
    });
    it('is deterministic for the same seed and scale', () => {
        setSeed('measurement-mass');
        const first = generator.generate({measurement: 'gram-weight'});
        setSeed('measurement-mass');
        expect(generator.generate({measurement: 'gram-weight'})).toEqual(first);
    });

});
