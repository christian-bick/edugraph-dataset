import { describe, it, expect, beforeEach } from 'vitest';
import { ArithmeticGenerator } from './generator.ts';
import { config } from './permutations.ts';
import { setSeed } from '../../lib/random.ts';
import { Ability, Area, Scope } from 'edugraph-ts';

describe('ArithmeticGenerator', () => {
    let generator: ArithmeticGenerator;

    beforeEach(() => {
        generator = new ArithmeticGenerator();
        setSeed(config.generationConfig.seed);
    });

    it('should have the correct type and compatible renderers', () => {
        expect(generator.type).toBe('arithmetic');
        expect(generator.compatibleRenderers).toContain('operations-boxes');
        expect(generator.compatibleRenderers).toContain('operations-vertical');
        expect(generator.compatibleRenderers).toContain('operations-representation');
        expect(generator.compatibleRenderers).toContain('operations-decompose');
        expect(generator.compatibleRenderers).toContain('place-value-blocks');
    });

    describe('generate', () => {
        it('should generate valid problem stubs for all permutations', () => {
            config.generationConfig.permutations.forEach(input => {
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
                        expect(stub.data.operator).toBeDefined();
                    }
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

    describe('Label-driven constraints', () => {
        it('should enforce zero when Scope.IntegersWithZero is present', () => {
            const input = {
                labels: [Area.Addition, Scope.NumbersSmaller10, Scope.IntegersWithZero],
                constraints: {}
            };
            let zeroFound = false;
            for (let i = 0; i < 50; i++) {
                const stub = generator.generate(input);
                if (stub && (stub.data.num1 === 0 || stub.data.num2 === 0)) {
                    zeroFound = true;
                    break;
                }
            }
            expect(zeroFound).toBe(true);
        });

        it('should respect Scope.NumbersSmaller10', () => {
            const input = {
                labels: [Area.Addition, Scope.NumbersSmaller10, Scope.IntegersWithoutZero],
                constraints: {}
            };
            for (let i = 0; i < 20; i++) {
                const stub = generator.generate(input);
                if (stub) {
                    expect(stub.data.num1).toBeLessThan(10);
                    expect(stub.data.num2).toBeLessThan(10);
                }
            }
        });

        it('should respect explicit digit constraints over labels', () => {
            const input = {
                labels: [Area.Addition, Scope.NumbersSmaller100],
                constraints: { digitsNum1: 3 } // 3 digits even if scope says smaller 100
            };
            const stub = generator.generate(input);
            if (stub) {
                expect(stub.data.num1).toBeGreaterThanOrEqual(100);
                expect(stub.data.num1).toBeLessThan(1000);
            }
        });
    });
});
