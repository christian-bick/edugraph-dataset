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

    it('should respect numeric comparison constraints and avoid equals', () => {
        for (let i = 0; i < 100; i++) {
            const stub = generator.generate({ 
                labels: [Scope.NumbersSmaller10], 
                constraints: { digits: 1 } 
            });
            if (stub) {
                expect(stub.data.num1).not.toEqual(stub.data.num2);
                expect(stub.data.answer).toMatch(/^[<>]$/);
            }
        }
    });

    it('should respect group comparison matching with greater constraint', () => {
        const input = {
            labels: [],
            constraints: { mode: 'matching', comparisonType: 'greater', maxCount: 10 }
        };
        for (let i = 0; i < 50; i++) {
            const stub = generator.generate(input);
            expect(stub).not.toBeNull();
            expect(stub!.data.num1).toBeGreaterThan(stub!.data.num2);
            expect(stub!.data.answer).toBe('>');
        }
    });

    it('should respect group comparison matching with less constraint', () => {
        const input = {
            labels: [],
            constraints: { mode: 'matching', comparisonType: 'less', maxCount: 10 }
        };
        for (let i = 0; i < 50; i++) {
            const stub = generator.generate(input);
            expect(stub).not.toBeNull();
            expect(stub!.data.num1).toBeLessThan(stub!.data.num2);
            expect(stub!.data.answer).toBe('<');
        }
    });

    it('should respect group comparison matching with equal constraint', () => {
        const input = {
            labels: [],
            constraints: { mode: 'matching', comparisonType: 'equal', maxCount: 10 }
        };
        for (let i = 0; i < 50; i++) {
            const stub = generator.generate(input);
            expect(stub).not.toBeNull();
            expect(stub!.data.num1).toEqual(stub!.data.num2);
            expect(stub!.data.answer).toBe('=');
        }
    });

    it('should return null for unsupported modes', () => {
        const stub = generator.generate({
            labels: [],
            constraints: { mode: 'unsupported' }
        });
        expect(stub).toBeNull();
    });
});
