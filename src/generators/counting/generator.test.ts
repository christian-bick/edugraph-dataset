import {beforeEach, describe, expect, it} from 'vitest';
import {CountingGenerator} from './generator.ts';
import {setSeed} from '../../lib/random.ts';
import {Scope} from 'edugraph-ts';

describe('CountingGenerator', () => {
    let generator: CountingGenerator;

    beforeEach(() => {
        generator = new CountingGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
         expect(generator.type).toBe('counting');
    });

    it('should respect resolved ranges from labels', () => {
        const input = { 
            labels: [Scope.NumbersSmaller10], 
            constraints: {} 
        };
        for (let i = 0; i < 50; i++) {
            const stub = generator.generate(input);
            if (stub) {
                expect(stub.data.numObjects).toBeGreaterThanOrEqual(0);
                expect(stub.data.numObjects).toBeLessThanOrEqual(10);
            }
        }
    });

    it('should generate valid stubs', () => {
        const input = { 
            labels: [Scope.NumbersSmaller10], 
            constraints: {} 
        };
        const stub = generator.generate(input);
        expect(stub).not.toBeNull();
        expect(stub!.data.numObjects).toBeDefined();
    });



});
