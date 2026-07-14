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

    it('should have the correct type and compatible renderers', () => {
        expect(generator.type).toBe('geometry');
        expect(generator.compatibleRenderers).toContain('geometry-viewer');
    });

    describe('generate', () => {
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
    });
});
