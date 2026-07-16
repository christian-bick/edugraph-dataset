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

    it('should be deterministic with the same seed', () => {
        const input = { labels: [], constraints: {} };
        setSeed(123);
        const stub1 = generator.generate(input);
        setSeed(123);
        const stub2 = generator.generate(input);
        expect(stub1).toEqual(stub2);
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

    it('should return null for non-name-2d modes', () => {
        const stub = generator.generate({
            labels: [],
            constraints: { mode: 'position' }
        });
        expect(stub).toBeNull();
    });
});
