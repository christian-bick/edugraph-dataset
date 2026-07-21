import {beforeEach, describe, expect, it} from 'vitest';
import {MeasurementLengthGenerator} from './generator.ts';
import {setSeed} from '../../../lib/random.ts';

describe('MeasurementLengthGenerator', () => {
    let generator: MeasurementLengthGenerator;

    beforeEach(() => {
        generator = new MeasurementLengthGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('measurement');
    });

    it('should be deterministic with the same seed', () => {
        const config = { range: { min: 0, max: 10 }, useDecimals: true };
        setSeed(123);
        const stub1 = generator.generate(config);
        setSeed(123);
        const stub2 = generator.generate(config);
        expect(stub1).toEqual(stub2);
    });

    it('should validate standard measure bounds for decimals', () => {
        const config = { range: { min: 0, max: 10 }, useDecimals: true };
        const stub = generator.generate(config);
        expect(stub).not.toBeNull();
        expect(stub!.data.bandLength).toBe(10);
        expect(stub!.data.useDecimals).toBe(true);
        expect(stub!.data.problemLength).toBeGreaterThan(0);
        expect(stub!.data.problemLength).toBeLessThanOrEqual(10);
    });

    it('should validate standard measure bounds for integers', () => {
        const config = { range: { min: 0, max: 10 }, useDecimals: false };
        const stub = generator.generate(config);
        expect(stub).not.toBeNull();
        expect(stub!.data.bandLength).toBe(10);
        expect(stub!.data.useDecimals).toBe(false);
        expect(Number.isInteger(stub!.data.problemLength)).toBe(true);
        expect(stub!.data.problemLength).toBeGreaterThanOrEqual(1);
        expect(stub!.data.problemLength).toBeLessThanOrEqual(10);
    });

    it('should throw an error if range is missing', () => {
        const config = { range: null as any, useDecimals: true };
        expect(() => generator.generate(config)).toThrow();
    });
});
