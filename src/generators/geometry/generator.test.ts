import { describe, it, expect, beforeEach } from 'vitest';
import { GeometryGenerator } from './generator.ts';
import { config } from './permutations.ts';
import { setSeed } from '../../lib/random.ts';

describe('GeometryGenerator', () => {
    let generator: GeometryGenerator;

    beforeEach(() => {
        generator = new GeometryGenerator();
        setSeed(config.generationConfig.seed);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('geometry');
    });

    describe('generate basic permutations', () => {
        it('should generate valid problem stubs for all permutations', () => {
            config.generationConfig.permutations.forEach(input => {
                const stub = generator.generate(input);
                if (stub) {
                    expect(stub.id).toBeDefined();
                    expect(stub.data).toBeDefined();
                    expect(stub.data.mode).toBe(input.constraints.mode);
                    expect(stub.data.answer).toBeDefined();
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
        it('should validate position mode mappings', () => {
            const input = {
                labels: [],
                constraints: { mode: 'position', relation: 'below' }
            };
            const stub = generator.generate(input);
            expect(stub).not.toBeNull();
            expect(stub!.data.relation).toBe('below');
            expect(stub!.data.answer).toBe('below');
        });

        it('should validate env-shapes mapping values', () => {
            const targets = ['clock', 'window', 'table'];
            const expectedAnswers = ['circle', 'square', 'rectangle'];
            
            targets.forEach((target, index) => {
                const input = {
                    labels: [],
                    constraints: { mode: 'env-shapes', target }
                };
                const stub = generator.generate(input);
                expect(stub).not.toBeNull();
                expect(stub!.data.target).toBe(target);
                expect(stub!.data.answer).toBe(expectedAnswers[index]);
            });
        });

        it('should validate name-2d rotation and scale constraints', () => {
            const input = {
                labels: [],
                constraints: { mode: 'name-2d', shape: 'hexagon', rotation: 45, scale: 1.2 }
            };
            const stub = generator.generate(input);
            expect(stub).not.toBeNull();
            expect(stub!.data.shape).toBe('hexagon');
            expect(stub!.data.rotation).toBe(45);
            expect(stub!.data.scale).toBe(1.2);
            expect(stub!.data.answer).toBe('hexagon');
        });

        it('should validate classify-dim 2D and 3D outputs', () => {
            const input2D = {
                labels: [],
                constraints: { mode: 'classify-dim', shapeType: '2d' }
            };
            const stub2D = generator.generate(input2D);
            expect(stub2D).not.toBeNull();
            expect(stub2D!.data.shapeType).toBe('2d');
            expect(stub2D!.data.answer).toBe('Flat (2D)');

            const input3D = {
                labels: [],
                constraints: { mode: 'classify-dim', shapeType: '3d' }
            };
            const stub3D = generator.generate(input3D);
            expect(stub3D).not.toBeNull();
            expect(stub3D!.data.shapeType).toBe('3d');
            expect(stub3D!.data.answer).toBe('Solid (3D)');
        });

        it('should validate compare-attributes sides/corners comparison math', () => {
            const input = {
                labels: [],
                constraints: { mode: 'compare-attributes', attribute: 'sides', shape1: 'rectangle', shape2: 'triangle' }
            };
            const stub = generator.generate(input);
            expect(stub).not.toBeNull();
            expect(stub!.data.attribute).toBe('sides');
            expect(stub!.data.shape1).toBe('rectangle');
            expect(stub!.data.shape2).toBe('triangle');
            expect(stub!.data.val1).toBe(4);
            expect(stub!.data.val2).toBe(3);
            expect(stub!.data.answer).toBe('rectangle'); // rectangle has more sides
        });

        it('should validate same-attribute rolls/stacks/flat properties', () => {
            const inputRoll = {
                labels: [],
                constraints: { mode: 'same-attribute', attribute: 'can-roll' }
            };
            const stubRoll = generator.generate(inputRoll);
            expect(stubRoll).not.toBeNull();
            expect(stubRoll!.data.answer).toBe('sphere');

            const inputStack = {
                labels: [],
                constraints: { mode: 'same-attribute', attribute: 'can-stack' }
            };
            const stubStack = generator.generate(inputStack);
            expect(stubStack).not.toBeNull();
            expect(stubStack!.data.answer).toBe('cube');
        });

        it('should validate build-shape sticks and corners counts', () => {
            const input = {
                labels: [],
                constraints: { mode: 'build-shape', target: 'triangle' }
            };
            const stub = generator.generate(input);
            expect(stub).not.toBeNull();
            expect(stub!.data.target).toBe('triangle');
            expect(stub!.data.sides).toBe(3);
            expect(stub!.data.corners).toBe(3);
            expect(stub!.data.answer).toBe('3 sticks, 3 balls');
        });
    });
});
