import { describe, it, expect, beforeEach } from 'vitest';
import { GeometryName3dGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';

describe('GeometryName3dGenerator', () => {
    let generator: GeometryName3dGenerator;

    beforeEach(() => {
        generator = new GeometryName3dGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('geometry');
    });

    it('should validate name-3d rotation and scale constraints', () => {
        const input = {
            labels: [],
            constraints: { mode: 'name-3d', shape: 'cube', rotation: 90, scale: 1.5 }
        };
        const stub = generator.generate(input);
        expect(stub).not.toBeNull();
        expect(stub!.data.shape).toBe('cube');
        expect(stub!.data.rotation).toBe(90);
        expect(stub!.data.scale).toBe(1.5);
        expect(stub!.data.answer).toBe('cube');
    });

    it('should return null for non-name-3d modes', () => {
        const stub = generator.generate({
            labels: [],
            constraints: { mode: 'name-2d' }
        });
        expect(stub).toBeNull();
    });
});
