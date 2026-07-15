import { describe, it, expect, beforeEach } from 'vitest';
import { MeasurementGenerator } from './generator.ts';
import { config } from './permutations.ts';
import { setSeed } from '../../lib/random.ts';

describe('MeasurementGenerator', () => {
    let generator: MeasurementGenerator;

    beforeEach(() => {
        generator = new MeasurementGenerator();
        setSeed(config.generationConfig.seed);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('measurement');
    });

    describe('generate basic permutations', () => {
        it('should generate valid problem stubs for all permutations', () => {
            config.generationConfig.permutations.forEach(input => {
                const stub = generator.generate(input);
                if (stub) {
                    expect(stub.id).toBeDefined();
                    if (input.constraints.mode === 'attribute-type') {
                        expect(stub.data.attribute).toBeDefined();
                    } else if (input.constraints.mode === 'direct-compare') {
                        expect(stub.data.attribute).toBeDefined();
                        expect(stub.data.relation).toBeDefined();
                        expect(stub.data.answer).toBeDefined();
                    } else {
                        expect(stub.data.bandLength).toBe(input.constraints.bandLength);
                        expect(stub.data.problemLength).toBeGreaterThan(0);
                        expect(stub.data.problemLength).toBeLessThanOrEqual(input.constraints.bandLength);
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

    describe('generate comprehensive edge cases', () => {
        it('should validate attribute-type modes', () => {
            const input = {
                labels: [],
                constraints: { mode: 'attribute-type', attribute: 'weight' }
            };
            const stub = generator.generate(input);
            expect(stub).not.toBeNull();
            expect(stub!.data.mode).toBe('attribute-type');
            expect(stub!.data.attribute).toBe('weight');
        });

        it('should validate direct-compare length longer relation', () => {
            const input = {
                labels: [],
                constraints: { mode: 'direct-compare', attribute: 'length', relation: 'longer' }
            };
            for (let i = 0; i < 50; i++) {
                const stub = generator.generate(input);
                expect(stub).not.toBeNull();
                expect(stub!.data.mode).toBe('direct-compare');
                expect(stub!.data.attribute).toBe('length');
                expect(stub!.data.relation).toBe('longer');
                
                const { val1, val2, answer } = stub!.data;
                if (answer === 'A') {
                    expect(val1).toBeGreaterThan(val2);
                } else {
                    expect(val1).toBeLessThan(val2);
                }
            }
        });

        it('should validate direct-compare length shorter relation', () => {
            const input = {
                labels: [],
                constraints: { mode: 'direct-compare', attribute: 'length', relation: 'shorter' }
            };
            for (let i = 0; i < 50; i++) {
                const stub = generator.generate(input);
                expect(stub).not.toBeNull();
                expect(stub!.data.mode).toBe('direct-compare');
                expect(stub!.data.attribute).toBe('length');
                expect(stub!.data.relation).toBe('shorter');
                
                const { val1, val2, answer } = stub!.data;
                if (answer === 'A') {
                    expect(val1).toBeLessThan(val2);
                } else {
                    expect(val1).toBeGreaterThan(val2);
                }
            }
        });

        it('should validate direct-compare weight heavier relation', () => {
            const input = {
                labels: [],
                constraints: { mode: 'direct-compare', attribute: 'weight', relation: 'heavier' }
            };
            for (let i = 0; i < 50; i++) {
                const stub = generator.generate(input);
                expect(stub).not.toBeNull();
                expect(stub!.data.mode).toBe('direct-compare');
                expect(stub!.data.attribute).toBe('weight');
                expect(stub!.data.relation).toBe('heavier');
                
                const { val1, val2, answer } = stub!.data;
                if (answer === 'A') {
                    expect(val1).toBeGreaterThan(val2);
                } else {
                    expect(val1).toBeLessThan(val2);
                }
            }
        });
    });
});
