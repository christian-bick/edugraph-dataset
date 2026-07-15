import { describe, it, expect, beforeEach } from 'vitest';
import { CountingGenerator } from './generator.ts';
import { config } from './permutations.ts';
import { setSeed } from '../../lib/random.ts';
import { Scope } from 'edugraph-ts';

describe('CountingGenerator', () => {
    let generator: CountingGenerator;

    beforeEach(() => {
        generator = new CountingGenerator();
        setSeed(config.generationConfig.seed);
    });

    it('should have the correct type', () => {
         expect(generator.type).toBe('counting');
    });

    describe('generate basic permutations', () => {
        it('should generate valid problem stubs or null for all permutations', () => {
            config.generationConfig.permutations.forEach(input => {
                const stub = generator.generate(input);
                if (stub) {
                    expect(stub.id).toBeDefined();
                    expect(stub.data).toBeDefined();
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

    describe('generate comprehensive edge cases', () => {
        it('should return null when attempting to decrement 1 object', () => {
            const input = { 
                labels: [Scope.NumbersSmaller10], 
                constraints: { type: 'dec', maxCount: 1 } 
            };
            const stub = generator.generate(input);
            expect(stub).toBeNull();
        });

        it('should never return more than maxCount objects in simple mode', () => {
            const input = { 
                labels: [], 
                constraints: { maxCount: 5 } 
            };
            for (let i = 0; i < 50; i++) {
                const stub = generator.generate(input);
                if (stub) {
                    expect(stub.data.numObjects).toBeLessThanOrEqual(5);
                }
            }
        });

        it('should validate conservation mode constraints and output', () => {
            const input = {
                labels: [],
                constraints: { mode: 'conservation', minCount: 5, maxCount: 12 }
            };
            for (let i = 0; i < 50; i++) {
                const stub = generator.generate(input);
                expect(stub).not.toBeNull();
                expect(stub!.data.mode).toBe('conservation');
                expect(stub!.data.numObjects).toBeGreaterThanOrEqual(5);
                expect(stub!.data.numObjects).toBeLessThanOrEqual(12);
            }
        });

        it('should validate count-out mode totalCount bounds', () => {
            const input = {
                labels: [],
                constraints: { mode: 'count-out', count: 7, totalCount: 12 }
            };
            const stub = generator.generate(input);
            expect(stub).not.toBeNull();
            expect(stub!.data.mode).toBe('count-out');
            expect(stub!.data.numObjects).toBe(7);
            expect(stub!.data.totalCount).toBe(12);
        });

        it('should validate classify-count items and categories logic', () => {
            const input = {
                labels: [],
                constraints: { mode: 'classify-count', minTotal: 6, maxTotal: 10, classifyType: 'shape' }
            };
            for (let i = 0; i < 20; i++) {
                const stub = generator.generate(input);
                expect(stub).not.toBeNull();
                expect(stub!.data.mode).toBe('classify-count');
                expect(stub!.data.classifyType).toBe('shape');
                expect(stub!.data.items.length).toBeGreaterThanOrEqual(6);
                expect(stub!.data.items.length).toBeLessThanOrEqual(10);
                
                // Verify categories sum up to items.length
                const cats = stub!.data.categories;
                const total = (cats.circle || 0) + (cats.square || 0) + (cats.triangle || 0);
                expect(total).toBe(stub!.data.items.length);
            }
        });

        it('should validate classify-sort least/most logic and tie filtering', () => {
            const input = {
                labels: [],
                constraints: { mode: 'classify-sort', minTotal: 6, maxTotal: 10, relation: 'most', classifyType: 'color' }
            };
            for (let i = 0; i < 50; i++) {
                const stub = generator.generate(input);
                if (stub) {
                    expect(stub.data.mode).toBe('classify-sort');
                    expect(stub.data.classifyType).toBe('color');
                    expect(stub.data.relation).toBe('most');
                    
                    const answer = stub.data.answer;
                    const cats = stub.data.categories;
                    
                    // Verify answer is indeed the one with the most items and has no ties
                    const maxVal = cats[answer];
                    const possibleColors = ['red', 'blue', 'green'];
                    possibleColors.forEach(color => {
                        if (color !== answer) {
                            expect(cats[color]).toBeLessThan(maxVal);
                        }
                    });
                }
            }
        });
    });
});
