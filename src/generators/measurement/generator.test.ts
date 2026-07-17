import {beforeEach, describe, expect, it} from 'vitest';
import {MeasurementGenerator} from './generator.ts';
import {setSeed} from '../../lib/random.ts';

describe('MeasurementGenerator', () => {
    let generator: MeasurementGenerator;

    beforeEach(() => {
        generator = new MeasurementGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('measurement');
    });

    it('should be deterministic with the same seed', () => {
        const config = { range: { min: 0, max: 10 } };
        setSeed(123);
        const stub1 = generator.generate(config);
        setSeed(123);
        const stub2 = generator.generate(config);
        expect(stub1).toEqual(stub2);
    });

    it('should validate standard measure bounds', () => {
        const config = { range: { min: 0, max: 10 } };
        const stub = generator.generate(config);
        expect(stub).not.toBeNull();
        expect(stub!.data.bandLength).toBe(10);
        expect(stub!.data.problemLength).toBeGreaterThan(0);
        expect(stub!.data.problemLength).toBeLessThanOrEqual(10);
    });
});
