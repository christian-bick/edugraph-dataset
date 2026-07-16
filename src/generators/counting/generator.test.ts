import { describe, it, expect, beforeEach } from 'vitest';
import { CountingGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';
import { Area, Scope } from 'edugraph-ts';

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

    it('should generate valid stubs with default arrangement', () => {
        const input = { 
            labels: [Scope.NumbersSmaller10], 
            constraints: {} 
        };
        const stub = generator.generate(input);
        expect(stub).not.toBeNull();
        expect(stub!.data.arrangement).toBe('scattered');
    });

    it('should respect arrangement constraint', () => {
        const input = { 
            labels: [Scope.NumbersSmaller10], 
            constraints: { arrangement: 'line' } 
        };
        const stub = generator.generate(input);
        expect(stub).not.toBeNull();
        expect(stub!.data.arrangement).toBe('line');
        expect(stub!.id).toContain('line');
    });

    it('should generate totalCount pool when countOut constraint is provided', () => {
        const input = {
            labels: [Scope.NumbersSmaller10],
            constraints: { countOut: true }
        };
        for (let i = 0; i < 20; i++) {
            const stub = generator.generate(input);
            expect(stub).not.toBeNull();
            expect(stub!.data.totalCount).toBeDefined();
            expect(stub!.data.totalCount!).toBeGreaterThan(stub!.data.numObjects);
        }
    });
});
