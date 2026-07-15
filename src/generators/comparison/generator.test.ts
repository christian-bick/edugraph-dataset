import { describe, it, expect, beforeEach } from 'vitest';
import { ComparisonGenerator } from './generator.ts';
import { generationConfig } from './permutations.ts';
import { setSeed } from '../../lib/random.ts';
import { Scope } from 'edugraph-ts';

describe('ComparisonGenerator', () => {
    let generator: ComparisonGenerator;

    beforeEach(() => {
        generator = new ComparisonGenerator();
        setSeed(generationConfig.seed);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('comparison');
    });

    describe('generate basic permutations', () => {
        it('should generate valid problem stubs or null for all permutations', () => {
            generationConfig.permutations.forEach(input => {
                const stub = generator.generate(input);
                if (stub) {
                    expect(stub.id).toBeDefined();
                    expect(stub.data).toBeDefined();
                    expect(stub.data.num1).toBeDefined();
                    expect(stub.data.num2).toBeDefined();
                    if (input.constraints.mode === 'matching' || input.constraints.mode === 'count-compare') {
                        expect(stub.data.answer).toMatch(/^(A|B|equal)$/);
                        if (input.constraints.comparisonType !== 'equal') {
                            expect(stub.data.num1).not.toBe(stub.data.num2);
                        }
                    } else {
                        expect(stub.data.answer).toMatch(/^[<>]$/);
                        expect(stub.data.num1).not.toBe(stub.data.num2);
                    }
                }
            });
        });

        it('should be deterministic with the same seed', () => {
            const input = generationConfig.permutations[0];
            setSeed(123);
            const stub1 = generator.generate(input);
            setSeed(123);
            const stub2 = generator.generate(input);
            expect(stub1).toEqual(stub2);
        });
    });

    describe('generate comprehensive edge cases', () => {
        it('should return null if numbers are equal in legacy mode', () => {
            for (let i = 0; i < 100; i++) {
                const stub = generator.generate({ 
                    labels: [Scope.NumbersSmaller10], 
                    constraints: { digits: 1 } 
                });
                if (stub) {
                    expect(stub.data.num1).not.toEqual(stub.data.num2);
                }
            }
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
    });
});
