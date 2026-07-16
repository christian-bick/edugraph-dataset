import { describe, it, expect, beforeEach } from 'vitest';
import { MeasurementGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';

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
        const input = { labels: [], constraints: { bandLength: 10 } };
        setSeed(123);
        const stub1 = generator.generate(input);
        setSeed(123);
        const stub2 = generator.generate(input);
        expect(stub1).toEqual(stub2);
    });

    it('should validate standard measure bounds', () => {
        const input = {
            labels: [],
            constraints: { bandLength: 10 }
        };
        const stub = generator.generate(input);
        expect(stub).not.toBeNull();
        expect(stub!.data.bandLength).toBe(10);
        expect(stub!.data.problemLength).toBeGreaterThan(0);
        expect(stub!.data.problemLength).toBeLessThanOrEqual(10);
    });
});
