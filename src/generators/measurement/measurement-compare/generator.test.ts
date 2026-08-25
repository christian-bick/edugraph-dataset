import {beforeEach, describe, expect, it} from 'vitest';
import {MeasurementCompareGenerator} from './generator.ts';
import {setSeed} from '../../../lib/random.ts';
import {Area, Scope} from 'edugraph-ts';

describe('MeasurementCompareGenerator', () => {
    let generator: MeasurementCompareGenerator;

    beforeEach(() => {
        generator = new MeasurementCompareGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('measurement');
    });

    it('should validate direct-compare length longer relation', () => {
        const config = {
            attribute: Area.MeasuringLength,
            relation: Scope.Greater
        } as const;
        for (let i = 0; i < 50; i++) {
            const stub = generator.generate(config);
            expect(stub).not.toBeNull();
            expect(stub!.data.attribute).toBe('length');
            expect(stub!.data.relation).toBe('greater');
            
            const {smaller, larger} = stub!.data.magnitudes;
            expect(larger).toBeLessThanOrEqual(10);
            expect(smaller).toBeGreaterThanOrEqual(1);
            expect(smaller).toBeLessThan(larger);
            expect(stub!.data).not.toHaveProperty('answer');
        }
    });

    it('should validate direct-compare length shorter relation', () => {
        const config = {
            attribute: Area.MeasuringLength,
            relation: Scope.Less
        } as const;
        for (let i = 0; i < 50; i++) {
            const stub = generator.generate(config);
            expect(stub).not.toBeNull();
            expect(stub!.data.attribute).toBe('length');
            expect(stub!.data.relation).toBe('less');
            
            const {smaller, larger} = stub!.data.magnitudes;
            expect(larger).toBeLessThanOrEqual(10);
            expect(smaller).toBeLessThan(larger);
        }
    });

    it('should validate direct-compare weight heavier relation', () => {
        const config = {
            attribute: Area.MeasuringWeight,
            relation: Scope.Greater
        } as const;
        for (let i = 0; i < 50; i++) {
            const stub = generator.generate(config);
            expect(stub).not.toBeNull();
            expect(stub!.data.attribute).toBe('weight');
            expect(stub!.data.relation).toBe('greater');
            
            const {smaller, larger} = stub!.data.magnitudes;
            expect(larger).toBeLessThanOrEqual(10);
            expect(smaller).toBeLessThan(larger);
        }
    });

    it('should throw an error if parameters are missing', () => {
        expect(() => generator.generate({} as any)).toThrow();
    });

    it('rejects unsupported resolved labels instead of defaulting them', () => {
        expect(generator.generate({
            attribute: Area.MeasuringVolumes,
            relation: Scope.Greater
        } as any)).toBeNull();
        expect(generator.generate({
            attribute: Area.MeasuringLength,
            relation: Scope.Equal
        } as any)).toBeNull();
    });
});
