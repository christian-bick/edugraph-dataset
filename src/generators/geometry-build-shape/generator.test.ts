import { describe, it, expect, beforeEach } from 'vitest';
import { GeometryBuildShapeGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';

describe('GeometryBuildShapeGenerator', () => {
    let generator: GeometryBuildShapeGenerator;

    beforeEach(() => {
        generator = new GeometryBuildShapeGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('geometry');
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
    });

    it('should return null for non-build-shape modes', () => {
        const stub = generator.generate({
            labels: [],
            constraints: { mode: 'name-2d' }
        });
        expect(stub).toBeNull();
    });
});
