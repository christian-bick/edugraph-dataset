import {beforeEach, describe, expect, it} from 'vitest';
import {GeometryIdentityGenerator} from './generator.ts';
import {setSeed} from '../../lib/random.ts';
import {Area} from 'edugraph-ts';

describe('GeometryIdentityGenerator', () => {
    let generator: GeometryIdentityGenerator;

    beforeEach(() => {
        generator = new GeometryIdentityGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('geometry');
    });

    it('should fall back to basic 2D shapes if no shapes provided', () => {
        const stub = generator.generate({ shapes: [] });
        expect(stub).not.toBeNull();
        expect(['triangle', 'square', 'rectangle', 'circle']).toContain(stub!.data.shape);
    });

    it('should use provided shapes', () => {
        const stub = generator.generate({ shapes: [Area.Hexagon] });
        expect(stub).not.toBeNull();
        expect(stub!.data.shape).toBe('hexagon');
        expect(stub!.data.answer).toBe('hexagon');
        expect(stub!.id).toContain('hexagon');
    });
});
