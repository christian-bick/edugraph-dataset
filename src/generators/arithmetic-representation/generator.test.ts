import { describe, it, expect, beforeEach } from 'vitest';
import { ArithmeticRepresentationGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';

describe('ArithmeticRepresentationGenerator', () => {
    let generator: ArithmeticRepresentationGenerator;

    beforeEach(() => {
        generator = new ArithmeticRepresentationGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('arithmetic');
    });

    it('should respect representation addition limits', () => {
        const input = {
            labels: [],
            constraints: { mode: 'representation', operation: 'addition', maxSum: 10 }
        };
        for (let i = 0; i < 50; i++) {
            const stub = generator.generate(input);
            expect(stub).not.toBeNull();
            expect(stub!.data.operation).toBe('addition');
            expect(stub!.data.mode).toBe('representation');
            expect(stub!.data.num1).toBeGreaterThanOrEqual(1);
            expect(stub!.data.num2).toBeGreaterThanOrEqual(1);
            expect(stub!.data.answer).toBeLessThanOrEqual(10);
            expect(stub!.data.num1 + stub!.data.num2).toBe(stub!.data.answer);
        }
    });

    it('should respect representation subtraction limits', () => {
        const input = {
            labels: [],
            constraints: { mode: 'representation', operation: 'subtraction', maxMinuend: 10 }
        };
        for (let i = 0; i < 50; i++) {
            const stub = generator.generate(input);
            expect(stub).not.toBeNull();
            expect(stub!.data.operation).toBe('subtraction');
            expect(stub!.data.mode).toBe('representation');
            expect(stub!.data.num1).toBeLessThanOrEqual(10);
            expect(stub!.data.num1).toBeGreaterThan(stub!.data.num2);
            expect(stub!.data.answer).toBeGreaterThanOrEqual(0);
            expect(stub!.data.num1 - stub!.data.num2).toBe(stub!.data.answer);
        }
    });

    it('should return null for non-representation modes', () => {
        const stub = generator.generate({
            labels: [],
            constraints: { mode: 'standard' }
        });
        expect(stub).toBeNull();
    });
});
