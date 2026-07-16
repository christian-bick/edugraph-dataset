import { describe, it, expect, beforeEach } from 'vitest';
import { ComparisonGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';
import { Scope } from 'edugraph-ts';

describe('ComparisonGenerator', () => {
    let generator: ComparisonGenerator;

    beforeEach(() => {
        generator = new ComparisonGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('comparison');
    });

    it('should respect resolved ranges', () => {
        for (let i = 0; i < 100; i++) {
            const stub = generator.generate({ 
                labels: [Scope.NumbersSmaller10], 
                constraints: {} 
            });
            if (stub) {
                expect(stub.data.num1).toBeGreaterThanOrEqual(0);
                expect(stub.data.num1).toBeLessThanOrEqual(10);
                expect(stub.data.num2).toBeGreaterThanOrEqual(0);
                expect(stub.data.num2).toBeLessThanOrEqual(10);
                expect(['<', '>', '=']).toContain(stub.data.answer);
            }
        }
    });

    it('should respect greater constraint', () => {
        const input = {
            labels: [Scope.NumbersSmaller20],
            constraints: { comparisonType: 'greater' as const }
        };
        for (let i = 0; i < 50; i++) {
            const stub = generator.generate(input);
            expect(stub).not.toBeNull();
            expect(stub!.data.num1).toBeGreaterThan(stub!.data.num2);
            expect(stub!.data.answer).toBe('>');
        }
    });

    it('should respect less constraint', () => {
        const input = {
            labels: [Scope.NumbersSmaller20],
            constraints: { comparisonType: 'less' as const }
        };
        for (let i = 0; i < 50; i++) {
            const stub = generator.generate(input);
            expect(stub).not.toBeNull();
            expect(stub!.data.num1).toBeLessThan(stub!.data.num2);
            expect(stub!.data.answer).toBe('<');
        }
    });

    it('should respect equal constraint', () => {
        const input = {
            labels: [Scope.NumbersSmaller20],
            constraints: { comparisonType: 'equal' as const }
        };
        for (let i = 0; i < 50; i++) {
            const stub = generator.generate(input);
            expect(stub).not.toBeNull();
            expect(stub!.data.num1).toEqual(stub!.data.num2);
            expect(stub!.data.answer).toBe('=');
        }
    });
});
