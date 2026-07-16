import { describe, it, expect, beforeEach } from 'vitest';
import { GeometryDrawShapeGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';

describe('GeometryDrawShapeGenerator', () => {
    let generator: GeometryDrawShapeGenerator;

    beforeEach(() => {
        generator = new GeometryDrawShapeGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('geometry');
    });

    it('should validate draw-shape outputs', () => {
        const input = {
            labels: [],
            constraints: { mode: 'draw-shape', target: 'circle' }
        };
        const stub = generator.generate(input);
        expect(stub).not.toBeNull();
        expect(stub!.data.target).toBe('circle');
        expect(stub!.data.answer).toBe('circle');
    });

    it('should return null for non-draw-shape modes', () => {
        const stub = generator.generate({
            labels: [],
            constraints: { mode: 'name-2d' }
        });
        expect(stub).toBeNull();
    });
});
