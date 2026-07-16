import { describe, it, expect, beforeEach } from 'vitest';
import { ComparisonMatchingGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';

describe('ComparisonMatchingGenerator', () => {
    let generator: ComparisonMatchingGenerator;

    beforeEach(() => {
        generator = new ComparisonMatchingGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('comparison');
    });

    it('should respect matching mode with greater constraint', () => {
        const input = {
            labels: [],
            constraints: { mode: 'matching', comparisonType: 'greater' }
        };
        for (let i = 0; i < 50; i++) {
            const stub = generator.generate(input);
            expect(stub).not.toBeNull();
            expect(stub!.data.num1).toBeGreaterThan(stub!.data.num2);
            expect(stub!.data.answer).toBe('A');
        }
    });

    it('should respect matching mode with less constraint', () => {
        const input = {
            labels: [],
            constraints: { mode: 'matching', comparisonType: 'less' }
        };
        for (let i = 0; i < 50; i++) {
            const stub = generator.generate(input);
            expect(stub).not.toBeNull();
            expect(stub!.data.num1).toBeLessThan(stub!.data.num2);
            expect(stub!.data.answer).toBe('B');
        }
    });

    it('should respect matching mode with equal constraint', () => {
        const input = {
            labels: [],
            constraints: { mode: 'matching', comparisonType: 'equal' }
        };
        for (let i = 0; i < 50; i++) {
            const stub = generator.generate(input);
            expect(stub).not.toBeNull();
            expect(stub!.data.num1).toEqual(stub!.data.num2);
            expect(stub!.data.answer).toBe('equal');
        }
    });

    it('should return null for non-matching modes', () => {
        const stub = generator.generate({
            labels: [],
            constraints: { mode: 'numeric' }
        });
        expect(stub).toBeNull();
    });
});
