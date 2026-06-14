import { describe, it, expect, beforeEach } from 'vitest';
import { ComparisonGenerator } from './generator.ts';
import { config } from './permutations.ts';
import { setSeed } from '../../lib/random.ts';
import { Ability, Area, Scope } from 'edugraph-ts';

describe('ComparisonGenerator', () => {
    let generator: ComparisonGenerator;

    beforeEach(() => {
        generator = new ComparisonGenerator();
        setSeed(config.generationConfig.seed);
    });

    it('should have the correct type and compatible renderers', () => {
        expect(generator.type).toBe('comparison');
        expect(generator.compatibleRenderers).toContain('numbers-compare');
    });

    describe('generate', () => {
        it('should generate valid problem stubs or null for all permutations', () => {
            config.generationConfig.permutations.forEach(input => {
                const stub = generator.generate(input);
                if (stub) {
                    expect(stub.id).toBeDefined();
                    expect(stub.data).toBeDefined();
                    expect(stub.data.num1).toBeDefined();
                    expect(stub.data.num2).toBeDefined();
                    expect(stub.data.answer).toMatch(/^[<>]$/);
                    expect(stub.data.num1).not.toBe(stub.data.num2);
                }
            });
        });

        it('should be deterministic with the same seed', () => {
            const input = config.generationConfig.permutations[0];
            setSeed(123);
            const stub1 = generator.generate(input);
            setSeed(123);
            const stub2 = generator.generate(input);
            expect(stub1).toEqual(stub2);
        });
    });

    describe('generate edge cases', () => {
        it('should return null if numbers are equal', () => {
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

        it('should respect digit counts from constraints', () => {
            const input = { 
                labels: [], 
                constraints: { digits: 2 } 
            };
            const stub = generator.generate(input);
            if (stub) {
                expect(stub.data.num1).toBeGreaterThanOrEqual(10);
                expect(stub.data.num1).toBeLessThan(100);
            }
        });

        it('should respect scope labels when constraints are missing', () => {
            const input = { 
                labels: [Scope.NumbersSmaller100], 
                constraints: {} 
            };
            const stub = generator.generate(input);
            if (stub) {
                expect(stub.data.num1).toBeLessThan(100);
            }
        });
    });
});
