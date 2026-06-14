import { describe, it, expect, beforeEach } from 'vitest';
import { MeasurementGenerator } from './generator.ts';
import { config } from './permutations.ts';
import { setSeed } from '../../lib/random.ts';
import { Ability, Area, Scope } from 'edugraph-ts';

describe('MeasurementGenerator', () => {
    let generator: MeasurementGenerator;

    beforeEach(() => {
        generator = new MeasurementGenerator();
        setSeed(config.generationConfig.seed);
    });

    it('should have the correct type and compatible renderers', () => {
        expect(generator.type).toBe('measurement');
        expect(generator.compatibleRenderers).toContain('measure-length');
    });

    describe('generate', () => {
        it('should generate valid problem stubs for all permutations', () => {
            config.generationConfig.permutations.forEach(input => {
                const stub = generator.generate(input);
                if (stub) {
                    expect(stub.id).toBeDefined();
                    expect(stub.data.bandLength).toBe(input.constraints.bandLength);
                    expect(stub.data.problemLength).toBeGreaterThan(0);
                    expect(stub.data.problemLength).toBeLessThanOrEqual(input.constraints.bandLength);
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
});
