import { describe, it, expect, beforeEach } from 'vitest';
import { ArithmeticGenerator } from './generator.ts';
import { generationConfig } from './permutations.ts';
import { setSeed } from '../../lib/random.ts';

describe('ArithmeticGenerator', () => {
    let generator: ArithmeticGenerator;

    beforeEach(() => {
        generator = new ArithmeticGenerator();
        setSeed(generationConfig.seed);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('arithmetic');
    });

    describe('generate basic permutations', () => {
        it('should generate valid problem stubs for all permutations', () => {
        generationConfig.permutations.forEach(input => {
            const stub = generator.generate(input);
                if (stub) {
                    expect(stub.id).toBeDefined();
                    expect(stub.data).toBeDefined();
                    if (input.constraints.mode === 'decompose') {
                        expect(stub.data.targetNumber).toBeDefined();
                        expect(stub.data.pair1).toBeDefined();
                        expect(stub.data.pair2).toBeDefined();
                    } else if (input.constraints.mode === 'make-ten') {
                        expect(stub.data.givenNumber).toBeDefined();
                        expect(stub.data.missingNumber).toBeDefined();
                        expect(stub.data.target).toBe(10);
                    } else if (input.constraints.mode === 'compose-teen' || input.constraints.mode === 'decompose-teen') {
                        expect(stub.data.ones).toBeDefined();
                        expect(stub.data.target).toBeDefined();
                    } else if (input.constraints.mode === 'representation' || input.constraints.mode === 'word-problem') {
                        expect(stub.data.num1).toBeDefined();
                        expect(stub.data.num2).toBeDefined();
                        expect(stub.data.answer).toBeDefined();
                        expect(stub.data.operation).toBeDefined();
                    } else {
                        expect(stub.data.num1).toBeDefined();
                        expect(stub.data.num2).toBeDefined();
                        expect(stub.data.answer).toBeDefined();
                        expect(stub.data.operation).toBeDefined();
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
        it('should respect representation addition limits', () => {
            const input = {
                labels: [],
                constraints: { mode: 'representation', operation: 'addition', maxSum: 10 }
            };
            for (let i = 0; i < 50; i++) {
                const stub = generator.generate(input);
                expect(stub).not.toBeNull();
                expect(stub!.data.operation).toBe('addition');
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
                expect(stub!.data.num1).toBeLessThanOrEqual(10);
                expect(stub!.data.num1).toBeGreaterThan(stub!.data.num2);
                expect(stub!.data.answer).toBeGreaterThanOrEqual(0);
                expect(stub!.data.num1 - stub!.data.num2).toBe(stub!.data.answer);
            }
        });

        it('should generate non-empty scenario text for word problems', () => {
            const input = {
                labels: [],
                constraints: { mode: 'word-problem', operation: 'addition', maxSum: 10 }
            };
            const stub = generator.generate(input);
            expect(stub).not.toBeNull();
            expect(stub!.data.textScenario).toMatch(/\w+/);
            expect(stub!.data.textScenario).toContain(String(stub!.data.num1));
            expect(stub!.data.textScenario).toContain(String(stub!.data.num2));
        });

        it('should generate valid decomposition pairs', () => {
            const input = {
                labels: [],
                constraints: { mode: 'decompose', targetNumber: 6 }
            };
            for (let i = 0; i < 50; i++) {
                const stub = generator.generate(input);
                expect(stub).not.toBeNull();
                expect(stub!.data.targetNumber).toBe(6);
                
                const p1 = stub!.data.pair1;
                const p2 = stub!.data.pair2;
                expect(p1[0] + p1[1]).toBe(6);
                expect(p2[0] + p2[1]).toBe(6);
                expect(p1[0] === p2[0] && p1[1] === p2[1]).toBe(false);
            }
        });

        it('should generate correct make-ten missing addends', () => {
            const input = {
                labels: [],
                constraints: { mode: 'make-ten', givenNumber: 7 }
            };
            const stub = generator.generate(input);
            expect(stub).not.toBeNull();
            expect(stub!.data.givenNumber).toBe(7);
            expect(stub!.data.missingNumber).toBe(3);
            expect(stub!.data.target).toBe(10);
        });

        it('should generate correct teen compose / decompose structures', () => {
            const input1 = {
                labels: [],
                constraints: { mode: 'compose-teen', ones: 5 }
            };
            const stub1 = generator.generate(input1);
            expect(stub1).not.toBeNull();
            expect(stub1!.data.ones).toBe(5);
            expect(stub1!.data.target).toBe(15);

            const input2 = {
                labels: [],
                constraints: { mode: 'decompose-teen', ones: 7 }
            };
            const stub2 = generator.generate(input2);
            expect(stub2).not.toBeNull();
            expect(stub2!.data.ones).toBe(7);
            expect(stub2!.data.target).toBe(17);
        });
    });
});
