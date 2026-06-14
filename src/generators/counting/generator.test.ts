import { describe, it, expect, beforeEach } from 'vitest';
import { CountingGenerator } from './generator.ts';
import { config } from './permutations.ts';
import { setSeed } from '../../lib/random.ts';
import { Ability, Area, Scope } from 'edugraph-ts';

describe('CountingGenerator', () => {
    let generator: CountingGenerator;

    beforeEach(() => {
        generator = new CountingGenerator();
        setSeed(config.generationConfig.seed);
    });

    it('should have the correct type and compatible renderers', () => {
        expect(generator.type).toBe('counting');
        expect(generator.compatibleRenderers).toContain('counting-objects');
        expect(generator.compatibleRenderers).toContain('counting-inc-dec');
    });

    describe('generate', () => {
        it('should generate valid problem stubs or null for all permutations', () => {
            config.generationConfig.permutations.forEach(input => {
                const stub = generator.generate(input);
                if (stub) {
                    expect(stub.id).toBeDefined();
                    expect(stub.data).toBeDefined();
                    expect(stub.data.numObjects).toBeGreaterThanOrEqual(1);
                    expect(stub.data.incDecType).toBe(input.constraints.type);
                    
                    if (input.constraints.type === 'inc') {
                        expect(stub.data.incDecAnswer).toBe(stub.data.numObjects + 1);
                    } else if (input.constraints.type === 'dec') {
                        expect(stub.data.incDecAnswer).toBe(stub.data.numObjects - 1);
                        expect(stub.data.numObjects).toBeGreaterThan(1);
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

    describe('generate edge cases', () => {
        it('should return null when attempting to decrement 1 object', () => {
            const input = { 
                labels: [Scope.NumbersSmaller10], 
                constraints: { type: 'dec', maxCount: 1 } 
            };
            const stub = generator.generate(input);
            expect(stub).toBeNull();
        });

        it('should never return more than maxCount objects', () => {
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
    });
});
