import { describe, it, expect, beforeEach } from 'vitest';
import { MeasurementCompareGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';

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
        const input = {
            labels: [],
            constraints: { attribute: 'length', relation: 'longer' }
        };
        for (let i = 0; i < 50; i++) {
            const stub = generator.generate(input);
            expect(stub).not.toBeNull();
            expect(stub!.data.attribute).toBe('length');
            expect(stub!.data.relation).toBe('longer');
            
            const { val1, val2, answer } = stub!.data;
            if (answer === 'A') {
                expect(val1).toBeGreaterThan(val2);
            } else {
                expect(val1).toBeLessThan(val2);
            }
        }
    });

    it('should validate direct-compare length shorter relation', () => {
        const input = {
            labels: [],
            constraints: { attribute: 'length', relation: 'shorter' }
        };
        for (let i = 0; i < 50; i++) {
            const stub = generator.generate(input);
            expect(stub).not.toBeNull();
            expect(stub!.data.attribute).toBe('length');
            expect(stub!.data.relation).toBe('shorter');
            
            const { val1, val2, answer } = stub!.data;
            if (answer === 'A') {
                expect(val1).toBeLessThan(val2);
            } else {
                expect(val1).toBeGreaterThan(val2);
            }
        }
    });

    it('should validate direct-compare weight heavier relation', () => {
        const input = {
            labels: [],
            constraints: { attribute: 'weight', relation: 'heavier' }
        };
        for (let i = 0; i < 50; i++) {
            const stub = generator.generate(input);
            expect(stub).not.toBeNull();
            expect(stub!.data.attribute).toBe('weight');
            expect(stub!.data.relation).toBe('heavier');
            
            const { val1, val2, answer } = stub!.data;
            if (answer === 'A') {
                expect(val1).toBeGreaterThan(val2);
            } else {
                expect(val1).toBeLessThan(val2);
            }
        }
    });
});
