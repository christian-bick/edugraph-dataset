import { describe, it, expect, beforeEach } from 'vitest';
import { GeometryGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';

describe('GeometryGenerator', () => {
    let generator: GeometryGenerator;

    beforeEach(() => {
        generator = new GeometryGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('geometry');
    });

    it('should generate valid flat (2d) naming stubs', () => {
        const input = {
            labels: [],
            constraints: { mode: 'name-2d', shape: 'triangle' }
        };
        const stub = generator.generate(input);
        expect(stub).not.toBeNull();
        expect(stub!.data.shape).toBe('triangle');
        expect(stub!.data.answer).toBe('triangle');
    });

    it('should generate valid solid (3d) naming stubs', () => {
        const input = {
            labels: [],
            constraints: { mode: 'name-3d', shape: 'cube' }
        };
        const stub = generator.generate(input);
        expect(stub).not.toBeNull();
        expect(stub!.data.shape).toBe('cube');
        expect(stub!.data.answer).toBe('cube');
    });

    it('should return null for non-naming modes', () => {
        const stub = generator.generate({
            labels: [],
            constraints: { mode: 'position' }
        });
        expect(stub).toBeNull();
    });
});
